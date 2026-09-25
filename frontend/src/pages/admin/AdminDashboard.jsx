import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setStats(res.data.data))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Pending Farmers', value: stats.pendingFarmers || 0, icon: '👨‍🌾', color: 'from-green-400 to-green-600' },
    { label: 'Pending Buyers', value: stats.pendingBuyers || 0, icon: '🛍️', color: 'from-blue-400 to-blue-600' },
    { label: 'Pending Transporters', value: stats.pendingTransporters || 0, icon: '🚛', color: 'from-orange-400 to-orange-600' },
    { label: 'Total Farmers', value: stats.totalFarmers || 0, icon: '🌾', color: 'from-emerald-400 to-emerald-600' },
    { label: 'Total Buyers', value: stats.totalBuyers || 0, icon: '🏪', color: 'from-indigo-400 to-indigo-600' },
    { label: 'Total Transporters', value: stats.totalTransporters || 0, icon: '🚚', color: 'from-amber-400 to-amber-600' },
    { label: 'Total Orders', value: stats.totalOrders || 0, icon: '📦', color: 'from-purple-400 to-purple-600' },
    { label: 'Active Orders', value: stats.activeOrders || 0, icon: '⚡', color: 'from-red-400 to-red-600' },
  ] : [];

  const userChartData = stats ? [
    { name: 'Farmers', value: stats.totalFarmers || 0 },
    { name: 'Buyers', value: stats.totalBuyers || 0 },
    { name: 'Transporters', value: stats.totalTransporters || 0 },
  ] : [];

  return (
    <div className="pt-20 pb-12 bg-gray-900 min-h-screen">
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-8 text-white mb-8 shadow-xl border border-gray-700">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">AGRILINK Administration • {user?.fullName}</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-5">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl mb-3 shadow-md`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-white">{loading ? '...' : s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">User Distribution</h2>
            {stats && (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={userChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {userChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Pending Verifications</h2>
            {stats && (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Farmers', pending: stats.pendingFarmers || 0 },
                  { name: 'Buyers', pending: stats.pendingBuyers || 0 },
                  { name: 'Transporters', pending: stats.pendingTransporters || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="pending" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { to: '/admin/users', label: 'Manage Users', icon: '👥', desc: 'Verify & manage accounts' },
            { to: '/admin/users?status=PENDING_VERIFICATION', label: 'Pending Approvals', icon: '⏳', desc: 'Review new registrations' },
            { to: '/admin/users', label: 'Audit Logs', icon: '📋', desc: 'View activity history' },
          ].map((a, i) => (
            <a key={i} href={a.to} className="bg-gray-800 border border-gray-700 rounded-2xl p-5 hover:border-agri-green/50 transition-all group">
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{a.icon}</span>
              <h3 className="font-semibold text-white">{a.label}</h3>
              <p className="text-sm text-gray-400">{a.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
