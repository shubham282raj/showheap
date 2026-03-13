import { useEffect, useState } from "react";
import { Card, Button } from "react-bootstrap";

export default function InstallPWA() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem("pwa-dismissed");

    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!prompt) return;

    prompt.prompt();
    await prompt.userChoice;

    setVisible(false);
    setPrompt(null);
  };

  const later = () => {
    const oneDay = 24 * 60 * 60 * 1000;
    localStorage.setItem("pwa-dismissed", Date.now() + oneDay);

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="position-fixed top-0 start-0 d-flex justify-content-center align-items-end"
      style={{
        zIndex: 9990,
        height: "100dvh",
        width: "100dvw",
        backdropFilter: "blur(10px)",
      }}
    >
      <Card
        className="shadow-sm border-0 p-2 mb-5 mx-3"
        style={{ backgroundColor: "#080A0F", maxWidth: "500px" }}
      >
        <Card.Body className="d-flex flex-column gap-3 justify-content-between align-items-center">
          <div className="text-muted">
            Install <strong>ShowHeap</strong> for quicker access
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="primary"
              className="bg-primary bg-opacity-25 border-0"
              onClick={install}
            >
              Install
            </Button>

            <Button variant="dark" className="text-muted" onClick={later}>
              Later
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
