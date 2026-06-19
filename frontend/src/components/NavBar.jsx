// components/NavBar.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout, isManager } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/">Clock In</Link>
        <Link to="/roster">Active Roster</Link>
        {isManager && <Link to="/history">History</Link>}
        {isManager && <Link to="/venues">Venues</Link>}
      </div>
      <div className="navbar-user">
        <span>{user.name} ({user.role})</span>
        <button onClick={logout}>Log Out</button>
      </div>
    </nav>
  );
}
