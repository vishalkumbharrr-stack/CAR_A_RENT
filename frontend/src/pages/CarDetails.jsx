import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function CarDetails() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get(`/cars/${id}`)
      .then((res) => setCar(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const totalDays = startDate && endDate
    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
    : 0;
  const totalAmount = totalDays * (car?.price_per_day || 0);

  const handleBooking = async () => {
    if (!user) { navigate('/login'); return; }
    if (!startDate || !endDate) {
      setBookingError('Please select both start and end dates');
      return;
    }
    setBookingError('');
    setBookingLoading(true);
    try {
      const params = new URLSearchParams({
        car_id: id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });
      const res = await api.post(`/bookings?${params.toString()}`);
      navigate(`/checkout/${res.data.id}`);
    } catch (err) {
      setBookingError(err.response?.data?.detail || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rental"></div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-20">
        <span className="text-6xl">🚫</span>
        <h3 className="text-xl font-semibold mt-4">Car Not Found</h3>
        <Link to="/" className="btn-primary inline-block mt-4">Back to Cars</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-8">
      <Link to="/" className="text-rental hover:underline inline-flex items-center gap-1 mb-4 sm:mb-6 text-sm sm:text-base">
        ← Back to Cars
      </Link>

      <div className="card overflow-hidden">
        <img
          src={car.image_url || 'https://via.placeholder.com/800x400?text=No+Image'}
          alt={car.name}
          className="w-full h-48 sm:h-64 md:h-96 object-cover"
        />

        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">{car.name}</h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                {car.brand} • <span className="capitalize">{car.category}</span>
              </p>
              <p className="text-gray-500 flex items-center gap-1 mt-2 text-sm">📍 {car.location || 'N/A'}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-3xl sm:text-4xl font-bold text-rental-dark">₹{car.price_per_day}</p>
              <p className="text-gray-500 text-sm">per day</p>
              {car.available !== false ? (
                <span className="badge-success inline-block mt-2">Available</span>
              ) : (
                <span className="badge-danger inline-block mt-2">Currently Booked</span>
              )}
            </div>
          </div>

          <hr className="my-4 sm:my-6" />

          {/* Booking Section */}
          {car.available !== false ? (
            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">📅 Book This Car</h3>

              {!user && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4 text-sm">
                  Please <Link to="/login" className="font-bold underline">login</Link> to book this car.
                </div>
              )}

              {/* Full Customer Profile (if logged in) */}
              {user && (
                <div className="bg-white border rounded-lg p-4 mb-4 space-y-3">
                  <h4 className="font-semibold text-gray-700">👤 Your Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Name:</span> {user.full_name}</div>
                    <div><span className="text-gray-500">Phone:</span> {user.phone || 'N/A'}</div>
                    <div className="col-span-2"><span className="text-gray-500">Address:</span> {user.address || 'N/A'}</div>
                    <div><span className="text-gray-500">Aadhaar:</span> {user.aadhaar_number || 'N/A'}</div>
                    <div><span className="text-gray-500">DL No.:</span> {user.dl_number || 'N/A'}</div>
                    <div><span className="text-gray-500">DL Expiry:</span> {user.dl_expiry || 'N/A'}</div>
                    <div><span className="text-gray-500">Emergency:</span> {user.emergency_contact || 'N/A'}</div>
                  </div>

                  {/* Aadhaar Photo */}
                  {user.aadhaar_image_url && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Aadhaar Photo</p>
                      <img src={user.aadhaar_image_url} alt="Aadhaar" className="w-24 h-16 object-cover rounded border" />
                    </div>
                  )}
                  {/* DL Photo */}
                  {user.dl_image_url && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">DL Photo</p>
                      <img src={user.dl_image_url} alt="DL" className="w-24 h-16 object-cover rounded border" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1.5">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    placeholderText="Select start date"
                    minDate={new Date()}
                    className="input-field w-full"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1.5">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    placeholderText="Select end date"
                    minDate={startDate || new Date()}
                    className="input-field w-full"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>

              {totalDays > 0 && (
                <div className="mt-4 sm:mt-6 bg-white p-4 rounded-lg border space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold">{totalDays} day{totalDays > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate:</span>
                    <span>₹{car.price_per_day} × {totalDays}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg sm:text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-rental-dark">₹{totalAmount}</span>
                  </div>
                </div>
              )}

              {bookingError && (
                <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  ⚠️ {bookingError}
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={!user || !startDate || !endDate || bookingLoading}
                className={`mt-4 w-full py-3 text-base sm:text-lg font-bold rounded-xl transition ${
                  user && startDate && endDate && !bookingLoading
                    ? 'btn-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {bookingLoading ? 'Booking...' : '🚗 Proceed to Checkout'}
              </button>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 p-6 sm:p-8 rounded-xl text-center">
              <span className="text-5xl sm:text-6xl">🚫</span>
              <h3 className="text-lg sm:text-xl font-bold text-red-600 mt-4">Currently Unavailable</h3>
              <p className="text-red-500 mt-2 text-sm sm:text-base">This car is currently booked. Please browse other cars.</p>
              <Link to="/" className="btn-primary inline-block mt-4">Browse Cars</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}