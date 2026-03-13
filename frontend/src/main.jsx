import "./registerSW";
import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BackgroundGrid from "./components/BackgroundGrid";
import FadeSuspense from "./suspense/FadeSuspense";
import InstallPWA from "./components/InstallPWA";

document.documentElement.setAttribute("data-bs-theme", "dark");

const Main = lazy(() => import("./lazy"));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BackgroundGrid />
    <FadeSuspense>
      <Main />
    </FadeSuspense>
    <InstallPWA />
  </StrictMode>,
);
