import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer',   // 👈 Default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    try {
      // Pass role along with other data
      await signup(formData.phone, formData.password, formData.full_name, formData.role);
      alert('✅ Signup successful! Please login to continue.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="card max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <span className="text-4xl">📝</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-500 mt-2">Fill in the details to get started</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              placeholder="Enter your full name"
              required
              className="input-field"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="10-digit mobile number"
              required
              maxLength={10}
              className="input-field"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Account Type *
            </label>
            <select
              name="role"
              className="input-field"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="customer">🚗 Customer (Rent Cars)</option>
              <option value="admin">⚙️ Car Dealer / Admin</option>
            </select>
            {formData.role === 'admin' && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                ⚠️ Dealer accounts may require approval. Contact support if needed.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password *
            </label>
            <input
              type="password"
              name="password"
              placeholder="Min 6 characters"
              required
              className="input-field"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              required
              className="input-field"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg py-3.5 mt-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-rental-dark font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}