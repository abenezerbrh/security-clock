// components/NavBar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout, isManager } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu automatically whenever the route changes, so
  // tapping a link doesn't leave the menu open over the new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <span className="navbar-brand">Security Clock</span>
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      <div className={`navbar-collapsible ${menuOpen ? 'open' : ''}`}>
        <div className="navbar-links">
          <Link to="/" onClick={() => setMenuOpen(false)}>Clock In</Link>
          <Link to="/roster" onClick={() => setMenuOpen(false)}>Active Roster</Link>
          {isManager && (
            <Link to="/history" onClick={() => setMenuOpen(false)}>History</Link>
          )}
          {isManager && (
            <Link to="/venues" onClick={() => setMenuOpen(false)}>Venues</Link>
          )}
          {isManager && (
            <Link to="/reports" onClick={() => setMenuOpen(false)}>Generate Report</Link>
          )}
        </div>
        <div className="navbar-user">
          <span>{user.name} ({user.role})</span>
          <button onClick={logout}>Log Out</button>
        </div>
      </div>
    </nav>
  );
}