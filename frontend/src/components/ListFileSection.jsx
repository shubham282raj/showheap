import { Container, Card, ListGroup } from "react-bootstrap";
import { ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export function ListFiles({ files }) {
  const { media_type, tmdb_id } = useParams();

  const sortedFiles = Object.entries(files).sort((a, b) =>
    a[1].localeCompare(b[1], undefined, { sensitivity: "base" }),
  );

  return (
    <ListGroup variant="flush">
      {sortedFiles.map(([fileId, fileName]) => (
        <ListGroup.Item
          key={fileId}
          className="d-flex justify-content-between align-items-center p-0 border-0 bg-transparent"
        >
          <Link
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

            <ChevronRight
              strokeWidth={3}
              className="flex-shrink-0"
              color="var(--bs-primary)"
            />
          </Link>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}

export default function ListFileSection({ fileGroup }) {
  // Normalize keys to uppercase
  const normalized = {};

  Object.entries(fileGroup).forEach(([header, files]) => {
    const key = header.toUpperCase();

    if (!normalized[key]) normalized[key] = {};
    Object.assign(normalized[key], files);
  });

  const sortedGroups = Object.entries(normalized).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <Container className="my-4">
      {sortedGroups.map(([header, files]) => (
        <Card
          key={header}
          className="mb-3 shadow shadow-lg border-0 bg-white"
          style={{ "--bs-bg-opacity": "0.03" }}
        >
          <Card.Header className="border-0 text-primary">
            <strong>{header}</strong>
          </Card.Header>

          <ListFiles files={files} />
        </Card>
      ))}
    </Container>
  );
}
