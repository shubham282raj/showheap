import { Outlet, Link, useLocation } from "react-router-dom";
import Header from "./components/Header";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Header />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            backgroundColor: "var(--bs-dark-bg-subtle)",
            color: "whitesmoke",
          },
        }}
      />

      <Outlet />
    </>
  );
}

export default App;
