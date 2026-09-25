import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); setShowUserMenu(false); }, [location]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    const paths = {
      FARMER: '/farmer/dashboard', BUYER: '/buyer/dashboard',
      TRANSPORTER: '/transporter/dashboard', ADMIN: '/admin/dashboard',
      DRY_UNIT_MANAGER: '/dry-unit/dashboard', BIOGAS_MANAGER: '/biogas/dashboard',
    };
    return paths[user.role] || '/';
  };

  const isLanding = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled || !isLanding
        ? 'bg-white/95 backdrop-blur-lg shadow-md'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
              <img src="/logo.png" alt="AGRILINK Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <span className={`font-display font-bold text-xl hidden sm:block ${
              scrolled || !isLanding ? 'text-agri-green' : 'text-white'
            }`}>
              AGRILINK
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { to: '/', label: t('nav.home') },
              { to: '/how-it-works', label: t('nav.howItWorks') },
              { to: '/market', label: t('nav.marketplace') },
              { to: '/about', label: t('nav.about') },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-primary-100 text-agri-green'
                    : scrolled || !isLanding
                    ? 'text-gray-600 hover:text-agri-green hover:bg-gray-50'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                scrolled || !isLanding
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label="Toggle language"
            >
              {i18n.language === 'en' ? 'தமிழ்' : 'English'}
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-agri-green to-agri-leaf flex items-center justify-center text-white font-bold text-sm">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                    >
                      <Link to={getDashboardPath()} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        📊 {t('nav.dashboard')}
                      </Link>
                      <Link to={`/${user?.role?.toLowerCase()}/profile`} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        👤 {t('nav.profile')}
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        🚪 {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/auth/login" className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  scrolled || !isLanding ? 'text-gray-600 hover:text-agri-green' : 'text-white hover:bg-white/10'
                }`}>
                  {t('nav.login')}
                </Link>
                <Link to="/auth/register" className="btn-primary text-sm !px-5 !py-2.5">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-lg ${scrolled || !isLanding ? 'text-gray-600' : 'text-white'}`}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t shadow-lg"
          >
            <div className="px-4 py-4 space-y-2">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/how-it-works', label: t('nav.howItWorks') },
                { to: '/market', label: t('nav.marketplace') },
                { to: '/about', label: t('nav.about') },
              ].map(link => (
                <Link key={link.to} to={link.to} className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                  {link.label}
                </Link>
              ))}
              <hr className="border-gray-100" />
              <button onClick={toggleLanguage} className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                🌐 {i18n.language === 'en' ? 'தமிழ்' : 'English'}
              </button>
              {isAuthenticated ? (
                <>
                  <Link to={getDashboardPath()} className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                    📊 {t('nav.dashboard')}
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium">
                    🚪 {t('nav.logout')}
                  </button>
                </>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Link to="/auth/login" className="flex-1 text-center py-3 rounded-xl border-2 border-agri-green text-agri-green font-semibold">
                    {t('nav.login')}
                  </Link>
                  <Link to="/auth/register" className="flex-1 btn-primary text-center !py-3">
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
