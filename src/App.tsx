import { useState, useRef, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { SettingsModal } from "./components/SettingsModal";
import { useTTS } from "./hooks/useTTS";
import {
  useLanguage, useGoals, useChat, useUI,
  useConversation, useSettings
} from "./contexts";
import {
  saveAsJsonFile,
  splitSentences,
  getWelcomeMessage,
} from "./utils";
import { LEVELS } from "./constants";
import {
  LanguageProvider, GoalsProvider, ChatProvider, UIProvider,
  ConversationProvider, SettingsProvider
} from "./contexts";
import "./App.css";

function LanguageTutorApp() {
  const { lang, changeLanguage, level, changeLevel } = useLanguage();
  const { goals, toggleGoal, deleteGoal, saveEditGoal, addGoal, newGoal, setNewGoal } = useGoals();
  const {
    messages, setMessages, input, setInput, loading, feedback, stats, journal,
    updateStats, initializeWelcomeMessage, sendMessage, sendScenario
  } = useChat();
  const { sidebarOpen, setSidebarOpen, showSettings, setShowSettings } = useUI();
  const { convList, addConversation, setConvList, deleteConversation } = useConversation();
  const { aiProvider, setAiProvider, aiModels, setAiModels, apiKeys, setApiKeys, sessionStart } = useSettings();

  // Use custom hooks
  const {
    ttsEnabled, setTtsEnabled,
    speakingId,
    ttsRepeat,
    ttsRate, setTtsRate,
    ttsPitch, setTtsPitch,
    ttsInterval, setTtsInterval,
    ttsVoices,
    selectedVoice, setSelectedVoice,
    stopSpeaking,
    speak,
    repeatSpeak
  } = useTTS(lang);

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

  const [editingGoal, setEditingGoal] = useState<number | null>(null);

  const handleSave = () => {
    const entry = saveAsJsonFile(messages, lang, level, "structured");
    if (entry) {
      addConversation(entry);
      alert("✅ 대화가 성공적으로 저장되었습니다!");
    }
  };

  const handleLoadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // Implementation exists in logic but for UI we just handle event
  };

  const handleRestoreConv = (conv: any) => {
    if (messages.length > 1 && window.confirm("현재 대화를 저장하고 새 대화를 불러올까요?")) {
      handleSave();
    }
    const convLang = conv.langCode ? { code: conv.langCode, name: conv.langName } : null;
    if (convLang && convLang.code !== lang.code) changeLanguage(convLang as any);
    if (conv.level !== level) changeLevel(conv.level);

    setMessages(conv.messages);
    alert(`✅ "${conv.title}" 대화가 복원되었습니다.\n지금부터 이어서 대화할 수 있습니다!`);
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
    setInput("");
  };

  const levelIdx = LEVELS.indexOf(level);
  const levelProgress = ((levelIdx) / (LEVELS.length - 1)) * 100;

  return (
    <div className="app-container">
      <Header
        lang={lang} changeLanguage={changeLanguage}
        level={level} levelProgress={levelProgress}
        mode={"structured"} changeMode={() => { }} // simplified for this component
        ttsEnabled={ttsEnabled} setTtsEnabled={setTtsEnabled as any}
        speakingId={speakingId}
        ttsRate={ttsRate} setTtsRate={setTtsRate}
        ttsPitch={ttsPitch} setTtsPitch={setTtsPitch}
        ttsInterval={ttsInterval} setTtsInterval={setTtsInterval}
        ttsVoices={ttsVoices}
        selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice}
        stopSpeaking={stopSpeaking}
        aiProvider={aiProvider}
        aiModels={aiModels}
        apiKeys={apiKeys}
        setShowSettings={setShowSettings}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen as any}
        onNewChat={handleNewChat}
      />

      {showSettings && (
        <SettingsModal
          aiProvider={aiProvider} setAiProvider={setAiProvider}
          aiModels={aiModels} setAiModels={setAiModels}
          apiKeys={apiKeys} setApiKeys={setApiKeys}
          setShowSettings={setShowSettings}
        />
      )}

      {sidebarOpen && window.innerWidth < 768 && (
        <div onClick={() => setSidebarOpen(false)} className="sidebar-overlay" />
      )}

      <div className="main-layout">
        <ChatWindow
          messages={messages}
          input={input} setInput={setInput}
          loading={loading}
          sendMessage={sendMessage}
          lang={lang} level={level} mode={"structured"}
          speakingId={speakingId}
          ttsRepeat={ttsRepeat}
          speak={(text: string, id: number) => speak(text, id, splitSentences)}
          repeatSpeak={(text: string, id: number) => repeatSpeak(text, id, splitSentences)}
          onSave={handleSave}
        />

        <Sidebar
          sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen as any}
          lang={lang} level={level}
          loading={loading}
          sendScenario={sendScenario}
          feedback={feedback}
          goals={goals}
          toggleGoal={toggleGoal} deleteGoal={deleteGoal} saveEditGoal={saveEditGoal} addGoal={addGoal}
          newGoal={newGoal} setNewGoal={setNewGoal}
          editingGoal={editingGoal} setEditingGoal={setEditingGoal}
          stats={stats} journal={journal}
          levelProgress={levelProgress}
          convList={convList as any}
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
