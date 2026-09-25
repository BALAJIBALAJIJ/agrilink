import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('agrilink_token');
    const savedUser = localStorage.getItem('agrilink_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('agrilink_token');
        localStorage.removeItem('agrilink_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (mobileNumber, password) => {
    const res = await api.post('/auth/login', { mobileNumber, password });
    const authData = res.data.data;
    localStorage.setItem('agrilink_token', authData.token);
    localStorage.setItem('agrilink_user', JSON.stringify(authData));
    setUser(authData);
    return authData;
  }, []);

  const adminLogin = useCallback(async (username, password) => {
    const res = await api.post('/auth/admin/login', { mobileNumber: username, password });
    const authData = res.data.data;
    localStorage.setItem('agrilink_token', authData.token);
    localStorage.setItem('agrilink_user', JSON.stringify(authData));
    setUser(authData);
    return authData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const authData = res.data.data;
    localStorage.setItem('agrilink_token', authData.token);
    localStorage.setItem('agrilink_user', JSON.stringify(authData));
    setUser(authData);
    return authData;
  }, []);

  const googleAuth = useCallback(async (credential, role) => {
    const res = await api.post(`/auth/google?role=${role}`, { credential });
    const authData = res.data.data;
    localStorage.setItem('agrilink_token', authData.token);
    localStorage.setItem('agrilink_user', JSON.stringify(authData));
    setUser(authData);
    return authData;
  }, []);

  const completeProfile = useCallback(async (data) => {
    const res = await api.post('/auth/complete-profile', data);
    const authData = res.data.data;
    localStorage.setItem('agrilink_user', JSON.stringify(authData));
    setUser(authData);
    return authData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('agrilink_token');
    localStorage.removeItem('agrilink_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('agrilink_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, login, adminLogin, register, googleAuth, completeProfile, logout, updateUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      isFarmer: user?.role === 'FARMER',
      isBuyer: user?.role === 'BUYER',
      isTransporter: user?.role === 'TRANSPORTER',
      isVerified: user?.verificationStatus === 'APPROVED',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
