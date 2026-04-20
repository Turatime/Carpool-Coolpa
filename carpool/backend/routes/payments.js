const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const { authenticate } = require('../middleware/auth');

// POST /payments — complete payment for a booking
router.post('/', authenticate, async (req, res) => {
  const { booking_id } = req.body;

  if (!booking_id) {
    return res.status(400).json({ error: 'booking_id is required.' });
  }

  try {
    // Verify booking belongs to this passenger
    const [bookings] = await db.query(
      `SELECT b.*, p.payment_id, p.payment_status, p.amount
       FROM bookings b
       JOIN payments p ON p.booking_id = b.booking_id
       WHERE b.booking_id = ? AND b.passenger_id = ?`,
      [booking_id, req.user.user_id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking or payment not found.' });
    }

    const record = bookings[0];

    if (record.payment_status === 'paid') {
      return res.status(400).json({ error: 'Payment already completed.' });
    }
    if (record.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot pay for a cancelled booking.' });
    }

    // Mark payment as paid
    await db.query(
      'UPDATE payments SET payment_status = "paid", paid_at = NOW() WHERE booking_id = ?',
      [booking_id]
    );

    res.json({
      message: 'Payment successful.',
      payment: {
        payment_id: record.payment_id,
        booking_id,
        amount: record.amount,
        payment_status: 'paid'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
