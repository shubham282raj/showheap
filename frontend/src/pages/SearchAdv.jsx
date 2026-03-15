import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import ShowTile from "../components/ShowTile";
import { LoadingContainer } from "../components/Loader";
import { searchTMDBContentByName } from "../apis/tmdbproxy";

export default function SearchAdv() {
  const [searchParams] = useSearchParams();

  const queryParam = searchParams.get("query");

  const [movieCheck, setMovieCheck] = useState(true);
  const [tvCheck, setTVCheck] = useState(true);

  const queryType =
    movieCheck && tvCheck
      ? "multi"
      : movieCheck
        ? "movie"
        : tvCheck
          ? "tv"
          : null;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["advsearch", queryType, queryParam],
    enabled: !!queryParam && !!queryType,
    queryFn: async ({ pageParam: page = 1 }) =>
      searchTMDBContentByName(queryType, queryParam, page),
    getNextPageParam: (lastQuery) => {
      return lastQuery.page != lastQuery.total_pages
        ? lastQuery.page + 1
        : null;
    },
  });

  if (isLoading) return <LoadingContainer />;

  if (isError)
    return (
      <Container>
        <div className="text-center">Error: {error.message}</div>
      </Container>
    );

  return (
    <Container className="my-2">
      {/* checkbox */}
      <div className="d-flex justify-content-center gap-4 my-3">
        <Form.Check
          type="checkbox"
          label="Movies"
          checked={movieCheck}
          onChange={(e) => setMovieCheck(e.target.checked)}
          id="movie_checkbox"
        />
        <Form.Check
          type="checkbox"
          style={{ accentColor: "var(--bs-primary)" }}
          label={"TV Shows"}
          checked={tvCheck}
          onChange={(e) => setTVCheck(e.target.checked)}
          id="tv_checkbox"
        />
      </div>

      {/* instructions */}
      {queryType ? (
        <div className="text-center mb-2" style={{ lineHeight: "1.8rem" }}>
          These results are TMDB query results
          <br /> Select a content to further check availabilty in our database
        </div>
      ) : (
        <div className="text-center">Select either Movie or TV Shows</div>
      )}

      {/* results */}
      {data && data.pages && (
        <Row className="g-2">
          {data.pages.map((page) =>
            page.results.map((content) =>
              content.media_type == "person" ? null : (
                <Col
                  key={content.id}
                  xs={6}
                  sm={6}
                  md={4}
                  lg={3}
                  className="d-flex"
                >
                  <ShowTile
                    content={{
                      name: content.title || content.name,
                      poster_path: content.poster_path,
                      media_type:
                        queryType == "multi" ? content.media_type : queryType,
                      tmdb_id: content.id,
                    }}
                  />
                </Col>
              ),
            ),
          )}
        </Row>
      )}

      <div className="my-3 text-center">
        {data &&
          data.pages &&
          (data.pages[0].results.length ? (
            <>
              <div className="my-2">
                Page {data.pages.length} / {data.pages[0].total_pages}
              </div>
              {hasNextPage ? (
                isFetchingNextPage ? (
                  <Spinner />
                ) : (
                  <Button
                    className="bg-dark-subtle border-0 mx-auto d-block py-2 px-4"
                    style={{ outline: "none" }}
                    onClick={fetchNextPage}
                  >
                    Load More
                  </Button>
                )
              ) : (
                <div>You've reached the end</div>
              )}
            </>
          ) : (
            <div>No Results Found</div>
          ))}
      </div>
    </Container>
  );
}
