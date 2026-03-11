import { Badge, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getTmdbImageUrl } from "../utils/link";

export default function ShowTile({ content }) {
  const isTVShow = content.media_type == "tv";
  const fileCount = content.files
    ? isTVShow
      ? Object.values(content.files).reduce(
          (total, files) => total + Object.keys(files).length,
          0,
        )
      : Object.keys(content.files).length
    : 0;

  return (
    <Link
      className="text-decoration-none"
      to={`/content/${content.media_type}/${content.tmdb_id}`}
    >
      <Card
        className="shadow-sm border-0 bg-white h-100 w-100"
        style={{ "--bs-bg-opacity": "0.03" }}
      >
        <Card.Img
          variant="top"
          src={getTmdbImageUrl(content.poster_path)}
          alt={content.name}
          style={{ aspectRatio: 1 / 1.414, objectFit: "cover" }}
        />

        <Card.Body className="d-flex flex-column">
          <Card.Title className="mb-auto">{content.name}</Card.Title>

          <div className="d-flex my-2">
            <Badge
              bg={content.media_type == "tv" ? "success" : "danger"}
              className="me-2 text-uppercase"
            >
              {content.media_type}
            </Badge>

            {!!fileCount && (
              <Badge bg="secondary">
                {fileCount} file{fileCount > 1 && "s"}
              </Badge>
            )}
          </div>

          {content.updated_at && (
            <small className="text-muted">
              Updated:{" "}
              {content.updated_at?.toDate
                ? content.updated_at.toDate().toLocaleString()
                : ""}
            </small>
          )}
        </Card.Body>
      </Card>
    </Link>
  );
}
