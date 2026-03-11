import { useInfiniteQuery } from "@tanstack/react-query";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { LoadingContainer } from "../components/Loader";
import ShowTile from "../components/ShowTile";
import DBCount from "../components/DBCount";
import { fetchContent } from "../apis/firebase";

export default function Home() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["fetchmovies"],
    queryFn: async ({ pageParam }) => fetchContent(pageParam),
    getNextPageParam: (lastPage) => lastPage.lastVisible ?? undefined,
  });

  if (isLoading) return <LoadingContainer />;

  if (isError)
    return (
      <Container>
        <div className="text-center">{error.message}</div>
      </Container>
    );

  return (
    <Container className="my-1">
      <Row className="g-2">
        {data.pages.map((page) =>
          page.docs.map((doc) => {
            const content = doc.data();

            return (
              <Col key={doc.id} xs={6} sm={6} md={4} lg={3} className="d-flex">
                <ShowTile content={content} />
              </Col>
            );
          }),
        )}
      </Row>

      <DBCount />

      {hasNextPage ? (
        <div className="text-center my-3">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="bg-dark-subtle border-0 py-2 px-4"
          >
            {isFetchingNextPage ? (
              <>
                <Spinner animation="border" className="me-2" />
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      ) : (
        <Container className="mt-3 text-center">
          <hr />
          You've reached the end
        </Container>
      )}
    </Container>
  );
}
