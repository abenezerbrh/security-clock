// pages/GenerateReport.jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';

function formatDuration(clockIn, clockOut) {
  if (!clockOut) return 'Ongoing';
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  return `${hours}h ${minutes}m`;
}

export default function GenerateReport() {
  const [report, setReport] = useState([]);
  const [venues, setVenues] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [venueId, setVenueId] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    api.getVenues(true).then(setVenues).catch(() => {});
  }, []);

  async function fetchReport() {
    setError('');
    setLoading(true);
    try {
      const filters = {};
      if (venueId) filters.venueId = venueId;
      if (from) filters.from = from;
      if (to) filters.to = to;
      const data = await api.getHistory(filters);
      setReport(data);
      setHasGenerated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const selectedVenueName =
    venues.find((v) => v.id === venueId)?.name || 'All Venues';

  return (
    <div className="page">
      <h1>Generate Report</h1>

      <div className="filters-row no-print">
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
        <button onClick={fetchReport} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
        {hasGenerated && report.length > 0 && (
          <button onClick={handlePrint}>Print Report</button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {hasGenerated && !error && (
        <>
          <h2>Shift Report</h2>
          <p className="report-meta">Venue: {selectedVenueName}</p>
          <p className="report-meta">
            Date range: {from || 'earliest record'} to {to || 'latest record'}
          </p>
          <p className="report-meta">{report.length} entries</p>
        </>
      )}

      {hasGenerated && !loading && !error && report.length === 0 && (
        <p>No shifts found for the selected filters.</p>
      )}

      {report.length > 0 && (
        <>
          {/* Desktop: standard table, also what actually prints */}
          <table className="roster-table desktop-only">
            <thead>
              <tr>
                <th>Name</th>
                <th>License #</th>
                <th>Venue</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Duration</th>
                <th>Status at Check-in</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {report.map((entry) => (
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
                  <td>{formatDuration(entry.clock_in_time, entry.clock_out_time)}</td>
                  <td>{entry.license_status_at_checkin}</td>
                  <td>{entry.logged_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: card layout */}
          <div className="roster-cards mobile-only">
            {report.map((entry) => (
              <div key={entry.id} className="roster-card">
                <div className="roster-card-header">
                  <span className="roster-card-name">{entry.guard_name}</span>
                  <span className="roster-card-duration">
                    {formatDuration(entry.clock_in_time, entry.clock_out_time)}
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
                    <span className="roster-card-label">Status</span>
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
                  <div className="roster-card-row">
                    <span className="roster-card-label">Logged By</span>
                    <span>{entry.logged_by_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}