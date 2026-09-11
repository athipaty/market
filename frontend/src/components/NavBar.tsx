import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={closeMenu}>
          🛒 Nearby Market
        </Link>
        <button
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "✕" : "☰"}
        </button>
        <div className={`nav-links ${open ? "open" : ""}`}>
          <Link to="/" onClick={closeMenu}>
            Browse
          </Link>
          {user && (
            <Link to="/listings/new" onClick={closeMenu}>
              Sell something
            </Link>
          )}
          {user && (
            <Link to="/my-listings" onClick={closeMenu}>
              My listings
            </Link>
          )}
          {user && (
            <Link to="/inbox" onClick={closeMenu}>
              Messages
            </Link>
          )}
          {user ? (
            <>
              <span className="muted">Hi, {user.name}</span>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  logout();
                  closeMenu();
                  navigate("/");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>
                Log in
              </Link>
              <Link to="/register" className="btn" onClick={closeMenu}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
