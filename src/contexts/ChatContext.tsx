import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ChatMessage, Feedback, Stats, JournalEntry, ChatContextType } from "../types";
import { useSettings } from "./SettingsContext";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { apiKeys, aiProvider, aiModels } = useSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats>({
    messages: 0,
    vocab: 0,
    grammar: 0,
    time: 0,
  });
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((m) => [...m, msg]);
  }, []);

  const addFeedback = useCallback((fb: Feedback) => {
    setFeedback((f) => [fb, ...f.slice(0, 9)]);
  }, []);

  const updateStats = useCallback((updates: Partial<Stats>) => {
    setStats((s) => ({ ...s, ...updates }));
  }, []);

  const addJournalEntry = useCallback((entry: JournalEntry) => {
    setJournal((j) => [entry, ...j.slice(0, 4)]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const initializeWelcomeMessage = useCallback((welcomeMsg: ChatMessage) => {
    setMessages([welcomeMsg]);
    setFeedback([]);
  }, []);

  // API URL configuration
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const USE_BACKEND = import.meta.env.VITE_USE_BACKEND !== 'false';

  const callAI = useCallback(async (systemPrompt: string, history: { role: string; content: string }[], userText: string, maxTokens: number = 1200) => {
    const model = aiModels[aiProvider as keyof typeof aiModels];

    try {
      if (USE_BACKEND) {
        try {
          const endpoint = `${API_BASE_URL}/api/${aiProvider}`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemPrompt,
              messages: history,
              userText,
              maxTokens,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || `${aiProvider} API error`);
          }

          const data = await res.json();
          return data.text || "";
        } catch (backendError) {
          console.warn("Backend API failed, falling back to direct API calls:", backendError);
        }
      }

      // Fallback
      if (aiProvider === "claude") {
        const key = apiKeys.claude;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
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
        return data.content?.map((c: any) => c.text || "").join("") || "";
      }

      const key = apiKeys[aiProvider as keyof typeof apiKeys];
      if (!key) throw new Error(`${aiProvider} API 키가 없습니다. 설정에서 키를 입력해주세요.`);

      if (aiProvider === "openai") {
        const msgs = [
          { role: 'system', content: systemPrompt },
          ...history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          { role: 'user', content: userText },
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

      if (aiProvider === "gemini") {
        const contents = [
          ...history.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text: userText }] },
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
        return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
      }

      throw new Error("알 수 없는 AI 프로바이더");
    } catch (error: any) {
      throw error;
    }
  }, [aiProvider, aiModels, apiKeys, USE_BACKEND, API_BASE_URL]);

  const sendMessage = useCallback(async (inputText?: string) => {
    // This will be implemented or passed from App.tsx
    console.log("sendMessage placeholder", inputText);
  }, []);

  const sendScenario = useCallback(async (sit: any) => {
    // This will be implemented or passed from App.tsx
    console.log("sendScenario placeholder", sit);
  }, []);

  const value: ChatContextType = {
    messages,
    setMessages,
    input,
    setInput,
    loading,
    setLoading,
    feedback,
    setFeedback,
    stats,
    setStats,
    journal,
    setJournal,
    addMessage,
    addFeedback,
    updateStats,
    addJournalEntry,
    clearMessages,
    initializeWelcomeMessage,
    callAI,
    sendMessage,
    sendScenario,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
