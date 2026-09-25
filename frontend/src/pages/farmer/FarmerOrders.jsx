import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function FarmerOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const res = await api.get('/orders/farmer?page=0&size=50');
      setOrders(res.data.data?.content || []);
    } catch {} finally { setLoading(false); }
  };

  const acceptOrder = async (id) => {
    try { await api.put(`/orders/${id}/accept`); toast.success('Order accepted'); loadOrders(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const rejectOrder = async (id) => {
    if (!confirm('Reject this order?')) return;
    try { await api.put(`/orders/${id}/reject`); toast.success('Order rejected'); loadOrders(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        <h1 className="section-title mb-8">{t('farmer.orderedVeg')}</h1>
        {loading ? (
          <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
        ) : orders.length === 0 ? (
          <div className="empty-state"><span className="text-6xl mb-4">📋</span><p className="text-gray-500">{t('empty.noOrders')}</p></div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">
                      {order.productImageUrl ? <img src={order.productImageUrl} alt="" className="w-full h-full rounded-xl object-cover" /> : '🥬'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{order.productName}</h3>
                      <p className="text-sm text-gray-500">Order #{order.orderId} • {order.buyerName}</p>
                      <p className="text-sm text-gray-500">{order.quantity} kg × ₹{order.pricePerKg}/kg = <span className="font-semibold text-gray-900">₹{order.productTotal?.toFixed(0)}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      order.status === 'CANCELLED' || order.status === 'FARMER_REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                    {order.status === 'PAYMENT_VERIFIED' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => acceptOrder(order.id)} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all">
                          ✅ {t('order.accept')}
                        </button>
                        <button onClick={() => rejectOrder(order.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-all">
                          ❌ {t('order.reject')}
                        </button>
                      </div>
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
