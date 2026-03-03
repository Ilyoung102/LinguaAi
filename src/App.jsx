import { useState, useEffect, useRef, useCallback } from "react";

const LANGUAGES = [
  { code: "es", name: "스페인어", flag: "🇪🇸", nativeName: "Español",  ttsLang: "es-ES" },
  { code: "fr", name: "프랑스어", flag: "🇫🇷", nativeName: "Français", ttsLang: "fr-FR" },
  { code: "de", name: "독일어",   flag: "🇩🇪", nativeName: "Deutsch",  ttsLang: "de-DE" },
  { code: "ja", name: "일본어",   flag: "🇯🇵", nativeName: "日本語",   ttsLang: "ja-JP" },
  { code: "it", name: "이탈리아어", flag: "🇮🇹", nativeName: "Italiano", ttsLang: "it-IT" },
  { code: "pt", name: "포르투갈어", flag: "🇧🇷", nativeName: "Português", ttsLang: "pt-BR" },
  { code: "zh", name: "중국어",   flag: "🇨🇳", nativeName: "中文",    ttsLang: "zh-CN" },
];

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLORS = {
  A1: "#64b5f6", A2: "#4fc3f7", B1: "#4db6ac",
  B2: "#81c784", C1: "#ffb74d", C2: "#f06292"
};

// AI 프로바이더 & 모델 정의
const AI_PROVIDERS = {
  claude: {
    name: "Claude",
    icon: "🟠",
    color: "#fb923c",
    models: [
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { id: "claude-opus-4-5",          label: "Claude Opus 4.5" },
      { id: "claude-haiku-4-5-20251001",label: "Claude Haiku 4.5" },
    ],
    placeholder: "sk-ant-api03-...",
  },
  openai: {
    name: "ChatGPT",
    icon: "🟢",
    color: "#4ade80",
    models: [
      { id: "gpt-4o",       label: "GPT-4o" },
      { id: "gpt-4o-mini",  label: "GPT-4o mini" },
      { id: "gpt-4-turbo",  label: "GPT-4 Turbo" },
    ],
    placeholder: "sk-...",
  },
  gemini: {
    name: "Gemini",
    icon: "🔵",
    color: "#60a5fa",
    models: [
      { id: "gemini-2.0-flash",        label: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro",          label: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash",        label: "Gemini 1.5 Flash" },
    ],
    placeholder: "AIza...",
  },
};

const MODE_LABELS = { casual: "💬 일상 대화", structured: "📚 구조화 수업" };

const initialGoals = [
  { id: 1, text: "기본 인사말 마스터", done: false },
  { id: 2, text: "현재 시제 동사 활용", done: false },
  { id: 3, text: "일상 어휘 50단어 습득", done: false },
];

// Convert hex color to "r,g,b" string for rgba()
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

// Renders dialogue text with 3-line format:
// Line 1 (원어): plain text — white, normal weight
// 📢 line (발음): coral/orange — italic, smaller
// 💬 line (해석): muted blue-gray — small
// Other lines (📖 title, 📌 section, • bullet): special styles
function FormattedMessage({ text }) {
  // **bold** → <strong> 렌더링
  function renderText(str) {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, idx) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={idx} style={{ color: "#f1f5f9" }}>{p.slice(2, -2)}</strong>;
      }
      return p;
    });
  }
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (!t) {
      // empty line → small gap
      elements.push(<div key={i} style={{ height: "6px" }} />);
      i++; continue;
    }

    // 📖 episode title
    if (t.startsWith("📖")) {
      elements.push(
        <div key={i} style={{ fontSize: "14px", fontWeight: 700, color: "#a78bfa", marginBottom: "10px", marginTop: "4px" }}>{t}</div>
      );
      i++; continue;
    }

    // 📌 section header
    if (t.startsWith("📌")) {
      elements.push(
        <div key={i} style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa", marginTop: "14px", marginBottom: "6px", borderTop: "1px solid rgba(96,165,250,0.2)", paddingTop: "10px" }}>{t}</div>
      );
      i++; continue;
    }

    // 📢 pronunciation line — 레이블 제거하고 📢 + 발음만 표시
    if (t.startsWith("📢")) {
      const colonIdx = t.indexOf(":");
      const pronText = colonIdx !== -1 ? t.slice(colonIdx + 1).trim() : t.slice(2).trim();
      elements.push(
        <div key={i} style={{ fontSize: "12px", color: "#fdba74", fontStyle: "italic", paddingLeft: "12px", marginTop: "1px" }}>
          📢 {pronText}
        </div>
      );
      i++; continue;
    }

    // 💬 Korean meaning/translation line — 레이블 제거하고 💬 + 해석만 표시
    if (t.startsWith("💬")) {
      const colonIdx = t.indexOf(":");
      const krText = colonIdx !== -1 ? t.slice(colonIdx + 1).trim() : t.slice(2).trim();
      elements.push(
        <div key={i} style={{ fontSize: "12px", color: "#94a3b8", paddingLeft: "12px", marginBottom: "8px" }}>
          💬 {krText}
        </div>
      );
      i++; continue;
    }

    // • bullet (핵심 표현 항목)
    if (t.startsWith("•") || t.startsWith("-")) {
      elements.push(
        <div key={i} style={{ fontSize: "13px", color: "#cbd5e1", paddingLeft: "8px", marginBottom: "2px" }}>{t}</div>
      );
      i++; continue;
    }

    // A: / B: dialogue line (원어 대사) — most important, highlighted
    if (/^[A-Z]:\s/.test(t) || /^[AB]:\s/.test(t)) {
      elements.push(
        <div key={i} style={{ fontSize: "14px", color: "#f1f5f9", fontWeight: 600, marginTop: "10px" }}>
          {renderText(t)}
        </div>
      );
      i++; continue;
    }

    // default plain line
    elements.push(
      <div key={i} style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "2px" }}>
        {renderText(t)}
      </div>
    );
    i++;
  }
  return <div style={{ lineHeight: "1.7" }}>{elements}</div>;
}

