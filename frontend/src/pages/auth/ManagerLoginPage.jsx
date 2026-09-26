import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CONFIG = {
  'dry-unit': {
    title: '🏭 Dry Unit Manager',
    subtitle: 'Manage vegetable drying requests',
    gradient: 'from-orange-600 to-amber-700',
    bg: 'from-orange-900 to-amber-900',
    border: 'border-orange-700',
    focus: 'focus:border-orange-500 focus:ring-orange-500/20',
    btn: '!bg-orange-600 hover:!bg-orange-700',
    role: 'DRY_UNIT_MANAGER',
    redirect: '/dry-unit',
  },
  'biogas': {
    title: '⚡ Biogas Plant Manager',
    subtitle: 'Manage waste collection requests',
    gradient: 'from-green-600 to-teal-700',
    bg: 'from-green-900 to-teal-900',
    border: 'border-green-700',
    focus: 'focus:border-green-500 focus:ring-green-500/20',
    btn: '!bg-green-600 hover:!bg-green-700',
    role: 'BIOGAS_MANAGER',
    redirect: '/biogas',
  },
};

export default function ManagerLoginPage() {
  const { type } = useParams(); // 'dry-unit' or 'biogas'
  const config = CONFIG[type] || CONFIG['dry-unit'];
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(form.mobile, form.password);
      if (result.role !== config.role) {
        toast.error(`This login is for ${config.title} only`);
        localStorage.removeItem('agrilink_token');
        localStorage.removeItem('agrilink_user');
        window.location.reload();
        return;
      }
      toast.success(`${config.title} login successful!`);
      navigate(config.redirect);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${config.bg} px-4`}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className={`bg-gray-800/80 backdrop-blur-lg border ${config.border} rounded-2xl p-8 shadow-2xl`}>
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">{config.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{config.subtitle}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mobile Number</label>
              <input type="text" value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})}
                className={`w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white ${config.focus} outline-none`}
                placeholder="9000000001" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                className={`w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white ${config.focus} outline-none`}
                placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className={`btn-primary w-full !py-3.5 ${config.btn}`}>
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-gray-700/50 rounded-xl text-center">
            <p className="text-xs text-gray-400">Default credentials:</p>
            <p className="text-xs text-gray-300 mt-1">
              {type === 'biogas' ? 'Mobile: 9000000002 | Pass: biogas123' : 'Mobile: 9000000001 | Pass: dryunit123'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
