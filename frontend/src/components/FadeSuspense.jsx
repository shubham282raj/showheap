import { Suspense, useState, useEffect, useRef } from "react";

function FadeOverlay({ children, show }) {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (!show) {
      const t = setTimeout(() => setMounted(false), 600);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "black",
        transition: "opacity 0.6s ease",
        opacity: show ? 1 : 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {children}
    </div>
  );
}

function SuspenseBridge({ onLoaded, children }) {
  useEffect(() => {
    onLoaded();
  }, []);

  return children;
}

export default function FadeSuspense({
  children,
  fallback,
  minDuration = 1000,
}) {
  const [loaded, setLoaded] = useState(false);
  const timerDone = useRef(false);
  const contentReady = useRef(false);

  // Try to resolve — only fires when both flags are true
  const tryResolve = () => {
    if (timerDone.current && contentReady.current) {
      setLoaded(true);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      timerDone.current = true;
      tryResolve();
    }, minDuration);

    return () => clearTimeout(t);
  }, []);

  const handleLoaded = () => {
    contentReady.current = true;
    tryResolve();
  };

  return (
    <>
      <Suspense fallback={null}>
        <SuspenseBridge onLoaded={handleLoaded}>{children}</SuspenseBridge>
      </Suspense>

      <FadeOverlay show={!loaded}>{fallback}</FadeOverlay>
    </>
  );
}
