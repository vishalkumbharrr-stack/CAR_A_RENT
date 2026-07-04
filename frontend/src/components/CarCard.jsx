import { Link } from 'react-router-dom';

export default function CarCard({ car, adminView, onEdit, onDelete }) {
  return (
    <div className="card group">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={car.image_url || 'https://via.placeholder.com/400x250?text=No+Image'}
          alt={car.name}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 flex flex-wrap gap-1">
          <span className="badge-info capitalize">{car.category}</span>
          <span className={`badge ${car.rental_type === 'tour' ? 'badge-warning' : 'badge-success'}`}>
            {car.rental_type === 'tour' ? '🗺️ Tour' : '🏙️ Local'}
          </span>
        </div>
        {car.available === false && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg rotate-[-15deg]">
              BOOKED
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-800 mb-1 truncate">{car.name}</h3>
        <p className="text-gray-500 text-sm mb-2">{car.brand}</p>
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <span>📍 {car.location || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-rental-dark">
            ₹{car.price_per_day}<span className="text-sm text-gray-500 font-normal">/day</span>
          </span>
          {car.available !== false && (
            <span className="badge-success">Available</span>
          )}
        </div>

        {adminView ? (
          <div className="flex gap-2 mt-4">
            <button onClick={() => onEdit(car)} className="btn-primary flex-1 text-sm py-2">
              ✏️ Edit
            </button>
            <button onClick={() => onDelete(car.id)} className="btn-danger flex-1 text-sm py-2">
              🗑️ Delete
            </button>
          </div>
        ) : (
          <Link to={`/cars/${car.id}`} className="btn-primary block text-center mt-4">
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}