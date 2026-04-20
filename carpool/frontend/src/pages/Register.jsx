import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ name: '', email: '', password: '', role: 'passenger', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-1">Join RideShare today</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input name="name" required className="input" placeholder="John Doe"
                value={form.name} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="input" placeholder="you@example.com"
                value={form.email} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input name="phone" className="input" placeholder="+66 81 234 5678"
                value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" required className="input" placeholder="Min. 6 characters"
                value={form.password} onChange={handleChange} />
            </div>
            <div>
              <label className="label">I want to join as</label>
              <div className="grid grid-cols-2 gap-3">
                {['passenger', 'driver'].map((r) => (
                  <button
                    type="button" key={r}
                    onClick={() => setForm({ ...form, role: r })}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                      form.role === r
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-500 hover:border-brand-300'
                    }`}
                  >
                    {r === 'passenger' ? '🧳 Passenger' : '🚗 Driver'}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
