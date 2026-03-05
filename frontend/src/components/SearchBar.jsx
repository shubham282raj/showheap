import { ChevronLeft, Search } from "lucide-react";
import { Button, Collapse } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SearchBar({ visible }) {
  const navigate = useNavigate();
  const textboxref = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const queryFromUrl = searchParams.get("query") || "";
  const [searchBox, setSearchBox] = useState(queryFromUrl);

  useEffect(() => {
    setSearchBox(queryFromUrl);
  }, [queryFromUrl]);

  return (
    <Collapse in={visible} onEntered={() => textboxref.current?.focus()}>
      <div>
        <form
          className="d-flex gap-2 mt-2"
          onSubmit={(e) => {
            e.preventDefault();

            if (!searchBox.trim()) return;

            setSearchParams({ query: searchBox.trim() });
          }}
        >
          <Button
            title="Back"
            type="button"
            variant="dark"
            onClick={() =>
              window.history.length > 1 ? navigate(-1) : navigate("/")
            }
          >
            <ChevronLeft className="text-primary" strokeWidth={3} />
          </Button>

          <input
            type="text"
            ref={textboxref}
            value={searchBox}
            onChange={(e) => setSearchBox(e.target.value)}
            placeholder="Search Movie/Show Name"
            className="flex-grow-1 border-0 px-3 rounded-2 bg-dark text-muted"
            style={{ outline: "none" }}
          />

          <Button type="submit" className="px-3" variant="dark">
            <Search className="text-primary" strokeWidth={3} />
          </Button>
        </form>
      </div>
    </Collapse>
  );
}
