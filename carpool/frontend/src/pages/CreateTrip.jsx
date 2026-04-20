import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CreateTrip() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicle_id: '', origin: '', destination: '',
    departure_time: '', available_seats: '', price: '',
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/vehicles').then(r => setVehicles(r.data.vehicles)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (Number(form.available_seats) <= 0) { setError('Seats must be greater than 0.'); return; }
    if (Number(form.price) < 0)            { setError('Price cannot be negative.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/trips', form);
      setSuccess(`Trip created! ID: #${res.data.trip_id}`);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-800">Post a Trip</h1>
        <p className="text-slate-500 mt-1">Fill in your trip details below</p>
      </div>

      <div className="card">
        {error   && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
        {success && <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {vehicles.length > 0 && (
            <div>
              <label className="label">Vehicle (optional)</label>
              <select name="vehicle_id" className="input" value={form.vehicle_id} onChange={handleChange}>
                <option value="">— Select a vehicle —</option>
                {vehicles.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.model} · {v.license_plate} · {v.capacity} seats
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Origin</label>
              <input name="origin" required className="input" placeholder="e.g. Bangkok"
                value={form.origin} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Destination</label>
              <input name="destination" required className="input" placeholder="e.g. Chiang Mai"
                value={form.destination} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="label">Departure Date & Time</label>
            <input name="departure_time" type="datetime-local" required className="input"
              value={form.departure_time} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Available Seats</label>
              <input name="available_seats" type="number" min="1" required className="input" placeholder="e.g. 3"
                value={form.available_seats} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Price per Seat (฿)</label>
              <input name="price" type="number" min="0" step="0.01" required className="input" placeholder="e.g. 350"
                value={form.price} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Posting…' : '🛣️ Post Trip'}
          </button>
        </form>
      </div>
    </div>
  );
}
