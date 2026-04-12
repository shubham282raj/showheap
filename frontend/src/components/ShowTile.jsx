import { Badge, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function ShowTile({ content }) {
  return (
    <Link
      className="text-decoration-none w-100"
      to={`/content/${content.media_type}/${content.imdb_id}`}
    >
      <Card
        className="shadow-sm border-0 bg-white h-100 w-100"
        style={{ "--bs-bg-opacity": "0.03" }}
      >
        <Card.Img
          variant="top"
          src={content.poster?.replace("small", "big")}
          alt={content.title}
          style={{ aspectRatio: 1 / 1.414, objectFit: "cover" }}
        />

        <Card.Body className="d-flex flex-column">
          <Card.Title className="mb-auto">{content.name}</Card.Title>

          <div className="d-flex my-2">
            <Badge
              bg={content.media_type == "series" ? "success" : "danger"}
              className="me-2 text-uppercase"
            >
              {content.media_type}
            </Badge>
          </div>

          {content.updated_at && (
            <small className="text-muted">
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
