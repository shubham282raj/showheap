import { useMutation } from "@tanstack/react-query";
import { Card, Container, Spinner } from "react-bootstrap";
import { signIn } from "../apis/auth";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function Login() {
  const logInMutation = useMutation({
    mutationFn: signIn,
    onSuccess: () => {
      toast.success("Sign In Successful");
    },
    onError: (e) => {
      toast.error(`Error: ${e.message}`);
    },
  });
  return (
    <Container className="d-flex justify-content-center align-items-center">
      <Card style={{ width: "400px" }} className="shadow-sm border-0 py-2">
        <Card.Body>
          <Card.Title className="text-center mb-4">Login</Card.Title>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const email = e.target.email.value;
              const password = e.target.password.value;
              if (!logInMutation.isPending) {
                logInMutation.mutate(email, password);
              }
            }}
            style={{}}
          >
            <div className="mb-3">
              <label className="form-label text-muted">Email</label>
              <input
                type="email"
                name="email"
                className="form-control border-0"
                placeholder="Enter email"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-muted">Password</label>
              <input
                type="password"
                name="password"
                className="form-control border-0"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-100 btn bg-primary bg-opacity-25"
              disabled={logInMutation.isPending}
            >
              {logInMutation.isPending ? "Signing you in..." : "Sign In"}
            </button>

            <div className="mt-3 text-center text-muted">
              <Link
                to={"/passwordreset"}
                className="text-decoration-none text-primary text-opacity-50"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="mt-3 text-center text-muted">
              New here?{" "}
              <Link
                to={"/register"}
                className="text-decoration-none text-primary text-opacity-50"
              >
                Register
              </Link>
            </div>
          </form>
        </Card.Body>
      </Card>
    </Container>
  );
}
