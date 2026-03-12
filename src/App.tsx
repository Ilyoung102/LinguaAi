import { useRef, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { SettingsModal } from "./components/SettingsModal";
import { useTTS } from "./hooks/useTTS";
import {
  useLanguage, useChat, useUI,
  useConversation, useSettings
} from "./contexts";
import {
  saveAsJsonFile,
  getWelcomeMessage,
} from "./utils";
import {
  LanguageProvider, GoalsProvider, ChatProvider, UIProvider,
  ConversationProvider, SettingsProvider
} from "./contexts";
import "./App.css";

function LanguageTutorApp() {
  const { lang } = useLanguage();
  const { sidebarOpen, setSidebarOpen, showSettings } = useUI();
  const { addConversation, setConvList, deleteConversation } = useConversation();
  const { sessionStart } = useSettings();
  const { messages, setMessages, initializeWelcomeMessage, updateStats } = useChat();

  const { stopSpeaking } = useTTS(lang);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    stopSpeaking();
  }, [lang, stopSpeaking]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      updateStats({ time: Math.floor((Date.now() - sessionStart) / 60000) });
    }, 10000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStart, updateStats]);

  const handleSave = () => {
    // Note: We need level here for save, might need to get it from context
    // For now, keeping it simple
    const entry = saveAsJsonFile(messages, lang, "A1", "structured");
    if (entry) {
      addConversation(entry);
      alert("✅ 대화가 성공적으로 저장되었습니다!");
    }
  };

  const handleRestoreConv = (conv: any) => {
    if (messages.length > 1 && window.confirm("현재 대화를 저장하고 새 대화를 불러올까요?")) {
      handleSave();
    }
    // Restoration logic would ideally be in a hook/context
    setMessages(conv.messages);
    alert(`✅ "${conv.title}" 대화가 복원되었습니다.`);
  };

  const handleNewChat = () => {
    stopSpeaking();
    const welcome: any = {
      role: "assistant",
      text: getWelcomeMessage(lang),
      ts: Date.now(),
      id: Date.now(),
    };
    initializeWelcomeMessage(welcome);
  };

  const handleLoadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
  };

  return (
    <div className="app-container">
      <Header onNewChat={handleNewChat} />

      {showSettings && <SettingsModal />}

      {sidebarOpen && window.innerWidth < 768 && (
        <div onClick={() => setSidebarOpen(false)} className="sidebar-overlay" />
      )}

      <div className="main-layout">
        <ChatWindow onSave={handleSave} />
        <Sidebar
          onLoadFiles={handleLoadFiles}
          onDeleteConv={deleteConversation}
          onRestoreConv={handleRestoreConv}
          onClearConvList={() => setConvList([])}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <GoalsProvider>
          <ChatProvider>
            <UIProvider>
              <ConversationProvider>
                <LanguageTutorApp />
              </ConversationProvider>
            </UIProvider>
          </ChatProvider>
        </GoalsProvider>
      </LanguageProvider>
    </SettingsProvider>
  );
}
