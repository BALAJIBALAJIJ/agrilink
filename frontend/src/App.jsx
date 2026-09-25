import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { connectWebSocket, disconnectWebSocket } from './services/websocket';
import Navbar from './components/layout/Navbar';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage'));
const ProfileCompletePage = lazy(() => import('./pages/auth/ProfileCompletePage'));

const FarmerDashboard = lazy(() => import('./pages/farmer/FarmerDashboard'));
const FarmerProducts = lazy(() => import('./pages/farmer/FarmerProducts'));
const CreateProduct = lazy(() => import('./pages/farmer/CreateProduct'));
const FarmerOrders = lazy(() => import('./pages/farmer/FarmerOrders'));

const BuyerDashboard = lazy(() => import('./pages/buyer/BuyerDashboard'));
const BuyerOrders = lazy(() => import('./pages/buyer/BuyerOrders'));
const ProductDetail = lazy(() => import('./pages/buyer/ProductDetail'));

const TransporterDashboard = lazy(() => import('./pages/transporter/TransporterDashboard'));
const LiveTracking = lazy(() => import('./pages/transporter/LiveTracking'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

const DryUnitDashboard = lazy(() => import('./pages/dryunit/DryUnitDashboard'));
const BiogasDashboard = lazy(() => import('./pages/biogas/BiogasDashboard'));

const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      connectWebSocket(user.userId, (notification) => {
        // Toast notification handled by individual pages
      });
      return () => disconnectWebSocket();
    }
  }, [isAuthenticated, user?.userId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', background: '#333', color: '#fff' },
        }}
      />
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/market" element={<MarketplacePage />} />

          {/* Auth Pages */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/profile/complete" element={
            <ProtectedRoute><ProfileCompletePage /></ProtectedRoute>
          } />

          {/* Farmer Routes */}
          <Route path="/farmer/dashboard" element={
            <ProtectedRoute roles={['FARMER']}><FarmerDashboard /></ProtectedRoute>
          } />
          <Route path="/farmer/products" element={
            <ProtectedRoute roles={['FARMER']}><FarmerProducts /></ProtectedRoute>
          } />
          <Route path="/farmer/products/create" element={
            <ProtectedRoute roles={['FARMER']}><CreateProduct /></ProtectedRoute>
          } />
          <Route path="/farmer/orders" element={
            <ProtectedRoute roles={['FARMER']}><FarmerOrders /></ProtectedRoute>
          } />
          <Route path="/farmer/*" element={
            <ProtectedRoute roles={['FARMER']}><FarmerDashboard /></ProtectedRoute>
          } />

          {/* Buyer Routes */}
          <Route path="/buyer/dashboard" element={
            <ProtectedRoute roles={['BUYER']}><BuyerDashboard /></ProtectedRoute>
          } />
          <Route path="/buyer/orders" element={
            <ProtectedRoute roles={['BUYER']}><BuyerOrders /></ProtectedRoute>
          } />
          <Route path="/buyer/market" element={
            <ProtectedRoute roles={['BUYER']}><MarketplacePage /></ProtectedRoute>
          } />
          <Route path="/buyer/product/:id" element={<ProductDetail />} />
          <Route path="/buyer/*" element={
            <ProtectedRoute roles={['BUYER']}><BuyerDashboard /></ProtectedRoute>
          } />

          {/* Transporter Routes */}
          <Route path="/transporter/dashboard" element={
            <ProtectedRoute roles={['TRANSPORTER']}><TransporterDashboard /></ProtectedRoute>
          } />
          <Route path="/transporter/live/:requestId" element={
            <ProtectedRoute roles={['TRANSPORTER']}><LiveTracking /></ProtectedRoute>
          } />
          <Route path="/transporter/*" element={
            <ProtectedRoute roles={['TRANSPORTER']}><TransporterDashboard /></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
          } />

          {/* Dry Unit & Biogas Routes */}
          <Route path="/dry-unit/*" element={
            <ProtectedRoute roles={['DRY_UNIT_MANAGER', 'FARMER']}><DryUnitDashboard /></ProtectedRoute>
          } />
          <Route path="/biogas/*" element={
            <ProtectedRoute roles={['BIOGAS_MANAGER', 'FARMER']}><BiogasDashboard /></ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
