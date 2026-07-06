import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-rental-darker via-rental-dark to-rental text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex justify-between items-center py-2 sm:py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-1 sm:space-x-2 group">
            <span className="text-2xl sm:text-3xl group-hover:animate-bounce">🚗</span>
            <span className="font-bold text-lg sm:text-xl">CarRental</span>
          </Link>

          {/* Mobile menu button */}
          <button
            className="sm:hidden text-white text-2xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          {/* Desktop menu */}
          <div className="hidden sm:flex items-center space-x-1 sm:space-x-3">
            {user ? (
              <>
                {/* Profile link – visible to all logged‑in users */}
                <Link to="/profile" className="nav-link text-xs sm:text-sm">
                  👤 Profile
                </Link>

                {user.role !== 'admin' && (
                  <Link to="/my-bookings" className="nav-link text-xs sm:text-sm">
                    📋 My Bookings
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="nav-link text-xs sm:text-sm">
                    ⚙️ Admin
                  </Link>
                )}
                <span className="text-white/70 px-1 sm:px-2 text-xs sm:text-sm hidden lg:block">
                  👤 {user.full_name || 'User'}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition font-semibold text-xs sm:text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link text-xs sm:text-sm">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-white text-rental-dark hover:bg-gray-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition font-semibold text-xs sm:text-sm"
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-3 space-y-1">
            {user ? (
              <>
                {/* Profile link – mobile */}
                <Link
                  to="/profile"
                  className="block py-2 px-3 rounded hover:bg-white/20 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  👤 Profile
                </Link>

                {user.role !== 'admin' && (
                  <Link
                    to="/my-bookings"
                    className="block py-2 px-3 rounded hover:bg-white/20 text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    📋 My Bookings
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block py-2 px-3 rounded hover:bg-white/20 text-sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    ⚙️ Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded hover:bg-red-500 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 px-3 rounded hover:bg-white/20 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block py-2 px-3 rounded bg-white text-rental-dark font-semibold text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .nav-link {
          @apply px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-white/20 transition text-xs sm:text-sm font-medium;
        }
      `}</style>
    </nav>
  );
}