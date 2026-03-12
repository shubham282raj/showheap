import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStreamingLink } from "../utils/link";
import { Container } from "react-bootstrap";
import FileMetadata from "../components/FileMetadata";
import WatchFile from "../components/WatchFile";
import { getMetadata } from "../apis/firebase";

export default function Watch() {
  const { media_type, tmdb_id, file_id } = useParams();

  const { data, isLoading, isError, isSuccess, error } = useQuery({
    queryKey: ["file", file_id],
    enabled: !!file_id,
    queryFn: () => getMetadata(file_id),
  });

  if (isError)
    return (
      <Container>
        {console.log(error)}
        <div className="text-center">Error: {error.message}</div>
      </Container>
    );

  if (isSuccess && (data.media_type != media_type || data.tmdb_id != tmdb_id))
    return (
      <Container>
        <div className="text-center">
          This file does not belong to this content
        </div>
      </Container>
    );

  return (
    <Container>
      <WatchFile
        media_type={media_type}
        tmdb_id={tmdb_id}
        file_id={file_id}
        streamingLink={isSuccess ? getStreamingLink(data) : null}
      />
      <FileMetadata />
    </Container>
  );
}
