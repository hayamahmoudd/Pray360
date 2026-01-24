import MapView from "./MapView";
import "./index.css";

export default function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Praybnb</div>
        <div className="tag">Pin and rate prayer spaces</div>
      </header>
      <MapView />
    </div>
  );
}
