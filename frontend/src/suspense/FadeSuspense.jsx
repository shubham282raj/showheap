import { Suspense, useState, useEffect, useRef } from "react";
import {
  subscribeSuspense,
  getSuspenseState,
  showSuspense,
} from "./suspenseController";
import MainSuspense from "./MainSuspense";

function FadeOverlay({ children, show }) {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (!show) {
      const t = setTimeout(() => setMounted(false), 600);
      return () => clearTimeout(t);
    } else {
      setMounted(true);
    }
  }, [show]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
        background: "black",
        transition: "opacity 0.6s ease",
        opacity: show ? 1 : 0,
        pointerEvents: "none",
        zIndex: 9999,
        color: "white",
        fontSize: "18px",
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

export default function FadeSuspense({ children, minDuration = 100 }) {
  const [loaded, setLoaded] = useState(false);

  const [forcedState, setForcedState] = useState(getSuspenseState());

  const timerDone = useRef(false);
  const contentReady = useRef(false);

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

  useEffect(() => {
    return subscribeSuspense(setForcedState);
  }, []);

  const showOverlay = !loaded || forcedState.visible;

  return (
    <>
      <Suspense fallback={null}>
        <SuspenseBridge onLoaded={handleLoaded}>{children}</SuspenseBridge>
      </Suspense>

      <FadeOverlay show={showOverlay}>
        <MainSuspense text={forcedState.text} />
      </FadeOverlay>
    </>
  );
}
