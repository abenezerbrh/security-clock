// pages/ManageVenues.jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function ManageVenues() {
  const [venues, setVenues] = useState([]);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [error, setError] = useState('');

  function load() {
    api.getVenues(true).then(setVenues).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.createVenue(newName.trim(), newAddress.trim() || undefined);
      setNewName('');
      setNewAddress('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleActive(venue) {
    try {
      await api.updateVenue(venue.id, { active: !venue.active });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1>Manage Venues</h1>

      {error && <p className="error-text">{error}</p>}

      <form className="inline-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Venue name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Address (optional)"
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
        />
        <button type="submit">Add Venue</button>
      </form>

      <table className="roster-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {venues.map((v) => (
            <tr key={v.id}>
              <td>{v.name}</td>
              <td>{v.address || '—'}</td>
              <td>{v.active ? 'Active' : 'Inactive'}</td>
              <td>
                <button onClick={() => handleToggleActive(v)}>
                  {v.active ? 'Deactivate' : 'Reactivate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
