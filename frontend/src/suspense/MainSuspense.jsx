import BackgroundGrid from "../components/BackgroundGrid";
import LogoText from "../components/LogoText";

export default function MainSuspense({ text }) {
  return (
    <>
      <BackgroundGrid />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)",
            animation: "breathe 4s ease-in-out infinite",
          }}
        />

        {/* Corner marks */}
        {[
          {
            top: 24,
            left: 24,
            borderTop: "1px solid rgba(74,222,128,0.3)",
            borderLeft: "1px solid rgba(74,222,128,0.3)",
          },
          {
            top: 24,
            right: 24,
            borderTop: "1px solid rgba(74,222,128,0.3)",
            borderRight: "1px solid rgba(74,222,128,0.3)",
          },
          {
            bottom: 24,
            left: 24,
            borderBottom: "1px solid rgba(74,222,128,0.3)",
            borderLeft: "1px solid rgba(74,222,128,0.3)",
          },
          {
            bottom: 24,
            right: 24,
            borderBottom: "1px solid rgba(74,222,128,0.3)",
            borderRight: "1px solid rgba(74,222,128,0.3)",
          },
        ].map((style, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 28,
              height: 28,
              ...style,
            }}
          />
        ))}

        {/* Main content */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
          }}
        >
          {/* Wordmark */}
          <LogoText />

          {/* Tagline */}
          <div
            style={{
              marginTop: "12px",
              fontSize: "0.65rem",
              letterSpacing: "0.4em",
              lineHeight: 1,
              color: "rgba(74,222,128,0.4)",
              textTransform: "uppercase",
              animation: "fadeUp 0.8s 0.2s ease forwards",
              opacity: 0,
              // height: "15px",
            }}
          >
            {text}
          </div>

          {/* Progress bar track */}
          <div
            style={{
              marginTop: "48px",
              width: "50%",
              height: "1px",
              background: "rgba(74,222,128,0.1)",
              position: "relative",
              left: "50%",
              transform: "translateX(-50%)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, transparent, #22c55e, #4ade80, transparent)",
                animation: "scan 1.8s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.9); opacity: 0.6; }
          50%       { transform: scale(1.1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scan {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
      </div>
    </>
  );
}
