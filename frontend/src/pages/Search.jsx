import { useQuery } from "@tanstack/react-query";
import { Col, Container, Row } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import ShowTile from "../components/ShowTile";
import { LoadingContainer } from "../components/Loader";
import { Check, X } from "lucide-react";
import { searchContentByName } from "../apis/firebase";

export default function Search() {
  const [searchParams] = useSearchParams();

  const queryParam = searchParams.get("query");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["search", queryParam],
    enabled: !!queryParam,
    queryFn: async () => searchContentByName(queryParam.toLowerCase()),
  });

  if (!queryParam)
    return (
      <Container>
        <div className="text-center" style={{ lineHeight: "1.5rem" }}>
          This uses prefix based search <br /> <br />
          For example
          <br />
          Query = "Break" <br />
          "Breaking Bad" <Check size={20} /> <br />
          "Prison Break" <X size={20} /> <br /> <br />
          Try <Link to={"/tmdbSearch"}>TMDB Search</Link> for better results
        </div>
      </Container>
    );

  if (isLoading) return <LoadingContainer />;

  if (isError)
    return (
      <Container>
        <div className="text-center">Error: {error.message}</div>
      </Container>
    );

  return (
    <Container className="my-2">
      {data &&
        (data.length ? (
          <>
            <Row className="px-1">
              {data.map((content) => (
                <Col
                  key={content.id}
                  xs={6}
                  sm={6}
                  md={4}
                  lg={3}
                  className="px-0"
                >
                  <ShowTile content={content} />
                </Col>
              ))}
            </Row>
          </>
        ) : (
          <div className="text-center" style={{ lineHeight: "2rem" }}>
            Nothing Found with this prefix! <br />
            Try <Link to={"/tmdbSearch"}>TMDB Search</Link> for better results
          </div>
        ))}
    </Container>
  );
}
