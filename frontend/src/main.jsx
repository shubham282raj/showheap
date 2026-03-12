import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import BackgroundGrid from "./components/BackgroundGrid";
import FadeSuspense from "./suspense/FadeSuspense";

document.documentElement.setAttribute("data-bs-theme", "dark");

// const Main = lazy(() => import("./lazy"));
const Main = lazy(
  () =>
    new Promise((resolve) => {
      setTimeout(() => resolve(import("./lazy")), 1000);
    }),
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BackgroundGrid />
    <FadeSuspense>
      <Main />
    </FadeSuspense>
  </StrictMode>,
);
