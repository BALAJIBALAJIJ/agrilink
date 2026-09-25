import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50 flex items-center justify-center px-4 pt-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <div className="glass-card p-8 shadow-xl text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-5xl">⏳</span>
          </div>
          
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-3">
            Verification Pending
          </h1>
          
          <p className="text-gray-600 mb-2">
            Welcome <strong>{user?.fullName}</strong>! 🌾
          </p>
          
          <p className="text-gray-500 text-sm mb-6">
            Your profile has been submitted successfully. Our admin team will review and approve your account shortly.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">📋</span>
              <span className="font-semibold text-yellow-800 text-sm">Account Status</span>
            </div>
            <div className="space-y-1 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Role:</span>
                <span className="font-medium">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium text-yellow-600">⏳ Pending Approval</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profile:</span>
                <span className="font-medium text-green-600">✅ Completed</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            You will be able to access your dashboard once the admin approves your account.
          </p>

          <div className="space-y-3">
            <button onClick={() => window.location.reload()} 
              className="btn-primary w-full !py-3">
              🔄 Check Status
            </button>
            <button onClick={handleLogout} 
              className="btn-secondary w-full !py-3 text-sm">
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
