// pages/ShiftHistory.jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function ShiftHistory() {
  const [history, setHistory] = useState([]);
  const [venues, setVenues] = useState([]);
  const [venueId, setVenueId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getVenues(true).then(setVenues).catch(() => {});
  }, []);

  async function loadHistory() {
    setError('');
    try {
      const filters = {};
      if (venueId) filters.venueId = venueId;
      if (from) filters.from = from;
      if (to) filters.to = to;
      const data = await api.getHistory(filters);
      setHistory(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <h1>Shift History</h1>

      <div className="filters-row">
        <select value={venueId} onChange={(e) => setVenueId(e.target.value)}>
          <option value="">All venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={loadHistory}>Apply Filters</button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {history.length === 0 && !error && (
        <p>No shifts found.</p>
      )}

      {/* Desktop: standard table */}
      <table className="roster-table desktop-only">
        <thead>
          <tr>
            <th>Name</th>
            <th>License #</th>
            <th>Venue</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Status at Check-in</th>
            <th>Logged By</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.guard_name}</td>
              <td>{entry.license_number}</td>
              <td>{entry.venue_name}</td>
              <td>{new Date(entry.clock_in_time).toLocaleString()}</td>
              <td>
                {entry.clock_out_time
                  ? new Date(entry.clock_out_time).toLocaleString()
                  : 'Still clocked in'}
              </td>
              <td>{entry.license_status_at_checkin}</td>
              <td>{entry.logged_by_name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: card layout */}
      <div className="roster-cards mobile-only">
        {history.map((entry) => (
          <div key={entry.id} className="roster-card">
            <div className="roster-card-header">
              <span className="roster-card-name">{entry.guard_name}</span>
              <span
                className={`roster-card-status ${
                  entry.license_status_at_checkin?.toLowerCase() === 'active'
                    ? 'status-active'
                    : 'status-inactive'
                }`}
              >
                {entry.license_status_at_checkin}
              </span>
            </div>
            <div className="roster-card-body">
              <div className="roster-card-row">
                <span className="roster-card-label">License</span>
                <span>{entry.license_number}</span>
              </div>
              <div className="roster-card-row">
                <span className="roster-card-label">Venue</span>
                <span>{entry.venue_name}</span>
              </div>
              <div className="roster-card-row">
                <span className="roster-card-label">Clock In</span>
                <span>{new Date(entry.clock_in_time).toLocaleString()}</span>
              </div>
              <div className="roster-card-row">
                <span className="roster-card-label">Clock Out</span>
                <span>
                  {entry.clock_out_time
                    ? new Date(entry.clock_out_time).toLocaleString()
                    : 'Still clocked in'}
                </span>
              </div>
              <div className="roster-card-row">
                <span className="roster-card-label">Logged By</span>
                <span>{entry.logged_by_name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}