import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { LANGUAGES } from "../constants";
import { Conversation, ConversationContextType, Language } from "../types";

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

interface ConversationProviderProps {
  children: ReactNode;
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  const [convList, setConvList] = useState<Conversation[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("lingua_conv_list") || "[]");
    } catch {
      return [];
    }
  });

  // localStorage에 자동 저장
  useEffect(() => {
    try {
      localStorage.setItem("lingua_conv_list", JSON.stringify(convList));
    } catch {}
  }, [convList]);

  const addConversation = useCallback((entry: Conversation) => {
    setConvList((prev) => {
      const filtered = prev.filter((e) => e.id !== entry.id);
      return [entry, ...filtered].slice(0, 100);
    });
  }, []);

  const loadConversationsFromFiles = useCallback((files: File[], parseConvFile: any) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        const entry = parseConvFile(file, result, LANGUAGES);
        if (!entry) return;
        setConvList((prev) => {
          const filtered = prev.filter((e) => e.filename !== file.name);
          return [entry, ...filtered].slice(0, 100);
        });
      };
      reader.readAsText(file, "utf-8");
    });
  }, []);

  const deleteConversation = useCallback((id: number) => {
    setConvList((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAllConversations = useCallback(() => {
    setConvList([]);
  }, []);

  const value: ConversationContextType = {
    convList,
    setConvList,
    addConversation,
    loadConversationsFromFiles,
    deleteConversation,
    clearAllConversations,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation(): ConversationContextType {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within ConversationProvider");
  }
  return context;
}
