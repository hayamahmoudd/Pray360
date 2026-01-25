export type Place = {
  id: number;
  name: string;
  type: "restaurant" | "mall" | "campus" | "masjid" | "other";
  address: string | null;
  isVerified: boolean;
  lat: number;
  lng: number;
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
  data: { userId: number; rating: number; comment?: string; photo?: File }
) {
  const formData = new FormData();
  formData.append("userId", String(data.userId));
  formData.append("rating", String(data.rating));
  if (data.comment) formData.append("comment", data.comment);
  if (data.photo) formData.append("photo", data.photo);

  const res = await fetch(`${API_BASE}/places/${placeId}/reviews`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to add review");
  return res.json() as Promise<{ id: number }>;
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