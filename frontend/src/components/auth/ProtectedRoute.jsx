import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check profile completion first
  if (!user.profileCompleted && !window.location.pathname.includes('/profile/complete')
      && !window.location.pathname.includes('/pending-approval')) {
    return <Navigate to="/profile/complete" replace />;
  }

  // Check if account is pending admin approval
  if (user.profileCompleted && user.verificationStatus === 'PENDING_VERIFICATION'
      && !window.location.pathname.includes('/pending-approval')
      && !window.location.pathname.includes('/profile/complete')
      && user.role !== 'ADMIN') {
    return <Navigate to="/pending-approval" replace />;
  }

  // Check role authorization
  if (roles && !roles.includes(user.role)) {
    const redirectMap = {
      FARMER: '/farmer/dashboard',
      BUYER: '/buyer/dashboard',
      TRANSPORTER: '/transporter/dashboard',
      ADMIN: '/admin/dashboard',
    };
    return <Navigate to={redirectMap[user.role] || '/'} replace />;
  }

  return children;
}
