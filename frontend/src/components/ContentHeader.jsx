import { useQuery } from "@tanstack/react-query";
import { Container, Card, Badge, Image } from "react-bootstrap";
import { CONTENT_COLLECTION_NAME, getContent } from "../apis/firebase";
import { useParams } from "react-router-dom";

export default function ContentHeader() {
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

  if (isLoading) return <></>;

  if (isError) return <div>Error: {error.message}</div>;

  return (
    <Card className="shadow position-relative text-white w-100 h-100 border-0 overflow-hidden user-select-none">
      <Card.Img
        src={content.background}
        className="object-fit-cover h-100 w-100"
        style={{ aspectRatio: 16 / 9 }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.9))",
        }}
      >
        <div className="w-100 h-100 m-0 d-flex justify-content-between align-items-end">
          <Container className="h-100 w-auto p-2 m-0">
            <Image
              src={content.poster.replace("small", "big")}
              className="h-100 w-auto p-0 rounded-2"
            ></Image>
          </Container>

          {/* Info */}
          <div
            className="text-end z-1 user-select-none w-50 pe-3"
            style={{ pointerEvents: "none", paddingBottom: "2.1rem" }}
          >
            <Badge bg="secondary" className="mb-2">
              {content.media_type.toUpperCase()}
            </Badge>
            <h2 className="m-0 p-0">{content.name}</h2>
          </div>
        </div>
      </div>
    </Card>
  );
}
