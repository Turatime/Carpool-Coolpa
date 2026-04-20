import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [paying,  setPaying]    = useState(false);
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/bookings');
        const found = res.data.bookings.find(b => b.booking_id === Number(bookingId));
        if (!found) { setError('Booking not found.'); }
        else setBooking(found);
      } catch { setError('Could not load booking.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [bookingId]);

  const handlePay = async () => {
    setPaying(true); setError('');
    try {
      await api.post('/payments', { booking_id: Number(bookingId) });
      setSuccess('Payment successful! 🎉 You can now review this trip.');
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">Complete Payment</h1>
      <p className="text-slate-500 mb-8">Booking #{bookingId}</p>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}
      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl font-medium">{success}</div>
      )}

      {booking && !success && (
        <div className="card">
          {/* Order summary */}
          <h2 className="font-display font-bold text-lg text-slate-800 mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm text-slate-600 mb-6">
            <div className="flex justify-between">
              <span>Route</span>
              <span className="font-semibold text-slate-800">{booking.origin} → {booking.destination}</span>
            </div>
            <div className="flex justify-between">
              <span>Departure</span>
              <span className="font-semibold text-slate-800">{new Date(booking.departure_time).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Seats</span>
              <span className="font-semibold text-slate-800">{booking.seats_booked}</span>
            </div>
            <div className="flex justify-between">
              <span>Price per seat</span>
              <span className="font-semibold text-slate-800">฿{booking.price}</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between text-base">
              <span className="font-bold text-slate-800">Total</span>
              <span className="font-bold text-brand-600 text-xl">฿{booking.amount}</span>
            </div>
          </div>

          {/* Simulated payment method */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Payment Method</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <span className="text-sm font-medium text-slate-700">•••• •••• •••• 4242</span>
              <span className="ml-auto text-xs text-slate-400">Expires 12/26</span>
            </div>
          </div>

          {booking.payment_status === 'paid' ? (
            <div className="badge-paid text-center py-3 rounded-xl">Payment already completed ✓</div>
          ) : (
            <button onClick={handlePay} disabled={paying} className="btn-primary w-full text-base py-3">
              {paying ? 'Processing…' : `Pay ฿${booking.amount}`}
            </button>
          )}

          <p className="text-center text-xs text-slate-400 mt-3">
            🔒 This is a simulated payment for demo purposes
          </p>
        </div>
      )}
    </div>
  );
}
