import { useInfiniteQuery } from "@tanstack/react-query";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { LoadingContainer } from "../components/Loader";
import ShowTile from "../components/ShowTile";
import { fetchContent } from "../apis/firebase";

export default function Home() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["fetchmovies"],
      queryFn: async ({ pageParam }) => fetchContent(pageParam),
      getNextPageParam: (lastPage) => lastPage.lastVisible ?? undefined,
    });

  if (isLoading) return <LoadingContainer />;

  return (
    <Container className="my-2">
      <Row className="px-1">
        {data.pages.map((page) =>
          page.docs.map((doc) => {
            const content = doc.data();

            return (
              <Col key={doc.id} xs={6} sm={6} md={4} lg={3} className="px-0">
                <ShowTile content={content} />
              </Col>
            );
          }),
        )}
      </Row>

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
