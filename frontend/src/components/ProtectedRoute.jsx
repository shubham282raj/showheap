import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.emailVerified) {
    return <Navigate to="/verification" replace />;
  }

  return <Outlet />;
}
