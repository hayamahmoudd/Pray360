import { useEffect, useState } from "react";
import MapView from "./MapView";
import "./index.css";
import type { User } from "./api";
import { createOrGetUser } from "./api";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [gender, setGender] = useState<'brother' | 'sister'>('brother');

  useEffect(() => {
    const storedUser = localStorage.getItem("pray360_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("pray360_user");
      }
    }
    // Don't show login modal on first load - let them explore first
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("pray360_user");
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  const handleLogin = async () => {
    if (!userName || !userEmail) {
      alert("Please enter your name and email");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      alert("Please enter a valid email address (e.g., name@example.com)");
      return;
    }

    try {
      const user = await createOrGetUser({ 
        name: userName, 
        email: userEmail,
        isBusinessOwner,
        gender
      });
      setCurrentUser(user);
      localStorage.setItem("pray360_user", JSON.stringify(user));
      setShowLoginModal(false);
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create profile. Please check your email format and try again.");
    }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="brand">pray360</div>
          <div className="tag">Pin and rate prayer spaces</div>
        </div>
        {currentUser && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            fontSize: '12px',
            flexShrink: 0
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>
                {currentUser.name} {currentUser.isVerified && '✅'}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>
                {currentUser.email}
              </div>
            </div>
            <button 
              className="btn secondary" 
              onClick={handleLogout}
              style={{ padding: '6px 10px', fontSize: '11px' }}
            >
              Logout
            </button>
          </div>
        )}
      </header>
      
      {/* Initial Login Modal */}
      {showLoginModal && (
        <div className="drawerOverlay" style={{ zIndex: 200 }}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: 'calc(100vw - 24px)', margin: 'auto', height: 'auto', maxHeight: 'calc(100dvh - 40px)', borderRadius: '14px', border: '1px solid rgba(255,255,255,.2)', overflowY: 'auto' }}>
            <div className="drawerHeader">
              <div>
                <div className="drawerTitle">Sign In to Continue</div>
                <div className="drawerMeta">Create your profile to pin and rate prayer spaces</div>
              </div>
            </div>

            <div style={{ 
              marginBottom: "16px", 
              padding: "12px", 
              background: "rgba(255,255,255,.1)", 
              border: "1px solid rgba(255,255,255,.2)",
              borderRadius: "10px",
              fontSize: "13px",
              color: "rgba(255,255,255,.9)",
              lineHeight: "1.5"
            }}>
              ⚠️ Please enter a valid email address (e.g., name@example.com). Your email helps verify your reviews.
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
              
              <div style={{ marginBottom: "16px" }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  fontSize: '15px',
                  padding: '12px',
                  background: 'rgba(255,255,255,.04)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,.08)',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="checkbox"
                    checked={isBusinessOwner}
                    onChange={(e) => setIsBusinessOwner(e.target.checked)}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span>I'm a business owner (can set capacity for prayer spaces)</span>
                </label>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px',
                  marginBottom: '8px',
                  color: 'var(--muted)',
                  fontWeight: '600'
                }}>
                  Gender (optional)
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
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  <option value="brother">Brother</option>
                  <option value="sister">Sister</option>
                </select>
              </div>

              <button 
                className="btn" 
                onClick={handleLogin}
                style={{ width: "100%", padding: '12px', fontSize: '14px', fontWeight: '600' }}
              >
                Create Profile & Start
              </button>
            </div>

            <div className="section">
              <div className="muted" style={{ fontSize: '12px', textAlign: 'center' }}>
                Your profile helps verify reviews and ensures quality ratings
              </div>
            </div>
          </div>
        </div>
      )}
      
      <MapView currentUser={currentUser} onRequestLogin={() => setShowLoginModal(true)} />
    </div>
  );
}

