import { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { ChatWindow } from "./components/ChatWindow";
import { Sidebar } from "./components/Sidebar";
import { SettingsModal } from "./components/SettingsModal";
import { useTTS } from "./hooks/useTTS";
import { useSettings } from "./hooks/useSettings";
import { useChat } from "./hooks/useChat";
import { LANGUAGES, LEVELS, INITIAL_GOALS } from "./constants";
import { getWelcomeMessage, buildScenarioPrompt, splitSentences, saveAsTextFile, parseConvFile } from "./utils";

export default function LanguageTutor() {
  const [lang, setLang] = useState(LANGUAGES[0]); // 영어(index 0)
  const [level, setLevel] = useState("A1");
  const [mode, setMode] = useState("casual");
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [newGoal, setNewGoal] = useState("");
  const [editingGoal, setEditingGoal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionStart] = useState(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    aiProvider, setAiProvider,
    aiModels, setAiModels,
    apiKeys, setApiKeys
  } = useSettings();

  const {
    messages, setMessages,
    input, setInput,
    loading, setLoading,
    feedback, setFeedback,
    stats, setStats,
    journal, setJournal,
    callAI
  } = useChat(apiKeys, aiProvider, aiModels);

  const {
    ttsEnabled, setTtsEnabled,
    speakingId, setSpeakingId,
    ttsRepeat, setTtsRepeat,
    ttsRate, setTtsRate,
    ttsPitch, setTtsPitch,
    ttsInterval, setTtsInterval,
    ttsVoices,
    selectedVoice, setSelectedVoice,
    stopSpeaking,
    speak,
    repeatSpeak
  } = useTTS(lang);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setStats(s => ({ ...s, time: Math.floor((Date.now() - sessionStart) / 60000) }));
    }, 10000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    stopSpeaking();
    const welcome = {
      role: "assistant",
      text: getWelcomeMessage(lang),
      ts: Date.now(),
      id: Date.now(),
    };
    setMessages([welcome]);
    setFeedback([]);
  }, [lang]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: input, ts: Date.now(), id: Date.now() };
    setMessages(m => [...m, userMsg]);
    const userInput = input;
    setInput("");
    setLoading(true);

    const history = messages.slice(-8).map(m => ({
      role: m.role,
      content: m.text
    }));

    const systemPrompt = `You are an expert ${lang.nativeName} language tutor. The student's level is ${level}.
Mode: ${mode === "casual" ? "casual conversation" : "structured lesson"}.
Current learning goals: ${goals.filter(g => !g.done).map(g => g.text).join(", ")}.

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
        } catch {}
      }

      const newMsgId = Date.now();
      setMessages(m => [...m, { role: "assistant", text: mainText.trim(), ts: newMsgId, id: newMsgId }]);
      // Auto-speak if TTS enabled
      if (ttsEnabled) {
        setTimeout(() => speak(mainText.trim(), newMsgId, splitSentences), 100);
      }

      if (parsedFeedback) {
        const fb = {
          id: Date.now(),
          ...parsedFeedback,
          userMsg: userInput,
          ts: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        };
        setFeedback(f => [fb, ...f.slice(0, 9)]);
        if (parsedFeedback.suggestedLevel && LEVELS.includes(parsedFeedback.suggestedLevel)) {
          const curr = LEVELS.indexOf(level);
          const sugg = LEVELS.indexOf(parsedFeedback.suggestedLevel);
          if (sugg > curr && stats.messages > 3) setLevel(LEVELS[Math.min(curr + 1, 5)]);
        }
        setStats(s => ({
          ...s,
          messages: s.messages + 1,
          vocab: Math.min(100, s.vocab + (parsedFeedback.vocab?.length > 20 ? 3 : 1)),
          grammar: Math.min(100, s.grammar + (parsedFeedback.grammar?.includes("잘") ? 2 : 1)),
        }));
        if (stats.messages % 5 === 4) {
          setJournal(j => [{
            id: Date.now(),
            date: new Date().toLocaleDateString("ko-KR"),
            summary: `${lang.name} 학습 - ${stats.messages + 1}개 메시지 교환, 레벨: ${level}`,
            highlight: parsedFeedback.tip || "",
          }, ...j.slice(0, 4)]);
        }
      } else {
        setStats(s => ({ ...s, messages: s.messages + 1 }));
      }
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", text: `⚠️ ${e.message || "오류가 발생했습니다. 다시 시도해주세요."}`, ts: Date.now(), id: Date.now() }]);
    }
    setLoading(false);
  }

  async function sendScenario(sit) {
    if (loading) return;
    const displayText = `[${sit.label}]`;
    const actualPrompt = buildScenarioPrompt(sit, lang, level);
    const userMsgId = Date.now();
    setMessages(m => [...m, {
      role: "user", text: displayText, ts: userMsgId, id: userMsgId,
      isScenario: true, scenarioColor: sit.color, scenarioIcon: sit.icon,
    }]);
    setLoading(true);

    const history = messages.slice(-6).map(m => ({ role: m.role, content: m.text }));
    const systemPrompt = `You are an expert ${lang.nativeName} language tutor at level ${level}.
