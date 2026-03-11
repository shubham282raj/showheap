import {
  ChevronsLeft,
  ChevronsRight,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { Spinner } from "react-bootstrap";
import { useAutoHide } from "./useAutoHide";
import ContentHeader from "./ContentHeader";
import { useRef, useState, useCallback, useEffect } from "react";

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "00:00";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n) => String(n).padStart(2, "0");

  return `${hrs ? pad(hrs) + ":" : ""}${pad(mins)}:${pad(secs)}`;
}

// Seek flash ripple component — mimics YouTube/MX Player feedback
function SeekFlashRipple({ side, active }) {
  return (
    <div
      className="position-absolute top-0 h-100 d-flex align-items-center justify-content-center"
      style={{
        [side === "left" ? "left" : "right"]: 0,
        width: "35%",
        pointerEvents: "none",
        zIndex: 25,
      }}
    >
      {/* Ripple backdrop */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          borderRadius: side === "left" ? "0 100% 100% 0" : "100% 0 0 100%",
          background:
            side === "left"
              ? "radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.18) 0%, transparent 70%)"
              : "radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.18) 0%, transparent 70%)",
          opacity: active ? 1 : 0,
          transition: active ? "opacity 0.05s ease" : "opacity 0.4s ease",
        }}
      />

      {/* Icon + label */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          opacity: active ? 1 : 0,
          transform: active ? "scale(1)" : "scale(0.7)",
          transition: active
            ? "opacity 0.05s ease, transform 0.1s cubic-bezier(0.34,1.56,0.64,1)"
            : "opacity 0.35s ease, transform 0.35s ease",
        }}
      >
        {side === "left" ? (
          <ChevronsLeft size={36} strokeWidth={1.4} color="white" />
        ) : (
          <ChevronsRight size={36} strokeWidth={1.4} color="white" />
        )}
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "white",
            letterSpacing: "0.5px",
          }}
        >
          10s
        </span>
      </div>
    </div>
  );
}