// Animated waveform component shown while TTS is playing
function Waveform({ color = "#f472b6" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", height: "14px" }}>
      {[1, 2, 3, 4, 3].map((h, i) => (
        <span key={i} style={{
          display: "inline-block",
          width: "2px",
          height: `${h * 3}px`,
          background: color,
          borderRadius: "1px",
          animation: `wavebar 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
        }} />
      ))}
    </span>
  );
}

export default function LanguageTutor() {
  // 초기 언어: 일본어(index 3), 초기 탭: 상황 모드
  const [lang, setLang] = useState(LANGUAGES[3]);
  const [level, setLevel] = useState("A1");
  const [mode, setMode] = useState("casual");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [goals, setGoals] = useState(initialGoals);
  const [newGoal, setNewGoal] = useState("");
  const [editingGoal, setEditingGoal] = useState(null);
  const [stats, setStats] = useState({ messages: 0, vocab: 0, grammar: 0, time: 0 });
  const [journal, setJournal] = useState([]);
  const [activeTab, setActiveTab] = useState("situations"); // 초기: 상황 탭
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // AI 설정 — localStorage에서 복원
  const [aiProvider, setAiProvider] = useState(() => {
    try { return localStorage.getItem("lingua_provider") || "claude"; } catch { return "claude"; }
  });
  const [aiModels, setAiModels] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lingua_models") || "{}");
      return {
        claude: saved.claude || "claude-sonnet-4-20250514",
        openai: saved.openai || "gpt-4o",
        gemini: saved.gemini || "gemini-2.0-flash",
      };
    } catch { return { claude: "claude-sonnet-4-20250514", openai: "gpt-4o", gemini: "gemini-2.0-flash" }; }
  });
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lingua_keys") || "{}");
      return { claude: saved.claude || "", openai: saved.openai || "", gemini: saved.gemini || "" };
    } catch { return { claude: "", openai: "", gemini: "" }; }
  });
  const [showKeys, setShowKeys] = useState({ claude: false, openai: false, gemini: false });

  // 설정 변경 시 localStorage 자동 저장
  useEffect(() => {
    try { localStorage.setItem("lingua_provider", aiProvider); } catch {}
  }, [aiProvider]);
  useEffect(() => {
    try { localStorage.setItem("lingua_models", JSON.stringify(aiModels)); } catch {}
  }, [aiModels]);
  useEffect(() => {
    try { localStorage.setItem("lingua_keys", JSON.stringify(apiKeys)); } catch {}
  }, [apiKeys]);
  const [sessionStart] = useState(Date.now());
  // TTS states
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speakingId, setSpeakingId] = useState(null);
  const [ttsRepeat, setTtsRepeat] = useState(false);
  const [ttsRate, setTtsRate] = useState(0.85);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [ttsInterval, setTtsInterval] = useState(1200);
  const [ttsVoices, setTtsVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showTtsPanel, setShowTtsPanel] = useState(false);
  const chatRef = useRef(null);
  const timerRef = useRef(null);
  const utteranceRef = useRef(null);
  const repeatRef = useRef(false);
  const currentTextRef = useRef("");
  const currentMsgIdRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setStats(s => ({ ...s, time: Math.floor((Date.now() - sessionStart) / 60000) }));
    }, 10000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Load available TTS voices
  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis?.getVoices() || [];
      setTtsVoices(voices);
    }
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Auto-select best voice when language or voices change
  useEffect(() => {
    if (!ttsVoices.length) return;
    const targetLang = lang.ttsLang;
    // Prefer exact match (e.g. es-ES), then base lang match (es), then any
    const exact = ttsVoices.find(v => v.lang === targetLang);
    const base  = ttsVoices.find(v => v.lang.startsWith(lang.code));
    setSelectedVoice(exact || base || null);
  }, [lang, ttsVoices]);

  // keep repeatRef in sync with ttsRepeat state
  useEffect(() => { repeatRef.current = ttsRepeat; }, [ttsRepeat]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    currentTextRef.current = "";
    currentMsgIdRef.current = null;
  }, []);

  // TTS용 텍스트 필터: 📢 발음줄, 💬 해석줄, 📌/• 섹션줄 모두 제거 → 원어 대사만 남김
  function filterForTTS(text) {
    const lines = text.split("\n");
    const result = [];

    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;

      // 📢 발음 줄 — 콜론 뒤 발음 텍스트만 추출
      if (t.startsWith("📢")) {
        const colonIdx = t.indexOf(":");
        if (colonIdx !== -1) {
          const pron = t.slice(colonIdx + 1).trim();
          if (pron) result.push(cleanForTTS(pron));
        }
        continue;
      }

      // 💬 한국어 해석 줄 제거
      if (t.startsWith("💬")) continue;
      if (t.startsWith("→")) continue;
      if (t.startsWith("📌")) continue;
      if (t.startsWith("📖")) continue;
      if (t.startsWith("•") || t.startsWith("-")) continue;

      // 한글 비율 50% 초과 줄 제거
      const hangulCount = (t.match(/[\uAC00-\uD7AF]/g) || []).length;
      const totalLen = t.replace(/\s/g, "").length;
      if (totalLen > 0 && hangulCount / totalLen > 0.5) continue;

      // A: / B: 화자 레이블 제거 후 대사만 추출
      const speakerMatch = t.match(/^[A-Za-z]{1,2}:\s*(.+)$/);
      if (speakerMatch) {
        result.push(cleanForTTS(speakerMatch[1].trim()));
        continue;
      }

      result.push(cleanForTTS(t));
    }

    return result.join(" ");
  }

  // 마크다운 기호 및 불필요한 특수문자 제거
  function cleanForTTS(str) {
    return str
      .replace(/\*\*(.+?)\*\*/g, "$1")   // **굵게** → 굵게
      .replace(/\*(.+?)\*/g, "$1")        // *이탤릭* → 이탤릭
      .replace(/`(.+?)`/g, "$1")          // `코드` → 코드
      .replace(/_{1,2}(.+?)_{1,2}/g, "$1") // __밑줄__ → 밑줄
      .replace(/#+\s*/g, "")              // ## 헤더 제거
      .replace(/\[(.+?)\]\(.+?\)/g, "$1") // [링크](url) → 링크
      .replace(/[*_`~#>|]/g, "")          // 남은 마크다운 기호 제거
      .replace(/\s+/g, " ")
      .trim();
  }

  // Split text into sentences for interval-based playback
  function splitSentences(text) {
    const cleaned = filterForTTS(text);
    // Split on sentence-ending punctuation
    return cleaned
      .replace(/[\u{1F300}-\u{1FFFF}]/gu, " ")  // strip emoji
      .split(/(?<=[.!?。！？])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 1);
  }

  const speakSentences = useCallback((sentences, msgId, idx = 0) => {
    if (!window.speechSynthesis) return;
    if (idx >= sentences.length) {
      // All sentences done — check repeat
      if (repeatRef.current) {
        setTimeout(() => speakSentences(sentences, msgId, 0), ttsInterval * 2);
      } else {
        setSpeakingId(null);
        currentMsgIdRef.current = null;
      }
      return;
    }
    const s = sentences[idx];
    if (!s) { speakSentences(sentences, msgId, idx + 1); return; }

    const utter = new SpeechSynthesisUtterance(s);
    utter.lang  = lang.ttsLang;
    utter.rate  = ttsRate;
    utter.pitch = ttsPitch;
    if (selectedVoice) utter.voice = selectedVoice;
    utter.onend = () => {
      // Wait interval then next sentence
      setTimeout(() => {
        if (currentMsgIdRef.current === msgId) {
          speakSentences(sentences, msgId, idx + 1);
        }
      }, ttsInterval);
    };
    utter.onerror = () => {
      setTimeout(() => {
        if (currentMsgIdRef.current === msgId) {
          speakSentences(sentences, msgId, idx + 1);
        }
      }, ttsInterval);
    };
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [lang, ttsRate, ttsPitch, selectedVoice, ttsInterval]);

  const speak = useCallback((text, msgId) => {
    if (!window.speechSynthesis) return;
    // Toggle stop if same message
    if (speakingId === msgId) { stopSpeaking(); return; }
    stopSpeaking();
    currentTextRef.current = text;
    currentMsgIdRef.current = msgId;
    setSpeakingId(msgId);
    const sentences = splitSentences(text);
    speakSentences(sentences, msgId, 0);
  }, [speakingId, stopSpeaking, speakSentences]);

  const repeatSpeak = useCallback((text, msgId) => {
    // Toggle repeat flag and (re)start
    const next = !ttsRepeat;
    setTtsRepeat(next);
    repeatRef.current = next;
    if (speakingId !== msgId) {
      speak(text, msgId);
    }
  }, [ttsRepeat, speakingId, speak]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    stopSpeaking();
    const welcome = {
      role: "assistant",
      text: getWelcomeMessage(lang),
      ts: Date.now(),
      id: Date.now(),
    };
    setMessages([welcome]);
    setFeedback([]);
  }, [lang]);

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
          model: key ? model : "claude-sonnet-4-20250514",
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
  // ─────────────────────────────────────────────────────────────

  function getWelcomeMessage(l) {
    const msgs = {
      es: `¡Hola! Soy tu tutor de ${l.nativeName}. ¿Cómo te llamas? 😊`,
      fr: `Bonjour! Je suis ton tuteur de ${l.nativeName}. Comment tu t'appelles? 😊`,
      de: `Hallo! Ich bin dein ${l.nativeName}-Tutor. Wie heißt du? 😊`,
      ja: `こんにちは！私はあなたの${l.nativeName}チューターです。お名前は何ですか？😊`,
      it: `Ciao! Sono il tuo tutor di ${l.nativeName}. Come ti chiami? 😊`,
      pt: `Olá! Sou seu tutor de ${l.nativeName}. Como você se chama? 😊`,
      zh: `你好！我是你的${l.nativeName}老师。你叫什么名字？😊`,
    };
    return msgs[l.code] || `Hello! I'm your ${l.nativeName} tutor. Let's begin! 😊`;
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: input, ts: Date.now(), id: Date.now() };
    setMessages(m => [...m, userMsg]);
    const userInput = input;
    setInput("");
    setLoading(true);

    const history = messages.slice(-8).map(m => ({
      role: m.role,
      content: m.text
    }));

    const systemPrompt = `You are an expert ${lang.nativeName} language tutor. The student's level is ${level}.
Mode: ${mode === "casual" ? "casual conversation" : "structured lesson"}.
Current learning goals: ${goals.filter(g => !g.done).map(g => g.text).join(", ")}.

Instructions:
1. Respond primarily in ${lang.nativeName} appropriate for ${level} level.
2. For EVERY ${lang.nativeName} sentence or phrase you write, immediately follow it with:
   - Line 2: 📢 ${lang.nativeName === "日本語" ? "히라가나 읽기" : lang.nativeName === "中文" ? "병음(拼音)" : "한국어 발음"}: [Korean pronunciation transcription]
   - Line 3: 💬 한국어 해석: [natural Korean translation]
3. After your full response, add "---FEEDBACK---" then JSON: {"grammar":"...","vocab":"...","tip":"...","suggestedLevel":"A1"}
4. Keep responses natural and encouraging.`;

    try {
      const fullText = await callAI(systemPrompt, history, userInput, 1200);
      const [mainText, feedbackRaw] = fullText.split("---FEEDBACK---");
      let parsedFeedback = null;
      if (feedbackRaw) {
        try {
          const jsonMatch = feedbackRaw.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsedFeedback = JSON.parse(jsonMatch[0]);
        } catch {}
      }

      const newMsgId = Date.now();
      setMessages(m => [...m, { role: "assistant", text: mainText.trim(), ts: newMsgId, id: newMsgId }]);
      // Auto-speak if TTS enabled
      if (ttsEnabled) {
        setTimeout(() => speak(mainText.trim(), newMsgId), 100);
      }

      if (parsedFeedback) {
        const fb = {
          id: Date.now(),
          ...parsedFeedback,
          userMsg: userInput,
          ts: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        };
        setFeedback(f => [fb, ...f.slice(0, 9)]);
        if (parsedFeedback.suggestedLevel && LEVELS.includes(parsedFeedback.suggestedLevel)) {
          const curr = LEVELS.indexOf(level);
          const sugg = LEVELS.indexOf(parsedFeedback.suggestedLevel);
          if (sugg > curr && stats.messages > 3) setLevel(LEVELS[Math.min(curr + 1, 5)]);
        }
        setStats(s => ({
          ...s,
          messages: s.messages + 1,
          vocab: Math.min(100, s.vocab + (parsedFeedback.vocab?.length > 20 ? 3 : 1)),
          grammar: Math.min(100, s.grammar + (parsedFeedback.grammar?.includes("잘") ? 2 : 1)),
        }));
        if (stats.messages % 5 === 4) {
          setJournal(j => [{
            id: Date.now(),
            date: new Date().toLocaleDateString("ko-KR"),
            summary: `${lang.name} 학습 - ${stats.messages + 1}개 메시지 교환, 레벨: ${level}`,
            highlight: parsedFeedback.tip || "",
          }, ...j.slice(0, 4)]);
        }
      } else {
        setStats(s => ({ ...s, messages: s.messages + 1 }));
      }
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", text: `⚠️ ${e.message || "오류가 발생했습니다. 다시 시도해주세요."}`, ts: Date.now(), id: Date.now() }]);
    }
    setLoading(false);
  }

  function addGoal() {
    if (!newGoal.trim()) return;
    setGoals(g => [...g, { id: Date.now(), text: newGoal.trim(), done: false }]);
    setNewGoal("");
  }

  function toggleGoal(id) {
    setGoals(g => g.map(go => go.id === id ? { ...go, done: !go.done } : go));
  }

  function deleteGoal(id) {
    setGoals(g => g.filter(go => go.id !== id));
  }

  function saveEditGoal(id, text) {
    setGoals(g => g.map(go => go.id === id ? { ...go, text } : go));
    setEditingGoal(null);
  }

  // ---------- 텍스트 파일 저장 ----------
  function saveAsText() {
    if (messages.length === 0) return;

    // 파일 제목: 마지막 사용자 메시지 10자 이내 + 날짜시간분
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    const rawTitle = lastUserMsg ? lastUserMsg.text.replace(/[\r\n\s]+/g, " ").trim().slice(0, 10) : "대화";
    const now = new Date();
    const ts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
    ].join("");
    const filename = `${rawTitle}_${ts}.txt`;

    // 텍스트 내용 구성
    const header = [
      `LinguaAI 학습 대화 기록`,
      `언어: ${lang.name} (${lang.nativeName}) | 레벨: ${level} | 모드: ${mode === "casual" ? "일상 대화" : "구조화 수업"}`,
      `저장 일시: ${now.toLocaleString("ko-KR")}`,
      "=".repeat(60),
      "",
    ].join("\n");

    const body = messages.map(m => {
      if (m.isScenario) {
        return `[상황 요청] ${m.text}\n`;
      }
      const role = m.role === "user" ? "👤 나" : "🌍 튜터";
      return `${role}\n${m.text}\n`;
    }).join("\n" + "-".repeat(40) + "\n\n");

    const content = header + body;

    // 다운로드 트리거 — data: URI 방식 (sandbox 환경 호환)
    const encoded = encodeURIComponent(content);
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encoded;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ---------- Situation Prompts ----------
  const SITUATIONS = [
    { id: "cafe",         label: "카페",     icon: "☕", color: "#c084fc" },
    { id: "travel",       label: "여행",     icon: "✈️", color: "#38bdf8" },
    { id: "hotel",        label: "호텔",     icon: "🏨", color: "#fb923c" },
    { id: "airport",      label: "공항",     icon: "🛫", color: "#a3e635" },
    { id: "shopping",     label: "쇼핑",     icon: "🛍️", color: "#f472b6" },
    { id: "restaurant",   label: "레스토랑", icon: "🍽️", color: "#facc15" },
    { id: "street",       label: "거리",     icon: "🚶", color: "#4ade80" },
    { id: "phone",        label: "전화",     icon: "📞", color: "#60a5fa" },
    { id: "work",         label: "일",       icon: "💼", color: "#94a3b8" },
    { id: "hospital",     label: "병원",     icon: "🏥", color: "#f87171" },
    { id: "business",     label: "비즈니스", icon: "🤝", color: "#818cf8" },
    { id: "general",      label: "일반",     icon: "💬", color: "#e2e8f0" },
    { id: "chit",         label: "잡담",     icon: "😄", color: "#fbbf24" },
    { id: "beginner",     label: "초급단어", icon: "🌱", color: "#6ee7b7" },
    { id: "intermediate", label: "중급단어", icon: "🌿", color: "#34d399" },
    { id: "advanced",     label: "고급단어", icon: "🌳", color: "#059669" },
  ];

  // 언어별 발음 표기 방식 레이블
  function getPronunciationLabel(langCode) {
    const map = {
      ja: "히라가나 읽기",
      zh: "병음(拼音)",
      ko: "발음",
      ar: "발음(로마자)",
    };
    return map[langCode] || "한국어 발음";
  }

  function buildScenarioPrompt(sit) {
    const nativeName = lang.nativeName;
    const lvl = level;
    const pronLabel = getPronunciationLabel(lang.code);

    // 3줄 형식: 원어 / 발음 / 한국어 해석
    const dialogueBase = (place) => `
${nativeName}로 "${place}" 상황의 실제 대화문을 작성해줘. 학습자 수준: ${lvl}

【필수 규칙】
1. 두 사람(A, B)이 실제로 주고받는 완성된 대화 — 총 10~14 교환
2. 기(시작)→승(전개/문제)→결(해결/마무리) 흐름
3. 모든 대화는 구체적이고 완성된 문장이어야 함
   ❌ 절대 금지: ~をください / ~が欲しい / [음식명] / （商品名） 같은 플레이스홀더
   ✅ 반드시: コーヒーをください / このシャツをください 처럼 실제 단어 사용
4. 에피소드 제목을 ${nativeName}로
5. 에피소드 끝에 📌 핵심 표현 4~5개

【출력 형식 — 각 대화줄마다 정확히 3줄】
A: [완성된 ${nativeName} 문장]
📢 [한국어 발음(한글로)]
💬 [자연스러운 한국어 번역]

B: [완성된 ${nativeName} 문장]
📢 [한국어 발음(한글로)]
💬 [자연스러운 한국어 번역]

【출력 예시 — 카페 상황, 일본어】
📖 カフェでのひととき

A: いらっしゃいませ！ご注文はお決まりですか？
📢 이랏샤이마세！고추몽와 오키마리데스카？
💬 어서 오세요! 주문은 정하셨나요?

B: ホットコーヒーをひとつと、チーズケーキをください。
📢 홋토코-히-오 히토츠토、치-즈케-키오 쿠다사이。
💬 따뜻한 커피 한 잔이랑 치즈케이크 주세요.

A: かしこまりました。サイズはいかがなさいますか？
📢 카시코마리마시타。사이즈와 이카가 나사이마스카？
💬 알겠습니다. 사이즈는 어떻게 하시겠어요?

📌 핵심 표현
ご注文はお決まりですか？
📢 고추몽와 오키마리데스카？
💬 주문은 정하셨나요?
`.trim();

    const wordBase = (label, range) => `
${nativeName} ${range} 수준의 핵심 어휘 15개를 선정해줘.

각 어휘마다 3줄 형식으로:
1번줄: 번호. [${nativeName} 단어/표현]
2번줄: 📢 ${getPronunciationLabel(lang.code)}: [한국어 발음]
3번줄: 💬 한국어 해석: [뜻] / 예문: [${nativeName} 예문]

마지막에 이 어휘를 활용한 짧은 대화문(A/B, 6줄 이상)을 동일한 3줄 형식으로 작성.
대화문 제목: 📖 어휘 활용 대화
`.trim();

    const map = {
      cafe:         dialogueBase("카페"),
      travel:       dialogueBase("여행 중"),
      hotel:        dialogueBase("호텔 체크인/체크아웃"),
      airport:      dialogueBase("공항 탑승 수속"),
      shopping:     dialogueBase("쇼핑몰/옷가게"),
      restaurant:   dialogueBase("레스토랑 주문"),
      street:       dialogueBase("길거리에서 길 묻기"),
      phone:        dialogueBase("전화 통화"),
      work:         dialogueBase("직장 동료와의 대화"),
      hospital:     dialogueBase("병원 진료"),
      business:     dialogueBase("비즈니스 미팅"),
      general:      dialogueBase("일상생활"),
      chit:         dialogueBase("친구와의 가벼운 잡담"),
      beginner:     wordBase("초급", "A1-A2"),
      intermediate: wordBase("중급", "B1-B2"),
      advanced:     wordBase("고급", "C1-C2"),
    };
    return map[sit.id] || dialogueBase(sit.label);
  }

  async function sendScenario(sit) {
    if (loading) return;
    const displayText = `[${sit.label}]`;
    const actualPrompt = buildScenarioPrompt(sit);
    const userMsgId = Date.now();
    setMessages(m => [...m, {
      role: "user", text: displayText, ts: userMsgId, id: userMsgId,
      isScenario: true, scenarioColor: sit.color, scenarioIcon: sit.icon,
    }]);
    setLoading(true);
    setActiveTab("feedback");

    const history = messages.slice(-6).map(m => ({ role: m.role, content: m.text }));
    const systemPrompt = `You are an expert ${lang.nativeName} language tutor at level ${level}.
Write COMPLETE, CONCRETE dialogue — every sentence must use real specific words (e.g. コーヒー, このシャツ, 山田さん).
STRICTLY FORBIDDEN: placeholder patterns like 〜をください, [商品名], ＿＿, （名前）, ~が欲しい with tildes as fillers.
Each dialogue line must use the exact 3-line format shown in the prompt with no colons after 📢 or 💬 labels — just the text directly.
Format: 
A: [sentence]
📢 [pronunciation in Korean hangul]
💬 [Korean translation]
After ALL content add exactly "---FEEDBACK---" then JSON: {"grammar":"tip","vocab":"핵심표현요약","tip":"학습팁","suggestedLevel":"${level}"}
Do NOT stop mid-dialogue. Complete the full episode before the feedback section.`;

    try {
      const fullText = await callAI(systemPrompt, history, actualPrompt, 2500);
      const [mainText, feedbackRaw] = fullText.split("---FEEDBACK---");
      let parsedFeedback = null;
      if (feedbackRaw) {
        try { const m2 = feedbackRaw.match(/\{[\s\S]*\}/); if (m2) parsedFeedback = JSON.parse(m2[0]); } catch {}
      }
      const newMsgId = Date.now();
      setMessages(m => [...m, { role: "assistant", text: mainText.trim(), ts: newMsgId, id: newMsgId }]);
      if (ttsEnabled) setTimeout(() => speak(mainText.trim(), newMsgId), 100);
      if (parsedFeedback) {
        setFeedback(f => [{
          id: Date.now(), ...parsedFeedback, userMsg: displayText,
          ts: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        }, ...f.slice(0, 9)]);
      }
      setStats(s => ({ ...s, messages: s.messages + 1 }));
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", text: `⚠️ ${e.message || "오류가 발생했습니다."}`, ts: Date.now(), id: Date.now() }]);
    }
    setLoading(false);
  }

  const levelIdx = LEVELS.indexOf(level);
  const levelProgress = ((levelIdx) / (LEVELS.length - 1)) * 100;

  return (
    <div style={{
      fontFamily: "'Noto Sans KR', 'Noto Sans JP', sans-serif",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      minHeight: "100vh",
      color: "#e8e8f0",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <header style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>🌍</span>
          <span style={{ fontWeight: 700, fontSize: "18px", background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            LinguaAI
          </span>
        </div>

        {/* Language Selector */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowLangDropdown(!showLangDropdown)} style={{
            background: "rgba(167,139,250,0.15)",
            border: "1px solid rgba(167,139,250,0.4)",
            borderRadius: "10px",
            padding: "7px 14px",
            color: "#e8e8f0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
          }}>
            {lang.flag} {lang.name} <span style={{ opacity: 0.6, fontSize: "12px" }}>▾</span>
          </button>
          {showLangDropdown && (
            <div style={{
              position: "absolute",
              top: "110%",
              left: 0,
              background: "#1e1b3a",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              overflow: "hidden",
              zIndex: 200,
              minWidth: "180px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { setLang(l); setShowLangDropdown(false); }} style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: lang.code === l.code ? "rgba(167,139,250,0.2)" : "transparent",
                  border: "none",
                  color: "#e8e8f0",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  fontSize: "14px",
                  transition: "background 0.15s",
                }}>
                  {l.flag} {l.name} <span style={{ opacity: 0.5, fontSize: "12px" }}>{l.nativeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Level Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", opacity: 0.6 }}>레벨</span>
          <span style={{
            background: LEVEL_COLORS[level],
            color: "#fff",
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "13px",
            boxShadow: `0 0 12px ${LEVEL_COLORS[level]}66`,
          }}>{level}</span>
          <div style={{ width: "80px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: `${levelProgress}%`, height: "100%", background: LEVEL_COLORS[level], transition: "width 0.5s" }} />
          </div>
        </div>

        {/* Mode Toggle */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          {/* TTS Controls */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowTtsPanel(p => !p)}
              title="음성 설정"
              style={{
                background: ttsEnabled ? "rgba(244,114,182,0.15)" : "rgba(255,255,255,0.05)",
                border: ttsEnabled ? "1px solid rgba(244,114,182,0.4)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "7px 12px",
                color: ttsEnabled ? "#f472b6" : "#666",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.2s",
              }}
            >
              {speakingId ? <><Waveform color="#f472b6" /><span style={{ fontSize: "11px" }}>재생 중</span></> : <><span>🔊</span><span style={{ fontSize: "11px" }}>음성</span></>}
            </button>

            {showTtsPanel && (
              <div style={{
                position: "absolute",
                top: "110%",
                right: 0,
                background: "#1a1730",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "14px",
                padding: "16px",
                zIndex: 300,
                minWidth: "240px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#a78bfa", marginBottom: "14px" }}>🔊 음성 설정</div>

                {/* TTS on/off */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span style={{ fontSize: "12px", color: "#ccc" }}>자동 읽기</span>
                  <button
                    onClick={() => setTtsEnabled(v => !v)}
                    style={{
                      width: "42px", height: "22px",
                      background: ttsEnabled ? "#a78bfa" : "rgba(255,255,255,0.1)",
                      border: "none", borderRadius: "11px", cursor: "pointer",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <span style={{
                      position: "absolute", top: "3px",
                      left: ttsEnabled ? "22px" : "3px",
                      width: "16px", height: "16px",
                      background: "#fff", borderRadius: "50%",
                      transition: "left 0.2s",
                    }} />
                  </button>
                </div>

                {/* Speed */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#ccc", marginBottom: "6px" }}>
                    <span>속도</span>
                    <span style={{ color: "#a78bfa" }}>{ttsRate.toFixed(1)}x</span>
                  </div>
                  <input type="range" min="0.5" max="2" step="0.1" value={ttsRate}
                    onChange={e => setTtsRate(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "#a78bfa" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#555" }}>
                    <span>느리게</span><span>보통</span><span>빠르게</span>
                  </div>
                </div>

                {/* Pitch */}
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#ccc", marginBottom: "6px" }}>
                    <span>음높이</span>
                    <span style={{ color: "#60a5fa" }}>{ttsPitch.toFixed(1)}</span>
                  </div>
                  <input type="range" min="0.5" max="2" step="0.1" value={ttsPitch}
                    onChange={e => setTtsPitch(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "#60a5fa" }} />
                </div>

                {/* Interval between sentences */}
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#ccc", marginBottom: "6px" }}>
                    <span>문장 간 쉬기</span>
                    <span style={{ color: "#4ade80" }}>{(ttsInterval / 1000).toFixed(1)}초</span>
                  </div>
                  <input type="range" min="500" max="3000" step="100" value={ttsInterval}
                    onChange={e => setTtsInterval(parseInt(e.target.value))}
                    style={{ width: "100%", accentColor: "#4ade80" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#555" }}>
                    <span>0.5s</span><span>1.5s</span><span>3.0s</span>
                  </div>
                </div>

                {/* Voice selector */}
                {ttsVoices.filter(v => v.lang.startsWith(lang.code)).length > 0 && (
                  <div>
                    <div style={{ fontSize: "12px", color: "#ccc", marginBottom: "6px" }}>음성 선택</div>
                    <select
                      value={selectedVoice?.name || ""}
                      onChange={e => setSelectedVoice(ttsVoices.find(v => v.name === e.target.value) || null)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        color: "#e8e8f0",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    >
                      {ttsVoices.filter(v => v.lang.startsWith(lang.code)).map(v => (
                        <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Stop button */}
                {speakingId && (
                  <button onClick={stopSpeaking} style={{
                    marginTop: "12px",
                    width: "100%",
                    background: "rgba(244,114,182,0.15)",
                    border: "1px solid rgba(244,114,182,0.4)",
                    borderRadius: "8px",
                    padding: "7px",
                    color: "#f472b6",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}>⏹ 읽기 중지</button>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "4px" }}>
          {Object.entries(MODE_LABELS).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              background: mode === m ? "rgba(167,139,250,0.4)" : "transparent",
              color: mode === m ? "#fff" : "#aaa",
              cursor: "pointer",
              fontSize: "12px",
              transition: "all 0.2s",
            }}>{label}</button>
          ))}
          </div>

          {/* ⚙️ AI 설정 버튼 */}
          <button
            onClick={() => setShowSettings(true)}
            title="AI 설정"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: `1px solid rgba(${hexToRgb(AI_PROVIDERS[aiProvider].color)}, 0.4)`,
              borderRadius: "10px",
              padding: "7px 13px",
              color: "#e8e8f0",
              cursor: "pointer",
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.2s",
            }}
          >
            <span>⚙️</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.2 }}>
              <span style={{ fontSize: "11px", color: AI_PROVIDERS[aiProvider].color, fontWeight: 700 }}>
                {AI_PROVIDERS[aiProvider].icon} {AI_PROVIDERS[aiProvider].name}
              </span>
              <span style={{ fontSize: "9px", color: "#666" }}>
                {AI_PROVIDERS[aiProvider].models.find(m => m.id === aiModels[aiProvider])?.label || aiModels[aiProvider]}
              </span>
            </div>
            {!apiKeys[aiProvider] && aiProvider !== "claude" && (
              <span style={{ fontSize: "9px", color: "#f87171", background: "rgba(248,113,113,0.1)", padding: "1px 6px", borderRadius: "6px", border: "1px solid rgba(248,113,113,0.3)" }}>키 필요</span>
            )}
          </button>
        </div>
      </header>

      {/* ── AI 설정 모달 ─────────────────────────────────────── */}
      {showSettings && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            background: "linear-gradient(135deg, #1e1b3a, #16132e)",
            border: "1px solid rgba(167,139,250,0.3)",
            borderRadius: "20px",
            padding: "28px",
            width: "480px",
            maxWidth: "95vw",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          }}>
            {/* 모달 헤더 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#e8e8f0" }}>⚙️ AI 설정</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>API 키와 모델을 설정하세요</div>
              </div>
              <button onClick={() => setShowSettings(false)} style={{
                background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px",
                padding: "6px 12px", color: "#aaa", cursor: "pointer", fontSize: "16px",
              }}>✕</button>
            </div>

            {/* 활성 AI 선택 */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", color: "#888", marginBottom: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>사용할 AI</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {Object.entries(AI_PROVIDERS).map(([pid, prov]) => (
                  <button
                    key={pid}
                    onClick={() => setAiProvider(pid)}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      borderRadius: "12px",
                      border: aiProvider === pid
                        ? `2px solid ${prov.color}`
                        : "2px solid rgba(255,255,255,0.08)",
                      background: aiProvider === pid
                        ? `rgba(${hexToRgb(prov.color)}, 0.15)`
                        : "rgba(255,255,255,0.04)",
                      color: aiProvider === pid ? prov.color : "#888",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: aiProvider === pid ? 700 : 400,
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{prov.icon}</span>
                    <span>{prov.name}</span>
                    {apiKeys[pid] && <span style={{ fontSize: "9px", color: "#4ade80" }}>● 키 설정됨</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 각 AI별 API 키 + 모델 설정 */}
            {Object.entries(AI_PROVIDERS).map(([pid, prov]) => (
              <div key={pid} style={{
                marginBottom: "20px",
                padding: "16px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "14px",
                border: aiProvider === pid
                  ? `1px solid rgba(${hexToRgb(prov.color)}, 0.35)`
                  : "1px solid rgba(255,255,255,0.06)",
                opacity: aiProvider === pid ? 1 : 0.6,
                transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <span style={{ fontSize: "18px" }}>{prov.icon}</span>
                  <span style={{ fontWeight: 700, color: prov.color, fontSize: "14px" }}>{prov.name}</span>
                  {apiKeys[pid] && (
                    <span style={{ marginLeft: "auto", fontSize: "10px", color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(74,222,128,0.3)" }}>
                      ✓ 키 등록됨
                    </span>
                  )}
                </div>

                {/* API 키 입력 */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>API Key</div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type={showKeys[pid] ? "text" : "password"}
                      value={apiKeys[pid]}
                      onChange={e => setApiKeys(k => ({ ...k, [pid]: e.target.value }))}
                      placeholder={prov.placeholder}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "#e8e8f0",
                        fontSize: "12px",
                        outline: "none",
                        fontFamily: "monospace",
                      }}
                    />
                    <button
                      onClick={() => setShowKeys(k => ({ ...k, [pid]: !k[pid] }))}
                      style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px", padding: "8px 10px", color: "#aaa", cursor: "pointer", fontSize: "13px",
                      }}
                    >{showKeys[pid] ? "🙈" : "👁️"}</button>
                    {apiKeys[pid] && (
                      <button
                        onClick={() => setApiKeys(k => ({ ...k, [pid]: "" }))}
                        style={{
                          background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                          borderRadius: "8px", padding: "8px 10px", color: "#f87171", cursor: "pointer", fontSize: "12px",
                        }}
                      >삭제</button>
                    )}
                  </div>
                </div>

                {/* 모델 선택 */}
                <div>
                  <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>모델</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {prov.models.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setAiModels(prev => ({ ...prev, [pid]: m.id }))}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "8px",
                          border: aiModels[pid] === m.id
                            ? `1px solid ${prov.color}`
                            : "1px solid rgba(255,255,255,0.1)",
                          background: aiModels[pid] === m.id
                            ? `rgba(${hexToRgb(prov.color)}, 0.15)`
                            : "rgba(255,255,255,0.04)",
                          color: aiModels[pid] === m.id ? prov.color : "#888",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: aiModels[pid] === m.id ? 600 : 400,
                          transition: "all 0.15s",
                        }}
                      >{m.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Claude 키 없을 때 안내 */}
            {aiProvider === "claude" && !apiKeys["claude"] && (
              <div style={{
                marginTop: "12px",
                padding: "10px 14px",
                background: "rgba(251,146,60,0.08)",
                borderRadius: "10px",
                border: "1px solid rgba(251,146,60,0.25)",
                fontSize: "11px",
                color: "#fdba74",
                lineHeight: "1.7",
              }}>
                💡 Claude는 API 키 없이도 <strong>Claude.ai 내장 API</strong>로 동작합니다.<br/>
                키를 입력하면 본인 계정으로 직접 호출됩니다.
              </div>
            )}

            {/* 발급 안내 링크 */}
            <div style={{
              marginTop: "12px",
              padding: "12px 16px",
              background: "rgba(167,139,250,0.07)",
              borderRadius: "12px",
              border: "1px solid rgba(167,139,250,0.15)",
              fontSize: "11px",
              color: "#888",
              lineHeight: "1.8",
            }}>
              📌 API 키 발급처<br/>
              🟠 Claude: <span style={{ color: "#fb923c" }}>console.anthropic.com</span><br/>
              🟢 ChatGPT: <span style={{ color: "#4ade80" }}>platform.openai.com/api-keys</span><br/>
              🔵 Gemini: <span style={{ color: "#60a5fa" }}>aistudio.google.com/apikey</span>
            </div>

            {/* 확인 버튼 */}
            <button
              onClick={() => setShowSettings(false)}
              style={{
                marginTop: "16px",
                width: "100%",
                background: `linear-gradient(135deg, ${AI_PROVIDERS[aiProvider].color}, #a78bfa)`,
                border: "none",
                borderRadius: "12px",
                padding: "12px",
                color: "#fff",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {AI_PROVIDERS[aiProvider].icon} {AI_PROVIDERS[aiProvider].name} ·{" "}
              {AI_PROVIDERS[aiProvider].models.find(m => m.id === aiModels[aiProvider])?.label} 적용
            </button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flex: 1, gap: 0, maxHeight: "calc(100vh - 65px)", overflow: "hidden" }}>
        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Messages */}
          <div ref={chatRef} style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(167,139,250,0.3) transparent",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: "8px",
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: speakingId === msg.id
                      ? "linear-gradient(135deg, #f472b6, #a78bfa)"
                      : "linear-gradient(135deg, #a78bfa, #60a5fa)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", flexShrink: 0,
                    boxShadow: speakingId === msg.id ? "0 0 16px rgba(244,114,182,0.6)" : "none",
                    transition: "all 0.3s",
                  }}>🌍</div>
                )}
                <div style={{ maxWidth: "70%", position: "relative" }}>
                  {/* Scenario badge bubble */}
                  {msg.isScenario ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 16px",
                      background: `rgba(${hexToRgb(msg.scenarioColor)}, 0.15)`,
                      border: `1px solid rgba(${hexToRgb(msg.scenarioColor)}, 0.4)`,
                      borderRadius: "18px 18px 4px 18px",
                      boxShadow: `0 2px 12px rgba(${hexToRgb(msg.scenarioColor)}, 0.2)`,
                    }}>
                      <span style={{ fontSize: "18px" }}>{msg.scenarioIcon}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: msg.scenarioColor }}>{msg.text}</span>
                      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>상황 요청</span>
                    </div>
                  ) : (
                    <div style={{
                      background: msg.role === "user"
                        ? "linear-gradient(135deg, #a78bfa, #818cf8)"
                        : "rgba(255,255,255,0.07)",
                      border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      padding: "12px 16px",
                      paddingBottom: "36px",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      backdropFilter: "blur(10px)",
                      boxShadow: msg.role === "user" ? "0 4px 20px rgba(167,139,250,0.3)" : "0 2px 10px rgba(0,0,0,0.2)",
                    }}>
                      <FormattedMessage text={msg.text} />
                    </div>
                  )}
                  {/* Speak + Repeat buttons — only for non-scenario messages */}
                  {!msg.isScenario && (
                    <div style={{
                      position: "absolute",
                      bottom: "6px",
                      right: "10px",
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                    }}>
                      {/* Play/Stop button */}
                      <button
                        onClick={() => speak(msg.text, msg.id)}
                        title={speakingId === msg.id ? "정지" : "읽기"}
                        style={{
                          background: speakingId === msg.id ? "rgba(244,114,182,0.25)" : "rgba(255,255,255,0.08)",
                          border: speakingId === msg.id ? "1px solid rgba(244,114,182,0.5)" : "1px solid rgba(255,255,255,0.12)",
                          borderRadius: "14px",
                          padding: "3px 9px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.2s",
                        }}
                      >
                        {speakingId === msg.id
                          ? <><Waveform /><span style={{ fontSize: "10px", color: "#f472b6" }}>정지</span></>
                          : <><span style={{ fontSize: "12px" }}>🔊</span><span style={{ fontSize: "10px", color: "#aaa" }}>듣기</span></>
                        }
                      </button>
                      {/* Repeat toggle button */}
                      <button
                        onClick={() => repeatSpeak(msg.text, msg.id)}
                        title={ttsRepeat && speakingId === msg.id ? "반복 끄기" : "반복 재생"}
                        style={{
                          background: ttsRepeat && speakingId === msg.id ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)",
                          border: ttsRepeat && speakingId === msg.id ? "1px solid rgba(251,191,36,0.5)" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "14px",
                          padding: "3px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          transition: "all 0.2s",
                        }}
                      >
                        <span style={{ fontSize: "11px" }}>🔁</span>
                        <span style={{ fontSize: "10px", color: ttsRepeat && speakingId === msg.id ? "#fbbf24" : "#666" }}>
                          {ttsRepeat && speakingId === msg.id ? "ON" : ""}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #60a5fa)", display: "flex", alignItems: "center", justifyContent: "center" }}>🌍</div>
                <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", padding: "14px 20px", display: "flex", gap: "5px", alignItems: "center" }}>
                  {[0,1,2].map(n => (
                    <div key={n} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#a78bfa", animation: `bounce 1s ${n * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: "16px 20px",
            background: "rgba(255,255,255,0.03)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: "10px",
            alignItems: "flex-end",
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`${lang.nativeName}로 메시지를 입력하세요... (Shift+Enter: 줄바꿈)`}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "14px",
                padding: "12px 16px",
                color: "#e8e8f0",
                fontSize: "14px",
                resize: "none",
                outline: "none",
                lineHeight: "1.5",
                minHeight: "46px",
                maxHeight: "120px",
                fontFamily: "inherit",
              }}
              rows={1}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
              background: input.trim() && !loading ? "linear-gradient(135deg, #a78bfa, #60a5fa)" : "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "12px",
              padding: "12px 18px",
              color: "#fff",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              fontSize: "18px",
              transition: "all 0.2s",
              flexShrink: 0,
            }}>➤</button>

            {/* 저장 버튼 */}
            <button
              onClick={saveAsText}
              disabled={messages.length === 0}
              title="대화 내용을 텍스트 파일로 저장"
              style={{
                background: messages.length > 0 ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
                border: messages.length > 0 ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "12px 14px",
                color: messages.length > 0 ? "#4ade80" : "#555",
                cursor: messages.length > 0 ? "pointer" : "not-allowed",
                fontSize: "16px",
                transition: "all 0.2s",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span style={{ fontSize: "11px" }}>저장</span>
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{
          width: sidebarOpen ? "320px" : "0px",
          minWidth: sidebarOpen ? "320px" : "0px",
          background: "rgba(0,0,0,0.3)",
          borderLeft: sidebarOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.3s ease, min-width 0.3s ease",
          position: "relative",
        }}>
          {/* Sidebar toggle button — always visible on the left edge */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
            style={{
              position: "absolute",
              left: sidebarOpen ? "-18px" : "-18px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 50,
              width: "18px",
              height: "48px",
              background: "rgba(167,139,250,0.25)",
              border: "1px solid rgba(167,139,250,0.4)",
              borderRight: "none",
              borderRadius: "8px 0 0 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a78bfa",
              fontSize: "10px",
              transition: "background 0.2s",
              padding: 0,
            }}
          >{sidebarOpen ? "›" : "‹"}</button>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { id: "situations", label: "🗺️ 상황" },
              { id: "feedback",   label: "💡 피드백" },
              { id: "goals",      label: "🎯 목표" },
              { id: "progress",   label: "📊 진행" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1,
                padding: "11px 3px",
                background: activeTab === tab.id ? "rgba(167,139,250,0.15)" : "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #a78bfa" : "2px solid transparent",
                color: activeTab === tab.id ? "#a78bfa" : "#888",
                cursor: "pointer",
                fontSize: "10px",
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: "all 0.2s",
              }}>{tab.label}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", scrollbarWidth: "thin", scrollbarColor: "rgba(167,139,250,0.2) transparent" }}>

            {/* Situations Tab */}
            {activeTab === "situations" && (
              <div>
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa", marginBottom: "4px" }}>🗺️ 상황별 에피소드</div>
                  <div style={{ fontSize: "11px", color: "#666", lineHeight: "1.5" }}>
                    버튼을 누르면 해당 상황의 기·승·결 대화 에피소드 1개를 {lang.nativeName}로 생성합니다
                  </div>
                </div>

                {/* 4×4 icon grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "8px",
                }}>
                  {SITUATIONS.map(sit => (
                    <button
                      key={sit.id}
                      onClick={() => sendScenario(sit)}
                      disabled={loading}
                      title={sit.label}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        padding: "10px 4px",
                        background: `rgba(${hexToRgb(sit.color)}, 0.1)`,
                        border: `1px solid rgba(${hexToRgb(sit.color)}, 0.3)`,
                        borderRadius: "12px",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.5 : 1,
                        transition: "all 0.18s",
                      }}
                      onMouseEnter={e => {
                        if (!loading) {
                          e.currentTarget.style.background = `rgba(${hexToRgb(sit.color)}, 0.22)`;
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = `0 4px 14px rgba(${hexToRgb(sit.color)}, 0.3)`;
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = `rgba(${hexToRgb(sit.color)}, 0.1)`;
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "20px", lineHeight: 1 }}>{sit.icon}</span>
                      <span style={{
                        fontSize: "9.5px",
                        color: sit.color,
                        fontWeight: 600,
                        textAlign: "center",
                        lineHeight: "1.2",
                        wordBreak: "keep-all",
                      }}>{sit.label}</span>
                    </button>
                  ))}
                </div>

                <div style={{
                  marginTop: "14px",
                  padding: "10px 12px",
                  background: "rgba(167,139,250,0.07)",
                  borderRadius: "10px",
                  border: "1px solid rgba(167,139,250,0.15)",
                  fontSize: "11px",
                  color: "#888",
                  lineHeight: "1.6",
                }}>
                  💡 단어 카드(초·중·고급)는 선택 언어 수준별 핵심 어휘 20개와 예문을 정리해줍니다
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === "feedback" && (
              <>
                {feedback.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#666", marginTop: "40px" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
                    <p style={{ fontSize: "13px" }}>대화를 시작하면 실시간 피드백이 표시됩니다</p>
                  </div>
                ) : feedback.map(fb => (
                  <div key={fb.id} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "14px",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}>
                    <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>
                      ✏️ "{fb.userMsg?.slice(0, 30)}{fb.userMsg?.length > 30 ? "..." : ""}"
                    </div>
                    {fb.grammar && (
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ color: "#60a5fa", fontWeight: 600, fontSize: "11px" }}>📝 문법</span>
                        <p style={{ margin: "4px 0 0", color: "#ccc" }}>{fb.grammar}</p>
                      </div>
                    )}
                    {fb.vocab && (
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ color: "#4ade80", fontWeight: 600, fontSize: "11px" }}>📖 어휘</span>
                        <p style={{ margin: "4px 0 0", color: "#ccc" }}>{fb.vocab}</p>
                      </div>
                    )}
                    {fb.tip && (
                      <div style={{ background: "rgba(167,139,250,0.1)", borderRadius: "8px", padding: "8px 10px", borderLeft: "3px solid #a78bfa" }}>
                        <span style={{ fontSize: "11px", color: "#a78bfa" }}>💡 {fb.tip}</span>
                      </div>
                    )}
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "8px", textAlign: "right" }}>{fb.ts}</div>
                  </div>
                ))}
              </>
            )}

            {/* Goals Tab */}
            {activeTab === "goals" && (
              <>
                <div>
                  <h3 style={{ fontSize: "13px", color: "#a78bfa", marginBottom: "10px", fontWeight: 600 }}>🎯 학습 목표</h3>
                  {goals.map(goal => (
                    <div key={goal.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "10px",
                      marginBottom: "6px",
                      border: goal.done ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <input type="checkbox" checked={goal.done} onChange={() => toggleGoal(goal.id)}
                        style={{ cursor: "pointer", accentColor: "#a78bfa", width: "15px", height: "15px" }} />
                      {editingGoal === goal.id ? (
                        <input
                          defaultValue={goal.text}
                          autoFocus
                          onBlur={e => saveEditGoal(goal.id, e.target.value)}
                          onKeyDown={e => e.key === "Enter" && saveEditGoal(goal.id, e.target.value)}
                          style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #a78bfa", color: "#e8e8f0", fontSize: "13px", outline: "none" }}
                        />
                      ) : (
                        <span
                          onClick={() => setEditingGoal(goal.id)}
                          style={{ flex: 1, fontSize: "13px", color: goal.done ? "#666" : "#ccc", textDecoration: goal.done ? "line-through" : "none", cursor: "pointer" }}
                        >{goal.text}</span>
                      )}
                      <button onClick={() => deleteGoal(goal.id)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "14px", padding: "2px" }}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    value={newGoal}
                    onChange={e => setNewGoal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addGoal()}
                    placeholder="새 목표 추가..."
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "#e8e8f0",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />
                  <button onClick={addGoal} style={{
                    background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}>+</button>
                </div>
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888", marginBottom: "6px" }}>
                    <span>완료율</span>
                    <span>{Math.round((goals.filter(g => g.done).length / Math.max(goals.length, 1)) * 100)}%</span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      width: `${(goals.filter(g => g.done).length / Math.max(goals.length, 1)) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #a78bfa, #4ade80)",
                      transition: "width 0.5s",
                    }} />
                  </div>
                </div>
              </>
            )}

            {/* Progress Tab */}
            {activeTab === "progress" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "메시지", value: stats.messages, icon: "💬", color: "#a78bfa" },
                    { label: "학습 시간", value: `${stats.time}분`, icon: "⏱️", color: "#60a5fa" },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "12px",
                      padding: "14px",
                      textAlign: "center",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{ fontSize: "22px" }}>{stat.icon}</div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: stat.color, marginTop: "4px" }}>{stat.value}</div>
                      <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {[
                  { label: "어휘 성장", value: stats.vocab, color: "#4ade80" },
                  { label: "문법 향상", value: stats.grammar, color: "#60a5fa" },
                  { label: "레벨 진행", value: levelProgress, color: LEVEL_COLORS[level] },
                ].map(bar => (
                  <div key={bar.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888", marginBottom: "6px" }}>
                      <span>{bar.label}</span>
                      <span style={{ color: bar.color }}>{Math.round(bar.value)}%</span>
                    </div>
                    <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: `${bar.value}%`,
                        height: "100%",
                        background: bar.color,
                        borderRadius: "4px",
                        boxShadow: `0 0 8px ${bar.color}66`,
                        transition: "width 0.5s",
                      }} />
                    </div>
                  </div>
                ))}

                {journal.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <h3 style={{ fontSize: "13px", color: "#a78bfa", marginBottom: "10px" }}>📓 학습 일지</h3>
                    {journal.map(j => (
                      <div key={j.id} style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: "10px",
                        padding: "12px",
                        marginBottom: "8px",
                        fontSize: "12px",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}>
                        <div style={{ color: "#888", marginBottom: "4px" }}>{j.date}</div>
                        <div style={{ color: "#ccc" }}>{j.summary}</div>
                        {j.highlight && <div style={{ color: "#a78bfa", marginTop: "4px" }}>💡 {j.highlight}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes wavebar {
          0%   { transform: scaleY(0.4); }
          100% { transform: scaleY(1.4); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 2px; }
        textarea { font-family: inherit; }
        @media (max-width: 640px) {
          .right-panel { display: none; }
        }
      `}</style>
    </div>
  );
}
