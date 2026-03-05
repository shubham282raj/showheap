import { useEffect, useRef, useState, useCallback } from "react";

export function useAutoHide({ delay = 5000, enabled = true } = {}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);
  const enabledRef = useRef(enabled);

  // Keep ref in sync so callbacks always see latest value without re-creating
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Stable clear — never changes identity
  const clear = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Stable startTimer — reads enabled from ref, so no stale closures
  const startTimer = useCallback(() => {
    if (!enabledRef.current) return;
    clear();
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, delay);
  }, [clear, delay]);

  // Show overlay and restart the hide timer
  const showOverlay = useCallback(() => {
    setVisible(true);
    startTimer();
  }, [startTimer]);

  // forceShow also restarts the timer so it auto-hides again afterward
  const forceShow = useCallback(() => {
    setVisible(true);
    startTimer();
  }, [startTimer]);

  const forceHide = useCallback(() => {
    clear();
    setVisible(false);
  }, [clear]);

  // React to enabled toggling (e.g. play ↔ pause)
  useEffect(() => {
    if (enabled) {
      startTimer();
    } else {
      clear();
      setVisible(true);
    }

    return clear;
  }, [enabled, startTimer, clear]);

  return {
    visible,
    showOverlay,
    forceShow,
    forceHide,
  };
}
