import { useEffect, useState } from "react";
import type { Place, Promo, Review, User } from "./api";
import { addReview, fetchPromos, fetchReviews, createOrGetUser } from "./api";

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
  const [loading, setLoading] = useState(false);
  
  // User profile
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Check if user exists in localStorage
    const storedUser = localStorage.getItem("praybnb_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

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

  const handleSubmit = async () => {
    if (!place || !currentUser) return;
    
    try {
      await addReview(place.id, { 
        userId: currentUser.id, 
        rating, 
        comment
      });
      
      setComment("");
      setRating(5);
      
      const updated = await fetchReviews(place.id);
      setReviews(updated);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to post review");
    }
  };

  const handleCreateUser = async () => {
    if (!userName || !userEmail) {
      alert("Please enter your name and email");
      return;
    }

    try {
      const user = await createOrGetUser({ name: userName, email: userEmail });
      setCurrentUser(user);
      localStorage.setItem("praybnb_user", JSON.stringify(user));
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user profile");
    }
  };

  if (!open || !place) return null;

  // Show user creation form if no user
  if (!currentUser) {
    return (
      <div className="drawerOverlay" onClick={onClose}>
        <div className="drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawerHeader">
            <div>
              <div className="drawerTitle">Create Your Profile</div>
              <div className="drawerMeta">Sign in to view and add reviews</div>
            </div>
            <button className="btn secondary" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="section">
            <div className="sectionTitle">Your Information</div>
            <div className="row" style={{ marginBottom: "12px" }}>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Full name"
                autoFocus
              />
            </div>
            <div className="row" style={{ marginBottom: "12px" }}>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
            <button 
              className="btn" 
              onClick={handleCreateUser}
              style={{ width: "100%" }}
            >
              Create Profile & Continue
            </button>
          </div>

          <div className="section">
            <div className="muted" style={{ fontSize: '12px', textAlign: 'center' }}>
              Your profile will be used to verify your reviews
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drawerOverlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawerHeader">
          <div>
            <div className="drawerTitle">{place.name}</div>
            <div className="drawerMeta">
              {place.reviewCount > 0 ? `⭐ ${place.avgRating.toFixed(1)} (${place.reviewCount} reviews)` : 'No reviews yet'}
              {place.isVerified ? " · ✅ verified" : ""}
              {place.capacity && ` · Capacity: ${place.capacity}`}
              {place.requiresRegistration && " · 📝 Registration required"}
            </div>
          </div>
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {loading && <div className="muted">Loading…</div>}

        <div className="section">
          <div className="card" style={{ background: 'rgba(138,180,255,.08)' }}>
            <div className="cardTitle">
              {currentUser.name} {currentUser.isVerified && '✅'}
            </div>
            <div className="cardSub">{currentUser.email}</div>
          </div>
        </div>

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
            <button className="btn" onClick={handleSubmit} style={{ flex: 1 }}>
              Post Review
            </button>
          </div>
        </div>

        <div className="section">
          <div className="sectionTitle">Recent reviews ({reviews.length})</div>
          {reviews.length === 0 ? (
            <div className="muted">No reviews yet. Be the first.</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="cardTitle">⭐ {r.rating}/5</div>
                <div className="cardSub" style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                  {r.userName} {r.userVerified && '✅'} · {new Date(r.createdAt).toLocaleDateString()}
                </div>
                {r.comment && <div className="cardSub" style={{ marginTop: '8px' }}>{r.comment}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}