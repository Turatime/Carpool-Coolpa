const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const { authenticate, requireDriver } = require('../middleware/auth');

// POST /trips — driver creates a trip
router.post('/', authenticate, requireDriver, async (req, res) => {
  const { vehicle_id, origin, destination, departure_time, available_seats, price } = req.body;

  if (!origin || !destination || !departure_time || !available_seats || price === undefined) {
    return res.status(400).json({ error: 'origin, destination, departure_time, available_seats, and price are required.' });
  }
  if (Number(available_seats) <= 0) {
    return res.status(400).json({ error: 'available_seats must be greater than 0.' });
  }
  if (Number(price) < 0) {
    return res.status(400).json({ error: 'price cannot be negative.' });
  }

  try {
    // If vehicle provided, verify it belongs to this driver
    if (vehicle_id) {
      const [v] = await db.query(
        'SELECT vehicle_id FROM vehicles WHERE vehicle_id = ? AND user_id = ?',
        [vehicle_id, req.user.user_id]
      );
      if (v.length === 0) {
        return res.status(403).json({ error: 'Vehicle not found or does not belong to you.' });
      }
    }

    const [result] = await db.query(
      'INSERT INTO trips (driver_id, vehicle_id, origin, destination, departure_time, available_seats, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.user_id, vehicle_id || null, origin, destination, departure_time, available_seats, price]
    );
    res.status(201).json({
      message: 'Trip created.',
      trip_id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /trips — list all active trips (with driver's average rating)
router.get('/', async (req, res) => {
  const { origin, destination } = req.query;
  try {
    let query = `
      SELECT 
        t.*,
        u.name AS driver_name,
        u.phone AS driver_phone,
        ROUND(AVG(r.rating), 1) AS driver_avg_rating,
        COUNT(DISTINCT r.review_id) AS driver_review_count
      FROM trips t
      JOIN users u ON u.user_id = t.driver_id
      LEFT JOIN reviews r ON r.reviewer_id = t.driver_id
      WHERE t.status = 'active'
    `;
    const params = [];
    if (origin) {
      query += ' AND t.origin LIKE ?';
      params.push(`%${origin}%`);
    }
    if (destination) {
      query += ' AND t.destination LIKE ?';
      params.push(`%${destination}%`);
    }
    query += ' GROUP BY t.trip_id ORDER BY t.departure_time ASC';

    const [trips] = await db.query(query, params);
    res.json({ trips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /trips/:id — single trip detail
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.*,
        u.name AS driver_name,
        u.phone AS driver_phone,
        v.model AS vehicle_model,
        v.license_plate,
        ROUND(AVG(r.rating), 1) AS driver_avg_rating
      FROM trips t
      JOIN users u ON u.user_id = t.driver_id
      LEFT JOIN vehicles v ON v.vehicle_id = t.vehicle_id
      LEFT JOIN reviews r ON r.reviewer_id = t.driver_id
      WHERE t.trip_id = ?
      GROUP BY t.trip_id
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Trip not found.' });
    res.json({ trip: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
