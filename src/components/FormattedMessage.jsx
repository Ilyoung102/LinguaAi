export function FormattedMessage({ text }) {
  // **bold** → <strong> 렌더링
  function renderText(str) {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, idx) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={idx} style={{ color: "#f1f5f9" }}>{p.slice(2, -2)}</strong>;
      }
      return p;
    });
  }
  
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (!t) {
      // empty line → small gap
      elements.push(<div key={i} style={{ height: "6px" }} />);
      i++; continue;
    }

    // 📖 episode title
    if (t.startsWith("📖")) {
      elements.push(
        <div key={i} style={{ fontSize: "14px", fontWeight: 700, color: "#a78bfa", marginBottom: "10px", marginTop: "4px" }}>{t}</div>
      );
      i++; continue;
    }

    // 📌 section header
    if (t.startsWith("📌")) {
      elements.push(
        <div key={i} style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa", marginTop: "14px", marginBottom: "6px", borderTop: "1px solid rgba(96,165,250,0.2)", paddingTop: "10px" }}>{t}</div>
      );
      i++; continue;
    }

    // 📢 pronunciation line — 레이블 제거하고 📢 + 발음만 표시
    if (t.startsWith("📢")) {
      const colonIdx = t.indexOf(":");
      const pronText = colonIdx !== -1 ? t.slice(colonIdx + 1).trim() : t.slice(2).trim();
      elements.push(
        <div key={i} style={{ fontSize: "12px", color: "#fdba74", fontStyle: "italic", paddingLeft: "12px", marginTop: "1px" }}>
          📢 {pronText}
        </div>
      );
      i++; continue;
    }

    // 💬 Korean meaning/translation line — 레이블 제거하고 💬 + 해석만 표시
    if (t.startsWith("💬")) {
      const colonIdx = t.indexOf(":");
      const krText = colonIdx !== -1 ? t.slice(colonIdx + 1).trim() : t.slice(2).trim();
      elements.push(
        <div key={i} style={{ fontSize: "12px", color: "#94a3b8", paddingLeft: "12px", marginBottom: "8px" }}>
          💬 {krText}
        </div>
      );
      i++; continue;
    }

    // • bullet (핵심 표현 항목)
    if (t.startsWith("•") || t.startsWith("-")) {
      elements.push(
        <div key={i} style={{ fontSize: "13px", color: "#cbd5e1", paddingLeft: "8px", marginBottom: "2px" }}>{t}</div>
      );
      i++; continue;
    }

    // A: / B: dialogue line (원어 대사) — most important, highlighted
    if (/^[A-Z]:\s/.test(t) || /^[AB]:\s/.test(t)) {
      elements.push(
        <div key={i} style={{ fontSize: "14px", color: "#f1f5f9", fontWeight: 600, marginTop: "10px" }}>
          {renderText(t)}
        </div>
      );
      i++; continue;
    }

    // default plain line
    elements.push(
      <div key={i} style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "2px" }}>
        {renderText(t)}
      </div>
    );
    i++;
  }
  return <div style={{ lineHeight: "1.7" }}>{elements}</div>;
}
