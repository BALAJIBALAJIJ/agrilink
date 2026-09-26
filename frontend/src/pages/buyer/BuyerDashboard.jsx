import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LiveTracker from '../../components/transport/LiveTracker';

export default function BuyerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  useEffect(() => {
    api.get('/orders/buyer?page=0&size=20')
      .then(res => setOrders(res.data.data?.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeOrders = orders.filter(o => !['COMPLETED','CANCELLED','FARMER_REJECTED'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED');

  const stats = [
    { label: t('buyer.activeOrders'), value: activeOrders.length, icon: '📦', color: 'from-blue-400 to-blue-600' },
    { label: t('buyer.deliveredOrders'), value: completedOrders.length, icon: '✅', color: 'from-green-400 to-green-600' },
    { label: t('buyer.totalPurchase'), value: `₹${orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toFixed(0)}`, icon: '💰', color: 'from-purple-400 to-purple-600' },
  ];

  const statusColors = {
    TRANSPORT_REQUESTED: 'bg-yellow-100 text-yellow-700',
    TRANSPORT_ASSIGNED: 'bg-blue-100 text-blue-700',
    GOING_TO_PICKUP: 'bg-blue-100 text-blue-700',
    ARRIVED_AT_PICKUP: 'bg-orange-100 text-orange-700',
    PICKED_UP: 'bg-orange-100 text-orange-700',
    IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
    NEAR_DESTINATION: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-green-200 text-green-800',
  };

  const canTrack = (status) => ['TRANSPORT_ASSIGNED','GOING_TO_PICKUP','ARRIVED_AT_PICKUP','PICKED_UP','IN_TRANSIT','NEAR_DESTINATION'].includes(status);

  const downloadReceipt = (order) => {
    const content = `
AGRILINK - ORDER RECEIPT
========================
Order ID: ${order.orderId}
Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}

Product: ${order.productName}
Quantity: ${order.quantity} kg
Price/kg: ₹${order.pricePerKg}
Product Total: ₹${order.productTotal?.toFixed(2)}
Transport: ₹${order.transportCharge?.toFixed(2) || '0.00'}
TOTAL: ₹${order.totalAmount?.toFixed(2)}

Farmer: ${order.farmerName}
Transporter: ${order.transporterName || 'N/A'}
Payment: Cash on Delivery
Status: ${order.status}
Delivered: ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('en-IN') : 'Pending'}
========================
    `.trim();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AGRILINK_Order_${order.orderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

        {/* Live Tracking Section */}
        {trackingOrderId && (
          <div className="mb-6">
            <LiveTracker transportRequestId={trackingOrderId} onClose={() => setTrackingOrderId(null)} />
          </div>
        )}

        {/* Active Orders with Track Button */}
        {activeOrders.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🚚 Active Orders</h2>
            <div className="space-y-3">
              {activeOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{order.productName}</p>
                    <p className="text-xs text-gray-500">#{order.orderId} • {order.quantity} kg • ₹{order.totalAmount?.toFixed(0)}</p>
                    {order.transporterName && <p className="text-xs text-blue-600 mt-1">🚛 {order.transporterName}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                    {canTrack(order.status) && order.transportRequestId && (
                      <button onClick={() => setTrackingOrderId(order.transportRequestId)}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                        📍 Track Live
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order History */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📋 Order History</h2>
          {orders.length === 0 ? (
            <div className="empty-state"><span className="text-5xl mb-3">🛒</span><p className="text-gray-500">{t('empty.noOrders')}</p>
              <Link to="/market" className="btn-primary mt-4">Browse Marketplace</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div><p className="font-medium text-gray-900">{order.productName}</p>
                    <p className="text-xs text-gray-500">#{order.orderId} • {order.quantity} kg • {new Date(order.createdAt).toLocaleDateString('en-IN')}</p></div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">₹{order.totalAmount?.toFixed(0)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-yellow-100 text-yellow-700'}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                    {(order.status === 'COMPLETED' || order.status === 'DELIVERED') && (
                      <button onClick={() => downloadReceipt(order)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-200">
                        📄 Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
