import { useState, useRef } from "react";
import { SITUATIONS, LEVEL_COLORS } from "../constants";
import { hexToRgb } from "../utils";
import { Language, Goal, Stats, JournalEntry, Conversation, Feedback } from "../types";

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean | ((v: boolean) => boolean)) => void;
    lang: Language;
    level: string;
    loading: boolean;
    sendScenario: (sit: any) => void;
    feedback: Feedback[];
    goals: Goal[];
    toggleGoal: (id: number) => void;
    deleteGoal: (id: number) => void;
    saveEditGoal: (id: number, text: string) => void;
    addGoal: () => void;
    newGoal: string;
    setNewGoal: (goal: string) => void;
    editingGoal: number | null;
    setEditingGoal: (id: number | null) => void;
    stats: Stats;
    journal: JournalEntry[];
    levelProgress: number;
    convList?: Conversation[];
    onLoadFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteConv: (id: number) => void;
    onRestoreConv: (entry: Conversation) => void;
    onClearConvList: () => void;
}

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
    stats, // journal,
    levelProgress,
    convList = [],
    onLoadFiles,
    onDeleteConv,
    onRestoreConv,
    onClearConvList,
}: SidebarProps) {
    const [activeTab, setActiveTab] = useState("history");
    const [showConvDelete, setShowConvDelete] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const TABS = [
        { id: "situations", label: "🗺️ 상황", icon: "🗺️" },
        { id: "feedback", label: "💡 피드백", icon: "💡" },
        { id: "goals", label: "🎯 목표", icon: "🎯" },
        { id: "progress", label: "📊 진행", icon: "📊" },
        { id: "history", label: "📋 목록", icon: "📋" },
    ];

    return (
        <div style={{
            width: sidebarOpen ? "280px" : "40px",
            minWidth: sidebarOpen ? "280px" : "40px",
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
            overflow: "hidden",
        }}>

            {/* 접혔을 때: 세로 탭 아이콘 */}
            {!sidebarOpen && (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingTop: "8px",
                    gap: "4px",
                    flex: 1,
                }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSidebarOpen(true); }}
                            title={tab.label}
                            style={{
                                width: "36px", height: "36px",
                                background: activeTab === tab.id ? "rgba(167,139,250,0.25)" : "transparent",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "17px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.2s",
                            }}
                        >{tab.icon}</button>
                    ))}
                </div>
            )}

            {/* 펼쳐졌을 때: 전체 내용 */}
            <div style={{
                width: "280px",
                flex: 1,
                display: sidebarOpen ? "flex" : "none",
                flexDirection: "column",
                overflow: "hidden",
            }}>
                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {TABS.map(tab => (
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
                                                onBlur={e => saveEditGoal(goal.id, (e.target as HTMLInputElement).value)}
                                                onKeyDown={e => e.key === "Enter" && saveEditGoal(goal.id, (e.target as HTMLInputElement).value)}
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
                                    onChange={e => setNewGoal(e.currentTarget.value)}
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
                                { label: "레벨 진행", value: levelProgress, color: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] },
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
                        </>
                    )}

                    {/* 📋 목록 탭 - Modernized AI Story Style */}
                    {activeTab === "history" && (
                        <>
                            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                        background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)",
                                        borderRadius: "12px", padding: "10px", color: "#a78bfa",
                                        cursor: "pointer", fontSize: "12px", fontWeight: 600,
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(167,139,250,0.2)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(167,139,250,0.1)")}
                                >
                                    📥 파일 불러오기
                                </button>
                                {convList.length > 0 && (
                                    <button
                                        onClick={() => { if (window.confirm("모든 대화 목록을 삭제할까요?")) onClearConvList(); }}
                                        style={{
                                            background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                                            borderRadius: "12px", padding: "10px", color: "#f87171",
                                            cursor: "pointer", fontSize: "11px", transition: "all 0.2s"
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.2)")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.1)")}
                                    >전체삭제</button>
                                )}
                            </div>

                            {convList.length === 0 ? (
                                <div style={{ textAlign: "center", color: "#555", marginTop: "60px" }}>
                                    <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>📖</div>
                                    <p style={{ fontSize: "14px", color: "#888" }}>아직 저장된 대화가 없습니다</p>
                                    <p style={{ fontSize: "11px", color: "#666", marginTop: "8px" }}>대화 중 하단 저장 버튼을 눌러보세요</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {convList.map(entry => (
                                        <div
                                            key={entry.id}
                                            onClick={() => { if (!showConvDelete) onRestoreConv(entry); }}
                                            style={{
                                                background: "rgba(255,255,255,0.03)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                borderRadius: "16px",
                                                padding: "16px",
                                                cursor: "pointer",
                                                position: "relative",
                                                transition: "all 0.2s ease",
                                                overflow: "hidden",
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                                                e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)";
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                                                e.currentTarget.style.transform = "none";
                                            }}
                                        >
                                            {/* Header: Flag and Title */}
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontWeight: 700, color: "#fff",
                                                        fontSize: "13px", marginBottom: "2px",
                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                                                    }}>{entry.title || "새로운 대화"}</div>
                                                    <div style={{ fontSize: "11px", color: "#666" }}>
                                                        {entry.langName}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer: Date and Message Count */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ fontSize: "10px", color: "#444" }}>
                                                    {new Date(entry.createdAt).toLocaleDateString("ko-KR")}
                                                </div>
                                                <div style={{ fontSize: "9px", background: "rgba(167,139,250,0.12)", color: "#a78bfa", padding: "2px 6px", borderRadius: "6px", fontWeight: 600 }}>
                                                    {entry.messages?.length || 0} msgs
                                                </div>
                                            </div>

                                            {/* Quick Delete Overlay */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowConvDelete(entry.id); }}
                                                style={{
                                                    position: "absolute", top: "12px", right: "12px",
                                                    background: "rgba(255,255,255,0.05)", border: "none",
                                                    color: "#555", cursor: "pointer", fontSize: "14px",
                                                    width: "24px", height: "24px", borderRadius: "6px",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    transition: "all 0.2s"
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                            >×</button>

                                            {showConvDelete === entry.id && (
                                                <div
                                                    onClick={e => e.stopPropagation()}
                                                    style={{
                                                        position: "absolute", inset: 0,
                                                        background: "rgba(30,27,58,0.95)",
                                                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                                        gap: "12px", padding: "12px", zIndex: 10
                                                    }}
                                                >
                                                    <span style={{ fontSize: "12px", color: "#f87171", fontWeight: 600 }}>이 대화를 삭제할까요?</span>
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button
                                                            onClick={() => { onDeleteConv(entry.id); setShowConvDelete(null); }}
                                                            style={{ background: "#f87171", color: "#fff", border: "none", padding: "6px 16px", borderRadius: "8px", fontSize: "11px", cursor: "pointer" }}
                                                        >삭제</button>
                                                        <button
                                                            onClick={() => setShowConvDelete(null)}
                                                            style={{ background: "rgba(255,255,255,0.1)", color: "#aaa", border: "none", padding: "6px 16px", borderRadius: "8px", fontSize: "11px", cursor: "pointer" }}
                                                        >취소</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.json"
                                multiple
                                onChange={onLoadFiles}
                                style={{ display: "none" }}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* 하단 토글 버튼 */}
            <button
                onClick={() => setSidebarOpen(o => !o)}
                title={sidebarOpen ? "사이드바 접기" : "사이드바 펼치기"}
                style={{
                    width: "100%", height: "40px",
                    background: "rgba(255,255,255,0.03)",
                    border: "none", borderTop: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "4px", color: "#a78bfa", transition: "all 0.2s", flexShrink: 0,
                }}
            >
                <svg
                    width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.3s" }}
                >
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                {sidebarOpen && <span style={{ fontSize: "11px", color: "#888" }}>접기</span>}
            </button>
        </div>
    );
}
