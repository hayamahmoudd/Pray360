import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { fetchNearbyPlaces, type Place } from "./api";
import PlaceDrawer from "./PlaceDrawer";

function icon(type: Place["type"]) {
  switch (type) {
    case "restaurant":
      return "🍽️";
    case "mall":
      return "🏬";
    case "campus":
      return "🎓";
    case "masjid":
      return "🕌";
    default:
      return "📍";
  }
}

export default function MapView() {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [selected, setSelected] = useState<Place | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;

    const styleUrl = import.meta.env.VITE_MAPTILER_STYLE_URL as string;
    console.log("ENV STYLE URL:", styleUrl);

    const center = { lat: 43.5448, lng: -80.2482 }; // Guelph default

    const m = new maplibregl.Map({
      container: el.current,
      style: styleUrl,
      center: [center.lng, center.lat],
      zoom: 13,
      attributionControl: false,
    });

    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    m.on("error", (e) => console.error("MAP ERROR:", e.error));
    m.on("load", () => console.log("MAP LOADED ✅"));

    map.current = m;

    (async () => {
      const places = await fetchNearbyPlaces(center.lat, center.lng, 7000);

      for (const p of places) {
        const mEl = document.createElement("div");
        mEl.className = `mw-marker ${p.isVerified ? "verified" : ""}`;
        mEl.innerHTML = `<div class="mw-marker-inner">${icon(p.type)}</div>`;

        mEl.addEventListener("click", () => setSelected(p));

        new maplibregl.Marker({ element: mEl, anchor: "bottom" })
          .setLngLat([p.lng, p.lat])
          .addTo(m);
      }
    })().catch(console.error);

    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  return (
    <>
      <div className="map" ref={el} />
      <PlaceDrawer open={!!selected} onClose={() => setSelected(null)} place={selected} />
    </>
  );
}
