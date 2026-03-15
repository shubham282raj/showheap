import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Container } from "react-bootstrap";
import FileMetadata from "../components/FileMetadata";
import WatchFile from "../components/WatchFile";
import { fetchStreamingLink } from "../apis/stream";
import { LoadingContainer } from "../components/Loader";

export default function Watch() {
  const { media_type, tmdb_id, encoded_metadata_id } = useParams();

  const { data, isLoading, isError, isSuccess, error } = useQuery({
    queryKey: ["file", encoded_metadata_id],
    queryFn: () => fetchStreamingLink(encoded_metadata_id),
  });

  if (isLoading) return <LoadingContainer />;

  if (isError)
    return (
      <Container>
        <div className="text-center">Error: {error.message}</div>
      </Container>
    );

  if (
    isSuccess &&
    (data.metadata.media_type != media_type || data.metadata.tmdb_id != tmdb_id)
  )
    return (
      <Container>
        <div className="text-center">
          This file does not belong to this content
        </div>
      </Container>
    );

  return (
    <Container>
      <WatchFile streamingLink={isSuccess ? data["stream_url"] : null} />
      <FileMetadata />
    </Container>
  );
}
