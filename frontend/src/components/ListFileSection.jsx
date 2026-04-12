import { ListGroup, Container, Card } from "react-bootstrap";
import { ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMetadata, METADATA_COLLECTION_NAME } from "../apis/firebase";
import { LoadingContainer } from "./Loader";
import { formatBytes } from "../utils/format";

export function MovieFiles({ files }) {
  const { media_type, imdb_id } = useParams();

  return (
    <ListGroup variant="flush">
      {files
        .sort((a, b) => b.file_size - a.file_size)
        .map((file) => (
          <ListGroup.Item
            key={file.file_id}
            className="d-flex justify-content-between align-items-center p-0 border-0 bg-transparent"
          >
            <Link
              to={`/watch/${media_type}/${imdb_id}/${file.id}`}
              className="text-decoration-none w-100 py-2 px-3 d-flex align-items-center link-warning"
              title={file.file_name}
            >
              <div
                className="flex-grow-1 me-2 ms-3 d-flex justify-content-between"
                style={{
                  fontSize: "0.9rem",
                  color: "var(--bs-list-group-color)",
                  minWidth: 0,
                }}
              >
                <span className="text-truncate">{file.file_name}</span>
                <span className="ps-2" style={{ whiteSpace: "nowrap" }}>
                  {formatBytes(file.file_size)}
                </span>
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

export function SeriesFiles({ files }) {
  const { media_type, imdb_id } = useParams();

  return (
    <>
      {Object.keys(files)
        .sort((a, b) => {
          const ea = Number(a.replace("Episode ", ""));
          const eb = Number(b.replace("Episode ", ""));
          return ea - eb;
        })
        .map((episode) => (
          <div key={episode}>
            <div
              className="px-3 py-1 text-secondary"
              style={{ fontSize: "0.85rem" }}
            >
              {episode}
            </div>

            <ListGroup variant="flush">
              {files[episode]
                .sort((a, b) => b.file_size - a.file_size)
                .map((file) => (
                  <ListGroup.Item
                    key={file.id}
                    className="d-flex justify-content-between align-items-center p-0 border-0 bg-transparent"
                  >
                    <Link
                      to={`/watch/${media_type}/${imdb_id}/${file.id}`}
                      className="text-decoration-none w-100 py-2 px-3 d-flex align-items-center link-warning"
                      title={file.file_name}
                    >
                      <div
                        className="flex-grow-1 me-2 ms-3 d-flex justify-content-between"
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--bs-list-group-color)",
                          minWidth: 0,
                        }}
                      >
                        <span className="text-truncate">{file.file_name}</span>
                        <span className="ps-2" style={{ whiteSpace: "nowrap" }}>
                          {formatBytes(file.file_size)}
                        </span>
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
          </div>
        ))}
    </>
  );
}

export default function ListFileSection() {
  const { media_type, imdb_id } = useParams();

  const {
    data: content,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [METADATA_COLLECTION_NAME, media_type, imdb_id],
    enabled: !!media_type && !!imdb_id,
    queryFn: () => getMetadata(imdb_id),
  });

  if (isLoading) return <LoadingContainer />;

  if (isError)
    return (
      <Container>
        <div className="text-center">{error.message}</div>
      </Container>
    );

  return (
    <Container className="my-4">
      {Object.keys(content)
        .sort()
        .map((key) => {
          const value = content[key];
          const isMovie = Array.isArray(value);

          return (
            <Card
              key={key}
              className="mb-3 shadow shadow-lg border-0 bg-white"
              style={{ "--bs-bg-opacity": "0.03" }}
            >
              <Card.Header className="border-0 text-primary">
                <strong>{key}</strong>
              </Card.Header>

              {isMovie ? (
                <MovieFiles files={value} />
              ) : (
                <SeriesFiles files={value} />
              )}
            </Card>
          );
        })}
    </Container>
  );
}