Write COMPLETE, CONCRETE dialogue — every sentence must use real specific words (e.g. コーヒー, このシャツ, 山田さん).
STRICTLY FORBIDDEN: placeholder patterns like 〜をください, [商品名], ＿＿, （名前）, ~が欲しい with tildes as fillers.
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
        try { const m2 = feedbackRaw.match(/\{[\s\S]*\}/); if (m2) parsedFeedback = JSON.parse(m2[0]); } catch {}
      }
      const newMsgId = Date.now();
      setMessages(m => [...m, { role: "assistant", text: mainText.trim(), ts: newMsgId, id: newMsgId }]);
      if (ttsEnabled) setTimeout(() => speak(mainText.trim(), newMsgId, splitSentences), 100);
      if (parsedFeedback) {
        setFeedback(f => [{
          id: Date.now(), ...parsedFeedback, userMsg: displayText,
          ts: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        }, ...f.slice(0, 9)]);
      }
      setStats(s => ({ ...s, messages: s.messages + 1 }));
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", text: `⚠️ ${e.message || "오류가 발생했습니다."}`, ts: Date.now(), id: Date.now() }]);
    }
    setLoading(false);
  }

  function addGoal() {
    if (!newGoal.trim()) return;
    setGoals(g => [...g, { id: Date.now(), text: newGoal.trim(), done: false }]);
    setNewGoal("");
  }

  function toggleGoal(id) {
    setGoals(g => g.map(go => go.id === id ? { ...go, done: !go.done } : go));
  }

  function deleteGoal(id) {
    setGoals(g => g.filter(go => go.id !== id));
  }

  function saveEditGoal(id, text) {
    setGoals(g => g.map(go => go.id === id ? { ...go, text } : go));
    setEditingGoal(null);
  }

  // ── 대화 목록 (localStorage 영속) ────────────────────────────
  const [convList, setConvList] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lingua_conv_list") || "[]"); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("lingua_conv_list", JSON.stringify(convList)); } catch {}
  }, [convList]);

  function handleSave() {
    const entry = saveAsTextFile(messages, lang, level, mode);
    if (!entry) return;
    setConvList(prev => {
      const filtered = prev.filter(e => e.id !== entry.id);
      return [entry, ...filtered].slice(0, 100);
    });
  }

  function handleLoadFiles(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = evt => {
        const entry = parseConvFile(file, evt.target.result, LANGUAGES);
        if (!entry) { alert(`⚠️ "${file.name}" — LinguaAI 포맷이 아닙니다.`); return; }
        setConvList(prev => {
          const filtered = prev.filter(e => e.filename !== file.name);
          return [entry, ...filtered].slice(0, 100);
        });
      };
      reader.readAsText(file, "utf-8");
    });
    e.target.value = "";
  }

  function deleteConv(id) {
    setConvList(prev => prev.filter(e => e.id !== id));
  }

  const levelIdx = LEVELS.indexOf(level);
  const levelProgress = ((levelIdx) / (LEVELS.length - 1)) * 100;

  return (
    <div style={{
      fontFamily: "'Noto Sans KR', 'Noto Sans JP', sans-serif",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      height: "100%", // Changed from minHeight: "100vh"
      overflow: "hidden", // Added to lock the container
      color: "#e8e8f0",
      display: "flex",
      flexDirection: "column",
    }}>
      <Header
        lang={lang} setLang={setLang}
        level={level} levelProgress={levelProgress}
        mode={mode} setMode={setMode}
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
      />

      {showSettings && (
        <SettingsModal
          aiProvider={aiProvider} setAiProvider={setAiProvider}
          aiModels={aiModels} setAiModels={setAiModels}
          apiKeys={apiKeys} setApiKeys={setApiKeys}
          setShowSettings={setShowSettings}
        />
      )}

      {/* Mobile Overlay for auto-closing sidebar */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "transparent",
            zIndex: 900, // Below sidebar (1000) but above everything else
          }}
        />
      )}

      <div style={{ display: "flex", flex: 1, gap: 0, minHeight: 0, overflow: "hidden" }}>
        <ChatWindow
          messages={messages}
          input={input} setInput={setInput}
          loading={loading}
          sendMessage={sendMessage}
          lang={lang} level={level} mode={mode}
          speakingId={speakingId}
          ttsRepeat={ttsRepeat}
          speak={(text, id) => speak(text, id, splitSentences)}
          repeatSpeak={(text, id) => repeatSpeak(text, id, splitSentences)}
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
          convList={convList}
          onLoadFiles={handleLoadFiles}
          onDeleteConv={deleteConv}
          onClearConvList={() => setConvList([])}
        />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes wavebar {
          0%   { transform: scaleY(0.4); }
          100% { transform: scaleY(1.4); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 2px; }
        textarea { font-family: inherit; }
        @media (max-width: 640px) {
          .right-panel { display: none; }
        }
      `}</style>
    </div>
  );
}