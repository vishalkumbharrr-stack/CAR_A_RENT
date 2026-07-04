import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import PaymentOptions from '../components/PaymentOptions';

export default function Checkout() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get(`/bookings/${bookingId}`)
      .then((res) => setBooking(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rental"></div>
      </div>
    );
  }

  if (!booking) return null;

  // Calculate days
  const start = new Date(booking.start_date);
  const end = new Date(booking.end_date);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">💳 Checkout</h2>

      <div className="card p-6 md:p-8">
        {/* Booking Summary */}
        <div className="border-b pb-6 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Booking Summary</h3>
            <span className="text-sm text-gray-500">ID: #{booking.id?.slice(0, 8)}</span>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <img
            src={booking.cars?.image_url || 'https://via.placeholder.com/120'}
            alt={booking.cars?.name}
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div>
            <h4 className="font-bold text-lg">{booking.cars?.name}</h4>
            <p className="text-gray-500">{booking.cars?.brand}</p>
          </div>
        </div>

        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between">
            <span className="text-gray-600">Start Date:</span>
            <span className="font-semibold">{booking.start_date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">End Date:</span>
            <span className="font-semibold">{booking.end_date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-semibold">{days} day{days > 1 ? 's' : ''}</span>
          </div>
          <hr />
          <div className="flex justify-between text-xl font-bold">
            <span>Total Amount:</span>
            <span className="text-rental-dark">₹{booking.total_amount}</span>
          </div>
        </div>

        {/* Payment Section */}
        <div className="mt-6">
          <PaymentOptions booking={booking} />
        </div>
      </div>

      <Link to="/my-bookings" className="block text-center mt-6 text-gray-500 hover:text-rental transition">
        ← View My Bookings
      </Link>
    </div>
  );
}