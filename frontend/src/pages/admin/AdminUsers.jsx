import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { user: admin } = useAuth();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [filter, setFilter] = useState({ role: '', status: searchParams.get('status') || '', search: '' });

  useEffect(() => { loadUsers(); }, [filter.role, filter.status]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.role) params.set('role', filter.role);
      if (filter.status) params.set('status', filter.status);
      if (filter.search) params.set('search', filter.search);
      params.set('page', '0'); params.set('size', '50');
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.data?.content || []);
    } catch {} finally { setLoading(false); }
  };

  const handleAction = async (userId, action) => {
    try {
      if (action === 'approve') {
        await api.put(`/admin/users/${userId}/approve`, { notes: 'Approved' });
        toast.success('User approved ✅');
      } else if (action === 'reject') {
        const reason = prompt('Rejection reason:');
        if (!reason) return;
        await api.put(`/admin/users/${userId}/reject`, { reason });
        toast.success('User rejected');
      } else if (action === 'suspend') {
        const reason = prompt('Suspension reason:');
        if (!reason) return;
        await api.put(`/admin/users/${userId}/suspend`, { reason });
        toast.success('User suspended');
      }
      loadUsers();
      setSelectedUser(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const viewUserDetails = async (u) => {
    setSelectedUser(u);
    try {
      const res = await api.get(`/profile/farmer/${u.id}`);
      setUserProfile(res.data.data);
    } catch {
      setUserProfile(null);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setUserProfile(null);
  };

  return (
    <div className="pt-20 pb-12 bg-gray-900 min-h-screen">
      <div className="page-container">
        <h1 className="font-display text-3xl font-bold text-white mb-8">User Management</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {['', 'FARMER', 'BUYER', 'TRANSPORTER'].map(role => (
            <button key={role || 'all'} onClick={() => setFilter({...filter, role})}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter.role === role ? 'bg-agri-green text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {role || 'All Roles'}
            </button>
          ))}
          <span className="w-px bg-gray-700" />
          {['', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(status => (
            <button key={status || 'all'} onClick={() => setFilter({...filter, status})}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter.status === status ? 'bg-agri-sun text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {status?.replace(/_/g, ' ') || 'All Status'}
            </button>
          ))}
        </div>

        {/* User List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12"><span className="text-5xl">👥</span><p className="text-gray-500 mt-4">No users found</p></div>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => viewUserDetails(u)}>
                    {/* Profile Photo */}
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-600 flex-shrink-0">
                      {u.profilePhotoUrl ? (
                        <img src={u.profilePhotoUrl} alt={u.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-2xl">
                          {u.role === 'FARMER' ? '👨‍🌾' : u.role === 'BUYER' ? '🛍️' : u.role === 'TRANSPORTER' ? '🚛' : '👤'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white hover:text-green-400 transition-colors">{u.fullName}</h3>
                      <p className="text-sm text-gray-400">{u.mobileNumber} • {u.email || 'No email'}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{u.role}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          u.verificationStatus === 'APPROVED' ? 'bg-green-900 text-green-300' :
                          u.verificationStatus === 'PENDING_VERIFICATION' ? 'bg-yellow-900 text-yellow-300' :
                          u.verificationStatus === 'REJECTED' ? 'bg-red-900 text-red-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {u.verificationStatus?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => viewUserDetails(u)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                      👁️ View
                    </button>
                    {u.verificationStatus === 'PENDING_VERIFICATION' && (
                      <>
                        <button onClick={() => handleAction(u.id, 'approve')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">✅ Approve</button>
                        <button onClick={() => handleAction(u.id, 'reject')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">❌ Reject</button>
                      </>
                    )}
                    {u.verificationStatus === 'APPROVED' && u.role !== 'ADMIN' && (
                      <button onClick={() => handleAction(u.id, 'suspend')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-500">🚫 Suspend</button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header with Photo */}
              <div className="bg-gradient-to-r from-green-800 to-green-600 p-6 rounded-t-2xl text-center relative">
                <button onClick={closeModal} className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl">✕</button>
                <div className="w-24 h-24 rounded-full mx-auto border-4 border-white overflow-hidden shadow-xl mb-3">
                  {selectedUser.profilePhotoUrl ? (
                    <img src={selectedUser.profilePhotoUrl} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center text-4xl">
                      {selectedUser.role === 'FARMER' ? '👨‍🌾' : selectedUser.role === 'BUYER' ? '🛍️' : '🚛'}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">{selectedUser.fullName}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-white/20 text-white">{selectedUser.role}</span>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    selectedUser.verificationStatus === 'APPROVED' ? 'bg-green-400/30 text-green-200' :
                    selectedUser.verificationStatus === 'PENDING_VERIFICATION' ? 'bg-yellow-400/30 text-yellow-200' :
                    'bg-red-400/30 text-red-200'
                  }`}>
                    {selectedUser.verificationStatus?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Personal Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <DetailItem label="Full Name" value={selectedUser.fullName} />
                  <DetailItem label="Mobile" value={selectedUser.mobileNumber || 'Not set'} />
                  <DetailItem label="Email" value={selectedUser.email || 'Not provided'} />
                  <DetailItem label="Date of Birth" value={selectedUser.dateOfBirth || 'Not set'} />
                  <DetailItem label="Role" value={selectedUser.role} />
                  <DetailItem label="Profile Complete" value={selectedUser.profileCompleted ? '✅ Yes' : '❌ No'} />
                  <DetailItem label="Registered" value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('en-IN') : 'N/A'} />
                  <DetailItem label="Last Login" value={selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString('en-IN') : 'Never'} />
                </div>

                {/* Location from profile */}
                {userProfile && userProfile[1] && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mt-4">
                      {selectedUser.role === 'FARMER' ? 'Farm Location' : 'Location'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailItem label="Address" value={userProfile[1]?.farmLocation?.address || userProfile[1]?.location?.address || 'Not set'} />
                      <DetailItem label="District" value={userProfile[1]?.farmLocation?.district || userProfile[1]?.location?.district || 'Not set'} />
                      <DetailItem label="State" value={userProfile[1]?.farmLocation?.state || userProfile[1]?.location?.state || 'Tamil Nadu'} />
                      <DetailItem label="Pincode" value={userProfile[1]?.farmLocation?.pincode || userProfile[1]?.location?.pincode || 'Not set'} />
                      <DetailItem label="Latitude" value={
                        userProfile[1]?.farmLocation?.latitude?.toFixed(6) || 
                        userProfile[1]?.location?.latitude?.toFixed(6) || 'N/A'
                      } />
                      <DetailItem label="Longitude" value={
                        userProfile[1]?.farmLocation?.longitude?.toFixed(6) || 
                        userProfile[1]?.location?.longitude?.toFixed(6) || 'N/A'
                      } />
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
                  {selectedUser.verificationStatus === 'PENDING_VERIFICATION' && (
                    <>
                      <button onClick={() => handleAction(selectedUser.id, 'approve')}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all">
                        ✅ Approve User
                      </button>
                      <button onClick={() => handleAction(selectedUser.id, 'reject')}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all">
                        ❌ Reject User
                      </button>
                    </>
                  )}
                  {selectedUser.verificationStatus === 'APPROVED' && selectedUser.role !== 'ADMIN' && (
                    <button onClick={() => handleAction(selectedUser.id, 'suspend')}
                      className="flex-1 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-500 transition-all">
                      🚫 Suspend User
                    </button>
                  )}
                  <button onClick={closeModal}
                    className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-all">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-white font-medium truncate">{value}</p>
    </div>
  );
}
