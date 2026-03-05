import { useState, useRef } from "react";
import { SITUATIONS, LEVEL_COLORS } from "../constants";
import { hexToRgb } from "../utils";

export function Sidebar({
  sidebarOpen, setSidebarOpen,
  lang, level,
  loading,
  sendScenario,
  feedback,
  goals,
  toggleGoal, deleteGoal, saveEditGoal, addGoal,
  newGoal, setNewGoal,
  editingGoal, setEditingGoal,
  stats, journal,
  levelProgress,
  convList = [],
  onLoadFiles,
  onDeleteConv,
  onClearConvList,
}) {
  const [activeTab, setActiveTab] = useState("situations");
  const [showConvDelete, setShowConvDelete] = useState(null);
  const fileInputRef = useRef(null);

  return (
    <div style={{
      width: sidebarOpen ? "320px" : "40px", // Changed collapsed width to 40px
      minWidth: sidebarOpen ? "320px" : "40px",
      background: "rgba(15, 12, 41, 0.95)",
      backdropFilter: "blur(10px)",
      borderLeft: "1px solid rgba(255,255,255,0.1)",
      display: "flex",
      flexDirection: "column",
      transition: "all 0.3s ease",
      position: window.innerWidth < 768 ? "absolute" : "relative",
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 1000,
      boxShadow: sidebarOpen ? "-10px 0 30px rgba(0,0,0,0.5)" : "none",
    }}>
      {/* Inner Content Wrapper - Hides content when sidebar is closed */}
      <div style={{
        width: "320px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        opacity: sidebarOpen ? 1 : 0,
        pointerEvents: sidebarOpen ? "auto" : "none",
        transition: "opacity 0.2s ease",
        overflow: "hidden"
      }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { id: "situations", label: "🗺️ 상황" },
          { id: "feedback",   label: "💡 피드백" },
          { id: "goals",      label: "🎯 목표" },
          { id: "progress",   label: "📊 진행" },
          { id: "history",    label: "📋 목록" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1,
            padding: "11px 3px",
            background: activeTab === tab.id ? "rgba(167,139,250,0.15)" : "transparent",
            border: "none",
            borderBottom: activeTab === tab.id ? "2px solid #a78bfa" : "2px solid transparent",
            color: activeTab === tab.id ? "#a78bfa" : "#888",
            cursor: "pointer",
            fontSize: "10px",
            fontWeight: activeTab === tab.id ? 600 : 400,
            transition: "all 0.2s",
          }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", scrollbarWidth: "thin", scrollbarColor: "rgba(167,139,250,0.2) transparent" }}>
        {/* Situations Tab */}
        {activeTab === "situations" && (
          <div>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa", marginBottom: "4px" }}>🗺️ 상황별 에피소드</div>
              <div style={{ fontSize: "11px", color: "#666", lineHeight: "1.5" }}>
                버튼을 누르면 해당 상황의 기·승·결 대화 에피소드 1개를 {lang.nativeName}로 생성합니다
              </div>
            </div>

            {/* 4×4 icon grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
            }}>
              {SITUATIONS.map(sit => (
                <button
                  key={sit.id}
                  onClick={() => { sendScenario(sit); setActiveTab("feedback"); }}
                  disabled={loading}
                  title={sit.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    padding: "10px 4px",
                    background: `rgba(${hexToRgb(sit.color)}, 0.1)`,
                    border: `1px solid rgba(${hexToRgb(sit.color)}, 0.3)`,
                    borderRadius: "12px",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1,
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.background = `rgba(${hexToRgb(sit.color)}, 0.22)`;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 4px 14px rgba(${hexToRgb(sit.color)}, 0.3)`;
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `rgba(${hexToRgb(sit.color)}, 0.1)`;
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>{sit.icon}</span>
                  <span style={{
                    fontSize: "9.5px",
                    color: sit.color,
                    fontWeight: 600,
                    textAlign: "center",
                    lineHeight: "1.2",
                    wordBreak: "keep-all",
                  }}>{sit.label}</span>
                </button>
              ))}
            </div>

            <div style={{
              marginTop: "14px",
              padding: "10px 12px",
              background: "rgba(167,139,250,0.07)",
              borderRadius: "10px",
              border: "1px solid rgba(167,139,250,0.15)",
              fontSize: "11px",
              color: "#888",
              lineHeight: "1.6",
            }}>
              💡 단어 카드(초·중·고급)는 선택 언어 수준별 핵심 어휘 20개와 예문을 정리해줍니다
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <>
            {feedback.length === 0 ? (
              <div style={{ textAlign: "center", color: "#666", marginTop: "40px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
                <p style={{ fontSize: "13px" }}>대화를 시작하면 실시간 피드백이 표시됩니다</p>
              </div>
            ) : feedback.map(fb => (
              <div key={fb.id} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "13px",
                lineHeight: "1.6",
              }}>
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>
                  ✏️ "{fb.userMsg?.slice(0, 30)}{fb.userMsg?.length > 30 ? "..." : ""}"
                </div>
                {fb.grammar && (
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ color: "#60a5fa", fontWeight: 600, fontSize: "11px" }}>📝 문법</span>
                    <p style={{ margin: "4px 0 0", color: "#ccc" }}>{fb.grammar}</p>
                  </div>
                )}
                {fb.vocab && (
                  <div style={{ marginBottom: "8px" }}>
                    <span style={{ color: "#4ade80", fontWeight: 600, fontSize: "11px" }}>📖 어휘</span>
                    <p style={{ margin: "4px 0 0", color: "#ccc" }}>{fb.vocab}</p>
                  </div>
                )}
                {fb.tip && (
                  <div style={{ background: "rgba(167,139,250,0.1)", borderRadius: "8px", padding: "8px 10px", borderLeft: "3px solid #a78bfa" }}>
                    <span style={{ fontSize: "11px", color: "#a78bfa" }}>💡 {fb.tip}</span>
                  </div>
                )}
                <div style={{ fontSize: "10px", color: "#555", marginTop: "8px", textAlign: "right" }}>{fb.ts}</div>
              </div>
            ))}
          </>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <>
            <div>
              <h3 style={{ fontSize: "13px", color: "#a78bfa", marginBottom: "10px", fontWeight: 600 }}>🎯 학습 목표</h3>
              {goals.map(goal => (
                <div key={goal.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "10px",
                  marginBottom: "6px",
                  border: goal.done ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                  <input type="checkbox" checked={goal.done} onChange={() => toggleGoal(goal.id)}
                    style={{ cursor: "pointer", accentColor: "#a78bfa", width: "15px", height: "15px" }} />
                  {editingGoal === goal.id ? (
                    <input
                      defaultValue={goal.text}
                      autoFocus
                      onBlur={e => saveEditGoal(goal.id, e.target.value)}
                      onKeyDown={e => e.key === "Enter" && saveEditGoal(goal.id, e.target.value)}
                      style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #a78bfa", color: "#e8e8f0", fontSize: "13px", outline: "none" }}
                    />
                  ) : (
                    <span
                      onClick={() => setEditingGoal(goal.id)}
                      style={{ flex: 1, fontSize: "13px", color: goal.done ? "#666" : "#ccc", textDecoration: goal.done ? "line-through" : "none", cursor: "pointer" }}
                    >{goal.text}</span>
                  )}
                  <button onClick={() => deleteGoal(goal.id)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "14px", padding: "2px" }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addGoal()}
                placeholder="새 목표 추가..."
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#e8e8f0",
                  fontSize: "12px",
                  outline: "none",
                }}
              />
              <button onClick={addGoal} style={{
                background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "16px",
              }}>+</button>
            </div>
            <div style={{ marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888", marginBottom: "6px" }}>
                <span>완료율</span>
                <span>{Math.round((goals.filter(g => g.done).length / Math.max(goals.length, 1)) * 100)}%</span>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  width: `${(goals.filter(g => g.done).length / Math.max(goals.length, 1)) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #a78bfa, #4ade80)",
                  transition: "width 0.5s",
                }} />
              </div>
            </div>
          </>
        )}

        {/* Progress Tab */}
        {activeTab === "progress" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "메시지", value: stats.messages, icon: "💬", color: "#a78bfa" },
                { label: "학습 시간", value: `${stats.time}분`, icon: "⏱️", color: "#60a5fa" },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "12px",
                  padding: "14px",
                  textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ fontSize: "22px" }}>{stat.icon}</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: stat.color, marginTop: "4px" }}>{stat.value}</div>
                  <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {[
              { label: "어휘 성장", value: stats.vocab, color: "#4ade80" },
              { label: "문법 향상", value: stats.grammar, color: "#60a5fa" },
              { label: "레벨 진행", value: levelProgress, color: LEVEL_COLORS[level] },
            ].map(bar => (
              <div key={bar.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888", marginBottom: "6px" }}>
                  <span>{bar.label}</span>
                  <span style={{ color: bar.color }}>{Math.round(bar.value)}%</span>
                </div>
                <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{
                    width: `${bar.value}%`,
                    height: "100%",
                    background: bar.color,
                    borderRadius: "4px",
                    boxShadow: `0 0 8px ${bar.color}66`,
                    transition: "width 0.5s",
                  }} />
                </div>
              </div>
            ))}

            {journal.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <h3 style={{ fontSize: "13px", color: "#a78bfa", marginBottom: "10px" }}>📓 학습 일지</h3>
                {journal.map(j => (
                  <div key={j.id} style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "10px",
                    padding: "12px",
                    marginBottom: "8px",
                    fontSize: "12px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ color: "#888", marginBottom: "4px" }}>{j.date}</div>
                    <div style={{ color: "#ccc" }}>{j.summary}</div>
                    {j.highlight && <div style={{ color: "#a78bfa", marginTop: "4px" }}>💡 {j.highlight}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── 📋 목록 탭 ── */}
        {activeTab === "history" && (
          <>
            {/* 툴바 */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.4)",
                  borderRadius: "10px", padding: "8px 10px", color: "#60a5fa",
                  cursor: "pointer", fontSize: "12px", fontWeight: 600,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 14 12 9 17 14"/>
                  <line x1="12" y1="9" x2="12" y2="21"/>
                </svg>
                파일 불러오기
              </button>
              {convList.length > 0 && (
                <button
                  onClick={() => { if (window.confirm("목록을 전체 삭제할까요?")) onClearConvList?.(); }}
                  style={{
                    background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: "10px", padding: "8px 10px", color: "#f87171",
                    cursor: "pointer", fontSize: "11px",
                  }}
                >전체삭제</button>
              )}
            </div>
            <div style={{ fontSize: "10px", color: "#555", marginBottom: "10px", lineHeight: "1.5" }}>
              💾 저장 버튼 누르면 자동 추가 · 여러 파일 동시 선택 가능
            </div>

            {/* 목록 */}
            {convList.length === 0 ? (
              <div style={{ textAlign: "center", color: "#555", marginTop: "40px" }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📂</div>
                <p style={{ fontSize: "12px" }}>저장된 대화가 없습니다</p>
                <p style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>
                  저장 버튼을 누르거나<br/>파일을 불러오세요
                </p>
              </div>
            ) : (
              convList.map(entry => (
                <div key={entry.id} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontSize: "12px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "16px" }}>{entry.langFlag}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#e8e8f0", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.title}
                      </div>
                      <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>
                        {entry.langName} · {entry.level} · {entry.messageCount}개 메시지
                      </div>
                    </div>
                    <span style={{
                      background: (LEVEL_COLORS[entry.level] || "#888") + "33",
                      border: `1px solid ${(LEVEL_COLORS[entry.level] || "#888")}66`,
                      color: LEVEL_COLORS[entry.level] || "#888",
                      fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "8px", flexShrink: 0,
                    }}>{entry.level}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#555", marginBottom: "8px" }}>🕐 {entry.savedAt}</div>

                  {showConvDelete === entry.id ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span style={{ flex: 1, fontSize: "11px", color: "#f87171", display: "flex", alignItems: "center" }}>삭제할까요?</span>
                      <button
                        onClick={() => { onDeleteConv?.(entry.id); setShowConvDelete(null); }}
                        style={{ background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.5)", borderRadius: "8px", padding: "4px 10px", color: "#f87171", cursor: "pointer", fontSize: "11px" }}
                      >삭제</button>
                      <button
                        onClick={() => setShowConvDelete(null)}
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "4px 10px", color: "#aaa", cursor: "pointer", fontSize: "11px" }}
                      >취소</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => {
                          const w = window.open("", "_blank");
                          if (w) { w.document.write(`<pre style="font-family:sans-serif;padding:20px;white-space:pre-wrap;">${entry.content}</pre>`); w.document.title = entry.title; }
                          else {
                            const a = document.createElement("a");
                            a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(entry.content);
                            a.download = entry.filename;
                            document.body.appendChild(a); a.click(); document.body.removeChild(a);
                          }
                        }}
                        style={{ flex: 1, background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: "8px", padding: "5px 0", color: "#a78bfa", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}
                      >👁 보기</button>
                      <button
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(entry.content);
                          a.download = entry.filename;
                          document.body.appendChild(a); a.click(); document.body.removeChild(a);
                        }}
                        style={{ flex: 1, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "8px", padding: "5px 0", color: "#4ade80", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}
                      >⬇ 다운</button>
                      <button
                        onClick={() => setShowConvDelete(entry.id)}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "5px 8px", color: "#555", cursor: "pointer", fontSize: "11px" }}
                      >✕</button>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* 숨김 파일 input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              multiple
              onChange={onLoadFiles}
              style={{ display: "none" }}
            />
          </>
        )}
      </div>
      </div>

      {/* Sidebar Toggle Button at the Bottom */}
      <button
        onClick={() => setSidebarOpen(o => !o)}
        title="메뉴 토글"
        style={{
          width: "100%",
          height: "48px",
          background: "rgba(255,255,255,0.03)",
          border: "none",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#a78bfa",
          transition: "all 0.3s ease",
          flexShrink: 0,
          marginTop: "auto"
        }}
      >
        <svg 
          width="24" height="24" viewBox="0 0 24 24" 
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: "transform 0.3s ease", transform: sidebarOpen ? "rotate(0deg)" : "rotate(90deg)" }}
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}