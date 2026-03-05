export function Waveform({ color = "#f472b6" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", height: "14px" }}>
      {[1, 2, 3, 4, 3].map((h, i) => (
        <span key={i} style={{
          display: "inline-block",
          width: "2px",
          height: `${h * 3}px`,
          background: color,
          borderRadius: "1px",
          animation: `wavebar 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
        }} />
      ))}
    </span>
  );
}
