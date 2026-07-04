import { useState, useEffect } from 'react';
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
  const { messages } = useWebSocket('ws://localhost:8000/ws/bookings');

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

  // Listen for new booking events
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.type === 'new_booking') {
        setNewBookingsCount(prev => prev + 1);
      }
    }
  }, [messages]);

  // Reset counter when admin clicks on Bookings tab
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'bookings') {
      setNewBookingsCount(0);
      fetchBookings(); 
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetchBookings();
    fetchCars();
    fetchRevenue();
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/bookings');
      setBookings(res.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchCars = async () => {
    try {
      const res = await api.get('/cars');
      setCars(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchRevenue = async () => {
    try {
      const res = await api.get('/admin/revenue');
      setRevenue(res.data);
    } catch (err) { console.error(err); }
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
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
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
                  <td colSpan={7} className="p-8 text-center text-gray-500">
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
      )}

      {/* Cars Tab */}
      {activeTab === 'cars' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {cars.length} Car{cars.length !== 1 ? 's' : ''} Listed
            </h2>
            <button
              onClick={() => { closeModal(); setShowCarModal(true); }}
              className="btn-primary text-lg"
            >
              + Add New Car
            </button>
          </div>

          {/* Car Modal */}
          {showCarModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">
                    {editingCar ? '✏️ Edit Car' : '🚗 Add New Car'}
                  </h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCarSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Car Name *</label>
                    <input
                      placeholder="e.g., Honda City"
                      required
                      className="input-field"
                      value={carForm.name}
                      onChange={(e) => setCarForm({ ...carForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Brand *</label>
                    <input
                      placeholder="e.g., Honda"
                      required
                      className="input-field"
                      value={carForm.brand}
                      onChange={(e) => setCarForm({ ...carForm, brand: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Category *</label>
                    <select
                      className="input-field"
                      value={carForm.category}
                      onChange={(e) => setCarForm({ ...carForm, category: e.target.value })}
                    >
                      <option value="sedan">🚙 Sedan</option>
                      <option value="suv">🚘 SUV</option>
                      <option value="hatchback">🚗 Hatchback</option>
                      <option value="luxury">🏎️ Luxury</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Rental Type *</label>
                    <select
                      className="input-field"
                      value={carForm.rental_type}
                      onChange={(e) => setCarForm({ ...carForm, rental_type: e.target.value })}
                    >
                      <option value="local">🏙️ Local</option>
                      <option value="tour">🗺️ Tour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Price per Day (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g., 1500"
                      required
                      className="input-field"
                      value={carForm.price_per_day}
                      onChange={(e) => setCarForm({ ...carForm, price_per_day: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">City / Location</label>
                    <input
                      placeholder="e.g., Mumbai"
                      className="input-field"
                      value={carForm.location}
                      onChange={(e) => setCarForm({ ...carForm, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Car Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="input-field"
                      onChange={(e) => setCarImage(e.target.files[0])}
                    />
                    {editingCar?.image_url && !carImage && (
                      <img src={editingCar.image_url} alt="Current" className="mt-2 w-32 h-20 object-cover rounded" />
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="btn-primary flex-1 text-lg py-3">
                      {editingCar ? '💾 Update Car' : '➕ Add Car'}
                    </button>
                    <button type="button" onClick={closeModal} className="btn-secondary flex-1 text-lg py-3">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Cars Grid */}
          {cars.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-7xl">🚙</span>
              <h3 className="text-2xl font-semibold text-gray-700 mt-4">No Cars Added Yet</h3>
              <p className="text-gray-500 mt-2 text-lg">Click "Add New Car" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  adminView={true}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}