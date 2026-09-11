export interface User {
  id: string;
  email: string;
  name: string;
  lat: number | null;
  lng: number | null;
  locationName: string | null;
  createdAt: string;
}

export type ListingStatus = "ACTIVE" | "SOLD" | "REMOVED";

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  lat: number;
  lng: number;
  locationName: string | null;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  seller?: { id: string; name: string };
  distanceKm?: number;
}

export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  listing: { id: string; title: string; images: string[]; price: number };
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}
