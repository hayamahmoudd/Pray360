import { useState, useRef, useEffect } from "react";
import { createPlace, type Place } from "./api";

type SearchResult = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

// Calculate distance between two coordinates (Haversine formula)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function SearchPanel({ 
  onPlaceAdded 
}: { 
  onPlaceAdded: (place: Place) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Default to Guelph if location denied
          setUserLocation({ lat: 43.5448, lng: -80.2482 });
        }
      );
    }
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery)}&format=json&limit=12&addressdetails=1&countrycodes=ca,us`,
        {
          headers: {
            'User-Agent': 'pray360/1.0'
          }
        }
      );
      let data = await response.json();
      
      // Sort by distance from user's location if available
      if (userLocation && data.length > 0) {
        data = data.sort((a: SearchResult, b: SearchResult) => {
          const distA = getDistanceKm(userLocation.lat, userLocation.lng, parseFloat(a.lat), parseFloat(a.lon));
          const distB = getDistanceKm(userLocation.lat, userLocation.lng, parseFloat(b.lat), parseFloat(b.lon));
          return distA - distB;
        });
      }
      
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlace = async (result: SearchResult) => {
    try {
      const placeData = {
        name: result.display_name.split(",")[0],
        address: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
      
      console.log("Creating place with:", placeData);

      const response = await createPlace(placeData);
      console.log("Place created successfully:", response);

      const newPlace: Place = {
        id: response.id,
        ...placeData,
        isVerified: false,
        ownerId: null,
        capacity: null,
        requiresRegistration: false,
        avgRating: 0,
        reviewCount: 0,
      };

      onPlaceAdded(newPlace);
      setQuery("");
      setResults([]);
    } catch (error) {
      console.error("Error adding place:", error);
      alert("Failed to add place. Check the browser console for details.");
    }
  };

  return (
    <div className="searchPanel">
      <input
        type="text"
        className="searchInput"
        placeholder="Search for a place..."
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          
          if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
          }
          
          searchTimeout.current = setTimeout(() => {
            handleSearch(value);
          }, 500);
        }}
      />

      {loading && <div className="muted" style={{ padding: '8px 0' }}>Searching...</div>}

      {results.length > 0 && (
        <div className="searchResults">
          {results.map((result) => {
            const distance = userLocation 
              ? getDistanceKm(userLocation.lat, userLocation.lng, parseFloat(result.lat), parseFloat(result.lon))
              : null;
            return (
              <div
                key={result.place_id}
                className="searchResult"
                onClick={() => handleAddPlace(result)}
              >
                <div className="resultHeader">
                  <div className="resultTitle">{result.display_name.split(",")[0]}</div>
                  {distance !== null && (
                    <div className="resultDistance">
                      {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                    </div>
                  )}
                </div>
                <div className="resultAddress">{result.display_name}</div>
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && query && !loading && query.length >= 2 && (
        <div className="muted" style={{ textAlign: "center", padding: "16px 0" }}>
          No results found
        </div>
      )}
    </div>
  );
}