export default function MediaOverlay({
  playerState,
  playVideo,
  currentTime,
  duration,
  seekToPercentage,
  isFullscreen,
  toggleFullscreen,
  onDoubleClickLeft,
  onDoubleClickRight,
  seekFlash, // "backward" | "forward" | null
}) {
  const seekPercent = (currentTime / (duration || 1)) * 100;
  const { visible, showOverlay } = useAutoHide({
    delay: 2000,
    enabled: playerState == "playing",
  });

  // Draggable seek bar state
  const seekBarRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState(null);

  const getPercentFromEvent = useCallback((e) => {
    const rect = seekBarRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.min(
      Math.max(((clientX - rect.left) / rect.width) * 100, 0),
      100,
    );
  }, []);

  const handleSeekMouseDown = useCallback(
    (e) => {
      e.stopPropagation();
      setIsDragging(true);
      const pct = getPercentFromEvent(e);
      setDragPercent(pct);
    },
    [getPercentFromEvent],
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e) => {
      const pct = getPercentFromEvent(e);
      setDragPercent(pct);
    };

    const onUp = (e) => {
      const pct = getPercentFromEvent(e);
      seekToPercentage(pct);
      setIsDragging(false);
      setDragPercent(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, getPercentFromEvent, seekToPercentage]);

  const displayPercent =
    isDragging && dragPercent !== null ? dragPercent : seekPercent;

  return (
    <div
      className="position-absolute top-0 w-100 h-100 user-select-none"
      style={{ cursor: visible ? "default" : "none" }}
      onMouseMove={showOverlay}
    >
      {/* ── Seek flash ripples ── */}
      <SeekFlashRipple side="left" active={seekFlash === "backward"} />
      <SeekFlashRipple side="right" active={seekFlash === "forward"} />

      {/* ── Seek -10s button (original visibility logic) ── */}
      {/* <div
        className={`position-absolute p-4 d-flex flex-column align-items-center justify-content-center gap-1 media-overlay ${visible && playerState != "idle" ? "" : "hidden"}`}
        style={{
          left: "15%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 20,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDoubleClickLeft?.();
        }}
      >
        <RotateCcw size={36} strokeWidth={1.4} />
        <span
          style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.5px" }}
        >
          10s
        </span>
      </div> */}

      {/* ── Seek +10s button (original visibility logic) ── */}
      {/* <div
        className={`position-absolute p-4 d-flex flex-column align-items-center justify-content-center gap-1 media-overlay ${visible && playerState != "idle" ? "" : "hidden"}`}
        style={{
          left: "85%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 20,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDoubleClickRight?.();
        }}
      >
        <RotateCw size={36} strokeWidth={1.4} />
        <span
          style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.5px" }}
        >
          10s
        </span>
      </div> */}

      {/* ── Double-click seek zones (left / right halves) ── */}
      <div
        className="position-absolute top-0 h-100"
        style={{ left: 0, width: "35%", zIndex: 10 }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClickLeft?.();
        }}
      />

      {/* Center zone — single click play/pause */}
      <div
        className="position-absolute top-0 h-100"
        style={{ left: "35%", width: "30%", zIndex: 10, cursor: "pointer" }}
        onClick={() => {
          if (!visible) return;
          if (playerState === "paused" || playerState === "idle") {
            playVideo(true);
          } else {
            playVideo(false);
          }
        }}
      />

      {/* Right zone — seek +10s */}
      <div
        className="position-absolute top-0 h-100"
        style={{ left: "65%", width: "35%", zIndex: 10 }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClickRight?.();
        }}
      />

      {/* ── Dimmed overlay when not playing ── */}
      <div
        className={`media-overlay w-100 h-100 ${playerState == "playing" ? "hidden" : ""}`}
      >
        <ContentHeader />
      </div>

      {/* ── Play / Pause / Buffering indicator ── */}
      <div
        className={`position-absolute media-overlay p-3 ${visible ? "" : "hidden"}`}
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        {playerState === "paused" || playerState === "idle" ? (
          <Play size={50} strokeWidth={1.2} />
        ) : playerState === "buffering" ? (
          <Spinner />
        ) : (
          <Pause size={50} strokeWidth={1.2} />
        )}
      </div>

      {/* ── Fullscreen button ── */}
      <div
        className={`position-absolute p-3 media-overlay ${visible && playerState != "idle" ? "" : "hidden"}`}
        style={{ right: "0px", top: "0px", zIndex: 20 }}
        onClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
      >
        {isFullscreen ? (
          <Minimize className="m-0 d-block" size={20} />
        ) : (
          <Maximize className="m-0 d-block" size={20} />
        )}
      </div>

      {/* ── Time Seeker ── */}
      <div
        className={`position-absolute w-100 px-3 media-overlay ${visible && playerState != "idle" ? "" : "hidden"}`}
        style={{ left: "0px", bottom: "15px", zIndex: 20 }}
      >
        {/* Timestamp */}
        <div
          className="position-absolute h7 fw-bold mb-3 ms-3 user-select-none"
          style={{ left: "0px", bottom: "0px", letterSpacing: "0.5px" }}
        >
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </div>

        {/* Seek bar */}
        <div
          ref={seekBarRef}
          className="w-100 py-2 position-relative"
          style={{ cursor: isDragging ? "grabbing" : "pointer" }}
          onMouseDown={handleSeekMouseDown}
          onTouchStart={handleSeekMouseDown}
          onClick={(e) => {
            // fallback click for non-drag taps
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            seekToPercentage(pct);
          }}
        >
          {/* Track background */}
          <div
            className="w-100 rounded-5"
            style={{
              height: isDragging ? "5px" : "3px",
              background: "rgba(255,255,255,0.3)",
              transition: "height 0.15s ease",
            }}
          >
            {/* Filled portion */}
            <div
              className="rounded-5"
              style={{
                width: `${displayPercent}%`,
                height: "100%",
                background: "white",
                transition: isDragging ? "none" : "width 0.1s linear",
              }}
            />
          </div>

          {/* Thumb */}
          <div
            style={{
              position: "absolute",
              width: isDragging ? "14px" : "10px",
              height: isDragging ? "14px" : "10px",
              borderRadius: "50%",
              background: "white",
              boxShadow: isDragging
                ? "0 0 0 3px rgba(255,255,255,0.3)"
                : "none",
              top: "50%",
              left: `${displayPercent}%`,
              transform: "translate(-50%, -50%)",
              transition: isDragging
                ? "width 0.1s ease, height 0.1s ease, box-shadow 0.1s ease"
                : "width 0.15s ease, height 0.15s ease, left 0.1s linear",
              cursor: isDragging ? "grabbing" : "grab",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
