import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data.bookings);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (booking_id) => {
    if (!window.confirm('Cancel this booking? Seats will be restored.')) return;
    try {
      await api.delete(`/bookings/${booking_id}`);
      setMsg('Booking cancelled.');
      fetchBookings();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to cancel.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">My Bookings</h1>
      <p className="text-slate-500 mb-6">All your carpool reservations</p>

      {msg && (
        <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
          {msg}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="card text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">📋</p>
          <p className="font-medium">No bookings yet.</p>
          <Link to="/trips" className="text-brand-600 font-semibold mt-2 inline-block hover:underline">Browse trips →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.booking_id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-slate-800">{b.origin} → {b.destination}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                      b.status === 'confirmed' ? 'bg-blue-100 text-blue-700'
                      : b.status === 'cancelled' ? 'bg-slate-100 text-slate-500'
                      : 'bg-amber-100 text-amber-700'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 space-y-0.5">
                    <p>🕐 {new Date(b.departure_time).toLocaleString()}</p>
                    <p>👤 Driver: <strong className="text-slate-700">{b.driver_name}</strong></p>
                    <p>💺 {b.seats_booked} seat(s) · 💰 ฿{b.amount}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {/* Payment status */}
                  <span className={`badge-${b.payment_status === 'paid' ? 'paid' : b.status === 'cancelled' ? 'cancelled' : 'pending'}`}>
                    {b.payment_status === 'paid' ? '✓ Paid' : b.payment_status === 'pending' ? '⏳ Unpaid' : b.payment_status}
                  </span>

                  {/* Actions */}
                  {b.status !== 'cancelled' && b.payment_status !== 'paid' && (
                    <>
                      <Link to={`/payment/${b.booking_id}`} className="btn-primary text-xs py-1.5 px-3">
                        💳 Pay Now
                      </Link>
                      <button onClick={() => handleCancel(b.booking_id)} className="btn-danger text-xs py-1.5 px-3">
                        Cancel
                      </button>
                    </>
                  )}
                  {b.payment_status === 'paid' && (
                    <Link to={`/review/${b.trip_id}`} className="btn-secondary text-xs py-1.5 px-3">
                      ⭐ Write Review
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
