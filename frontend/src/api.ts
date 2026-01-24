export type Place = {
  id: number;
  name: string;
  type: "restaurant" | "mall" | "campus" | "masjid" | "other";
  address: string | null;
  isVerified: boolean;
  lat: number;
  lng: number;
};

const API_BASE = "http://localhost:4000";

export async function fetchNearbyPlaces(lat: number, lng: number, radiusMeters = 7000) {
  const url = new URL(`${API_BASE}/places/near`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("radiusMeters", String(radiusMeters));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load places");
  return (await res.json()) as Place[];
}
