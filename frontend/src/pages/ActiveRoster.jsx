// pages/ActiveRoster.jsx
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

function formatDuration(clockInTime) {
  const ms = Date.now() - new Date(clockInTime).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  return `${hours}h ${minutes}m`;
}

export default function ActiveRoster() {
  const [roster, setRoster] = useState([]);
  const [venues, setVenues] = useState([]);
  const [venueFilter, setVenueFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getActiveRoster(venueFilter || undefined);
      setRoster(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [venueFilter]);

  useEffect(() => {
    api.getVenues().then(setVenues).catch(() => {});
  }, []);

  useEffect(() => {
    loadRoster();
    // Refresh periodically so the "currently clocked in" view stays live
    // without the supervisor needing to manually reload.
    const interval = setInterval(loadRoster, 30000);
    return () => clearInterval(interval);
  }, [loadRoster]);

  async function handleClockOut(shiftLogId) {
    try {
      await api.clockOut(shiftLogId);
      loadRoster();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1>Currently Clocked In</h1>

      <div className="venue-select">
        <label htmlFor="venueFilter">Filter by venue</label>
        <select
          id="venueFilter"
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
        >
          <option value="">All venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && roster.length === 0 && <p>Loading...</p>}

      {!loading && roster.length === 0 && <p>No one is currently clocked in.</p>}

      <table className="roster-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>License #</th>
            <th>Venue</th>
            <th>Clocked In</th>
            <th>Duration</th>
            <th>Logged By</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {roster.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.guard_name}</td>
              <td>{entry.license_number}</td>
              <td>{entry.venue_name}</td>
              <td>{new Date(entry.clock_in_time).toLocaleTimeString()}</td>
              <td>{formatDuration(entry.clock_in_time)}</td>
              <td>{entry.logged_by_name}</td>
              <td>
                <button onClick={() => handleClockOut(entry.id)}>Clock Out</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
