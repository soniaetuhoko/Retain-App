import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-link active" : "nav-link";
}

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const onAdmin = path.startsWith("/admin");
  const screen = path === "/" ? "dash-screen" : path === "/expenses" ? "spend-screen" : path === "/budget" ? "plan-screen" : onAdmin ? "admin-screen" : "";
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className={screen ? `app-shell ${screen}` : "app-shell"}>
      <header className="topbar">
        {menuOpen && (
          <button type="button" className="menu-backdrop" aria-label="Close menu" onClick={closeMenu} />
        )}
        <div className="topbar-inner">
          <NavLink className="brand" to="/" end onClick={closeMenu}>
            <span className="brand-mark" aria-hidden="true" />
            Retain
          </NavLink>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className={menuOpen ? "menu open" : "menu"}>
            <nav className="nav" onClick={closeMenu}>
              <NavLink className={linkClass} to="/" end>Dashboard</NavLink>
              <NavLink className={linkClass} to="/expenses">Expenses</NavLink>
              <NavLink className={linkClass} to="/budget">Budget</NavLink>
              {user?.role === "admin" && <NavLink className={linkClass} to="/admin" end>Admin</NavLink>}
              {user?.role === "admin" && <NavLink className={linkClass} to="/admin/categories">Categories</NavLink>}
            </nav>
            <div className="user-box">
              {onAdmin ? (
                <button
                  type="button"
                  className="admin-signout"
                  onClick={() => {
                    signOut();
                    closeMenu();
                    navigate("/sign-in");
                  }}
                >
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  className="avatar"
                  aria-label="Sign out"
                  title="Sign out"
                  onClick={() => {
                    signOut();
                    closeMenu();
                    navigate("/sign-in");
                  }}
                >
                  {(user?.name.trim()[0] || "S").toUpperCase()}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
