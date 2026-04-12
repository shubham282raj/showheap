import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import Content from "../pages/Content";
import Search from "../pages/Search";
import Watch from "../pages/Watch";
import SearchAdv from "../pages/SearchAdv";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import Register from "../pages/Register";
import PasswordReset from "../pages/PasswordReset";
import Verification from "../pages/Verification";
import Logout from "../pages/Logout";
import Admin from "../pages/Admin/Admin";
import AllowedUsers from "../pages/Admin/AllowedUsers";
import Waitlist from "../pages/Admin/Waitlist";
import WatchStream from "../pages/WatchStream";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "logout",
        element: <Logout />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "passwordreset",
        element: <PasswordReset />,
      },
      {
        path: "verification",
        element: <Verification />,
      },
      {
        path: "warchstream/:safeSrc",
        element: <WatchStream />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: "content/:media_type/:imdb_id",
            element: <Content />,
          },
          {
            path: "watch/:media_type/:imdb_id/:file_id",
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
          {
            path: "admin",
            element: <Admin />,
            children: [
              {
                index: true,
                element: <AllowedUsers />,
              },
              {
                path: "allowedusers",
                element: <AllowedUsers />,
              },
              {
                path: "waitlist",
                element: <Waitlist />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
