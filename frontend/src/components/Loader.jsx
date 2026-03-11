import { Container, Spinner } from "react-bootstrap";

export function LoadingContainer() {
  return (
    <Container>
      <div className="d-flex justify-content-center py-4 my-4 bg-transparent rounded-2">
        <Spinner animation="border" className="text-primary"></Spinner>
      </div>
    </Container>
  );
}
