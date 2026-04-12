import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Container } from "react-bootstrap";
import ContentHeader from "../components/ContentHeader";
import ListFileSection from "../components/ListFileSection";
import { LoadingContainer } from "../components/Loader";
import { CONTENT_COLLECTION_NAME, getContent } from "../apis/firebase";

export default function Content() {
  const { media_type, imdb_id } = useParams();

  const {
    data: content,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [CONTENT_COLLECTION_NAME, media_type, imdb_id],
    enabled: !!media_type && !!imdb_id,
    queryFn: () => getContent(imdb_id),
  });

  if (isLoading) return <LoadingContainer />;

  if (isError)
    return (
      <Container>
        <div className="text-center">{error.message}</div>
      </Container>
    );

  if (!media_type || !imdb_id || media_type != content.media_type)
    return (
      <Container>
        <div>Invalid URL</div>
      </Container>
    );

  return (
    <Container className="mt-4">
      <ContentHeader media_type={media_type} imdb_id={imdb_id} />

      <ListFileSection />
    </Container>
  );
}
