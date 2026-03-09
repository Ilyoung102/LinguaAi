import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { LANGUAGES, LEVELS } from "../constants";
import { Language, LanguageContextType } from "../types";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLang] = useState<Language>(LANGUAGES[0]); // 영어
  const [level, setLevel] = useState<string>("A1");
  const [mode, setMode] = useState<"casual" | "structured">("casual");
  const [sessionStart] = useState<number>(Date.now());

  const changeLanguage = useCallback((newLang: Language) => {
    setLang(newLang);
  }, []);

  const changeLevel = useCallback((newLevel: string) => {
    if (LEVELS.includes(newLevel)) {
      setLevel(newLevel);
    }
  }, []);

  const changeMode = useCallback((newMode: "casual" | "structured") => {
    if (["casual", "structured"].includes(newMode)) {
      setMode(newMode);
    }
  }, []);

  const value: LanguageContextType = {
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

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
