const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const { authenticate, requireDriver } = require('../middleware/auth');

// POST /vehicles — driver adds a vehicle
router.post('/', authenticate, requireDriver, async (req, res) => {
  const { license_plate, model, capacity } = req.body;

  if (!license_plate || !model || !capacity) {
    return res.status(400).json({ error: 'license_plate, model, and capacity are required.' });
  }
  if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
    return res.status(400).json({ error: 'capacity must be a positive integer.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO vehicles (user_id, license_plate, model, capacity) VALUES (?, ?, ?, ?)',
      [req.user.user_id, license_plate, model, capacity]
    );
    res.status(201).json({
      message: 'Vehicle added.',
      vehicle: { vehicle_id: result.insertId, user_id: req.user.user_id, license_plate, model, capacity: Number(capacity) }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'License plate already registered.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /vehicles — get vehicles belonging to the logged-in driver
router.get('/', authenticate, requireDriver, async (req, res) => {
  try {
    const [vehicles] = await db.query(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.user_id]
    );
    res.json({ vehicles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
