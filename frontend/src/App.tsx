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
    // Clear form inputs
    setUserName("");
    setUserEmail("");
    setIsBusinessOwner(false);
    setGender('brother');
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

  const handleUserCreated = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("pray360_user", JSON.stringify(user));
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo2.png" alt="Pray360" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
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
        <div className="drawerOverlay" style={{ zIndex: 200, alignItems: 'center', justifyContent: 'center' }}>
          <div className="loginModal" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255,255,255,.1)',
                border: '1px solid rgba(255,255,255,.2)',
                borderRadius: '8px',
                color: '#fff',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src="/logo2.png" alt="Pray360" style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '8px' }} />
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>Welcome to Pray360</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)' }}>Create your profile to pin and rate prayer spaces</div>
            </div>

            <div className="section" style={{ marginTop: 0 }}>
              <div className="row" style={{ marginBottom: "10px" }}>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  style={{ fontSize: '15px', padding: '14px' }}
                />
              </div>
              <div className="row" style={{ marginBottom: "14px" }}>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Email address"
                  style={{ fontSize: '15px', padding: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: "14px" }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  fontSize: '14px',
                  padding: '14px',
                  background: isBusinessOwner ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: isBusinessOwner ? '1px solid rgba(255,255,255,.25)' : '1px solid rgba(255,255,255,.1)',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="checkbox"
                    checked={isBusinessOwner}
                    onChange={(e) => setIsBusinessOwner(e.target.checked)}
                    style={{ cursor: 'pointer', width: '20px', height: '20px', accentColor: '#fff' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>I'm a business owner</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)', marginTop: '2px' }}>Promote your prayer space</div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setGender('brother')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: gender === 'brother' ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.08)',
                      border: gender === 'brother' ? '1px solid rgba(255,255,255,.35)' : '1px solid rgba(255,255,255,.12)',
                      borderRadius: '12px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: gender === 'brother' ? 600 : 400,
                      transition: 'all 0.2s'
                    }}
                  >
                    Brother
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('sister')}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: gender === 'sister' ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.08)',
                      border: gender === 'sister' ? '1px solid rgba(255,255,255,.35)' : '1px solid rgba(255,255,255,.12)',
                      borderRadius: '12px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: gender === 'sister' ? 600 : 400,
                      transition: 'all 0.2s'
                    }}
                  >
                    Sister
                  </button>
                </div>
              </div>

              <button 
                className="btn" 
                onClick={handleLogin}
                style={{ width: "100%", padding: '16px', fontSize: '15px', fontWeight: '600', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)' }}
              >
                Get Started
              </button>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>
                Your email helps verify reviews
              </div>
            </div>
          </div>
        </div>
      )}
      
      <MapView currentUser={currentUser} onRequestLogin={() => setShowLoginModal(true)} onUserCreated={handleUserCreated} />
    </div>
  );
}

