import { useMutation } from "@tanstack/react-query";
import { Card, Container } from "react-bootstrap";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { resetPassword } from "../apis/auth";

export default function PasswordReset() {
  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success("Password reset email sent");
    },
    onError: (e) => {
      toast.error(`Error: ${e.message}`);
    },
  });

  return (
    <Container className="d-flex justify-content-center align-items-center">
      <Card style={{ width: "400px" }} className="shadow-sm border-0 py-2">
        <Card.Body>
          <Card.Title className="text-center mb-4">Reset Password</Card.Title>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const email = e.target.email.value;

              if (!resetMutation.isPending) {
                resetMutation.mutate(email);
              }
            }}
          >
            <div className="mb-4">
              <label className="form-label text-muted">Email</label>
              <input
                type="email"
                name="email"
                className="form-control border-0"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              className="w-100 btn bg-primary bg-opacity-25"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending
                ? "Sending reset email..."
                : "Send Reset Link"}
            </button>

            <div className="mt-3 text-center text-muted">
              Remembered your password?{" "}
              <Link
                to="/login"
                className="text-decoration-none text-primary text-opacity-50"
              >
                Login
              </Link>
            </div>
          </form>
        </Card.Body>
      </Card>
    </Container>
  );
}
