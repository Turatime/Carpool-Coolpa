const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const { authenticate, requirePassenger } = require('../middleware/auth');

// POST /bookings — passenger books a trip
router.post('/', authenticate, requirePassenger, async (req, res) => {
  const { trip_id, seats_booked } = req.body;

  if (!trip_id || !seats_booked) {
    return res.status(400).json({ error: 'trip_id and seats_booked are required.' });
  }
  if (Number(seats_booked) <= 0) {
    return res.status(400).json({ error: 'seats_booked must be at least 1.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Lock trip row for update (prevent race conditions)
    const [trips] = await conn.query(
      'SELECT * FROM trips WHERE trip_id = ? AND status = "active" FOR UPDATE',
      [trip_id]
    );
    if (trips.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Trip not found or not active.' });
    }
    const trip = trips[0];

    // Prevent passenger from booking their own trip
    if (trip.driver_id === req.user.user_id) {
      await conn.rollback();
      return res.status(400).json({ error: 'Drivers cannot book their own trips.' });
    }

    // Check for duplicate booking
    const [existing] = await conn.query(
      'SELECT booking_id FROM bookings WHERE trip_id = ? AND passenger_id = ? AND status != "cancelled"',
      [trip_id, req.user.user_id]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ error: 'You already have an active booking for this trip.' });
    }

    // Overbooking check
    if (trip.available_seats < Number(seats_booked)) {
      await conn.rollback();
      return res.status(400).json({
        error: `Not enough seats. Only ${trip.available_seats} seat(s) available.`
      });
    }

    // Create booking
    const [bookingResult] = await conn.query(
      'INSERT INTO bookings (trip_id, passenger_id, seats_booked, status) VALUES (?, ?, ?, "confirmed")',
      [trip_id, req.user.user_id, seats_booked]
    );

    // Deduct seats immediately
    await conn.query(
      'UPDATE trips SET available_seats = available_seats - ? WHERE trip_id = ?',
      [seats_booked, trip_id]
    );

    // Auto-create a pending payment record
    const amount = trip.price * Number(seats_booked);
    await conn.query(
      'INSERT INTO payments (booking_id, amount, payment_status) VALUES (?, ?, "pending")',
      [bookingResult.insertId, amount]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Booking confirmed.',
      booking: {
        booking_id: bookingResult.insertId,
        trip_id,
        passenger_id: req.user.user_id,
        seats_booked,
        status: 'confirmed',
        amount_due: amount
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    conn.release();
  }
});

// GET /bookings — get current user's bookings
router.get('/', authenticate, async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT 
        b.*,
        t.origin, t.destination, t.departure_time, t.price,
        u.name AS driver_name,
        p.amount, p.payment_status
      FROM bookings b
      JOIN trips t ON t.trip_id = b.trip_id
      JOIN users u ON u.user_id = t.driver_id
      LEFT JOIN payments p ON p.booking_id = b.booking_id
      WHERE b.passenger_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.user_id]);
    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /bookings/:id — passenger cancels a booking
router.delete('/:id', authenticate, requirePassenger, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify booking belongs to user
    const [rows] = await conn.query(
      'SELECT * FROM bookings WHERE booking_id = ? AND passenger_id = ?',
      [req.params.id, req.user.user_id]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const booking = rows[0];
    if (booking.status === 'cancelled') {
      await conn.rollback();
      return res.status(400).json({ error: 'Booking is already cancelled.' });
    }

    // Cancel booking
    await conn.query(
      'UPDATE bookings SET status = "cancelled" WHERE booking_id = ?',
      [booking.booking_id]
    );

    // Restore seats
    await conn.query(
      'UPDATE trips SET available_seats = available_seats + ? WHERE trip_id = ?',
      [booking.seats_booked, booking.trip_id]
    );

    await conn.commit();
    res.json({ message: 'Booking cancelled and seats restored.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
