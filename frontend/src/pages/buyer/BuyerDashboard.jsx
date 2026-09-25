import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function BuyerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/buyer?page=0&size=10')
      .then(res => setOrders(res.data.data?.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: t('buyer.activeOrders'), value: orders.filter(o => !['COMPLETED','CANCELLED','FARMER_REJECTED'].includes(o.status)).length, icon: '📦', color: 'from-blue-400 to-blue-600' },
    { label: t('buyer.deliveredOrders'), value: orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED').length, icon: '✅', color: 'from-green-400 to-green-600' },
    { label: t('buyer.totalPurchase'), value: `₹${orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toFixed(0)}`, icon: '💰', color: 'from-purple-400 to-purple-600' },
  ];

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t('buyer.dashboard')}</h1>
          <p className="text-white/80">Welcome, {user?.fullName}!</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl shadow-md`}>{s.icon}</div>
              <span className="text-2xl font-bold text-gray-900">{loading ? '...' : s.value}</span>
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link to="/buyer/market" className="card-interactive flex items-center gap-4">
            <span className="text-3xl">🛒</span>
            <div><h3 className="font-semibold text-gray-900">{t('nav.marketplace')}</h3><p className="text-sm text-gray-500">Browse fresh produce</p></div>
          </Link>
          <Link to="/buyer/orders" className="card-interactive flex items-center gap-4">
            <span className="text-3xl">📋</span>
            <div><h3 className="font-semibold text-gray-900">{t('buyer.activeOrders')}</h3><p className="text-sm text-gray-500">Track your orders</p></div>
          </Link>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <div className="empty-state"><span className="text-5xl mb-3">🛒</span><p className="text-gray-500">{t('empty.noOrders')}</p>
              <Link to="/market" className="btn-primary mt-4">Browse Marketplace</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div><p className="font-medium text-gray-900">{order.productName}</p>
                    <p className="text-xs text-gray-500">#{order.orderId} • {order.quantity} kg</p></div>
                  <div className="text-right"><p className="font-semibold">₹{order.totalAmount?.toFixed(0)}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{order.status?.replace(/_/g, ' ')}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
