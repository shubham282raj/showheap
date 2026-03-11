export default function BackgroundGrid() {
  // return <></>;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -10,
        background: "#080a0f",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        overflow: "hidden",
      }}
    >
      {/* Ambient grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
          linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px)
        `,
          backgroundSize: "48px 48px",
          animation: "gridDrift 20s linear infinite",
        }}
      />

      <style>{`
        // @keyframes gridDrift {
        //   from { transform: translate(0, 0); }
        //   to   { transform: translate(48px, 48px); }
        // }
      `}</style>
    </div>
  );
}
