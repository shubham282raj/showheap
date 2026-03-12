import { Link, useLocation } from "react-router-dom";
import { Clapperboard, LogIn, LogOut, Search } from "lucide-react";
import { Button, Container, Row } from "react-bootstrap";
import SearchBar from "./SearchBar";
import LogoText from "./LogoText";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();

  const isSearchRoute =
    location.pathname == "/search" || location.pathname == "/tmdbSearch";

  return (
    <Container
      className="sticky-top py-3 rounded-bottom-3 mb-1"
      style={{ backgroundColor: "#080a0f" }}
    >
      <Row>
        <Container className="d-flex justify-content-between align-items-center">
          <Link className="text-decoration-none">
            <div className="d-flex align-items-center gap-2 user-select-none">
              <Clapperboard className="text-primary" size={28} />

              <LogoText fontSize={"28px"} />
            </div>
          </Link>

          <div className="d-flex gap-2">
            {user ? (
              <>
                <Link
                  to="/search"
                  className="d-flex gap-2 align-items-center text-decoration-none"
                  title="Search"
                >
                  <Button
                    style={{
                      visibility: isSearchRoute ? "hidden" : "visible",
                    }}
                    className="border-0"
                    variant="dark"
                  >
                    <Search strokeWidth={3} className="text-primary" />
                  </Button>
                </Link>
                <Link
                  to="/logout"
                  className="d-flex gap-2 align-items-center text-decoration-none"
                  title="Log Out"
                >
                  <Button
                    style={{
                      visibility: isSearchRoute ? "hidden" : "visible",
                    }}
                    className="border-0"
                    variant="dark"
                  >
                    <LogOut strokeWidth={3} className="text-primary" />
                  </Button>
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="d-flex gap-2 align-items-center text-decoration-none"
                title="Log In"
              >
                <Button
                  style={{
                    visibility: isSearchRoute ? "hidden" : "visible",
                  }}
                  className="border-0"
                  variant="dark"
                >
                  <LogIn strokeWidth={3} className="text-primary" />
                </Button>
              </Link>
            )}
          </div>
        </Container>

        <SearchBar visible={isSearchRoute} />
      </Row>
    </Container>
  );
}
