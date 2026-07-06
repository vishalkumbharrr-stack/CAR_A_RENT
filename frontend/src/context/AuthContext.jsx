import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phone, password) => {
    const res = await api.post(`/auth/login?phone=${phone}&password=${password}`);
    localStorage.setItem('access_token', res.data.access_token);
    const me = await api.get('/auth/me');
    setUser(me.data);
  };

  const signup = async (formData) => {
    const params = new URLSearchParams();
    params.append('full_name', formData.full_name);
    params.append('phone', formData.phone);
    params.append('password', formData.password);
    params.append('role', formData.role);
    if (formData.address) params.append('address', formData.address);
    if (formData.aadhaar_number) params.append('aadhaar_number', formData.aadhaar_number);
    if (formData.dl_number) params.append('dl_number', formData.dl_number);
    if (formData.emergency_contact) params.append('emergency_contact', formData.emergency_contact);

    await api.post('/auth/signup', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};