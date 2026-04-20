import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar      from './components/Navbar';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import Trips       from './pages/Trips';
import CreateTrip  from './pages/CreateTrip';
import Vehicles    from './pages/Vehicles';
import Bookings    from './pages/Bookings';
import Payment     from './pages/Payment';
import Review      from './pages/Review';

// Protected route wrapper
function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/trips"     element={<Trips />} />
        <Route path="/reviews/:tripId" element={<Review />} />

        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/bookings"  element={<Protected role="passenger"><Bookings /></Protected>} />
        <Route path="/payment/:bookingId" element={<Protected role="passenger"><Payment /></Protected>} />
        <Route path="/review/:tripId"     element={<Protected role="passenger"><Review /></Protected>} />
        <Route path="/create-trip"        element={<Protected role="driver"><CreateTrip /></Protected>} />
        <Route path="/vehicles"           element={<Protected role="driver"><Vehicles /></Protected>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
