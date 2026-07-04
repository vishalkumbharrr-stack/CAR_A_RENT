import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import CarCard from '../components/CarCard';

export default function Home() {
  const [cars, setCars] = useState([]);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [rentalType, setRentalType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCars = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (category) params.category = category;
      if (location.trim()) params.location = location.trim();
      if (rentalType) params.rental_type = rentalType;
      const res = await api.get('/cars', { params });
      setCars(res.data);
    } catch (err) {
      setError('Failed to load cars. Please try again.');
      console.error('Fetch cars error:', err);
    } finally {
      setLoading(false);
    }
  }, [category, location, rentalType]);

  useEffect(() => {
    fetchCars();
  }, [category, rentalType]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCars();
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-rental-darker via-rental-dark to-rental text-white py-10 sm:py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 leading-tight">
            🚗 Find Your Perfect Ride
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Choose from a wide range of cars available in your city. Best prices guaranteed!
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-xl p-2 shadow-2xl">
              <input
                type="text"
                placeholder="Enter your city name..."
                className="flex-1 p-3 sm:p-3.5 text-gray-800 rounded-lg focus:outline-none text-base sm:text-lg"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <button type="submit" className="btn-primary whitespace-nowrap text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-3.5">
                🔍 Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            {location ? `Cars in "${location}"` : 'Available Cars'}
          </h2>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field w-full sm:w-auto min-w-[140px] text-sm sm:text-base"
            >
              <option value="">🚘 All Categories</option>
              <option value="sedan">🚙 Sedan</option>
              <option value="suv">🚘 SUV</option>
              <option value="hatchback">🚗 Hatchback</option>
              <option value="luxury">🏎️ Luxury</option>
            </select>
            <select
              value={rentalType}
              onChange={(e) => setRentalType(e.target.value)}
              className="input-field w-full sm:w-auto min-w-[140px] text-sm sm:text-base"
            >
              <option value="">All Types</option>
              <option value="local">🏙️ Local</option>
              <option value="tour">🗺️ Tour</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rental mx-auto"></div>
            <p className="mt-4 text-gray-500 text-lg">Loading available cars...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-16">
            <span className="text-6xl">⚠️</span>
            <h3 className="text-xl font-semibold text-red-600 mt-4">Oops!</h3>
            <p className="text-gray-500 mt-2">{error}</p>
            <button onClick={fetchCars} className="btn-primary mt-4">Try Again</button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && cars.length === 0 && (
          <div className="text-center py-20">
            <span className="text-7xl">🚙</span>
            <h3 className="text-2xl font-semibold text-gray-700 mt-4">No Cars Available</h3>
            <p className="text-gray-500 mt-2 text-lg">
              {location ? `No cars found in "${location}".` : 'No cars listed yet.'}
            </p>
            <p className="text-gray-400 mt-1">Try changing your filters or check back later.</p>
          </div>
        )}

        {/* Cars Grid */}
        {!loading && !error && cars.length > 0 && (
          <>
            <p className="text-gray-500 mb-6">{cars.length} car{cars.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}