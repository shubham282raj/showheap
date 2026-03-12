import { Container, Alert, Button, Card } from "react-bootstrap";
import { useMutation } from "@tanstack/react-query";
import { auth } from "../firebase";
import { requestAccessWaitlist } from "../apis/firebase";
import toast from "react-hot-toast";

export default function PermissionDenied() {
  const mutation = useMutation({
    mutationFn: () =>
      requestAccessWaitlist(auth.currentUser.uid, auth.currentUser.email),
    onSuccess: (res) =>
      res.already
        ? toast("You are already in the waitlist")
        : toast.success("You were successfully added in the waitlist"),
    onError: (e) => toast.error(e.message),
  });

  const already = mutation.data?.already;

  return (
    <Container className="position-absolute top-0 start-0 d-flex justify-content-center align-items-center vh-100">
      <Card className="text-center">
        <Card.Body>
          <Card.Title>Permission Denied</Card.Title>
          <div className="my-3">
            You do not have permission to view this item
          </div>
          {!mutation.isSuccess ? (
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="bg-white bg-opacity-10 fw-bold text-white text-opacity-75"
              style={{ letterSpacing: "1px" }}
            >
              {mutation.isPending ? "Requesting..." : "Request Access"}
            </Button>
          ) : already ? (
            <p className="text-warning">You are already in the waitlist</p>
          ) : (
            <p className="text-success">
              You were successfully added in the waitlist
            </p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
