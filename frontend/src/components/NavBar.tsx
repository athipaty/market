import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          🛒 Nearby Market
        </Link>
        <div className="nav-links">
          <Link to="/">Browse</Link>
          {user && <Link to="/listings/new">Sell something</Link>}
          {user && <Link to="/my-listings">My listings</Link>}
          {user && <Link to="/inbox">Messages</Link>}
          {user ? (
            <>
              <span className="muted">Hi, {user.name}</span>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
