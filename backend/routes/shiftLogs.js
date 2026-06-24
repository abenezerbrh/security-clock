// routes/shiftLogs.js
const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /shift-logs/clock-in
// body: { guardId, venueId, licenseStatusAtCheckin }
router.post('/clock-in', requireAuth, async (req, res) => {
  const { guardId, venueId, licenseStatusAtCheckin } = req.body;

  if (!guardId || !venueId || !licenseStatusAtCheckin) {
    return res.status(400).json({
      error: 'guardId, venueId, and licenseStatusAtCheckin are required',
    });
  }

  try {
    // Prevent double clock-in: check this guard doesn't already have an
    // open shift (clock_out_time is null) anywhere.
    const openShift = await pool.query(
      'select id from shift_logs where guard_id = $1 and clock_out_time is null',
      [guardId]
    );

    if (openShift.rows.length > 0) {
      return res.status(409).json({
        error: 'This guard is already clocked in. Clock them out first.',
        existingShiftId: openShift.rows[0].id,
      });
    }

    const result = await pool.query(
      `insert into shift_logs
        (guard_id, venue_id, logged_by_user_id, license_status_at_checkin)
       values ($1, $2, $3, $4)
       returning *`,
      [guardId, venueId, req.user.id, licenseStatusAtCheckin]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[shift-logs/clock-in]', err);
    res.status(500).json({ error: 'Could not record clock-in' });
  }
});

// POST /shift-logs/:id/clock-out
router.post('/:id/clock-out', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `update shift_logs
       set clock_out_time = now()
       where id = $1 and clock_out_time is null
       returning *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Shift log not found, or this guard is already clocked out',
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[shift-logs/clock-out]', err);
    res.status(500).json({ error: 'Could not record clock-out' });
  }
});

// GET /shift-logs/active
// Everyone currently clocked in, optionally filtered by venue.
// ?venueId=<uuid>
router.get('/active', requireAuth, async (req, res) => {
  const { venueId } = req.query;

  try {
    const params = [];
    let query = `
      select
        sl.id, sl.clock_in_time, sl.license_status_at_checkin,
        g.id as guard_id, g.name as guard_name, g.license_number,
        v.id as venue_id, v.name as venue_name,
        u.id as logged_by_id, u.name as logged_by_name
      from shift_logs sl
      join guards g on g.id = sl.guard_id
      join venues v on v.id = sl.venue_id
      join users u on u.id = sl.logged_by_user_id
      where sl.clock_out_time is null
    `;

    if (venueId) {
      params.push(venueId);
      query += ` and sl.venue_id = $${params.length}`;
    }

    query += ' order by sl.clock_in_time asc';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[shift-logs/active]', err);
    res.status(500).json({ error: 'Could not fetch active roster' });
  }
});

// GET /shift-logs?venueId=&from=&to=
// Full history with optional filters. Manager only.
router.get('/', requireAuth, requireRole('manager'), async (req, res) => {
  const { venueId, from, to } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (venueId) {
      params.push(venueId);
      conditions.push(`sl.venue_id = $${params.length}`);
    }
    if (from) {
      // Midnight at the start of `from`, in Toronto local time, expressed as a UTC instant
      const fromUtc = new Date(`${from}T00:00:00-04:00`); // adjust offset if needed for EST vs EDT
      params.push(fromUtc.toISOString());
      conditions.push(`sl.clock_in_time >= $${params.length}`);
    }
    if (to) {
      const toUtc = new Date(`${to}T23:59:59.999-04:00`);
      params.push(toUtc.toISOString());
      conditions.push(`sl.clock_in_time <= $${params.length}`);
    }

    const whereClause = conditions.length
      ? `where ${conditions.join(' and ')}`
      : '';

    const query = `
      select
        sl.id, sl.clock_in_time, sl.clock_out_time, sl.license_status_at_checkin,
        g.id as guard_id, g.name as guard_name, g.license_number,
        v.id as venue_id, v.name as venue_name,
        u.id as logged_by_id, u.name as logged_by_name
      from shift_logs sl
      join guards g on g.id = sl.guard_id
      join venues v on v.id = sl.venue_id
      join users u on u.id = sl.logged_by_user_id
      ${whereClause}
      order by sl.clock_in_time desc
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[shift-logs/history]', err);
    res.status(500).json({ error: 'Could not fetch shift history' });
  }
});

module.exports = router;
