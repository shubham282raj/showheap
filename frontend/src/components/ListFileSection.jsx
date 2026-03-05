import { Container, Card, ListGroup } from "react-bootstrap";
import { ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export function ListFiles({ files }) {
  const { media_type, tmdb_id } = useParams();

  return (
    <ListGroup variant="flush">
      {Object.entries(files).map(([fileId, fileName]) => (
        <ListGroup.Item
          key={fileId}
          className="d-flex justify-content-between align-items-center p-0 border-0"
        >
          <Link
            key={fileId}
            to={`/watch/${media_type}/${tmdb_id}/${fileId}`}
            className="text-decoration-none w-100 py-2 px-3 d-flex align-items-center link-warning"
            title={fileName}
          >
            <div
              className="flex-grow-1 text-truncate me-2"
              style={{
                fontSize: "0.9rem",
                color: "var(--bs-list-group-color)",
                minWidth: 0,
              }}
            >
              {fileName}
            </div>

            <ChevronRight strokeWidth={3} className="flex-shrink-0" />
          </Link>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}

export default function ListFileSection({ fileGroup }) {
  return (
    <Container className="my-4">
      {Object.entries(fileGroup).map(([header, files]) => (
        <Card key={header} className="mb-3 shadow shadow-lg border-0">
          <Card.Header className="bg-dark-subtle border-0 text-primary">
            <strong>{header}</strong>
          </Card.Header>

          <ListFiles files={files} />
        </Card>
      ))}
    </Container>
  );
}
