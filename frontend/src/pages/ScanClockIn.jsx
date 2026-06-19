// pages/ScanClockIn.jsx
import { useState, useEffect, useCallback } from 'react';
import QrScanner from '../components/QrScanner';
import { api } from '../api/client';

// Two input modes: scanning the QR, or typing the license number by hand
// when the QR is damaged, the screen has glare, or the camera just won't
// cooperate. Both paths end up calling the same lookup.
const MODE = { SCAN: 'scan', MANUAL: 'manual' };

export default function ScanClockIn() {
  const [mode, setMode] = useState(MODE.SCAN);
  const [manualInput, setManualInput] = useState('');
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getVenues()
      .then((data) => {
        setVenues(data);
        if (data.length > 0) setSelectedVenueId(data[0].id);
      })
      .catch(() => setStatusMessage('Could not load venue list.'));
  }, []);

  const runLookup = useCallback(async (licenseNumber) => {
    setStatusMessage('');
    setLookupResult(null);
    setLoading(true);
    try {
      const result = await api.scanLookup(licenseNumber);
      setLookupResult(result);
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    runLookup(manualInput.trim());
  }

  async function handleClockIn() {
    if (!lookupResult || !selectedVenueId) return;
    setLoading(true);
    setStatusMessage('');
    try {
      await api.clockIn(
        lookupResult.guard.id,
        selectedVenueId,
        lookupResult.licenseStatus
      );
      setStatusMessage(`${lookupResult.guard.name} clocked in successfully.`);
      setLookupResult(null);
      setManualInput('');
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Clock In</h1>

      <div className="venue-select">
        <label htmlFor="venue">Venue</label>
        <select
          id="venue"
          value={selectedVenueId}
          onChange={(e) => setSelectedVenueId(e.target.value)}
        >
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mode-toggle">
        <button
          className={mode === MODE.SCAN ? 'active' : ''}
          onClick={() => setMode(MODE.SCAN)}
        >
          Scan QR Code
        </button>
        <button
          className={mode === MODE.MANUAL ? 'active' : ''}
          onClick={() => setMode(MODE.MANUAL)}
        >
          Enter Manually
        </button>
      </div>

      {mode === MODE.SCAN && (
        <div className="scan-panel">
          <QrScanner onScan={runLookup} onError={setStatusMessage} />
          <p className="hint">
            Having trouble scanning? Switch to "Enter Manually" above.
          </p>
        </div>
      )}

      {mode === MODE.MANUAL && (
        <form className="manual-entry" onSubmit={handleManualSubmit}>
          <label htmlFor="licenseNumber">License Number</label>
          <input
            id="licenseNumber"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 50073036"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={loading}>
            Look Up
          </button>
        </form>
      )}

      {loading && <p>Checking license...</p>}

      {statusMessage && <p className="status-message">{statusMessage}</p>}

      {lookupResult && (
        <div className={`result-card ${lookupResult.isActive ? 'active' : 'inactive'}`}>
          <h2>{lookupResult.guard.name}</h2>
          <p>License #{lookupResult.guard.license_number}</p>
          <p className="status-badge">
            {lookupResult.isActive ? 'ACTIVE' : `NOT ACTIVE (${lookupResult.licenseStatus})`}
          </p>

          {lookupResult.isActive ? (
            <button onClick={handleClockIn} disabled={loading || !selectedVenueId}>
              Confirm Clock In
            </button>
          ) : (
            <p className="warning-text">
              This license is not active. Do not allow this person to work a shift.
              Notify a supervisor or manager.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
