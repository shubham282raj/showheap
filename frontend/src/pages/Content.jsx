import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Container } from "react-bootstrap";
import ContentHeader from "../components/ContentHeader";
import ListFileSection from "../components/ListFileSection";
import { LoadingContainer } from "../components/Loader";
import { getContent } from "../apis/firebase";

export default function Content() {
  const { media_type, tmdb_id, file_id } = useParams();

  const {
    data: content,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["content", media_type, tmdb_id],
    enabled: !!media_type && !!tmdb_id,
    queryFn: () => getContent(media_type, tmdb_id),
  });

  if (!media_type || !tmdb_id)
    return (
      <Container>
        <div>Invalid URL</div>
      </Container>
    );

  if (isLoading) return <LoadingContainer />;

  if (isError)
    return (
      <Container>
        <div className="text-center">{error.message}</div>
      </Container>
    );

  return (
    <Container className="mt-4">
      <ContentHeader media_type={media_type} tmdb_id={tmdb_id} />

      {content.media_type == "tv" ? (
        <ListFileSection fileGroup={content.files} />
      ) : (
        <ListFileSection fileGroup={{ Files: content.files }} />
      )}
    </Container>
  );
}
