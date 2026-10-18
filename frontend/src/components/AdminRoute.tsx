import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="status">Loading…</p>;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}