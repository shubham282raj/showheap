import { useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";

export default function WatchStream() {
  const { safeSrc } = useParams();
  const [searchParams] = useSearchParams();

  const poster = searchParams.get("poster");

  const [aspectRatio, setAspectRatio] = useState("16 / 7");

  return (
    <video
      className="w-100 bg-black"
      style={{ aspectRatio }}
      controls
      poster={poster}
      src={decodeURIComponent(safeSrc)}
      onLoadedMetadata={(e) => {
        const v = e.target;
        const ratio = `${v.videoWidth} / ${v.videoHeight}`;
        setAspectRatio(ratio);
      }}
    />
  );
}
