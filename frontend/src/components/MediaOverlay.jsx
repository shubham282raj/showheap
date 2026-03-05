import { Maximize, Minimize, Pause, Play } from "lucide-react";
import { Spinner } from "react-bootstrap";
import { useAutoHide } from "./useAutoHide";
import ContentHeader from "./ContentHeader";

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "00:00";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n) => String(n).padStart(2, "0");

  return `${hrs ? pad(hrs) + ":" : ""}${pad(mins)}:${pad(secs)}`;
}

export default function MediaOverlay({
  playerState,
  playVideo,
  currentTime,
  duration,
  seekToPercentage,
  isFullscreen,
  toggleFullscreen,
}) {
  const seekPercent = (currentTime / (duration || 1)) * 100;
  const { visible, showOverlay } = useAutoHide({
    delay: 2000,
    enabled: playerState == "playing",
  });

  return (
    <div
      className="position-absolute top-0 w-100 h-100"
      style={{ cursor: "pointer" }}
      onClick={() => {
        if (!visible) return;
        if (playerState == "paused" || playerState == "idle") {
          playVideo(true);
        } else {
          playVideo(false);
        }
      }}
      onMouseMove={showOverlay}
    >
      <div
        className={`media-overlay w-100 h-100 ${playerState == "playing" ? "hidden" : ""}`}
      >
        <ContentHeader />
      </div>

      {/* blur overlay */}
      {/* <div
        className="position-absolute top-0 w-100 h-100"
        style={{
          backdropFilter: "blur(2px)",
          visibility: playerState == "playing" ? "hidden" : "visible",
        }}
      ></div> */}

      {/* play / pause / buffering signs */}
      <div
        className={`position-absolute media-overlay ${visible ? "" : "hidden"}`}
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {playerState == "paused" || playerState == "idle" ? (
          <Play size={50} strokeWidth={1.2} />
        ) : playerState == "buffering" ? (
          <Spinner />
        ) : (
          <Pause size={50} strokeWidth={1.2} />
        )}
      </div>

      {/* fullscreen button */}
      <div
        className={`position-absolute p-3 media-overlay ${visible && playerState != "idle" ? "" : "hidden"}`}
        style={{ right: "0px", top: "0px" }}
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

      {/* Time Seeker */}
      <div
        className={`position-absolute w-100 px-3 media-overlay ${visible && playerState != "idle" ? "" : "hidden"}`}
        style={{
          left: "0px",
          bottom: "15px",
        }}
      >
        {/* Time Stamp */}
        <div
          className="position-absolute h7 fw-bold mb-3 ms-3 user-select-none"
          style={{ left: "0px", bottom: "0px", letterSpacing: "0.5px" }}
        >
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </div>

        {/* Seaker */}
        <div
          className="w-100 py-1 position-relative"
          onClick={(e) => {
            e.stopPropagation();

            const rect = e.currentTarget.getBoundingClientRect();

            const width = rect.width; // full div width
            const clickX = e.clientX - rect.left; // distance from left
            const percentage = (clickX / width) * 100;

            seekToPercentage(percentage);
          }}
        >
          <div className="w-100 border border-2  rounded-5"></div>
          <div
            className="position-absolute bg-white"
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              top: "50%",
              left: `${seekPercent}%`,
              transform: "translate(-50%, -50%)",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
