import { Link, useLocation } from "react-router-dom";
import { Clapperboard, Search } from "lucide-react";
import { Button, Container, Row } from "react-bootstrap";
import SearchBar from "./SearchBar";
import LogoText from "./LogoText";

export default function Header() {
  const location = useLocation();

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
              {/* <h4 className="m-0 text-primary" style={{ letterSpacing: "2px" }}>
                ShowHeap
              </h4> */}
            </div>
          </Link>

          <Link
            to="/search"
            className="d-flex gap-2 align-items-center text-decoration-none"
          >
            <Button
              style={{
                visibility: isSearchRoute ? "hidden" : "visible",
              }}
              className="border-0"
              variant="dark"
            >
              {/* <div>Search</div> */}
              <Search strokeWidth={3} className="text-primary" />
            </Button>
          </Link>
        </Container>

        <SearchBar visible={isSearchRoute} />
      </Row>
    </Container>
  );
}
