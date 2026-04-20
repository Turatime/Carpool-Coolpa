const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const { authenticate } = require('../middleware/auth');

// POST /reviews — passenger reviews a trip (only after payment)
router.post('/', authenticate, async (req, res) => {
  const { trip_id, rating, comment } = req.body;

  if (!trip_id || !rating) {
    return res.status(400).json({ error: 'trip_id and rating are required.' });
  }
  if (Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ error: 'rating must be between 1 and 5.' });
  }

  try {
    // Only allow review if passenger has a PAID booking on this trip
    const [eligible] = await db.query(
      `SELECT b.booking_id
       FROM bookings b
       JOIN payments p ON p.booking_id = b.booking_id
       WHERE b.trip_id = ?
         AND b.passenger_id = ?
         AND b.status = 'confirmed'
         AND p.payment_status = 'paid'`,
      [trip_id, req.user.user_id]
    );

    if (eligible.length === 0) {
      return res.status(403).json({
        error: 'You can only review a trip after your payment is completed.'
      });
    }

    // Prevent duplicate review
    const [existing] = await db.query(
      'SELECT review_id FROM reviews WHERE trip_id = ? AND reviewer_id = ?',
      [trip_id, req.user.user_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this trip.' });
    }

    const [result] = await db.query(
      'INSERT INTO reviews (trip_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?)',
      [trip_id, req.user.user_id, rating, comment || null]
    );

    res.status(201).json({
      message: 'Review submitted.',
      review: { review_id: result.insertId, trip_id, rating, comment }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /trips/:id/reviews — get all reviews for a trip with average rating
router.get('/trips/:id/reviews', async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.*, u.name AS reviewer_name
       FROM reviews r
       JOIN users u ON u.user_id = r.reviewer_id
       WHERE r.trip_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    const [avg] = await db.query(
      'SELECT ROUND(AVG(rating), 1) AS average_rating, COUNT(*) AS total FROM reviews WHERE trip_id = ?',
      [req.params.id]
    );

    res.json({
      average_rating: avg[0].average_rating || 0,
      total_reviews: avg[0].total,
      reviews
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
