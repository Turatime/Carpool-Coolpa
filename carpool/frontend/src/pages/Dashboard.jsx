import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role === 'passenger') {
          const res = await api.get('/bookings');
          setBookings(res.data.bookings);
        } else {
          const res = await api.get('/trips');
          setTrips(res.data.trips.filter(t => t.driver_id === user.user_id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleCancel = async (booking_id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.delete(`/bookings/${booking_id}`);
      setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-800">
          Welcome, {user.name} 👋
        </h1>
        <p className="text-slate-500 mt-1 capitalize">
          {user.role} Dashboard
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {user.role === 'passenger' ? (
          <>
            <Link to="/trips" className="card hover:border-brand-300 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">🔍</div>
              <p className="font-semibold text-slate-700 text-sm">Find Trips</p>
            </Link>
            <Link to="/bookings" className="card hover:border-brand-300 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="font-semibold text-slate-700 text-sm">My Bookings</p>
            </Link>
          </>
        ) : (
          <>
            <Link to="/create-trip" className="card hover:border-brand-300 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">➕</div>
              <p className="font-semibold text-slate-700 text-sm">Post a Trip</p>
            </Link>
            <Link to="/vehicles" className="card hover:border-brand-300 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-2">🚗</div>
              <p className="font-semibold text-slate-700 text-sm">My Vehicles</p>
            </Link>
          </>
        )}
      </div>

      {/* Passenger: recent bookings */}
      {user.role === 'passenger' && (
        <div>
          <h2 className="font-display text-xl font-bold text-slate-800 mb-4">Recent Bookings</h2>
          {bookings.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">🗺️</p>
              <p>No bookings yet. <Link to="/trips" className="text-brand-600 font-semibold">Find a trip!</Link></p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map(b => (
                <div key={b.booking_id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{b.origin} → {b.destination}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {new Date(b.departure_time).toLocaleString()} · {b.seats_booked} seat(s) · Driver: {b.driver_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`badge-${b.payment_status === 'paid' ? 'paid' : b.status === 'cancelled' ? 'cancelled' : 'pending'}`}>
                      {b.payment_status === 'paid' ? '✓ Paid' : b.status === 'cancelled' ? 'Cancelled' : '⏳ Pending Payment'}
                    </span>
                    {b.status !== 'cancelled' && b.payment_status !== 'paid' && (
                      <>
                        <Link to={`/payment/${b.booking_id}`} className="btn-primary text-xs py-1.5 px-3">Pay Now</Link>
                        <button onClick={() => handleCancel(b.booking_id)} className="btn-danger text-xs py-1.5 px-3">Cancel</button>
                      </>
                    )}
                    {b.payment_status === 'paid' && (
                      <Link to={`/review/${b.trip_id}`} className="btn-secondary text-xs py-1.5 px-3">⭐ Review</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Driver: posted trips */}
      {user.role === 'driver' && (
        <div>
          <h2 className="font-display text-xl font-bold text-slate-800 mb-4">Your Posted Trips</h2>
          {trips.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">🛣️</p>
              <p>No trips yet. <Link to="/create-trip" className="text-brand-600 font-semibold">Create one!</Link></p>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map(t => (
                <div key={t.trip_id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{t.origin} → {t.destination}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {new Date(t.departure_time).toLocaleString()} · {t.available_seats} seats left · ฿{t.price}
                    </p>
                    {t.driver_avg_rating && <StarRating rating={t.driver_avg_rating} />}
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                    t.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
