import { useCallback, useEffect, useState } from "react";

export function useFullscreen(ref) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(async () => {
    if (!ref.current) return;

    if (!document.fullscreenElement) {
      await ref.current.requestFullscreen();

      // Try to lock landscape
      if (screen.orientation?.lock) {
        try {
          await screen.orientation.lock("landscape");
        } catch (err) {
          console.log("Orientation lock failed:", err);
        }
      }
    }
  }, [ref]);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();

      // Unlock orientation
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  return {
    isFullscreen,
    toggleFullscreen,
  };
}
