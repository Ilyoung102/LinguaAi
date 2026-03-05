import { useState } from "react";
import { AI_PROVIDERS } from "../constants";

export function useChat(apiKeys, aiProvider, aiModels) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({ messages: 0, vocab: 0, grammar: 0, time: 0 });
  const [journal, setJournal] = useState([]);

  // ── 통합 AI 호출 함수 ──────────────────────────────────────────
  async function callAI(systemPrompt, history, userText, maxTokens = 1200) {
    const key   = apiKeys[aiProvider];
    const model = aiModels[aiProvider];

    // ── Claude (키 없으면 Claude.ai 내장 API 폴백) ────────────────
    if (aiProvider === "claude") {
      const headers = { "Content-Type": "application/json" };
      if (key) {
        headers["x-api-key"] = key;
        headers["anthropic-version"] = "2023-06-01";
      }
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: key ? model : "claude-3-7-sonnet-20250219",
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [...history, { role: "user", content: userText }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(`Claude: ${data.error.message}`);
      return data.content?.map(c => c.text || "").join("") || "";
    }

    // 다른 프로바이더는 키 필수
    if (!key) throw new Error(
      `${AI_PROVIDERS[aiProvider].name} API 키가 없습니다.\n` +
      `헤더의 ⚙️ 설정에서 키를 입력해주세요.`
    );

    // ── OpenAI (ChatGPT) ─────────────────────────────────────────
    if (aiProvider === "openai") {
      const msgs = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
        { role: "user", content: userText },
      ];
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({ model, max_tokens: maxTokens, messages: msgs }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`ChatGPT ${res.status}: ${err.error?.message || res.statusText}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    }

    // ── Gemini ───────────────────────────────────────────────────
    if (aiProvider === "gemini") {
      const contents = [
        ...history.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: userText }] },
      ];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { maxOutputTokens: maxTokens },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Gemini ${res.status}: ${err.error?.message || res.statusText}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(`Gemini: ${data.error.message}`);
      return data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    }

    throw new Error("알 수 없는 AI 프로바이더");
  }

  return {
    messages, setMessages,
    input, setInput,
    loading, setLoading,
    feedback, setFeedback,
    stats, setStats,
    journal, setJournal,
    callAI
  };
}
