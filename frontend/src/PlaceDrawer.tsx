import { useEffect, useState, useRef } from "react";
import type { Place, Promo, Review, User } from "./api";
import { addReview, fetchPromos, fetchReviews, createOrGetUser, uploadReviewPhoto } from "./api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export default function PlaceDrawer({
  open,
  onClose,
  place,
  currentUser,
  onUserCreated,
}: {
  open: boolean;
  onClose: () => void;
  place: Place | null;
  currentUser: User | null;
  onUserCreated: (user: User) => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track if user already has a review
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  // User profile form (for sign-in within drawer)
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [gender, setGender] = useState<'brother' | 'sister'>('brother');

  useEffect(() => {
    if (!open || !place) return;

    setLoading(true);
    Promise.all([fetchReviews(place.id), fetchPromos(place.id)])
      .then(([r, p]) => {
        setReviews(r);
        setPromos(p);
        
        // Check if current user already has a review
        if (currentUser) {
          const userReview = r.find(review => review.userId === currentUser.id);
          if (userReview) {
            setExistingReview(userReview);
            setRating(userReview.rating);
            setComment(userReview.comment);
          } else {
            setExistingReview(null);
            setRating(5);
            setComment("");
          }
          
          // Check if user owns this place
          setIsOwner(place.ownerId === currentUser.id);
        }
      })
      .finally(() => setLoading(false));
  }, [open, place, currentUser]);

  const handleSubmit = async () => {
    if (!place || !currentUser) return;
    
    // Check if user owns this place
    if (isOwner) {
      alert("Business owners cannot review their own places");
      return;
    }
    
    try {
      const reviewResponse = await addReview(place.id, { 
        userId: currentUser.id, 
        rating, 
        comment
      });
      
      // Upload photo if selected
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          await uploadReviewPhoto(reviewResponse.id, photoFile);
        } catch (error) {
          console.error("Error uploading photo:", error);
          alert("Review posted but photo upload failed");
        } finally {
          setUploadingPhoto(false);
        }
      }
      
      setComment("");
      setRating(5);
      setPhotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      const updated = await fetchReviews(place.id);
      setReviews(updated);
      
      // Update existing review state
      const userReview = updated.find(r => r.userId === currentUser.id);
      setExistingReview(userReview || null);
      
      alert(existingReview ? "Review updated successfully!" : "Review posted successfully!");
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
      const user = await createOrGetUser({ 
        name: userName, 
        email: userEmail,
        isBusinessOwner,
        gender
      });
      onUserCreated(user);
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user profile");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Maximum size is 5MB.");
        return;
      }
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file.");
        return;
      }
      setPhotoFile(file);
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
              <div className="drawerTitle">Sign In to Continue</div>
              <div className="drawerMeta">Create your profile to view and add reviews</div>
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
            
            <div style={{ marginBottom: "12px" }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '14px',
                marginBottom: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={isBusinessOwner}
                  onChange={(e) => setIsBusinessOwner(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                I'm a business owner
              </label>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px',
                marginBottom: '6px',
                color: 'var(--muted)'
              }}>
                Gender
              </label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,.15)',
                  border: '1px solid rgba(255,255,255,.25)',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '12px',
                  outline: 'none',
                  fontWeight: '500'
                }}
              >
                <option value="brother">Brother</option>
                <option value="sister">Sister</option>
              </select>
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
              {place.reviewCount > 0 ? `${place.avgRating.toFixed(1)} stars (${place.reviewCount} reviews)` : 'No reviews yet'}
              {place.isVerified ? " · Verified" : ""}
              {place.capacity && ` · Capacity: ${place.capacity}`}
              {place.requiresRegistration && " · Registration required"}
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
              {currentUser.name} {currentUser.isVerified && '(Verified)'}
              {currentUser.isBusinessOwner && ' (Business Owner)'}
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
          <div className="sectionTitle">
            {isOwner ? "You own this place" : existingReview ? "Edit your review" : "Add a review"}
          </div>
          {isOwner ? (
            <div style={{ 
              padding: '12px', 
              background: 'rgba(255,255,255,.1)', 
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,.2)',
              fontSize: '13px',
              color: 'rgba(255,255,255,.8)'
            }}>
              Business owners cannot review their own places. Other users can leave reviews.
            </div>
          ) : (
            <>
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

          <div className="row" style={{ marginTop: "8px", alignItems: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ flex: 1, fontSize: '12px' }}
            />
            {photoFile && (
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                {photoFile.name}
              </span>
            )}
          </div>

          <div className="row" style={{ marginTop: "8px" }}>
            <button 
              className="btn" 
              onClick={handleSubmit} 
              style={{ flex: 1 }}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? 'Uploading...' : existingReview ? 'Update Review' : 'Post Review'}
            </button>
          </div>
          </>
          )}
        </div>

        <div className="section">
          <div className="sectionTitle">Recent reviews ({reviews.length})</div>
          {reviews.length === 0 ? (
            <div className="muted">No reviews yet. Be the first.</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="cardTitle">{r.rating}/5 stars</div>
                <div className="cardSub" style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                  {r.userName} {r.userVerified && '(Verified)'} · {new Date(r.createdAt).toLocaleDateString()}
                </div>
                {r.comment && <div className="cardSub" style={{ marginTop: '8px' }}>{r.comment}</div>}
                {r.photoUrl && (
                  <img 
                    src={`${API_BASE}${r.photoUrl}`}
                    alt="Review"
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginTop: '8px'
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