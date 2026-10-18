import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="status">Loading…</p>;
  if (!user) return <Navigate to="/sign-in" replace />;
  return <Outlet />;
}