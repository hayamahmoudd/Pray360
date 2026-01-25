import { useState, useRef } from "react";
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
  };
};

export default function SearchPanel({ 
  onPlaceAdded 
}: { 
  onPlaceAdded: (place: Place) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery)}&format=json&limit=8&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Praybnb/1.0'
          }
        }
      );
      const data = await response.json();
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
          {results.map((result) => (
            <div
              key={result.place_id}
              className="searchResult"
              onClick={() => handleAddPlace(result)}
            >
              <div className="resultTitle">{result.display_name.split(",")[0]}</div>
              <div className="resultAddress">{result.display_name}</div>
            </div>
          ))}
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