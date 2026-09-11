import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Listing } from "../api/types";
import { ListingCard } from "../components/ListingCard";

export function MyListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ listings: Listing[] }>("/api/listings/mine")
      .then((data) => setListings(data.listings))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load your listings"))
      .finally(() => setLoading(false));
  }, []);

  async function markSold(id: string) {
    await api.patch(`/api/listings/${id}`, { status: "SOLD" });
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: "SOLD" } : l)));
  }

  async function remove(id: string) {
    if (!confirm("Remove this listing?")) return;
    await api.delete(`/api/listings/${id}`);
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="container page">
      <h1>My listings</h1>
      <Link to="/listings/new" className="btn">
        + New listing
      </Link>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error-text">{error}</p>}
      <div className="listing-grid">
        {listings.map((listing) => (
          <div key={listing.id} className="card listing-card">
            <ListingCard listing={listing} />
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {listing.status === "ACTIVE" && (
                <button className="btn btn-secondary" onClick={() => markSold(listing.id)}>
                  Mark sold
                </button>
              )}
              <button className="btn btn-danger" onClick={() => remove(listing.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {!loading && listings.length === 0 && <p className="muted">You haven't listed anything yet.</p>}
    </div>
  );
}
