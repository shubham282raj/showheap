export default function LogoText(props) {
  return (
    <div
      style={{
        fontSize: "clamp(2.5rem, 8vw, 5rem)",
        fontWeight: 900,
        letterSpacing: "0.25em",
        lineHeight: 1,
        textTransform: "uppercase",
        color: "#fff",
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        // transform: "translateY(1px)",
        animation: "fadeUp 0.8s ease forwards",
        opacity: 1,
        ...props,
      }}
    >
      <span
        style={{
          background:
            "linear-gradient(135deg, #4ade80 0%, #22c55e 40%, #86efac 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        show
      </span>
      <span
        style={{
          color: "rgba(255,255,255,0.15)",
        }}
      >
        heap
      </span>
    </div>
  );
}
