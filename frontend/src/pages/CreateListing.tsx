import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, resolveAssetUrl } from "../api/client";
import type { Listing } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";

const CATEGORIES = ["Furniture", "Electronics", "Vehicles", "Clothing", "Free stuff", "Other"];

export function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [locationName, setLocationName] = useState(user?.locationName ?? "");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lat = geo.lat ?? user?.lat ?? null;
  const lng = geo.lng ?? user?.lng ?? null;

  async function onFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));
      const data = await api.upload<{ urls: string[] }>("/api/uploads", formData);
      setImages((prev) => [...prev, ...data.urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (lat == null || lng == null) {
      setError("We need your location to list an item nearby. Use the location button below.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.post<{ listing: Listing }>("/api/listings", {
        title,
        description,
        price: Number(price),
        category,
        images,
        lat,
        lng,
        locationName: locationName || undefined,
      });
      navigate(`/listings/${data.listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container page" style={{ maxWidth: 560 }}>
      <h1>Sell something</h1>
      <form onSubmit={onSubmit} className="card">
        <div className="form-field">
          <label htmlFor="title">Title</label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="price">Price (USD)</label>
          <input
            id="price"
            type="number"
            min={0}
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="photos">Photos</label>
          <input id="photos" type="file" accept="image/*" multiple onChange={onFilesSelected} disabled={uploading} />
          {uploading && <p className="muted">Uploading…</p>}
          <div className="image-thumb-row">
            {images.map((img) => (
              <img key={img} src={resolveAssetUrl(img)} alt="" />
            ))}
          </div>
        </div>
        <div className="form-field">
          <label>Location</label>
          <button type="button" className="btn btn-secondary" onClick={geo.locate} disabled={geo.loading}>
            {geo.loading ? "Locating…" : lat != null ? "Location set ✓" : "Use my current location"}
          </button>
          {geo.error && <p className="error-text">{geo.error}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="locationName">Neighborhood / city label (optional)</label>
          <input
            id="locationName"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Downtown Austin"
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" type="submit" disabled={submitting || uploading}>
          {submitting ? "Publishing…" : "Publish listing"}
        </button>
      </form>
    </div>
  );
}
