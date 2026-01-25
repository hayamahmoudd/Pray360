import { useEffect, useState } from "react";
import MapView from "./MapView";
import "./index.css";
import type { User } from "./api";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("praybnb_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("praybnb_user");
    setCurrentUser(null);
    window.location.reload();
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="brand">Praybnb</div>
          <div className="tag">Pin and rate prayer spaces</div>
        </div>
        {currentUser && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            fontSize: '13px'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>
                {currentUser.name} {currentUser.isVerified && '✅'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>
                {currentUser.email}
              </div>
            </div>
            <button 
              className="btn secondary" 
              onClick={handleLogout}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Logout
            </button>
          </div>
        )}
      </header>
      <MapView />
    </div>
  );
}

