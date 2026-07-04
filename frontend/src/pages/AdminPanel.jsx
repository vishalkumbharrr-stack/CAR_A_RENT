import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import CarCard from '../components/CarCard';
import useWebSocket from '../hooks/useWebSocket';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [showCarModal, setShowCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [newBookingsCount, setNewBookingsCount] = useState(0);
  const { messages, isConnected } = useWebSocket();   // 👈 auto URL

  // Car Form State – includes rental_type
  const [carForm, setCarForm] = useState({
    name: '',
    brand: '',
    category: 'sedan',
    rental_type: 'local',
    price_per_day: '',
    location: ''
  });
  const [carImage, setCarImage] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/admin/bookings');
      setBookings(res.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchCars = useCallback(async () => {
    try {
      const res = await api.get('/cars');
      setCars(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchRevenue = useCallback(async () => {
    try {
      const res = await api.get('/admin/revenue');
      setRevenue(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchCars();
    fetchRevenue();
  }, [fetchBookings, fetchCars, fetchRevenue]);

  // WebSocket listener – new booking aane par
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.type === 'new_booking') {
        setNewBookingsCount(prev => prev + 1);
        // Refresh list if already on bookings tab
        if (activeTab === 'bookings') {
          fetchBookings();
        }
      }
      // Also handle status updates if needed
      if (lastMsg.type === 'booking_update') {
        if (activeTab === 'bookings') {
          fetchBookings();
        }
      }
    }
  }, [messages, activeTab, fetchBookings]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'bookings') {
      setNewBookingsCount(0);
      fetchBookings(); // force refresh when tab opened
    }
  };

  const updateStatus = async (bookingId, status) => {
    if (!status) return;
    try {
      await api.put(`/bookings/${bookingId}/status?status=${status}`);
      setBookings(prev => prev.map(b => b.id === bookingId ? {...b, status} : b));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleCarSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", carForm.name);
    formData.append("brand", carForm.brand);
    formData.append("category", carForm.category);
    formData.append("rental_type", carForm.rental_type);
    formData.append("price_per_day", carForm.price_per_day);
    formData.append("location", carForm.location);
    if (carImage) formData.append("image", carImage);

    try {
      if (editingCar) {
        await api.put(`/cars/${editingCar.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post("/cars", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      closeModal();
      fetchCars();
    } catch (err) {
      alert("Failed to save car: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setCarForm({
      name: car.name,
      brand: car.brand,
      category: car.category,
      rental_type: car.rental_type || 'local',
      price_per_day: car.price_per_day,
      location: car.location || ''
    });
    setCarImage(null);
    setShowCarModal(true);
  };

  const handleDelete = async (carId) => {
    if (window.confirm('Are you sure you want to delete this car?')) {
      try {
        await api.delete(`/cars/${carId}`);
        fetchCars();
      } catch (err) {
        alert('Failed to delete car');
      }
    }
  };

  const closeModal = () => {
    setShowCarModal(false);
    setEditingCar(null);
    setCarForm({ name: '', brand: '', category: 'sedan', rental_type: 'local', price_per_day: '', location: '' });
    setCarImage(null);
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

  const tabs = ['bookings', 'cars'];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">⚙️ Admin Dashboard</h1>

      {/* Revenue Cards */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-rental-dark">₹{revenue.total_revenue}</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <p className="text-gray-600 text-sm">Online Revenue</p>
            <p className="text-3xl font-bold text-blue-600">₹{revenue.online_revenue}</p>
          </div>
          <div className="card p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <p className="text-gray-600 text-sm">Offline Revenue</p>
            <p className="text-3xl font-bold text-yellow-600">₹{revenue.offline_revenue}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`px-6 py-3 font-semibold rounded-t-lg transition capitalize relative ${
              activeTab === tab
                ? 'bg-rental text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab === 'bookings' ? '📋 Bookings' : '🚗 Manage Cars'}
            {/* Notification badge on Bookings tab */}
            {tab === 'bookings' && newBookingsCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 shadow-lg animate-pulse">
                {newBookingsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
              <span className="text-sm text-gray-500">
                {isConnected ? 'Live updates active' : 'Connecting...'}
              </span>
            </div>
            <button
              onClick={() => { fetchBookings(); setNewBookingsCount(0); }}
              className="btn-secondary text-sm py-1.5 px-4"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="table-header">
                  <th className="p-3 text-left">Booking ID</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Car</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Dates</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      <span className="text-4xl block mb-2">📋</span>
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="border-t hover:bg-gray-50 transition">
                      <td className="p-3 text-sm font-mono">{b.id?.slice(0, 8)}</td>
                      <td className="p-3 font-medium">{b.users?.full_name || 'N/A'}</td>
                      <td className="p-3 text-sm">{b.users?.phone || 'N/A'}</td>
                      <td className="p-3">{b.cars?.name || 'N/A'}</td>
                      <td className="p-3">
                        {b.cars?.rental_type ? (
                          <span className={`badge ${b.cars.rental_type === 'tour' ? 'badge-warning' : 'badge-success'}`}>
                            {b.cars.rental_type === 'tour' ? '🗺️ Tour' : '🏙️ Local'}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">{b.start_date} → {b.end_date}</td>
                      <td className="p-3 font-semibold">₹{b.total_amount}</td>
                      <td className="p-3">
                        <span className={getStatusBadge(b.status)}>{b.status}</span>
                      </td>
                      <td className="p-3">
                        <select
                          onChange={(e) => updateStatus(b.id, e.target.value)}
                          className="input-field text-sm py-1.5 min-w-[120px]"
                          defaultValue=""
                        >
                          <option value="" disabled>Change Status</option>
                          <option value="confirmed">✅ Confirm</option>
                          <option value="ongoing">🚗 Ongoing</option>
                          <option value="completed">🏁 Complete</option>
                          <option value="cancelled">❌ Cancel</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cars Tab – remaining code unchanged ... */}
      {/* ... (keep your existing Cars tab JSX, modal, etc.) */}
    </div>
  );
}