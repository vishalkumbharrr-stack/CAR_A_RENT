import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useWebSocket from '../hooks/useWebSocket';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { messages } = useWebSocket('ws://localhost:8000/ws/bookings');
  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-rental-darker via-rental-dark to-rental text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-3xl group-hover:animate-bounce">🚗</span>
            <span className="font-bold text-xl hidden sm:block">CarRental</span>
          </Link>

          {/* Mobile menu button */}
          <button
            className="sm:hidden text-white text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          {/* Desktop menu */}
          <div className="hidden sm:flex items-center space-x-3">
            {user ? (
              <>
                {/* My Bookings – only for customers */}
                {user.role !== 'admin' && (
                  <Link to="/my-bookings" className="nav-link">
                    📋 My Bookings
                  </Link>
                )}

                {/* Admin link – simple, no badge */}
                {user.role === 'admin' && (
                  <Link to="/admin" className="nav-link">
                    ⚙️ Admin
                  </Link>
                )}

                <span className="text-white/70 px-2 hidden lg:block text-sm">
                  👤 {user.full_name || 'User'}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition font-semibold text-sm active:scale-95"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/signup" className="bg-white text-rental-dark hover:bg-gray-100 px-4 py-2 rounded-lg transition font-semibold text-sm">
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-3 space-y-2">
            {user ? (
              <>
                {user.role !== 'admin' && (
                  <Link to="/my-bookings" className="block py-2 px-3 rounded hover:bg-white/20" onClick={() => setMenuOpen(false)}>
                    📋 My Bookings
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="block py-2 px-3 rounded hover:bg-white/20" onClick={() => setMenuOpen(false)}>
                    ⚙️ Admin
                  </Link>
                )}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full text-left py-2 px-3 rounded hover:bg-red-500">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 px-3 rounded hover:bg-white/20" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/signup" className="block py-2 px-3 rounded bg-white text-rental-dark font-semibold" onClick={() => setMenuOpen(false)}>Signup</Link>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .nav-link {
          @apply px-3 py-2 rounded-lg hover:bg-white/20 transition text-sm font-medium;
        }
      `}</style>
    </nav>
  );
}