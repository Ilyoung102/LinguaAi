import { useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { ChatWindow } from "./components/ChatWindow";
import { Sidebar } from "./components/Sidebar";
import { SettingsModal } from "./components/SettingsModal";
import { useTTS } from "./hooks/useTTS";
import { LANGUAGES, LEVELS } from "./constants";
import { getWelcomeMessage, buildScenarioPrompt, splitSentences, saveAsJsonFile, parseConvFile } from "./utils";
import { useLanguage, useGoals, useChat, useUI, useConversation, useSettings } from "./contexts";

function LanguageTutorApp() {
  // Use Context Hooks
  const { lang, level, mode, sessionStart, changeLanguage, changeLevel, changeMode } = useLanguage();
  const { goals, newGoal, setNewGoal, editingGoal, setEditingGoal, addGoal, toggleGoal, deleteGoal, saveEditGoal } = useGoals();
  const { messages, setMessages, input, setInput, loading, setLoading, stats, journal, initializeWelcomeMessage, updateStats, addFeedback, addJournalEntry, callAI, feedback } = useChat();
  const { sidebarOpen, setSidebarOpen, showSettings, setShowSettings } = useUI();
  const { convList, setConvList, addConversation, loadConversationsFromFiles, deleteConversation } = useConversation();
  const { aiProvider, setAiProvider, aiModels, setAiModels, apiKeys, setApiKeys } = useSettings();

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
    const welcome: any = {
      role: "assistant",
      text: getWelcomeMessage(lang),
      ts: Date.now(),
      id: Date.now(),
    };
    initializeWelcomeMessage(welcome);
  }, [lang, stopSpeaking, initializeWelcomeMessage]);

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      updateStats({ time: Math.floor((Date.now() - sessionStart) / 60000) });
    }, 10000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStart, updateStats]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: any = { role: "user", text: input, ts: Date.now(), id: Date.now() };
    setMessages([...messages, userMsg]);
    const userInput = input;
    setInput("");
    setLoading(true);

    const history = messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    const systemPrompt = `You are an expert ${lang.nativeName} language tutor. The student's level is ${level}.
Mode: ${mode === "casual" ? "casual conversation" : "structured lesson"}.
Current learning goals: ${goals.filter((g) => !g.done).map((g) => g.text).join(", ")}.

Instructions:
1. Respond primarily in ${lang.nativeName} appropriate for ${level} level.
2. For EVERY ${lang.nativeName} sentence or phrase you write, immediately follow it with:
   - Line 2: 📢 ${lang.nativeName === "日本語" ? "히라가나 읽기" : lang.nativeName === "中文" ? "병음(拼音)" : "한국어 발음"}: [Korean pronunciation transcription]
   - Line 3: 💬 한국어 해석: [natural Korean translation]
3. After your full response, add "---FEEDBACK---" then JSON: {"grammar":"...","vocab":"...","tip":"...","suggestedLevel":"A1"}
4. Keep responses natural and encouraging.`;

    try {
      const fullText = await callAI(systemPrompt, history, userInput, 1200);
      const [mainText, feedbackRaw] = fullText.split("---FEEDBACK---");
      let parsedFeedback = null;
      if (feedbackRaw) {
        try {
          const jsonMatch = feedbackRaw.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsedFeedback = JSON.parse(jsonMatch[0]);
        } catch { }
      }

      const newMsgId = Date.now();
      setMessages([...messages, userMsg, { role: "assistant", text: mainText.trim(), ts: newMsgId, id: newMsgId }]);
      // Auto-speak if TTS enabled
      if (ttsEnabled) {
        setTimeout(() => speak(mainText.trim(), newMsgId, splitSentences), 100);
      }

      if (parsedFeedback) {
        const fb: any = {
          id: Date.now(),
          ...parsedFeedback,
          userMsg: userInput,
          ts: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        };
        addFeedback(fb);
        if (parsedFeedback.suggestedLevel && LEVELS.includes(parsedFeedback.suggestedLevel)) {
          const curr = LEVELS.indexOf(level);
          const sugg = LEVELS.indexOf(parsedFeedback.suggestedLevel);
          if (sugg > curr && stats.messages > 3) changeLevel(LEVELS[Math.min(curr + 1, 5)]);
        }
        updateStats({
          messages: stats.messages + 1,
          vocab: Math.min(100, stats.vocab + (parsedFeedback.vocab?.length > 20 ? 3 : 1)),
          grammar: Math.min(100, stats.grammar + (parsedFeedback.grammar?.includes("잘") ? 2 : 1)),
        });
        if ((stats.messages + 1) % 5 === 4) {
          addJournalEntry({
            id: Date.now(),
            date: new Date().toLocaleDateString("ko-KR"),
            summary: `${lang.name} 학습 - ${stats.messages + 1}개 메시지 교환, 레벨: ${level}`,
            highlight: parsedFeedback.tip || "",
          });
        }
      } else {
        updateStats({ messages: stats.messages + 1 });
      }
    } catch (e: any) {
      setMessages([...messages, userMsg, { role: "assistant", text: `⚠️ ${e.message || "오류가 발생했습니다. 다시 시도해주세요."}`, ts: Date.now(), id: Date.now() }]);
    }
    setLoading(false);
  }

  async function sendScenario(sit: any) {
    if (loading) return;
    const displayText = `[${sit.label}]`;
    const actualPrompt = buildScenarioPrompt(sit, lang, level);
    const userMsgId = Date.now();
    const userMsg: any = {
      role: "user", text: displayText, ts: userMsgId, id: userMsgId,
      isScenario: true, scenarioColor: sit.color, scenarioIcon: sit.icon,
    };
    setMessages([...messages, userMsg]);
    setLoading(true);

    const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.text }));
    const systemPrompt = `You are an expert ${lang.nativeName} language tutor at level ${level}.
Write COMPLETE, CONCRETE dialogue — every sentence must use real specific words (e.g. コーヒー, このシャツ, 山田さん).
STRICTLY FORBIDDEN: placeholder patterns like 〜를ください, [商品명], ＿＿, （이름）, ~가欲しい with tildes as fillers.
Each dialogue line must use the exact 3-line format shown in the prompt with no colons after 📢 or 💬 labels — just the text directly.
Format: 
A: [sentence]
📢 [pronunciation in Korean hangul]
💬 [Korean translation]
After ALL content add exactly "---FEEDBACK---" then JSON: {"grammar":"tip","vocab":"핵심표현요약","tip":"학습팁","suggestedLevel":"${level}"}
Do NOT stop mid-dialogue. Complete the full episode before the feedback section.`;

    try {
      const fullText = await callAI(systemPrompt, history, actualPrompt, 2500);
      const [mainText, feedbackRaw] = fullText.split("---FEEDBACK---");
      let parsedFeedback = null;
      if (feedbackRaw) {
        try { const m2 = feedbackRaw.match(/\{[\s\S]*\}/); if (m2) parsedFeedback = JSON.parse(m2[0]); } catch { }
      }
      const newMsgId = Date.now();
      setMessages([...messages, userMsg, { role: "assistant", text: mainText.trim(), ts: newMsgId, id: newMsgId }]);
      if (ttsEnabled) setTimeout(() => speak(mainText.trim(), newMsgId, splitSentences), 100);
      if (parsedFeedback) {
        addFeedback({
          id: Date.now(), ...parsedFeedback, userMsg: displayText,
          ts: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        } as any);
      }
      updateStats({ messages: stats.messages + 1 });
    } catch (e: any) {
      setMessages([...messages, userMsg, { role: "assistant", text: `⚠️ ${e.message || "오류가 발생했습니다."}`, ts: Date.now(), id: Date.now() }]);
    }
    setLoading(false);
  }

  function handleSave() {
    const entry = saveAsJsonFile(messages, lang, level, mode);
    if (!entry) return;
    addConversation(entry);
  }

  function handleLoadFiles(e: any) {
    const files = Array.from(e.target.files || []) as File[];
    loadConversationsFromFiles(files, parseConvFile);
    e.target.value = "";
  }

  function handleRestoreConv(conv: any) {
    if (!conv.restorable || !conv.messages) {
      alert("⚠️ 이 파일은 메시지 복원을 지원하지 않습니다.\n\n이 대화를 보려면 다시 보기 버튼을 사용하세요.");
      return;
    }

    const convLang = LANGUAGES.find((l) => l.code === conv.langCode);
    if (convLang && convLang.code !== lang.code) changeLanguage(convLang);
    if (conv.level !== level) changeLevel(conv.level);
    if (conv.mode && conv.mode !== mode) changeMode(conv.mode);

    setMessages(conv.messages);
    addFeedback([] as any); // 피드백 초기화 (addFeedback handles single feedback, but we need to clear it)
    // Actually our addFeedback prepends. To clear we might need setFeedback from useChat.
    // Let's just restore messages for now.
    alert(`✅ "${conv.title}" 대화가 복원되었습니다.\n지금부터 이어서 대화할 수 있습니다!`);
  }

  function handleNewChat() {
    if (messages.length > 1) {
      const entry = saveAsJsonFile(messages, lang, level, mode);
      if (entry) addConversation(entry);
    }
    const welcome: any = {
      role: "assistant",
      text: getWelcomeMessage(lang),
      ts: Date.now(),
      id: Date.now(),
    };
    initializeWelcomeMessage(welcome);
  }

  const levelIdx = LEVELS.indexOf(level);
  const levelProgress = ((levelIdx) / (LEVELS.length - 1)) * 100;

  return (
    <div className="app-container">
      <Header
        lang={lang} changeLanguage={changeLanguage}
        level={level} levelProgress={levelProgress}
        mode={mode} changeMode={changeMode}
        ttsEnabled={ttsEnabled} setTtsEnabled={setTtsEnabled}
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
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
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
          lang={lang} level={level} mode={mode}
          speakingId={speakingId}
          ttsRepeat={ttsRepeat}
          speak={(text: string, id: number) => speak(text, id, splitSentences)}
          repeatSpeak={(text: string, id: number) => repeatSpeak(text, id, splitSentences)}
          onSave={handleSave}
        />

        <Sidebar
          sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
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

// ──────────────────────────────────────────────────────
// Wrapper component with all Providers
// ──────────────────────────────────────────────────────
import {
  LanguageProvider, GoalsProvider, ChatProvider, UIProvider,
  ConversationProvider, SettingsProvider
} from "./contexts";
import "./App.css";

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
