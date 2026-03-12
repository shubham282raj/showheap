import { useQuery } from "@tanstack/react-query";
import { Container, Nav } from "react-bootstrap";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isSuperUser } from "../../apis/firebase";
import { LoadingContainer } from "../../components/Loader";

export default function Admin() {
  const { user } = useAuth();
  const {
    data: superuserCheck = false,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["superusercheck", user.uid],
    enabled: !!user,
    queryFn: isSuperUser,
  });

  if (isLoading) return <LoadingContainer />;

  if (isError)
    return (
      <Container>
        <div className="text-center">Error: {error.message}</div>
      </Container>
    );

  if (superuserCheck)
    return (
      <Container className="mt-4">
        <h2 className="mb-4">Admin Panel</h2>

        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link
              as={NavLink}
              to="allowedusers"
              className="text-white text-opacity-75"
              end
            >
              Allowed Users
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={NavLink}
              to="waitlist"
              className="text-white text-opacity-75"
            >
              Access Requests
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Outlet />
      </Container>
    );

  return <Navigate to={"/"} replace />;
}
