import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { user: admin } = useAuth();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
        toast.success('User approved');
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
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
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
                className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                      {u.role === 'FARMER' ? '👨‍🌾' : u.role === 'BUYER' ? '🛍️' : u.role === 'TRANSPORTER' ? '🚛' : '👤'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{u.fullName}</h3>
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
    </div>
  );
}
