import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function BuyerOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/buyer?page=0&size=50')
      .then(res => setOrders(res.data.data?.content || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        <h1 className="section-title mb-8">My Orders</h1>
        {loading ? <div className="text-center py-12 text-gray-500">{t('common.loading')}</div> :
         orders.length === 0 ? (
          <div className="empty-state"><span className="text-6xl mb-4">📋</span><p className="text-gray-500">{t('empty.noOrders')}</p></div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                      {order.productImageUrl ? <img src={order.productImageUrl} alt="" className="w-full h-full rounded-xl object-cover" /> : '🥬'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{order.productName}</h3>
                      <p className="text-sm text-gray-500">#{order.orderId} • From: {order.farmerName}</p>
                      <p className="text-sm text-gray-500">{order.quantity} kg × ₹{order.pricePerKg}/kg</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">₹{order.totalAmount?.toFixed(0)}</p>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      order.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'CANCELLED' || order.status === 'FARMER_REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
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
