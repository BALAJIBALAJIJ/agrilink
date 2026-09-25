import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobileNumber: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mobileNumber || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const auth = await login(form.mobileNumber, form.password);
      toast.success('Welcome back!');
      if (!auth.profileCompleted) {
        navigate('/profile/complete');
      } else {
        const paths = {
          FARMER: '/farmer/dashboard', BUYER: '/buyer/dashboard',
          TRANSPORTER: '/transporter/dashboard', ADMIN: '/admin/dashboard',
        };
        navigate(paths[auth.role] || '/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{t('auth.loginTitle')}</h1>
            <p className="text-gray-500 mt-1 text-sm">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.mobileNumber')}</label>
              <input
                type="tel"
                value={form.mobileNumber}
                onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                className="input-field"
                placeholder="9876543210"
                maxLength={10}
                required
                aria-label={t('auth.mobileNumber')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                  aria-label={t('auth.password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3.5 text-base disabled:opacity-60"
            >
              {loading ? t('common.loading') : t('auth.signIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('auth.noAccount')}{' '}
              <Link to="/auth/register" className="text-agri-green font-semibold hover:underline">
                {t('auth.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
