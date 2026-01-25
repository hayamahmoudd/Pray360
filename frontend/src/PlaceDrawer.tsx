import { useEffect, useRef, useState } from "react";
import type { Place, Promo, Review } from "./api";
import { addReview, fetchPromos, fetchReviews } from "./api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export default function PlaceDrawer({
  open,
  onClose,
  place,
}: {
  open: boolean;
  onClose: () => void;
  place: Place | null;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !place) return;

    setLoading(true);
    Promise.all([fetchReviews(place.id), fetchPromos(place.id)])
      .then(([r, p]) => {
        setReviews(r);
        setPromos(p);
      })
      .finally(() => setLoading(false));
  }, [open, place]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!place) return;
    
    await addReview(place.id, { 
      userId: 1, 
      rating, 
      comment,
      photo: photo || undefined
    });
    
    setComment("");
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    const updated = await fetchReviews(place.id);
    setReviews(updated);
  };

  if (!open || !place) return null;

  return (
    <div className="drawerOverlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawerHeader">
          <div>
            <div className="drawerTitle">{place.name}</div>
            <div className="drawerMeta">
              ⭐ {place.avgRating.toFixed(1)} ({place.reviewCount}) · {place.type}
              {place.isVerified ? " · ✅ verified" : ""}
            </div>
          </div>
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {loading && <div className="muted">Loading…</div>}

        {promos.length > 0 && (
          <div className="section">
            <div className="sectionTitle">Promos</div>
            {promos.map((p) => (
              <div key={p.id} className="card">
                <div className="cardTitle">{p.title}</div>
                {p.discountText && <div className="pill">{p.discountText}</div>}
                {p.description && <div className="cardSub">{p.description}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="section">
          <div className="sectionTitle">Add a review</div>
          <div className="row">
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>

            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Where is the prayer spot? Wudu? Privacy?"
            />
          </div>

          <div className="row" style={{ marginTop: "8px" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ flex: 1 }}
            />
            <button className="btn" onClick={handleSubmit}>
              Post
            </button>
          </div>

          {photoPreview && (
            <div style={{ marginTop: "12px" }}>
              <img 
                src={photoPreview} 
                alt="Preview" 
                style={{ 
                  maxWidth: "100%", 
                  maxHeight: "200px", 
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,.10)"
                }} 
              />
            </div>
          )}
        </div>

        <div className="section">
          <div className="sectionTitle">Recent reviews</div>
          {reviews.length === 0 ? (
            <div className="muted">No reviews yet. Be the first.</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="cardTitle">⭐ {r.rating}</div>
                {r.comment && <div className="cardSub">{r.comment}</div>}
                {r.photoUrl && (
                  <img 
                    src={`${API_BASE}${r.photoUrl}`}
                    alt="Review"
                    style={{ 
                      marginTop: "8px",
                      maxWidth: "100%", 
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,.10)"
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}