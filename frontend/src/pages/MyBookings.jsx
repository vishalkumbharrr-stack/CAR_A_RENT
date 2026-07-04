import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useWebSocket from '../hooks/useWebSocket';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { messages } = useWebSocket('ws://localhost:8000/ws/bookings');

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Listen for real-time updates
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.type === 'booking_update' || lastMsg.type === 'new_booking') {
        fetchBookings();
      }
    }
  }, [messages, fetchBookings]);

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await api.put(`/bookings/${bookingId}/status?status=cancelled`);
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
        );
      } catch (err) {
        alert('Failed to cancel booking: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-success',
      ongoing: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  const getStatusEmoji = (status) => {
    const emojis = {
      pending: '⏳',
      confirmed: '✅',
      ongoing: '🚗',
      completed: '🏁',
      cancelled: '❌',
    };
    return emojis[status] || '📋';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rental"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h2 className="section-title">📋 My Bookings</h2>

      {/* Live indicator */}
      <div className="flex items-center justify-end gap-2 mb-4 text-sm text-green-600">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Live Updates Active
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-7xl">📭</span>
          <h3 className="text-2xl font-semibold text-gray-700 mt-4">No Bookings Yet</h3>
          <p className="text-gray-500 mt-2 text-lg">Start by browsing available cars!</p>
          <Link to="/" className="btn-primary inline-block mt-6 text-lg">
            Browse Cars
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className={`card p-4 md:p-6 transition ${
                booking.status === 'cancelled' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Car Image */}
                <img
                  src={booking.cars?.image_url || 'https://via.placeholder.com/120'}
                  alt={booking.cars?.name}
                  className="w-full sm:w-28 h-28 object-cover rounded-lg"
                />

                {/* Booking Details */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{booking.cars?.name || 'Unknown Car'}</h3>
                      <p className="text-gray-500 text-sm">{booking.cars?.brand}</p>
                    </div>
                    <span className={`${getStatusBadge(booking.status)}`}>
                      {getStatusEmoji(booking.status)} {booking.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Start:</span>{' '}
                      <span className="font-semibold">{booking.start_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">End:</span>{' '}
                      <span className="font-semibold">{booking.end_date}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xl font-bold text-rental-dark">₹{booking.total_amount}</p>
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="text-red-500 hover:text-red-700 font-semibold text-sm hover:underline"
                      >
                        Cancel Booking
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        ✅ Trip Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}