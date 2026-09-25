import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check profile completion
  if (!user.profileCompleted && !window.location.pathname.includes('/profile/complete')) {
    return <Navigate to="/profile/complete" replace />;
  }

  // Check role authorization
  if (roles && !roles.includes(user.role)) {
    const redirectMap = {
      FARMER: '/farmer/dashboard',
      BUYER: '/buyer/dashboard',
      TRANSPORTER: '/transporter/dashboard',
      ADMIN: '/admin/dashboard',
      DRY_UNIT_MANAGER: '/dry-unit/dashboard',
      BIOGAS_MANAGER: '/biogas/dashboard',
    };
    return <Navigate to={redirectMap[user.role] || '/'} replace />;
  }

  return children;
}
