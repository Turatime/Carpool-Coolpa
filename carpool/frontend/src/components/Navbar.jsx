import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8l2-2zM13 6l3 5h3l1 2v3h-2M13 6h2l3 5" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl text-slate-800">RideShare</span>
        </Link>

        {/* Nav links */}
        {user ? (
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition">Dashboard</Link>
            <Link to="/trips" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition">Find Trips</Link>
            {user.role === 'driver' && (
              <>
                <Link to="/create-trip" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition">Post Trip</Link>
                <Link to="/vehicles" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition">Vehicles</Link>
              </>
            )}
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-500 hover:text-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
