import { Link } from "react-router-dom";
import { resolveAssetUrl } from "../api/client";
import type { Listing } from "../api/types";

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.images[0];
  return (
    <Link to={`/listings/${listing.id}`} className="card listing-card">
      {image ? (
        <img src={resolveAssetUrl(image)} alt={listing.title} />
      ) : (
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'/%3E" alt="" />
      )}
      <h3>{listing.title}</h3>
      <div>${listing.price.toFixed(2)}</div>
      <div className="muted">
        {listing.locationName ?? "Nearby"}
        {typeof listing.distanceKm === "number" ? ` · ${listing.distanceKm.toFixed(1)} km away` : ""}
      </div>
    </Link>
  );
}
