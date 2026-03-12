import { useMutation } from "@tanstack/react-query";
import { Card, Container } from "react-bootstrap";
import { register } from "../apis/auth";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export default function Register() {
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Account created successfully");
    },
    onError: (e) => {
      toast.error(`Error: ${e.message}`);
    },
  });

  return (
    <Container className="d-flex justify-content-center align-items-center">
      <Card style={{ width: "400px" }} className="shadow-sm border-0 py-2">
        <Card.Body>
          <Card.Title className="text-center mb-4">Register</Card.Title>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              const name = e.target.name.value;
              const email = e.target.email.value;
              const password = e.target.password.value;
              const confirmPassword = e.target.confirmPassword.value;

              if (password !== confirmPassword) {
                toast.error("Passwords do not match");
                return;
              }

              if (!registerMutation.isPending) {
                registerMutation.mutate({ name, email, password });
              }
            }}
          >
            <div className="mb-3">
              <label className="form-label text-muted">Name</label>
              <input
                type="text"
                name="name"
                className="form-control border-0"
                placeholder="Enter name"
                required
              />
            </div>

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

            <div className="mb-3">
              <label className="form-label text-muted">Password</label>
              <input
                type="password"
                name="password"
                className="form-control border-0"
                placeholder="Enter password"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-muted">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control border-0"
                placeholder="Confirm password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-100 btn bg-primary bg-opacity-25"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating account..." : "Register"}
            </button>

            <div className="mt-3 text-center text-muted">
              Existing User?{" "}
              <Link
                to={"/login"}
                className="text-decoration-none text-primary text-opacity-50"
              >
                Sign In
              </Link>
            </div>
          </form>
        </Card.Body>
      </Card>
    </Container>
  );
}
