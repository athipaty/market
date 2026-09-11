import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [locationName, setLocationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        lat: geo.lat ?? undefined,
        lng: geo.lng ?? undefined,
        locationName: locationName || undefined,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container page" style={{ maxWidth: 480 }}>
      <h1>Create your account</h1>
      <form onSubmit={onSubmit} className="card">
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Your area</label>
          <button type="button" className="btn btn-secondary" onClick={geo.locate} disabled={geo.loading}>
            {geo.loading ? "Locating…" : geo.lat ? "Location captured ✓" : "Use my current location"}
          </button>
          {geo.error && <p className="error-text">{geo.error}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="locationName">Neighborhood / city (optional label)</label>
          <input
            id="locationName"
            placeholder="e.g. Downtown Austin"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
