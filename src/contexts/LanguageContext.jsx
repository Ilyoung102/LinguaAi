import { createContext, useContext, useState, useCallback } from "react";
import { LANGUAGES, LEVELS } from "../constants";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(LANGUAGES[0]); // 영어
  const [level, setLevel] = useState("A1");
  const [mode, setMode] = useState("casual"); // "casual" | "structured"
  const [sessionStart] = useState(Date.now());

  const changeLanguage = useCallback((newLang) => {
    setLang(newLang);
  }, []);

  const changeLevel = useCallback((newLevel) => {
    if (LEVELS.includes(newLevel)) {
      setLevel(newLevel);
    }
  }, []);

  const changeMode = useCallback((newMode) => {
    if (["casual", "structured"].includes(newMode)) {
      setMode(newMode);
    }
  }, []);

  const value = {
    lang,
    level,
    mode,
    sessionStart,
    changeLanguage,
    changeLevel,
    changeMode,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
