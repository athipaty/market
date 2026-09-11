import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Listing } from "../api/types";
import { ListingCard } from "../components/ListingCard";
import { useAuth } from "../context/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";

const CATEGORIES = ["", "Furniture", "Electronics", "Vehicles", "Clothing", "Free stuff", "Other"];

export function Browse() {
  const { user } = useAuth();
  const geo = useGeolocation();
  const [radiusKm, setRadiusKm] = useState(25);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (geo.lat || geo.lng) return;
    if (user?.lat != null && user?.lng != null) {
      geo.setManual(user.lat, user.lng);
    } else {
      geo.locate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (geo.lat == null || geo.lng == null) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      lat: String(geo.lat),
      lng: String(geo.lng),
      radiusKm: String(radiusKm),
    });
    if (query) params.set("q", query);
    if (category) params.set("category", category);

    api
      .get<{ listings: Listing[] }>(`/api/listings?${params.toString()}`)
      .then((data) => setListings(data.listings))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load listings"))
      .finally(() => setLoading(false));
  }, [geo.lat, geo.lng, radiusKm, query, category]);

  return (
    <div className="container page">
      <h1>What's for sale near you</h1>

      <div className="filters-bar">
        <div className="form-field">
          <label htmlFor="q">Search</label>
          <input id="q" placeholder="e.g. bike, couch…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c || "All categories"}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="radius">Distance: {radiusKm} km</label>
          <input
            id="radius"
            type="range"
            min={1}
            max={200}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          />
        </div>
        <button className="btn btn-secondary" onClick={geo.locate} disabled={geo.loading}>
          {geo.loading ? "Locating…" : "Use my location"}
        </button>
      </div>

      {geo.error && <p className="error-text" style={{ marginTop: 12 }}>{geo.error}</p>}
      {geo.lat == null && !geo.loading && !geo.error && (
        <p className="muted" style={{ marginTop: 12 }}>
          Share your location to see listings near you, or add a home location on your profile.
        </p>
      )}
      {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
      {loading && <p className="muted" style={{ marginTop: 12 }}>Loading listings…</p>}
      {!loading && geo.lat != null && listings.length === 0 && (
        <p className="muted" style={{ marginTop: 12 }}>No listings found in this area yet.</p>
      )}

      <div className="listing-grid">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
