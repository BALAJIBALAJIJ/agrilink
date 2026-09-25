import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = '263551010978-hn145696j3t3relt5cv16gk0pofsiejh.apps.googleusercontent.com';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, googleAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobileNumber: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load Google Sign-In
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onload = () => initGoogleButton();
    return () => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) existing.remove();
    };
  }, []);

  const initGoogleButton = () => {
    const container = document.getElementById('google-signin-btn');
    if (!container || !window.google) return;
    container.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    window.google.accounts.id.renderButton(container, {
      theme: 'outline', size: 'large', width: '100%', text: 'signin_with',
      shape: 'pill', logo_alignment: 'center',
    });
  };

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    try {
      const authData = await googleAuth(response.credential, '');
      toast.success('Welcome back!');
      if (!authData.profileCompleted) {
        navigate('/profile/complete');
      } else {
        const paths = {
          FARMER: '/farmer/dashboard', BUYER: '/buyer/dashboard',
          TRANSPORTER: '/transporter/dashboard', ADMIN: '/admin/dashboard',
        };
        navigate(paths[authData.role] || '/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign in failed. Please register first.');
    } finally {
      setLoading(false);
    }
  };

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
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{t('auth.loginTitle')}</h1>
            <p className="text-gray-500 mt-1 text-sm">{t('auth.loginSubtitle')}</p>
          </div>

          {/* Google Sign In */}
          <div className="mb-4">
            <div id="google-signin-btn" className="flex justify-center"></div>
          </div>

          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-4 text-sm text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.mobileNumber')}</label>
              <input type="tel" value={form.mobileNumber}
                onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                className="input-field" placeholder="9876543210" maxLength={10} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-12" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 text-base disabled:opacity-60">
              {loading ? t('common.loading') : t('auth.signIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('auth.noAccount')}{' '}
              <Link to="/auth/register" className="text-agri-green font-semibold hover:underline">{t('auth.signUp')}</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
