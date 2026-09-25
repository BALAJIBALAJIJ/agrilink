import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = '263551010978-hn145696j3t3relt5cv16gk0pofsiejh.apps.googleusercontent.com';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser, googleAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRole = searchParams.get('role') || '';

  const [form, setForm] = useState({
    fullName: '', mobileNumber: '', password: '', confirmPassword: '',
    email: '', dateOfBirth: '', role: preselectedRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load Google Sign-In script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && form.role) {
        initGoogleButton();
      }
    };

    return () => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) existing.remove();
    };
  }, []);

  useEffect(() => {
    if (window.google && form.role) {
      initGoogleButton();
    }
  }, [form.role]);

  const initGoogleButton = () => {
    const container = document.getElementById('google-signup-btn');
    if (!container || !window.google) return;
    container.innerHTML = '';
    
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    window.google.accounts.id.renderButton(container, {
      theme: 'outline', size: 'large', width: '100%', text: 'continue_with',
      shape: 'pill', logo_alignment: 'center',
    });
  };

  const handleGoogleResponse = async (response) => {
    if (!form.role) {
      toast.error('Please select a role first (Farmer / Buyer / Transporter)');
      return;
    }
    setLoading(true);
    try {
      const authData = await googleAuth(response.credential, form.role);
      toast.success('Google sign up successful!');
      if (!authData.profileCompleted) {
        navigate('/profile/complete');
      } else {
        const paths = { FARMER: '/farmer/dashboard', BUYER: '/buyer/dashboard', TRANSPORTER: '/transporter/dashboard' };
        navigate(paths[authData.role] || '/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.mobileNumber || !form.password || !form.confirmPassword || !form.role) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
      toast.error('Invalid mobile number');
      return;
    }
    setLoading(true);
    try {
      await registerUser(form);
      toast.success('Registration successful!');
      navigate('/profile/complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 px-4 pt-24 pb-12">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{t('auth.registerTitle')}</h1>
            <p className="text-gray-500 mt-1 text-sm">{t('auth.registerSubtitle')}</p>
          </div>

          {/* Role Selection - ALWAYS FIRST */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {['FARMER', 'BUYER', 'TRANSPORTER'].map((role) => (
                <button key={role} type="button"
                  onClick={() => setForm({ ...form, role })}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    form.role === role
                      ? 'bg-agri-green text-white shadow-lg scale-105'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}>
                  {role === 'FARMER' ? '👨‍🌾' : role === 'BUYER' ? '🛍️' : '🚛'}
                  <div className="text-xs mt-1">{t(`roles.${role.toLowerCase()}`)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Google Sign Up Button */}
          {form.role && (
            <div className="mb-4">
              <div id="google-signup-btn" className="flex justify-center"></div>
              
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="px-4 text-sm text-gray-400">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>
          )}

          {!form.role && (
            <div className="text-center py-4 mb-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-700">👆 Please select your role first to continue</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.fullName')} *</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input-field" placeholder="Enter full name" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.mobileNumber')} *</label>
              <input type="tel" value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                className="input-field" placeholder="9876543210" maxLength={10} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.email')}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field" placeholder="email@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.dateOfBirth')}</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')} *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-12" placeholder="Min 8 characters" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5 flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${
                      form.password.length >= i * 3 ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.confirmPassword')} *</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="input-field pr-12" placeholder="Confirm password" required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !form.role} className="btn-primary w-full !py-3.5 text-base disabled:opacity-60">
              {loading ? t('common.loading') : t('auth.signUp')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('auth.hasAccount')}{' '}
              <Link to="/auth/login" className="text-agri-green font-semibold hover:underline">{t('auth.signIn')}</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
