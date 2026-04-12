import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Container } from "react-bootstrap";
import FileMetadata from "../components/FileMetadata";
import WatchFile from "../components/WatchFile";
import { fetchStreamingLink } from "../apis/stream";
import { LoadingContainer } from "../components/Loader";
import PermissionDenied from "../components/PermissionDenied";

export default function Watch() {
  const { media_type, imdb_id, file_id } = useParams();

  const { data, isLoading, isError, isSuccess, error } = useQuery({
    queryKey: ["file", file_id],
    queryFn: () => fetchStreamingLink(file_id),
  });

  if (isLoading) return <LoadingContainer />;

  if (isError)
    if (error.message == "permission-denied") return <PermissionDenied />;
    else
      return (
        <Container>
          <div className="text-center">Error: {error.message}</div>
        </Container>
      );

  if (
    isSuccess &&
    (data.metadata.media_type != media_type || data.metadata.imdb_id != imdb_id)
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
