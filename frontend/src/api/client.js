// api/client.js
//
// Single place for all backend calls. Reads the API base URL from an env
// var so it's easy to point at localhost during dev and a real host later.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  // Guards / license verification
  scanLookup: (licenseNumber) =>
    request('/guards/scan-lookup', { method: 'POST', body: { licenseNumber } }),

  // Shift logs
  clockIn: (guardId, venueId, licenseStatusAtCheckin) =>
    request('/shift-logs/clock-in', {
      method: 'POST',
      body: { guardId, venueId, licenseStatusAtCheckin },
    }),
  clockOut: (shiftLogId) =>
    request(`/shift-logs/${shiftLogId}/clock-out`, { method: 'POST' }),
  getActiveRoster: (venueId) =>
    request(`/shift-logs/active${venueId ? `?venueId=${venueId}` : ''}`),
  getHistory: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/shift-logs${params ? `?${params}` : ''}`);
  },

  // Venues
  getVenues: (includeInactive = false) =>
    request(`/venues${includeInactive ? '?includeInactive=true' : ''}`),
  createVenue: (name, address) =>
    request('/venues', { method: 'POST', body: { name, address } }),
  updateVenue: (id, fields) =>
    request(`/venues/${id}`, { method: 'PATCH', body: fields }),

  // Users (manager only)
  getUsers: () => request('/users'),
  createUser: (name, email, password, role) =>
    request('/users', { method: 'POST', body: { name, email, password, role } }),
};
