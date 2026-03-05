import { useState } from "react";
import { Waveform } from "./Waveform";
import { LANGUAGES, LEVEL_COLORS, MODE_LABELS, AI_PROVIDERS } from "../constants";
import { hexToRgb } from "../utils";

export function Header({
  lang, setLang,
  level, levelProgress,
  mode, setMode,
  ttsEnabled, setTtsEnabled,
  speakingId,
  ttsRate, setTtsRate,
  ttsPitch, setTtsPitch,
  ttsInterval, setTtsInterval,
  ttsVoices,
  selectedVoice, setSelectedVoice,
  stopSpeaking,
  aiProvider,
  aiModels,
  apiKeys,
  setShowSettings,
  sidebarOpen, setSidebarOpen
}) {
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showTtsPanel, setShowTtsPanel] = useState(false);

  return (
    <header style={{
      background: "rgba(255,255,255,0.05)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      padding: "12px 20px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "24px" }}>🌍</span>
        <span style={{ fontWeight: 700, fontSize: "18px", background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          LinguaAI
        </span>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 600, background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "10px" }}>v1.27</span>
      </div>

      {/* Language Selector */}
      <div style={{ position: "relative" }}>
        <button onClick={() => setShowLangDropdown(!showLangDropdown)} style={{
          background: "rgba(167,139,250,0.15)",
          border: "1px solid rgba(167,139,250,0.4)",
          borderRadius: "10px",
          padding: "7px 14px",
          color: "#e8e8f0",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "14px",
        }}>
          {lang.flag} {lang.name} <span style={{ opacity: 0.6, fontSize: "12px" }}>▾</span>
        </button>
        {showLangDropdown && (
          <div style={{
            position: "absolute",
            top: "110%",
            left: 0,
            background: "#1e1b3a",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "12px",
            overflow: "hidden",
            zIndex: 200,
            minWidth: "180px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => { setLang(l); setShowLangDropdown(false); }} style={{
                width: "100%",
                padding: "10px 16px",
                background: lang.code === l.code ? "rgba(167,139,250,0.2)" : "transparent",
                border: "none",
                color: "#e8e8f0",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                gap: "10px",
                alignItems: "center",
                fontSize: "14px",
                transition: "background 0.15s",
              }}>
                {l.flag} {l.name} <span style={{ opacity: 0.5, fontSize: "12px" }}>{l.nativeName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
              
                            {/* Mode Toggle */}
              
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              
                              {/* TTS Controls */}        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowTtsPanel(p => !p)}
            title="음성 설정"
            style={{
              background: ttsEnabled ? "rgba(244,114,182,0.15)" : "rgba(255,255,255,0.05)",
              border: ttsEnabled ? "1px solid rgba(244,114,182,0.4)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "7px 12px",
              color: ttsEnabled ? "#f472b6" : "#666",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.2s",
            }}
          >
            {speakingId ? <><Waveform color="#f472b6" /><span style={{ fontSize: "11px" }}>재생 중</span></> : <><span>🔊</span><span style={{ fontSize: "11px" }}>음성</span></>}
          </button>

          {showTtsPanel && (
            <div style={{
              position: "absolute",
              top: "110%",
              right: 0,
              background: "#1a1730",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "14px",
              padding: "16px",
              zIndex: 300,
              minWidth: "240px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#a78bfa", marginBottom: "14px" }}>🔊 음성 설정</div>

              {/* TTS on/off */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "12px", color: "#ccc" }}>자동 읽기</span>
                <button
                  onClick={() => setTtsEnabled(v => !v)}
                  style={{
                    width: "42px", height: "22px",
                    background: ttsEnabled ? "#a78bfa" : "rgba(255,255,255,0.1)",
                    border: "none", borderRadius: "11px", cursor: "pointer",
                    position: "relative", transition: "background 0.2s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: "3px",
                    left: ttsEnabled ? "22px" : "3px",
                    width: "16px", height: "16px",
                    background: "#fff", borderRadius: "50%",
                    transition: "left 0.2s",
                  }} />
                </button>
              </div>

              {/* Speed */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#ccc", marginBottom: "6px" }}>
                  <span>속도</span>
                  <span style={{ color: "#a78bfa" }}>{ttsRate.toFixed(1)}x</span>
                </div>
                <input type="range" min="0.5" max="2" step="0.1" value={ttsRate}
                  onChange={e => setTtsRate(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#a78bfa" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#555" }}>
                  <span>느리게</span><span>보통</span><span>빠르게</span>
                </div>
              </div>

              {/* Pitch */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#ccc", marginBottom: "6px" }}>
                  <span>음높이</span>
                  <span style={{ color: "#60a5fa" }}>{ttsPitch.toFixed(1)}</span>
                </div>
                <input type="range" min="0.5" max="2" step="0.1" value={ttsPitch}
                  onChange={e => setTtsPitch(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#60a5fa" }} />
              </div>

              {/* Interval between sentences */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#ccc", marginBottom: "6px" }}>
                  <span>문장 간 쉬기</span>
                  <span style={{ color: "#4ade80" }}>{(ttsInterval / 1000).toFixed(1)}초</span>
                </div>
                <input type="range" min="500" max="3000" step="100" value={ttsInterval}
                  onChange={e => setTtsInterval(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#4ade80" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#555" }}>
                  <span>0.5s</span><span>1.5s</span><span>3.0s</span>
                </div>
              </div>

              {/* Voice selector */}
              {ttsVoices.filter(v => v.lang.startsWith(lang.code)).length > 0 && (
                <div>
                  <div style={{ fontSize: "12px", color: "#ccc", marginBottom: "6px" }}>음성 선택</div>
                  <select
                    value={selectedVoice?.name || ""}
                    onChange={e => setSelectedVoice(ttsVoices.find(v => v.name === e.target.value) || null)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      color: "#e8e8f0",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  >
                    {ttsVoices.filter(v => v.lang.startsWith(lang.code)).map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Stop button */}
              {speakingId && (
                <button onClick={stopSpeaking} style={{
                  marginTop: "12px",
                  width: "100%",
                  background: "rgba(244,114,182,0.15)",
                  border: "1px solid rgba(244,114,182,0.4)",
                  borderRadius: "8px",
                  padding: "7px",
                  color: "#f472b6",
                  cursor: "pointer",
                  fontSize: "12px",
                }}>⏹ 읽기 중지</button>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "4px" }}>
        {Object.entries(MODE_LABELS).map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "none",
            background: mode === m ? "rgba(167,139,250,0.4)" : "transparent",
            color: mode === m ? "#fff" : "#aaa",
            cursor: "pointer",
            fontSize: "12px",
            transition: "all 0.2s",
          }}>{label}</button>
        ))}
        </div>

        {/* ⚙️ AI 설정 버튼 */}
        <button
          onClick={() => setShowSettings(true)}
          title="AI 설정"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: `1px solid rgba(${hexToRgb(AI_PROVIDERS[aiProvider].color)}, 0.4)`,
            borderRadius: "10px",
            padding: "7px 13px",
            color: "#e8e8f0",
            cursor: "pointer",
            fontSize: "15px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            transition: "all 0.2s",
          }}
        >
          <span>⚙️</span>
          {!apiKeys[aiProvider] && aiProvider !== "claude" && (
            <span style={{ fontSize: "9px", color: "#f87171", background: "rgba(248,113,113,0.1)", padding: "1px 6px", borderRadius: "6px", border: "1px solid rgba(248,113,113,0.3)" }}>키 필요</span>
          )}
        </button>
      </div>
    </header>
  );
}