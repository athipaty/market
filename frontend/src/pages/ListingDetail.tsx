import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, resolveAssetUrl } from "../api/client";
import type { Conversation, Listing } from "../api/types";
import { useAuth } from "../context/AuthContext";

export function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("Hi, is this still available?");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get<{ listing: Listing }>(`/api/listings/${id}`)
      .then((data) => setListing(data.listing))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load listing"));
  }, [id]);

  async function contactSeller() {
    if (!user) {
      navigate("/login", { state: { from: `/listings/${id}` } });
      return;
    }
    if (!listing) return;
    setSending(true);
    setError(null);
    try {
      const data = await api.post<{ conversation: Conversation }>("/api/conversations", {
        listingId: listing.id,
        message,
      });
      navigate(`/inbox?conversation=${data.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (error && !listing) return <div className="container page error-text">{error}</div>;
  if (!listing) return <div className="container page">Loading…</div>;

  const isOwner = user?.id === listing.sellerId;

  return (
    <div className="container page" style={{ maxWidth: 720 }}>
      <div className="image-thumb-row" style={{ marginBottom: 16 }}>
        {listing.images.length === 0 && <p className="muted">No photos</p>}
        {listing.images.map((img) => (
          <img key={img} src={resolveAssetUrl(img)} alt={listing.title} style={{ width: 160, height: 160 }} />
        ))}
      </div>
      <h1>{listing.title}</h1>
      <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>${listing.price.toFixed(2)}</div>
      <p className="muted">
        {listing.category} · {listing.locationName ?? "Nearby"}
        {typeof listing.distanceKm === "number" ? ` · ${listing.distanceKm.toFixed(1)} km away` : ""}
      </p>
      <p>{listing.description}</p>
      <p className="muted">Sold by {listing.seller?.name ?? "seller"}</p>

      {!isOwner && listing.status === "ACTIVE" && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="form-field">
            <label htmlFor="message">Message the seller</label>
            <input id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" onClick={contactSeller} disabled={sending || !message.trim()}>
            {sending ? "Sending…" : "Contact seller"}
          </button>
        </div>
      )}
      {listing.status !== "ACTIVE" && <p className="muted">This listing is no longer available.</p>}
      {isOwner && <p className="muted">This is your listing.</p>}
    </div>
  );
}
