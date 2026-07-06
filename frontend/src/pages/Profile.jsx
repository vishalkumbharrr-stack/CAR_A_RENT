import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = searchParams.get('redirect') || '/';

  const [form, setForm] = useState({
    address: '',
    emergency_contact: '',
    aadhaar_number: '',
    dl_number: '',
    dl_expiry: ''
  });
  const [aadhaarImage, setAadhaarImage] = useState(null);
  const [dlImage, setDlImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(res => {
      const u = res.data;
      setForm({
        address: u.address || '',
        emergency_contact: u.emergency_contact || '',
        aadhaar_number: u.aadhaar_number || '',
        dl_number: u.dl_number || '',
        dl_expiry: u.dl_expiry || ''
      });
    }).catch(console.error);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key]) formData.append(key, form[key]);
    });
    if (aadhaarImage) formData.append('aadhaar_image', aadhaarImage);
    if (dlImage) formData.append('dl_image', dlImage);

    try {
      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Update user context with new data
      const me = await api.get('/auth/me');
      if (setUser) setUser(me.data);

      setMessage('✅ Profile updated! Redirecting...');
      setTimeout(() => {
        navigate(redirectTo);
      }, 1500);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6">👤 My Profile</h2>
      {searchParams.get('redirect') && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4 text-sm text-yellow-700">
          ⚠️ Please complete your profile (Address, Aadhaar, Driving Licence) to continue.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 card p-6">
        <div>
          <label className="block text-sm font-semibold mb-1">Address *</label>
          <textarea name="address" className="input-field" required value={form.address} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Emergency Contact</label>
          <input type="tel" name="emergency_contact" className="input-field" value={form.emergency_contact} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Aadhaar Number *</label>
          <input type="text" name="aadhaar_number" className="input-field" required value={form.aadhaar_number} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Driving Licence Number *</label>
          <input type="text" name="dl_number" className="input-field" required value={form.dl_number} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">DL Expiry Date</label>
          <input type="date" name="dl_expiry" className="input-field" value={form.dl_expiry} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Aadhaar Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setAadhaarImage(e.target.files[0])} className="input-field" />
          {user?.aadhaar_image_url && !aadhaarImage && (
            <img src={user.aadhaar_image_url} alt="Aadhaar" className="mt-2 w-32 h-20 object-cover rounded" />
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Driving Licence Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setDlImage(e.target.files[0])} className="input-field" />
          {user?.dl_image_url && !dlImage && (
            <img src={user.dl_image_url} alt="DL" className="mt-2 w-32 h-20 object-cover rounded" />
          )}
        </div>
        {message && <p className="text-sm text-green-600">{message}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Saving...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}