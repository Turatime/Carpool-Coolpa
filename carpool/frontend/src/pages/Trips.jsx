import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';

export default function Trips() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [trips, setTrips]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState({ origin: '', destination: '' });
  const [booking, setBooking]     = useState({}); // { trip_id: seats }
  const [message, setMessage]     = useState('');

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.origin)      params.origin      = search.origin;
      if (search.destination) params.destination = search.destination;
      const res = await api.get('/trips', { params });
      setTrips(res.data.trips);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrips();
  };

  const handleBook = async (trip) => {
    if (!user) { navigate('/login'); return; }
    const seats = Number(booking[trip.trip_id] || 1);
    try {
      const res = await api.post('/bookings', { trip_id: trip.trip_id, seats_booked: seats });
      setMessage(`✅ Booked! Booking #${res.data.booking.booking_id}. Amount due: ฿${res.data.booking.amount_due}`);
      fetchTrips();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Booking failed.'}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">Find a Trip</h1>
      <p className="text-slate-500 mb-6">Browse available carpool seats</p>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="card flex flex-col sm:flex-row gap-3 mb-8">
        <input
          className="input flex-1" placeholder="🗺️ From (origin)…"
          value={search.origin} onChange={e => setSearch({ ...search, origin: e.target.value })}
        />
        <input
          className="input flex-1" placeholder="📍 To (destination)…"
          value={search.destination} onChange={e => setSearch({ ...search, destination: e.target.value })}
        />
        <button type="submit" className="btn-primary whitespace-nowrap">Search</button>
      </form>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
          message.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                   : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="card text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">🛣️</p>
          <p className="text-lg font-medium">No trips found.</p>
          <p className="text-sm mt-1">Try different search terms or check back later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map(trip => (
            <div key={trip.trip_id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Trip info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-display font-bold text-lg text-slate-800">
                      {trip.origin}
                    </span>
                    <span className="text-brand-500">→</span>
                    <span className="font-display font-bold text-lg text-slate-800">
                      {trip.destination}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mb-3">
                    <span>🕐 {new Date(trip.departure_time).toLocaleString()}</span>
                    <span>💺 {trip.available_seats} seats left</span>
                    <span>💰 ฿{trip.price} / seat</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center font-bold text-brand-700 text-xs">
                      {trip.driver_name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700">{trip.driver_name}</span>
                    {trip.driver_avg_rating > 0 && <StarRating rating={trip.driver_avg_rating} />}
                    {!trip.driver_avg_rating && <span className="text-slate-400 text-xs">No ratings yet</span>}
                  </div>
                </div>

                {/* Booking section */}
                {user?.role === 'passenger' && trip.available_seats > 0 && (
                  <div className="flex items-center gap-3">
                    <select
                      className="input w-24"
                      value={booking[trip.trip_id] || 1}
                      onChange={e => setBooking({ ...booking, [trip.trip_id]: e.target.value })}
                    >
                      {Array.from({ length: Math.min(trip.available_seats, 6) }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n} seat{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    <button onClick={() => handleBook(trip)} className="btn-primary whitespace-nowrap">
                      Book — ฿{(trip.price * (booking[trip.trip_id] || 1)).toFixed(0)}
                    </button>
                  </div>
                )}
                {trip.available_seats === 0 && (
                  <span className="badge-cancelled self-start">Full</span>
                )}
                {!user && (
                  <Link to="/login" className="btn-secondary text-sm">Login to Book</Link>
                )}
              </div>

              {/* Reviews link */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Link to={`/reviews/${trip.trip_id}`} className="text-xs text-brand-600 hover:underline font-medium">
                  View reviews for this trip →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
