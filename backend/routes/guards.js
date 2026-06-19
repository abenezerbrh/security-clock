// routes/guards.js
const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { verifyLicense } = require('../services/licenseVerification');

const router = express.Router();

// POST /guards/scan-lookup
// body: { licenseNumber }
//
// Given a license number (extracted from a scanned QR code), this:
//   1. Verifies the license against the Ontario PSIS registry
//   2. Finds the guard in our own DB by license number, or creates them
//      if this is their first time being scanned
//   3. Returns guard info + current license status, so the frontend can
//      decide whether to allow clock-in or flag it
router.post('/scan-lookup', requireAuth, async (req, res) => {
  const { licenseNumber } = req.body;

  if (!licenseNumber) {
    return res.status(400).json({ error: 'licenseNumber is required' });
  }

  const cleaned = String(licenseNumber).trim();
  if (!/^\d{6,8}$/.test(cleaned)) {
    return res.status(400).json({
      error: 'License number must be 6-8 digits. Check for typos and try again.',
    });
  }

  try {
    const verification = await verifyLicense(cleaned);

    if (!verification.found) {
      return res.status(404).json({
        error: 'License number not found in the Ontario PSIS registry',
      });
    }

    // Find or create the guard record in our own DB
    const existing = await pool.query(
      'select id, name, license_number from guards where license_number = $1',
      [verification.licenseNumber]
    );

    let guard = existing.rows[0];

    if (!guard) {
      const inserted = await pool.query(
        `insert into guards (name, license_number)
         values ($1, $2)
         returning id, name, license_number`,
        [verification.name, verification.licenseNumber]
      );
      guard = inserted.rows[0];
    }

    res.json({
      guard,
      licenseStatus: verification.status,
      licenseCategory: verification.category,
      isActive: verification.status?.toLowerCase() === 'active',
    });
  } catch (err) {
    console.error('[guards/scan-lookup]', err);
    res.status(500).json({ error: 'Could not complete license lookup' });
  }
});

module.exports = router;
