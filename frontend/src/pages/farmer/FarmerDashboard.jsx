import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import SmartFarmIntelligence from '../../components/farmer/SmartFarmIntelligence';
import LiveTracker from '../../components/transport/LiveTracker';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function FarmerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [farmLocation, setFarmLocation] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, orderRes, profileRes] = await Promise.allSettled([
        api.get(`/products/farmer/${user.userId}`),
        api.get('/orders/farmer?page=0&size=5'),
        api.get('/profile/me'),
      ]);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data.data || []);
      if (orderRes.status === 'fulfilled') setOrders(orderRes.value.data.data?.content || []);
      if (profileRes.status === 'fulfilled') {
        const profileData = profileRes.value.data.data;
        const farmerProfile = profileData?.[1];
        if (farmerProfile?.farmLocation) setFarmLocation(farmerProfile.farmLocation);
      }
    } catch {} finally { setLoading(false); }
  };

  const activeListings = products.filter(p => p.available && !p.paused).length;
  const totalQty = products.reduce((sum, p) => sum + (p.quantityAvailable || 0), 0);

  const stats = [
    { label: t('farmer.activeListings'), value: activeListings, icon: '🌿', color: 'from-green-400 to-green-600' },
    { label: t('farmer.totalQuantity'), value: `${totalQty} kg`, icon: '📦', color: 'from-blue-400 to-blue-600' },
    { label: t('farmer.pendingOrders'), value: orders.filter(o => !['COMPLETED','CANCELLED','FARMER_REJECTED'].includes(o.status)).length, icon: '📋', color: 'from-orange-400 to-orange-600' },
    { label: t('farmer.completedSales'), value: orders.filter(o => o.status === 'COMPLETED').length, icon: '✅', color: 'from-purple-400 to-purple-600' },
  ];

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        {/* Welcome Banner */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}
          className="bg-gradient-to-r from-agri-green to-agri-leaf rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                {t('farmer.dashboard')}
              </h1>
              <p className="text-white/80">Welcome back, {user?.fullName}!</p>
              <div className="mt-2">
                {user?.verificationStatus === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                    ✅ Verified Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-yellow-400/30 px-3 py-1 rounded-full text-sm">
                    ⏳ Pending Verification
                  </span>
                )}
              </div>
            </div>
            <Link to="/farmer/products/create" className="btn-accent !text-sm">
              ➕ {t('farmer.addProduct')}
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp}
              transition={{ delay: i * 0.1 }}
              className="stat-card">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl shadow-md`}>
                {stat.icon}
              </div>
              <span className="text-2xl font-bold text-gray-900">{loading ? '...' : stat.value}</span>
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { to: '/farmer/products', label: t('farmer.myProducts'), icon: '🌿', desc: 'View & manage listings' },
            { to: '/farmer/orders', label: t('farmer.orderedVeg'), icon: '📋', desc: 'View incoming orders' },
            { to: '/farmer/products/create', label: t('farmer.addProduct'), icon: '➕', desc: 'List new vegetables' },
            { to: '/dry-unit', label: t('farmer.dryUnit'), icon: '🏭', desc: 'Send surplus produce' },
          ].map((action, i) => (
            <Link key={i} to={action.to} className="card-interactive flex items-start gap-4">
              <div className="text-3xl">{action.icon}</div>
              <div>
                <h3 className="font-semibold text-gray-900">{action.label}</h3>
                <p className="text-sm text-gray-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        </div>

        {/* Live Tracking */}
        {trackingOrderId && (
          <div className="mb-6">
            <LiveTracker transportRequestId={trackingOrderId} onClose={() => setTrackingOrderId(null)} />
          </div>
        )}

        {/* Recent Orders with Track Button */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('farmer.orderedVeg')}</h2>
          {orders.length === 0 ? (
            <div className="empty-state">
              <span className="text-4xl mb-4">📋</span>
              <p className="text-gray-500">{t('empty.noOrders')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-lg">🥬</div>
                    <div>
                      <p className="font-medium text-gray-900">{order.productName}</p>
                      <p className="text-xs text-gray-500">{order.quantity} kg • ₹{order.pricePerKg}/kg</p>
                      {order.transporterName && <p className="text-xs text-blue-600">🚛 {order.transporterName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{order.productTotal?.toFixed(0)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {['TRANSPORT_ASSIGNED','GOING_TO_PICKUP','ARRIVED_AT_PICKUP','PICKED_UP','IN_TRANSIT','NEAR_DESTINATION'].includes(order.status) && order.transportRequestId && (
                      <button onClick={() => setTrackingOrderId(order.transportRequestId)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700">
                        📍 Track
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Farm Intelligence Section */}
        <SmartFarmIntelligence farmLocation={farmLocation} />
      </div>
    </div>
  );
}
