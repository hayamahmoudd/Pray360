import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { fetchNearbyPlaces, createPlace, type Place } from "./api";
import PlaceDrawer from "./PlaceDrawer";
import SearchPanel from "./SearchPanel";

export default function MapView() {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<number, maplibregl.Marker>>(new Map());

  const [selected, setSelected] = useState<Place | null>(null);
  const [isPinMode, setIsPinMode] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [placeCapacity, setPlaceCapacity] = useState("");

  const addMarker = (p: Place, m: maplibregl.Map) => {
    const mEl = document.createElement("div");
    mEl.className = `mw-marker ${p.isVerified ? "verified" : ""}`;
    mEl.innerHTML = `<div class="mw-marker-inner">📍</div>`;

    mEl.addEventListener("click", () => setSelected(p));

    const marker = new maplibregl.Marker({ element: mEl, anchor: "bottom" })
      .setLngLat([p.lng, p.lat])
      .addTo(m);

    markers.current.set(p.id, marker);
  };

  useEffect(() => {
    if (!el.current || map.current) return;

    const styleUrl = import.meta.env.VITE_MAPTILER_STYLE_URL as string;

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

    // Click to pin location
    m.on("click", (e) => {
      if (!isPinMode) return;
      
      const { lat, lng } = e.lngLat;
      setPinLocation({ lat, lng });
      setShowPinForm(true);
      
      // Exit pin mode after clicking
      setTimeout(() => setIsPinMode(false), 100);
    });

    map.current = m;

    (async () => {
      const loadedPlaces = await fetchNearbyPlaces(center.lat, center.lng, 7000);

      for (const p of loadedPlaces) {
        addMarker(p, m);
      }
    })().catch(console.error);

    return () => {
      m.remove();
      map.current = null;
    };
  }, [isPinMode]);

  const handlePlaceAdded = (newPlace: Place) => {
    if (map.current) {
      addMarker(newPlace, map.current);
      map.current.flyTo({
        center: [newPlace.lng, newPlace.lat],
        zoom: 15,
      });
    }

    setSelected(newPlace);
  };

  const handleCreatePin = async () => {
    if (!placeName.trim()) {
      alert("Please enter a name for this prayer space");
      return;
    }
    
    if (!pinLocation) return;

    try {
      const response = await createPlace({
        name: placeName,
        lat: pinLocation.lat,
        lng: pinLocation.lng,
        capacity: placeCapacity ? parseInt(placeCapacity) : undefined,
      });

      const newPlace: Place = {
        id: response.id,
        name: placeName,
        address: null,
        isVerified: false,
        lat: pinLocation.lat,
        lng: pinLocation.lng,
        capacity: placeCapacity ? parseInt(placeCapacity) : null,
        requiresRegistration: false,
        avgRating: 0,
        reviewCount: 0,
      };

      handlePlaceAdded(newPlace);
      setShowPinForm(false);
      setPlaceName("");
      setPlaceCapacity("");
      setPinLocation(null);
    } catch (error) {
      console.error("Error creating place:", error);
      alert("Failed to create place. Please check the console for details.");
    }
  };

  return (
    <>
      <div className="map" ref={el}>
        <SearchPanel onPlaceAdded={handlePlaceAdded} />
        
        {/* Pin Mode Button */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10,
        }}>
          <button 
            className={`btn ${isPinMode ? '' : 'secondary'}`}
            onClick={() => setIsPinMode(!isPinMode)}
            style={{
              background: isPinMode ? 'rgba(90,255,170,.18)' : undefined,
              border: isPinMode ? '1px solid rgba(90,255,170,.28)' : undefined,
              boxShadow: '0 4px 12px rgba(0,0,0,.2)',
              whiteSpace: 'nowrap',
            }}
          >
            {isPinMode ? '📍 Click map' : '➕ Pin'}
          </button>
        </div>

        {/* Pin Form Modal */}
        {showPinForm && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--panel)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,.10)',
            borderRadius: '12px',
            padding: '20px',
            width: 'min(400px, 90vw)',
            zIndex: 100,
          }}>
            <h3 style={{ marginTop: 0 }}>Name this prayer space</h3>
            <input
              type="text"
              className="searchInput"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="e.g., McDonald's Downtown"
              autoFocus
            />
            <input
              type="number"
              className="searchInput"
              value={placeCapacity}
              onChange={(e) => setPlaceCapacity(e.target.value)}
              placeholder="Capacity (optional)"
              min="1"
              style={{ marginTop: '8px' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                className="btn secondary" 
                onClick={() => {
                  setShowPinForm(false);
                  setPlaceName("");
                  setPlaceCapacity("");
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                onClick={handleCreatePin}
                style={{ flex: 1 }}
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
      <PlaceDrawer open={!!selected} onClose={() => setSelected(null)} place={selected} />
    </>
  );
}