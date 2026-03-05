export const LANGUAGES = [
  { code: "en", name: "영어",       flag: "🇺🇸", nativeName: "English",    ttsLang: "en-US" },
  { code: "ja", name: "일본어",     flag: "🇯🇵", nativeName: "日本語",     ttsLang: "ja-JP" },
  { code: "zh", name: "중국어",     flag: "🇨🇳", nativeName: "中文",       ttsLang: "zh-CN" },
  { code: "es", name: "스페인어",   flag: "🇪🇸", nativeName: "Español",    ttsLang: "es-ES" },
  { code: "fr", name: "프랑스어",   flag: "🇫🇷", nativeName: "Français",   ttsLang: "fr-FR" },
  { code: "de", name: "독일어",     flag: "🇩🇪", nativeName: "Deutsch",    ttsLang: "de-DE" },
  { code: "it", name: "이탈리아어", flag: "🇮🇹", nativeName: "Italiano",   ttsLang: "it-IT" },
  { code: "vi", name: "베트남어",   flag: "🇻🇳", nativeName: "Tiếng Việt", ttsLang: "vi-VN" },
];

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const LEVEL_COLORS = {
  A1: "#64b5f6", A2: "#4fc3f7", B1: "#4db6ac",
  B2: "#81c784", C1: "#ffb74d", C2: "#f06292"
};

// AI 프로바이더 & 모델 정의
export const AI_PROVIDERS = {
  claude: {
    name: "Claude",
    icon: "🟠",
    color: "#fb923c",
    models: [
      { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet" },
      { id: "claude-3-5-haiku-20241022",  label: "Claude 3.5 Haiku" },
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
      { id: "o3-mini",      label: "o3-mini" },
    ],
    placeholder: "sk-...",
  },
  gemini: {
    name: "Gemini",
    icon: "🔵",
    color: "#60a5fa",
    models: [
      { id: "gemini-2.5-flash",        label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro",          label: "Gemini 2.5 Pro" },
      { id: "gemini-2.0-flash",        label: "Gemini 2.0 Flash" },
    ],
    placeholder: "AIza...",
  },
};

export const MODE_LABELS = { casual: "💬 대화", structured: "📚 수업" };

export const INITIAL_GOALS = [
  { id: 1, text: "기본 인사말 마스터", done: false },
  { id: 2, text: "현재 시제 동사 활용", done: false },
  { id: 3, text: "일상 어휘 50단어 습득", done: false },
];

export const SITUATIONS = [
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