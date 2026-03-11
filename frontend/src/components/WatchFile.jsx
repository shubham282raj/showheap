import { useRef, useState, useEffect, useCallback } from "react";
import MediaOverlay from "./MediaOverlay";
import toast from "react-hot-toast";
import { useFullscreen } from "./useFullscreen";

// Derive a stable storage key from the streaming URL
function getStorageKey(url) {
  if (!url) return null;
  // Use the last meaningful segment of the URL as the key
  try {
    const u = new URL(url);
    return `watchfile_pos_${u.pathname}`;
  } catch {
    return `watchfile_pos_${url.slice(-80)}`;
  }
}

const SAVE_INTERVAL_MS = 5000; // save position every 5s
const RESUME_THRESHOLD = 10; // don't resume if within last 10s of video (treat as "finished")

export default function WatchFile({ streamingLink }) {
  const videoRef = useRef(null);

  const [playerState, setPlayerState] = useState("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekFlash, setSeekFlash] = useState(null); // "backward" | "forward" | null

  const fsContainerRef = useRef(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(fsContainerRef);

  const flashSeek = useCallback((direction) => {
    // Reset first so re-triggering the same direction still replays the animation
    setSeekFlash(null);
    requestAnimationFrame(() => {
      setSeekFlash(direction);
      setTimeout(() => setSeekFlash(null), 600);
    });
  }, []);

  const seekBy = useCallback(
    (seconds) => {
      if (!videoRef.current) return;
      const next = Math.min(
        Math.max(videoRef.current.currentTime + seconds, 0),
        duration,
      );
      videoRef.current.currentTime = next;
      setCurrentTime(next);
      flashSeek(seconds > 0 ? "forward" : "backward");
    },
    [duration, flashSeek],
  );

  const togglePlay = useCallback(async () => {
    if (playerState === "idle") {
      setPlayerState("buffering");
      return;
    }
    try {
      if (videoRef.current.paused) await videoRef.current.play();
      else await videoRef.current.pause();
    } catch {
      toast("Error");
    }
  }, [playerState]);

  const changeVolume = useCallback((delta) => {
    if (!videoRef.current) return;
    videoRef.current.volume = Math.min(
      Math.max(videoRef.current.volume + delta, 0),
      1,
    );
  }, []);

  // ── Restore saved position on first metadata load ──
  const handleLoadedMetadata = useCallback(
    (e) => {
      const vid = e.target;
      setDuration(vid.duration);

      const key = getStorageKey(streamingLink);
      if (!key) return;

      try {
        const saved = parseFloat(localStorage.getItem(key));
        if (
          saved &&
          !isNaN(saved) &&
          saved > 5 && // skip trivially small positions
          saved < vid.duration - RESUME_THRESHOLD // don't resume at the very end
        ) {
          vid.currentTime = saved;
          setCurrentTime(saved);
          toast(
            `Resumed from ${Math.floor(saved / 60)}:${String(Math.floor(saved % 60)).padStart(2, "0")}`,
            {
              icon: "⏩",
              duration: 3000,
            },
          );
        }
      } catch {
        // localStorage blocked or parse error — ignore
      }
    },
    [streamingLink],
  );

  // ── Periodically save position to localStorage ──
  useEffect(() => {
    const key = getStorageKey(streamingLink);
    if (!key) return;

    const interval = setInterval(() => {
      if (!videoRef.current || playerState !== "playing") return;
      try {
        localStorage.setItem(key, String(videoRef.current.currentTime));
      } catch {
        // quota exceeded or blocked — ignore
      }
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [streamingLink, playerState]);

  // ── Also save on pause / unload so we don't lose position ──
  useEffect(() => {
    const saveNow = () => {
      const key = getStorageKey(streamingLink);
      if (!key || !videoRef.current) return;
      try {
        localStorage.setItem(key, String(videoRef.current.currentTime));
      } catch {}
    };

    window.addEventListener("beforeunload", saveNow);
    return () => window.removeEventListener("beforeunload", saveNow);
  }, [streamingLink]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
        case "l":
          e.preventDefault();
          seekBy(10);
          break;
        case "ArrowLeft":
        case "j":
          e.preventDefault();
          seekBy(-10);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume(0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seekBy, changeVolume, toggleFullscreen]);

  return (
    <div
      className="position-relative m-0 p-0 border-white w-100 rounded-2 overflow-hidden mt-4 bg-black d-flex"
      style={{ aspectRatio: 16 / 9 }}
      ref={fsContainerRef}
    >
      {playerState != "idle" && (
        <video
          ref={videoRef}
          src={streamingLink}
          autoPlay
          className="w-100"
          onPlay={() => setPlayerState("playing")}
          onPause={() => {
            setPlayerState("paused");
            // Save on every pause
            const key = getStorageKey(streamingLink);
            if (key && videoRef.current) {
              try {
                localStorage.setItem(key, String(videoRef.current.currentTime));
              } catch {}
            }
          }}
          onWaiting={() => setPlayerState("buffering")}
          onPlaying={() => setPlayerState("playing")}
          onEnded={() => {
            setPlayerState("ended");
            // Clear saved position when video finishes
            const key = getStorageKey(streamingLink);
            if (key) {
              try {
                localStorage.removeItem(key);
              } catch {}
            }
          }}
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => {
            const err = videoRef.current?.error;
            toast.error("ERROR CODE: " + err.code);
            toast.error(err.message);
          }}
        />
      )}

      <div className="position-absolute top-0 w-100 h-100 media-overlay">
        <MediaOverlay
          playerState={playerState}
          seekFlash={seekFlash}
          playVideo={async (state) => {
            if (playerState === "idle") {
              setPlayerState("buffering");
              return;
            }
            try {
              if (state) await videoRef.current.play();
              else await videoRef.current.pause();
            } catch {
              toast("Error");
            }
          }}
          onDoubleClickLeft={() => seekBy(-10)}
          onDoubleClickRight={() => seekBy(10)}
          currentTime={currentTime}
          duration={duration}
          seekToPercentage={(percentage) => {
            if (videoRef.current) {
              const next = (percentage * duration) / 100;
              videoRef.current.currentTime = next;
              setCurrentTime(next);
            }
          }}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
