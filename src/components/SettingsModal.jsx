import { useState } from "react";
import { AI_PROVIDERS } from "../constants";
import { hexToRgb } from "../utils";

export function SettingsModal({
  aiProvider, setAiProvider,
  aiModels, setAiModels,
  apiKeys, setApiKeys,
  setShowSettings
}) {
  const [showKeys, setShowKeys] = useState({ claude: false, openai: false, gemini: false });

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: "linear-gradient(135deg, #1e1b3a, #16132e)",
        border: "1px solid rgba(167,139,250,0.3)",
        borderRadius: "20px",
        padding: "28px",
        width: "480px",
        maxWidth: "95vw",
        maxHeight: "85vh",
        overflowY: "auto",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
      }}>
        {/* 모달 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#e8e8f0" }}>⚙️ AI 설정</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>API 키와 모델을 설정하세요</div>
          </div>
          <button onClick={() => setShowSettings(false)} style={{
            background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px",
            padding: "6px 12px", color: "#aaa", cursor: "pointer", fontSize: "16px",
          }}>✕</button>
        </div>

        {/* 활성 AI 선택 */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>사용할 AI</div>
          <div style={{ display: "flex", gap: "8px" }}>
            {Object.entries(AI_PROVIDERS).map(([pid, prov]) => (
              <button
                key={pid}
                onClick={() => setAiProvider(pid)}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  borderRadius: "12px",
                  border: aiProvider === pid
                    ? `2px solid ${prov.color}`
                    : "2px solid rgba(255,255,255,0.08)",
                  background: aiProvider === pid
                    ? `rgba(${hexToRgb(prov.color)}, 0.15)`
                    : "rgba(255,255,255,0.04)",
                  color: aiProvider === pid ? prov.color : "#888",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: aiProvider === pid ? 700 : 400,
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "20px" }}>{prov.icon}</span>
                <span>{prov.name}</span>
                {apiKeys[pid] && <span style={{ fontSize: "9px", color: "#4ade80" }}>● 키 설정됨</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 각 AI별 API 키 + 모델 설정 */}
        {Object.entries(AI_PROVIDERS).map(([pid, prov]) => (
          <div key={pid} style={{
            marginBottom: "20px",
            padding: "16px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "14px",
            border: aiProvider === pid
              ? `1px solid rgba(${hexToRgb(prov.color)}, 0.35)`
              : "1px solid rgba(255,255,255,0.06)",
            opacity: aiProvider === pid ? 1 : 0.6,
            transition: "all 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "18px" }}>{prov.icon}</span>
              <span style={{ fontWeight: 700, color: prov.color, fontSize: "14px" }}>{prov.name}</span>
              {apiKeys[pid] && (
                <span style={{ marginLeft: "auto", fontSize: "10px", color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(74,222,128,0.3)" }}>
                  ✓ 키 등록됨
                </span>
              )}
            </div>

            {/* API 키 입력 */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>API Key</div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type={showKeys[pid] ? "text" : "password"}
                  value={apiKeys[pid]}
                  onChange={e => setApiKeys(k => ({ ...k, [pid]: e.target.value }))}
                  placeholder={prov.placeholder}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "#e8e8f0",
                    fontSize: "12px",
                    outline: "none",
                    fontFamily: "monospace",
                  }}
                />
                <button
                  onClick={() => setShowKeys(k => ({ ...k, [pid]: !k[pid] }))}
                  style={{
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px", padding: "8px 10px", color: "#aaa", cursor: "pointer", fontSize: "13px",
                  }}
                >{showKeys[pid] ? "🙈" : "👁️"}</button>
                {apiKeys[pid] && (
                  <button
                    onClick={() => setApiKeys(k => ({ ...k, [pid]: "" }))}
                    style={{
                      background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                      borderRadius: "8px", padding: "8px 10px", color: "#f87171", cursor: "pointer", fontSize: "12px",
                    }}
                  >삭제</button>
                )}
              </div>
            </div>

            {/* 모델 선택 */}
            <div>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>모델</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {prov.models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setAiModels(prev => ({ ...prev, [pid]: m.id }))}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "8px",
                      border: aiModels[pid] === m.id
                        ? `1px solid ${prov.color}`
                        : "1px solid rgba(255,255,255,0.1)",
                      background: aiModels[pid] === m.id
                        ? `rgba(${hexToRgb(prov.color)}, 0.15)`
                        : "rgba(255,255,255,0.04)",
                      color: aiModels[pid] === m.id ? prov.color : "#888",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: aiModels[pid] === m.id ? 600 : 400,
                      transition: "all 0.15s",
                    }}
                  >{m.label}</button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Claude 키 없을 때 안내 */}
        {aiProvider === "claude" && !apiKeys["claude"] && (
          <div style={{
            marginTop: "12px",
            padding: "10px 14px",
            background: "rgba(251,146,60,0.08)",
            borderRadius: "10px",
            border: "1px solid rgba(251,146,60,0.25)",
            fontSize: "11px",
            color: "#fdba74",
            lineHeight: "1.7",
          }}>
            💡 Claude는 API 키 없이도 <strong>Claude.ai 내장 API</strong>로 동작합니다.<br/>
            키를 입력하면 본인 계정으로 직접 호출됩니다.
          </div>
        )}

        {/* 발급 안내 링크 */}
        <div style={{
          marginTop: "12px",
          padding: "12px 16px",
          background: "rgba(167,139,250,0.07)",
          borderRadius: "12px",
          border: "1px solid rgba(167,139,250,0.15)",
          fontSize: "11px",
          color: "#888",
          lineHeight: "1.8",
        }}>
          📌 API 키 발급처<br/>
          🟠 Claude: <span style={{ color: "#fb923c" }}>console.anthropic.com</span><br/>
          🟢 ChatGPT: <span style={{ color: "#4ade80" }}>platform.openai.com/api-keys</span><br/>
          🔵 Gemini: <span style={{ color: "#60a5fa" }}>aistudio.google.com/apikey</span>
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={() => setShowSettings(false)}
          style={{
            marginTop: "16px",
            width: "100%",
            background: `linear-gradient(135deg, ${AI_PROVIDERS[aiProvider].color}, #a78bfa)`,
            border: "none",
            borderRadius: "12px",
            padding: "12px",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {AI_PROVIDERS[aiProvider].icon} {AI_PROVIDERS[aiProvider].name} ·{" "}
          {AI_PROVIDERS[aiProvider].models.find(m => m.id === aiModels[aiProvider])?.label} 적용
        </button>
      </div>
    </div>
  );
}