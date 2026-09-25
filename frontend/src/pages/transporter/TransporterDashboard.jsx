import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function TransporterDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dutyOn, setDutyOn] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/transport/requests/available');
      setRequests(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const toggleDuty = async () => {
    try {
      await api.post('/transport/duty/toggle');
      setDutyOn(!dutyOn);
      toast.success(dutyOn ? 'You are now off duty' : 'You are now on duty');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const acceptRequest = async (id) => {
    try {
      await api.put(`/transport/requests/${id}/accept`);
      toast.success('Delivery accepted!');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Transporter Dashboard</h1>
              <p className="text-white/80">Welcome, {user?.fullName}</p>
            </div>
            <button onClick={toggleDuty}
              className={`px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                dutyOn ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
              } text-white shadow-lg`}>
              {dutyOn ? `🟢 ${t('transport.dutyOn')}` : `⚪ ${t('transport.dutyOff')}`}
            </button>
          </div>
        </motion.div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('transport.availableRequests')}</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <span className="text-5xl mb-3">🚛</span>
              <p className="text-gray-500">{t('transport.noRequests')}</p>
              {!dutyOn && <p className="text-sm text-gray-400 mt-2">Turn on duty to start receiving delivery requests</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{req.productName}</h3>
                      <p className="text-sm text-gray-500">{req.quantity} kg • From: {req.farmerName} → To: {req.buyerName}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        {req.distance > 0 && <span className="text-blue-600">📍 {req.distance} km</span>}
                        {req.estimatedDuration > 0 && <span className="text-orange-600">⏱️ ~{Math.round(req.estimatedDuration)} min</span>}
                      </div>
                    </div>
                    <button onClick={() => acceptRequest(req.id)}
                      className="btn-primary !text-sm whitespace-nowrap">
                      ✅ {t('transport.acceptDelivery')}
                    </button>
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
