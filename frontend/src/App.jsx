import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CarDetails from './pages/CarDetails';
import Checkout from './pages/Checkout';
import MyBookings from './pages/MyBookings';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import { Toaster, toast } from 'react-hot-toast';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-rental"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  // Check profile completeness for customers
  if (user.role === 'customer') {
    const requiredFields = ['address', 'aadhaar_number', 'dl_number'];
    const missing = requiredFields.filter(field => !user[field]);
    if (missing.length > 0) {
      toast.error('Please complete your profile (Address, Aadhaar, Driving Licence) before proceeding.');
      return <Navigate to={`/profile?redirect=${encodeURIComponent(location.pathname)}`} />;
    }
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-rental"></div>
    </div>
  );
  return user?.role === 'admin' ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/cars/:id" element={<CarDetails />} />
              <Route path="/checkout/:bookingId" element={<PrivateRoute><Checkout /></PrivateRoute>} />
              <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}