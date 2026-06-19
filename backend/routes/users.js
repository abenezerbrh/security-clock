// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

// GET /users
// Manager only. List all staff accounts (no password hashes returned).
router.get('/', requireAuth, requireRole('manager'), async (req, res) => {
  try {
    const result = await pool.query(
      'select id, name, email, role, created_at from users order by name asc'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[users/list]', err);
    res.status(500).json({ error: 'Could not fetch users' });
  }
});

// POST /users
// Manager only. body: { name, email, password, role }
router.post('/', requireAuth, requireRole('manager'), async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }

  if (!['supervisor', 'manager'].includes(role)) {
    return res.status(400).json({ error: "role must be 'supervisor' or 'manager'" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `insert into users (name, email, password_hash, role)
       values ($1, $2, $3, $4)
       returning id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      // unique violation on email
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    console.error('[users/create]', err);
    res.status(500).json({ error: 'Could not create user' });
  }
});

module.exports = router;
