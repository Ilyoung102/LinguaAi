import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ChatMessage, Feedback, Stats, JournalEntry, ChatContextType } from "../types";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
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
