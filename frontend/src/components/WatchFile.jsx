import { useRef, useState } from "react";
import ContentHeader from "./ContentHeader";
import MediaOverlay from "./MediaOverlay";
import toast from "react-hot-toast";
import { useFullscreen } from "./useFullscreen";

export default function WatchFile({ streamingLink }) {
  const videoRef = useRef(null);

  const [playerState, setPlayerState] = useState("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const fsContainerRef = useRef(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(fsContainerRef);

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
          // controls
          autoPlay
          className="w-100"
          onPlay={() => setPlayerState("playing")}
          onPause={() => setPlayerState("paused")}
          onWaiting={() => {
            setPlayerState("buffering");
          }}
          onPlaying={() => setPlayerState("playing")}
          onEnded={() => setPlayerState("ended")}
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onError={() => {
            const err = videoRef.current?.error;
            toast.error("ERROR CODE: " + err.code);
            toast.error(err.message);
          }}
        />
      )}

      <div className={`position-absolute top-0 w-100 h-100 media-overlay`}>
        <MediaOverlay
          playerState={playerState}
          playVideo={async (state) => {
            if (playerState == "idle") {
              setPlayerState("buffering");
              return;
            }
            try {
              if (state) await videoRef.current.play();
              else await videoRef.current.pause();
            } catch (err) {
              toast("Error");
            }
          }}
          currentTime={currentTime}
          duration={duration}
          seekToPercentage={(percentage) => {
            if (videoRef.current) videoRef.current.currentTime = currentTime;
            setCurrentTime(
              (videoRef.current.currentTime = (percentage * duration) / 100),
            );
          }}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
