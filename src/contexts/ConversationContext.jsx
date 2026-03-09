import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { LANGUAGES } from "../constants";

const ConversationContext = createContext();

export function ConversationProvider({ children }) {
  const [convList, setConvList] = useState(() => {
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

  const addConversation = useCallback((entry) => {
    setConvList((prev) => {
      const filtered = prev.filter((e) => e.id !== entry.id);
      return [entry, ...filtered].slice(0, 100);
    });
  }, []);

  const loadConversationsFromFiles = useCallback((files, parseConvFile) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const entry = parseConvFile(file, evt.target.result, LANGUAGES);
        if (!entry) return;
        setConvList((prev) => {
          const filtered = prev.filter((e) => e.filename !== file.name);
          return [entry, ...filtered].slice(0, 100);
        });
      };
      reader.readAsText(file, "utf-8");
    });
  }, []);

  const deleteConversation = useCallback((id) => {
    setConvList((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAllConversations = useCallback(() => {
    setConvList([]);
  }, []);

  const value = {
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

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within ConversationProvider");
  }
  return context;
}
