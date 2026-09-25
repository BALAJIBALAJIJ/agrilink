import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(form.username, form.password);
      toast.success('Admin login successful');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-gray-400 text-sm mt-1">AGRILINK Administration Panel</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Admin Username</label>
              <input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                placeholder="Admin username" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
