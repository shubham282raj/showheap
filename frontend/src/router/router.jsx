import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import Content from "../pages/Content";
import Search from "../pages/Search";
import Watch from "../pages/Watch";
import SearchAdv from "../pages/SearchAdv";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "content/:media_type/:tmdb_id",
        element: <Content />,
      },
      {
        path: "content/:media_type/:tmdb_id/:file_id",
        element: <Content />,
      },
      {
        path: "watch/:media_type/:tmdb_id/:file_id",
        element: <Watch />,
      },
      {
        path: "search",
        element: <Search />,
      },
      {
        path: "tmdbSearch",
        element: <SearchAdv />,
      },
    ],
  },
]);
