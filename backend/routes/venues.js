// routes/venues.js
const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /venues
// Returns active venues by default. ?includeInactive=true for managers
// who need to see the full list (e.g. to reactivate one).
router.get('/', requireAuth, async (req, res) => {
  const { includeInactive } = req.query;

  try {
    const query =
      includeInactive === 'true' && req.user.role === 'manager'
        ? 'select * from venues order by name asc'
        : 'select * from venues where active = true order by name asc';

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('[venues/list]', err);
    res.status(500).json({ error: 'Could not fetch venues' });
  }
});

// POST /venues
// body: { name, address }
router.post('/', requireAuth, requireRole('manager'), async (req, res) => {
  const { name, address } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const result = await pool.query(
      'insert into venues (name, address) values ($1, $2) returning *',
      [name, address || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[venues/create]', err);
    res.status(500).json({ error: 'Could not create venue' });
  }
});

// PATCH /venues/:id
// body: any of { name, address, active }
// Used both for editing details and "removing" a venue (set active: false)
router.patch('/:id', requireAuth, requireRole('manager'), async (req, res) => {
  const { id } = req.params;
  const { name, address, active } = req.body;

  const fields = [];
  const params = [];

  if (name !== undefined) {
    params.push(name);
    fields.push(`name = $${params.length}`);
  }
  if (address !== undefined) {
    params.push(address);
    fields.push(`address = $${params.length}`);
  }
  if (active !== undefined) {
    params.push(active);
    fields.push(`active = $${params.length}`);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields provided to update' });
  }

  params.push(id);

  try {
    const result = await pool.query(
      `update venues set ${fields.join(', ')} where id = $${params.length} returning *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[venues/update]', err);
    res.status(500).json({ error: 'Could not update venue' });
  }
});

module.exports = router;
