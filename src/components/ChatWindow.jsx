import { useState, useRef, useEffect } from "react";
import { FormattedMessage } from "./FormattedMessage";
import { Waveform } from "./Waveform";
import { hexToRgb } from "../utils";
import { LEVEL_COLORS } from "../constants";

export function ChatWindow({ 
  messages, 
  input, 
  setInput, 
  loading, 
  sendMessage, 
  lang, 
  level, 
  mode,
  speakingId,
  ttsRepeat,
  speak,
  repeatSpeak,
  onSave,
}) {
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* Messages */}
      <div ref={chatRef} style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(167,139,250,0.3) transparent",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            alignItems: "flex-end",
            gap: "8px",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: speakingId === msg.id
                  ? "linear-gradient(135deg, #f472b6, #a78bfa)"
                  : "linear-gradient(135deg, #a78bfa, #60a5fa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", flexShrink: 0,
                boxShadow: speakingId === msg.id ? "0 0 16px rgba(244,114,182,0.6)" : "none",
                transition: "all 0.3s",
              }}>🌍</div>
            )}
            <div style={{ maxWidth: "70%", position: "relative" }}>
              {/* Scenario badge bubble */}
              {msg.isScenario ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  background: `rgba(${hexToRgb(msg.scenarioColor)}, 0.15)`,
                  border: `1px solid rgba(${hexToRgb(msg.scenarioColor)}, 0.4)`,
                  borderRadius: "18px 18px 4px 18px",
                  boxShadow: `0 2px 12px rgba(${hexToRgb(msg.scenarioColor)}, 0.2)`,
                }}>
                  <span style={{ fontSize: "18px" }}>{msg.scenarioIcon}</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: msg.scenarioColor }}>{msg.text}</span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>상황 요청</span>
                </div>
              ) : (
                <div style={{
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #a78bfa, #818cf8)"
                    : "rgba(255,255,255,0.07)",
                  border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "12px 16px",
                  paddingBottom: "36px",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  backdropFilter: "blur(10px)",
                  boxShadow: msg.role === "user" ? "0 4px 20px rgba(167,139,250,0.3)" : "0 2px 10px rgba(0,0,0,0.2)",
                }}>
                  <FormattedMessage text={msg.text} />
                </div>
              )}
              {/* Speak + Repeat buttons — only for non-scenario messages */}
              {!msg.isScenario && (
                <div style={{
                  position: "absolute",
                  bottom: "6px",
                  right: "10px",
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                }}>
                  {/* Play/Stop button */}
                  <button
                    onClick={() => speak(msg.text, msg.id)}
                    title={speakingId === msg.id ? "정지" : "읽기"}
                    style={{
                      background: speakingId === msg.id ? "rgba(244,114,182,0.25)" : "rgba(255,255,255,0.08)",
                      border: speakingId === msg.id ? "1px solid rgba(244,114,182,0.5)" : "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "14px",
                      padding: "3px 9px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.2s",
                    }}
                  >
                    {speakingId === msg.id
                      ? <><Waveform /><span style={{ fontSize: "10px", color: "#f472b6" }}>정지</span></>
                      : <><span style={{ fontSize: "12px" }}>🔊</span><span style={{ fontSize: "10px", color: "#aaa" }}>듣기</span></>
                    }
                  </button>
                  {/* Repeat toggle button */}
                  <button
                    onClick={() => repeatSpeak(msg.text, msg.id)}
                    title={ttsRepeat && speakingId === msg.id ? "반복 끄기" : "반복 재생"}
                    style={{
                      background: ttsRepeat && speakingId === msg.id ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)",
                      border: ttsRepeat && speakingId === msg.id ? "1px solid rgba(251,191,36,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      padding: "3px 8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "11px" }}>🔁</span>
                    <span style={{ fontSize: "10px", color: ttsRepeat && speakingId === msg.id ? "#fbbf24" : "#666" }}>
                      {ttsRepeat && speakingId === msg.id ? "ON" : ""}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #60a5fa)", display: "flex", alignItems: "center", justifyContent: "center" }}>🌍</div>
            <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", padding: "14px 20px", display: "flex", gap: "5px", alignItems: "center" }}>
              {[0,1,2].map(n => (
                <div key={n} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#a78bfa", animation: `bounce 1s ${n * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: "16px 20px",
        background: "rgba(255,255,255,0.03)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        gap: "10px",
        alignItems: "flex-end",
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={`${lang.nativeName}로 메시지를 입력하세요... (Shift+Enter: 줄바꿈)`}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            padding: "12px 16px",
            color: "#e8e8f0",
            fontSize: "14px",
            resize: "none",
            outline: "none",
            lineHeight: "1.5",
            minHeight: "46px",
            maxHeight: "120px",
            fontFamily: "inherit",
          }}
          rows={1}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
          background: input.trim() && !loading ? "linear-gradient(135deg, #a78bfa, #60a5fa)" : "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: "12px",
          padding: "12px 18px",
          color: "#fff",
          cursor: input.trim() && !loading ? "pointer" : "not-allowed",
          fontSize: "18px",
          transition: "all 0.2s",
          flexShrink: 0,
        }}>➤</button>

        {/* 저장 버튼 */}
        <button
          onClick={() => onSave && onSave()}
          disabled={messages.length === 0}
          title="대화 내용을 텍스트 파일로 저장"
          style={{
            background: messages.length > 0 ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
            border: messages.length > 0 ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "12px 14px",
            color: messages.length > 0 ? "#4ade80" : "#555",
            cursor: messages.length > 0 ? "pointer" : "not-allowed",
            fontSize: "16px",
            transition: "all 0.2s",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span style={{ fontSize: "11px" }}>저장</span>
        </button>
      </div>
    </div>
  );
}