import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ license_plate: '', model: '', capacity: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data.vehicles);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await api.post('/vehicles', form);
      setSuccess('Vehicle added successfully!');
      setForm({ license_plate: '', model: '', capacity: '' });
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add vehicle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">My Vehicles</h1>
      <p className="text-slate-500 mb-8">Manage your registered vehicles</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Add vehicle form */}
        <div>
          <h2 className="font-display text-xl font-bold text-slate-700 mb-4">Add New Vehicle</h2>
          <div className="card">
            {error   && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
            {success && <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">License Plate</label>
                <input name="license_plate" required className="input" placeholder="กก 1234 กทม"
                  value={form.license_plate} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Car Model</label>
                <input name="model" required className="input" placeholder="Toyota Fortuner"
                  value={form.model} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Passenger Capacity</label>
                <input name="capacity" type="number" min="1" required className="input" placeholder="4"
                  value={form.capacity} onChange={handleChange} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Adding…' : '🚗 Add Vehicle'}
              </button>
            </form>
          </div>
        </div>

        {/* Vehicle list */}
        <div>
          <h2 className="font-display text-xl font-bold text-slate-700 mb-4">
            Registered Vehicles ({vehicles.length})
          </h2>
          {vehicles.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">🚘</p>
              <p>No vehicles yet. Add one on the left!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map(v => (
                <div key={v.vehicle_id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{v.model}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        🔖 {v.license_plate} · 💺 {v.capacity} seats
                      </p>
                    </div>
                    <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2 py-1 rounded-full">
                      #{v.vehicle_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
