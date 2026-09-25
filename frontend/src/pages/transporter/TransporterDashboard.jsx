import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DUTY_KEY = 'agrilink_duty_status';
const LOCATION_INTERVAL = 10000; // 10 seconds

export default function TransporterDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dutyOn, setDutyOn] = useState(() => localStorage.getItem(DUTY_KEY) === 'true');
  const [requests, setRequests] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const locationWatchRef = useRef(null);
  const locationIntervalRef = useRef(null);

  useEffect(() => {
    loadData();
    // Check duty from backend on mount
    loadDutyStatus();
    return () => stopLocationTracking();
  }, []);

  // Start/stop location tracking based on active delivery
  useEffect(() => {
    if (activeDelivery && dutyOn) {
      startLocationTracking(activeDelivery.id);
    } else {
      stopLocationTracking();
    }
  }, [activeDelivery, dutyOn]);

  const loadDutyStatus = async () => {
    try {
      const res = await api.get('/transport/duty/status');
      const status = res.data.data?.dutyOn ?? false;
      setDutyOn(status);
      localStorage.setItem(DUTY_KEY, status);
    } catch {}
  };

  const loadData = async () => {
    try {
      const [reqRes, activeRes] = await Promise.allSettled([
        api.get('/transport/requests/available'),
        api.get('/transport/active-delivery'),
      ]);
      if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data.data || []);
      if (activeRes.status === 'fulfilled' && activeRes.value.data.data) {
        setActiveDelivery(activeRes.value.data.data);
      }
    } catch {} finally { setLoading(false); }
  };

  const toggleDuty = async () => {
    try {
      await api.post('/transport/duty/toggle');
      const newDuty = !dutyOn;
      setDutyOn(newDuty);
      localStorage.setItem(DUTY_KEY, newDuty);
      toast.success(newDuty ? '🟢 You are now on duty!' : '⚪ You are now off duty');
      if (newDuty) loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const acceptRequest = async (id) => {
    try {
      const res = await api.put(`/transport/requests/${id}/accept`);
      toast.success('✅ Delivery accepted!');
      setActiveDelivery(res.data.data);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const updateStatus = async (newStatus) => {
    if (!activeDelivery) return;
    try {
      await api.put(`/transport/requests/${activeDelivery.id}/status`, { status: newStatus });
      toast.success(`Status updated: ${newStatus.replace(/_/g, ' ')}`);
      if (newStatus === 'DELIVERED') {
        setActiveDelivery(null);
        stopLocationTracking();
      }
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const startLocationTracking = useCallback((requestId) => {
    stopLocationTracking();
    
    const sendLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api.post(`/transport/requests/${requestId}/gps`, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            speed: pos.coords.speed || 0,
            heading: pos.coords.heading || 0,
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    // Send immediately
    sendLocation();
    // Then every 10 seconds
    locationIntervalRef.current = setInterval(sendLocation, LOCATION_INTERVAL);
  }, []);

  const stopLocationTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    if (locationWatchRef.current) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
  };

  const statusFlow = ['GOING_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'DELIVERED'];
  const currentIndex = activeDelivery ? statusFlow.indexOf(activeDelivery.status) : -1;
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;

  const statusLabels = {
    GOING_TO_PICKUP: '🚛 Going to Pickup',
    ARRIVED_AT_PICKUP: '📍 Arrived at Pickup',
    PICKED_UP: '📦 Picked Up',
    IN_TRANSIT: '🛣️ In Transit',
    NEAR_DESTINATION: '📍 Near Destination',
    DELIVERED: '✅ Delivered',
  };

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">Transporter Dashboard</h1>
              <p className="text-white/80">Welcome, {user?.fullName}</p>
              {dutyOn && (
                <span className="inline-block mt-2 bg-green-500/30 px-3 py-1 rounded-full text-sm">
                  📍 Live location tracking active
                </span>
              )}
            </div>
            <button onClick={toggleDuty}
              className={`px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                dutyOn ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
              } text-white shadow-lg`}>
              {dutyOn ? `🟢 ${t('transport.dutyOn')}` : `⚪ ${t('transport.dutyOff')}`}
            </button>
          </div>
        </motion.div>

        {/* Active Delivery */}
        {activeDelivery && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border-2 border-green-400 shadow-lg mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              🚛 Active Delivery
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">LIVE</span>
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-bold text-gray-900">{activeDelivery.productName} — {activeDelivery.quantity} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Route</p>
                <p className="font-medium text-gray-700">
                  {activeDelivery.farmerName} → {activeDelivery.buyerName}
                </p>
              </div>
              {activeDelivery.distance > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="font-medium">📍 {activeDelivery.distance} km</p>
                </div>
              )}
              {activeDelivery.estimatedDuration > 0 && (
                <div>
                  <p className="text-sm text-gray-500">ETA</p>
                  <p className="font-medium">⏱️ ~{Math.round(activeDelivery.estimatedDuration)} min</p>
                </div>
              )}
            </div>

            {/* Status Progress */}
            <div className="flex gap-1 mb-4">
              {statusFlow.map((s, i) => (
                <div key={s} className={`flex-1 h-2 rounded-full ${
                  i <= currentIndex ? 'bg-green-500' : 'bg-gray-200'
                }`} title={statusLabels[s]} />
              ))}
            </div>
            <p className="text-sm text-center text-gray-600 mb-4">
              Current: <span className="font-bold text-green-700">{statusLabels[activeDelivery.status] || activeDelivery.status}</span>
            </p>

            {/* Next Status Button */}
            {nextStatus && (
              <button onClick={() => updateStatus(nextStatus)}
                className="btn-primary w-full !py-3.5 text-base">
                {statusLabels[nextStatus] || nextStatus}
              </button>
            )}
            {activeDelivery.status === 'DELIVERED' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-bold text-lg">✅ Delivery Completed!</p>
                <p className="text-green-600 text-sm">Cash on Delivery — Collect payment from buyer</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Available Requests */}
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
                      <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        💰 Cash on Delivery
                      </span>
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
