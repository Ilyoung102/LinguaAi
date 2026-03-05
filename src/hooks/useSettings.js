import { useState, useEffect } from "react";

export function useSettings() {
  const [aiProvider, setAiProvider] = useState(() => {
    try { return localStorage.getItem("lingua_provider") || "claude"; } catch { return "claude"; }
  });
  
  const [aiModels, setAiModels] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lingua_models") || "{}");
      return {
        claude: saved.claude || "claude-3-7-sonnet-20250219",
        openai: saved.openai || "gpt-4o",
        gemini: saved.gemini || "gemini-2.5-flash",
      };
    } catch { return { claude: "claude-3-7-sonnet-20250219", openai: "gpt-4o", gemini: "gemini-2.5-flash" }; }
  });
  
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lingua_keys") || "{}");
      return { claude: saved.claude || "", openai: saved.openai || "", gemini: saved.gemini || "" };
    } catch { return { claude: "", openai: "", gemini: "" }; }
  });

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

  return {
    aiProvider, setAiProvider,
    aiModels, setAiModels,
    apiKeys, setApiKeys
  };
}