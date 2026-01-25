export type Place = {
  id: number;
  name: string;
  address: string | null;
  isVerified: boolean;
  ownerId: number | null;
  lat: number;
  lng: number;
  capacity: number | null;
  requiresRegistration: boolean;
  avgRating: number;
  reviewCount: number;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export async function fetchNearbyPlaces(lat: number, lng: number, radiusMeters = 7000) {
  const url = new URL(`${API_BASE}/places/near`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("radiusMeters", String(radiusMeters));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load places");
  return (await res.json()) as Place[];
}

export type Review = {
  id: number;
  userId: number;
  userName: string;
  userVerified: boolean;
  rating: number;
  comment: string;
  photoUrl: string | null;
  createdAt: string;
};

export async function fetchReviews(placeId: number) {
  const res = await fetch(`${API_BASE}/places/${placeId}/reviews`);
  if (!res.ok) throw new Error("Failed to load reviews");
  return (await res.json()) as Review[];
}

export async function addReview(
  placeId: number, 
  data: { userId: number; rating: number; comment?: string }
) {
  const res = await fetch(`${API_BASE}/places/${placeId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add review");
  return res.json() as Promise<{ id: number }>;
}

export async function uploadReviewPhoto(reviewId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/reviews/${reviewId}/photo`, {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) throw new Error("Failed to upload photo");
  return res.json() as Promise<{ photoUrl: string }>;
}

export type Promo = {
  id: number;
  title: string;
  description: string;
  discountText: string;
};

export async function fetchPromos(placeId: number) {
  const res = await fetch(`${API_BASE}/places/${placeId}/promos`);
  if (!res.ok) throw new Error("Failed to load promos");
  return (await res.json()) as Promo[];
}

export async function createPlace(data: {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  ownerId?: number;
  capacity?: number;
  requiresRegistration?: boolean;
}) {
  console.log("API call - createPlace:", data);
  const res = await fetch(`${API_BASE}/places`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", errorText);
    throw new Error(`Failed to create place: ${errorText}`);
  }
  
  return res.json() as Promise<{ id: number }>;
}

export type User = {
  id: number;
  name: string;
  email: string;
  isVerified: boolean;
  isBusinessOwner?: boolean;
  gender?: string;
  reviewCount?: number;
  avgRating?: number;
};

export async function createOrGetUser(data: { 
  name: string; 
  email: string;
  isBusinessOwner?: boolean;
  gender?: 'brother' | 'sister';
}) {
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create/get user");
  return res.json() as Promise<User>;
}

export async function getUser(userId: number) {
  const res = await fetch(`${API_BASE}/users/${userId}`);
  if (!res.ok) throw new Error("Failed to get user");
  return res.json() as Promise<User>;
}