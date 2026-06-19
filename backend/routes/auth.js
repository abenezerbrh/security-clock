// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /auth/login
// body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { rows } = await pool.query(
      'select id, name, email, password_hash, role from users where email = $1',
      [email]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // const passwordMatches = await bcrypt.compare(password, user.password_hash);
    // if (!passwordMatches) {
    //   return res.status(401).json({ error: 'Invalid email or password' });
    // }

    console.log('--- LOGIN DEBUG ---');
console.log('Email received:', JSON.stringify(email));
console.log('Password received:', JSON.stringify(password));
console.log('Hash from DB:', JSON.stringify(user.password_hash));
console.log('Hash length:', user.password_hash.length);
console.log('Hash char codes:', [...user.password_hash].map(c => c.charCodeAt(0)).join(','));

const passwordMatches = await bcrypt.compare(password, user.password_hash);
console.log('Match result:', passwordMatches);

if (!passwordMatches) {
  return res.status(401).json({ error: 'Invalid email or password' });
}

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' } // a work shift's worth of session length
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Something went wrong logging in' });
  }
});

module.exports = router;
