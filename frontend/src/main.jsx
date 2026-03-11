import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MainSuspense from "./pages/MainSuspense";
import BackgroundGrid from "./components/BackgroundGrid";
import FadeSuspense from "./components/FadeSuspense";

document.documentElement.setAttribute("data-bs-theme", "dark");

const Main = lazy(() => import("./lazy"));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BackgroundGrid />
    <FadeSuspense fallback={<MainSuspense />}>
      <Main />
    </FadeSuspense>
  </StrictMode>,
);
