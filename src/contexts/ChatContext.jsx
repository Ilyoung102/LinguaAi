import { createContext, useContext, useState, useCallback } from "react";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({
    messages: 0,
    vocab: 0,
    grammar: 0,
    time: 0,
  });
  const [journal, setJournal] = useState([]);

  const addMessage = useCallback((msg) => {
    setMessages((m) => [...m, msg]);
  }, []);

  const addFeedback = useCallback((fb) => {
    setFeedback((f) => [fb, ...f.slice(0, 9)]);
  }, []);

  const updateStats = useCallback((updates) => {
    setStats((s) => ({ ...s, ...updates }));
  }, []);

  const addJournalEntry = useCallback((entry) => {
    setJournal((j) => [entry, ...j.slice(0, 4)]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const initializeWelcomeMessage = useCallback((welcomeMsg) => {
    setMessages([welcomeMsg]);
    setFeedback([]);
  }, []);

  const value = {
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

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
