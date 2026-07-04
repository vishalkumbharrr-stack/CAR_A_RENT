import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await login(phone, password);
      navigate('/');
    } catch (err) {
      setError('Invalid phone number or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="card max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back!</h2>
          <p className="text-gray-500 mt-2">Login to access your account</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="Enter registered phone number"
              required
              maxLength={10}
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-lg py-3.5 mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center mt-8 text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-rental-dark font-semibold hover:underline">
            Signup here
          </Link>
        </p>
      </div>
    </div>
  );
}