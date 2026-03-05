import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export function StreamButton({
  icon,
  text,
  backgroundColor,
  url,
  onClick = () => {},
}) {
  return (
    <Link to={url}>
      <Button
        style={{ backgroundColor }}
        className="border-0 py-2"
        onClick={onClick}
      >
        <div
          className="d-flex align-items-center gap-2"
          style={{ fontSize: "0.9rem", letterSpacing: "1px" }}
        >
          {icon}
          {text}
        </div>
      </Button>
    </Link>
  );
}
