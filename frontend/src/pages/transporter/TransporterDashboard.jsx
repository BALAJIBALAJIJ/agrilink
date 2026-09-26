import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DUTY_KEY = 'agrilink_duty_status';
const LOCATION_INTERVAL = 10000;

export default function TransporterDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dutyOn, setDutyOn] = useState(() => localStorage.getItem(DUTY_KEY) === 'true');
  const [requests, setRequests] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cashAmount, setCashAmount] = useState('');
  const [showCashModal, setShowCashModal] = useState(false);
  const [expandedReq, setExpandedReq] = useState(null);
  const locationIntervalRef = useRef(null);

  useEffect(() => {
    loadData();
    loadDutyStatus();
    return () => stopLocationTracking();
  }, []);

  useEffect(() => {
    if (activeDelivery && dutyOn && 
        ['GOING_TO_PICKUP','ARRIVED_AT_PICKUP','PICKED_UP','IN_TRANSIT','NEAR_DESTINATION'].includes(activeDelivery.status)) {
      startLocationTracking(activeDelivery.id);
    } else {
      stopLocationTracking();
    }
  }, [activeDelivery, dutyOn]);

  const loadDutyStatus = async () => {
    try {
      const res = await api.get('/transport/duty/status');
      const s = res.data.data?.dutyOn ?? false;
      setDutyOn(s);
      localStorage.setItem(DUTY_KEY, s);
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

  const loadHistory = async () => {
    try {
      const res = await api.get('/transport/history');
      setHistory(res.data.data || []);
      setShowHistory(true);
    } catch { toast.error('Failed to load history'); }
  };

  const toggleDuty = async () => {
    try {
      await api.post('/transport/duty/toggle');
      const nd = !dutyOn;
      setDutyOn(nd);
      localStorage.setItem(DUTY_KEY, nd);
      toast.success(nd ? '🟢 On duty!' : '⚪ Off duty');
      if (nd) loadData();
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
      toast.success(`Status: ${statusLabels[newStatus]}`);
      setActiveDelivery(prev => ({ ...prev, status: newStatus }));
      if (newStatus === 'DELIVERED') setShowCashModal(true);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const confirmCash = async () => {
    if (!cashAmount || isNaN(cashAmount) || Number(cashAmount) <= 0) {
      toast.error('Enter valid cash amount');
      return;
    }
    try {
      await api.post(`/transport/requests/${activeDelivery.id}/confirm-cash`, {
        cashAmount: Number(cashAmount),
      });
      toast.success('✅ Cash confirmed! Delivery completed!');
      setShowCashModal(false);
      setCashAmount('');
      setActiveDelivery(null);
      stopLocationTracking();
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const startLocationTracking = useCallback((requestId) => {
    stopLocationTracking();
    const send = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api.post(`/transport/requests/${requestId}/gps`, {
            latitude: pos.coords.latitude, longitude: pos.coords.longitude,
            speed: pos.coords.speed || 0, heading: pos.coords.heading || 0,
          }).catch(() => {});
        }, () => {}, { enableHighAccuracy: true, timeout: 8000 }
      );
    };
    send();
    locationIntervalRef.current = setInterval(send, LOCATION_INTERVAL);
  }, []);

  const stopLocationTracking = () => {
    if (locationIntervalRef.current) { clearInterval(locationIntervalRef.current); locationIntervalRef.current = null; }
  };

  const downloadPDF = (delivery) => {
    const content = `
AGRILINK - DELIVERY RECEIPT
============================
Date: ${new Date(delivery.createdAt).toLocaleDateString('en-IN')}
Order ID: ${delivery.orderId}
Product: ${delivery.productName}
Quantity: ${delivery.quantity} kg
Product Total: Rs.${delivery.productTotal?.toFixed(2) || '0.00'}
Transport Charge: Rs.${delivery.totalTransportCharge?.toFixed(2) || '0.00'}
Cash Received: Rs.${delivery.cashAmountReceived?.toFixed(2) || '0.00'}

FROM (Farmer): ${delivery.farmerName}
Phone: ${delivery.farmerPhone || 'N/A'}

TO (Buyer): ${delivery.buyerName}
Phone: ${delivery.buyerPhone || 'N/A'}

Transporter: ${delivery.transporterName || user?.fullName}
Distance: ${delivery.distance?.toFixed(1) || '0'} km
Duration: ${delivery.estimatedDuration?.toFixed(0) || '0'} min

Picked Up: ${delivery.pickedUpAt ? new Date(delivery.pickedUpAt).toLocaleString('en-IN') : 'N/A'}
Delivered: ${delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleString('en-IN') : 'N/A'}
Status: ${delivery.status}
============================
    `.trim();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AGRILINK_Receipt_${delivery.orderId || delivery.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusFlow = ['ACCEPTED', 'GOING_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'DELIVERED'];
  const currentIndex = activeDelivery ? statusFlow.indexOf(activeDelivery.status) : -1;
  const nextStatus = currentIndex >= 0 && currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;

  const statusLabels = {
    ACCEPTED: '✅ Accepted',
    GOING_TO_PICKUP: '🚛 Going to Pickup',
    ARRIVED_AT_PICKUP: '📍 Arrived at Pickup',
    PICKED_UP: '📦 Picked Up',
    IN_TRANSIT: '🛣️ In Transit',
    NEAR_DESTINATION: '📍 Near Destination',
    DELIVERED: '✅ Delivered',
    COMPLETED: '🎉 Completed',
  };

  const routeMapUrl = activeDelivery?.pickupLocation && activeDelivery?.deliveryLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(activeDelivery.pickupLocation.longitude, activeDelivery.deliveryLocation.longitude)-0.02}%2C${Math.min(activeDelivery.pickupLocation.latitude, activeDelivery.deliveryLocation.latitude)-0.02}%2C${Math.max(activeDelivery.pickupLocation.longitude, activeDelivery.deliveryLocation.longitude)+0.02}%2C${Math.max(activeDelivery.pickupLocation.latitude, activeDelivery.deliveryLocation.latitude)+0.02}&layer=mapnik&marker=${activeDelivery.pickupLocation.latitude}%2C${activeDelivery.pickupLocation.longitude}`
    : null;

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 sm:p-8 text-white mb-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Transporter Dashboard</h1>
              <p className="text-white/80">Welcome, {user?.fullName}</p>
              {dutyOn && <span className="inline-block mt-2 bg-green-500/30 px-3 py-1 rounded-full text-sm animate-pulse">📍 Live tracking active</span>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadHistory} className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all">
                📋 History
              </button>
              <button onClick={toggleDuty}
                className={`px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                  dutyOn ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
                } text-white shadow-lg`}>
                {dutyOn ? '🟢 Duty ON' : '⚪ Duty OFF'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Active Delivery */}
        {activeDelivery && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border-2 border-green-400 shadow-lg mb-6 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                🚛 Active Delivery
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">LIVE</span>
              </h2>

              {/* Product + Details */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-gray-400 font-semibold">Product</p>
                  <p className="font-bold text-gray-900">{activeDelivery.productName}</p>
                  <p className="text-sm text-gray-600">{activeDelivery.quantity} kg</p>
                  {activeDelivery.productTotal > 0 && <p className="text-sm text-green-700 font-semibold mt-1">₹{activeDelivery.productTotal?.toFixed(2)}</p>}
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-blue-400 font-semibold">👨‍🌾 Farmer (Pickup)</p>
                  <p className="font-bold text-gray-900">{activeDelivery.farmerName}</p>
                  <a href={`tel:${activeDelivery.farmerPhone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    📞 {activeDelivery.farmerPhone || 'N/A'}
                  </a>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-purple-400 font-semibold">🛒 Buyer (Deliver)</p>
                  <p className="font-bold text-gray-900">{activeDelivery.buyerName}</p>
                  <a href={`tel:${activeDelivery.buyerPhone}`} className="text-sm text-purple-600 hover:underline flex items-center gap-1">
                    📞 {activeDelivery.buyerPhone || 'N/A'}
                  </a>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-orange-400 font-semibold">Route Info</p>
                  {activeDelivery.distance > 0 && <p className="text-sm">📍 {activeDelivery.distance.toFixed(1)} km</p>}
                  {activeDelivery.estimatedDuration > 0 && <p className="text-sm">⏱️ ~{Math.round(activeDelivery.estimatedDuration)} min</p>}
                  <p className="text-sm text-orange-600 font-semibold">💰 COD</p>
                </div>
              </div>

              {/* Route Map */}
              {routeMapUrl && (
                <div className="mb-5 rounded-xl overflow-hidden border border-gray-200">
                  <iframe title="Route Map" width="100%" height="220" style={{ border: 0 }} src={routeMapUrl} loading="lazy" />
                  <div className="bg-gray-50 px-4 py-2 flex justify-between text-xs text-gray-500">
                    <span>🟢 Pickup: {activeDelivery.pickupLocation?.latitude?.toFixed(4)}, {activeDelivery.pickupLocation?.longitude?.toFixed(4)}</span>
                    <span>🔴 Delivery: {activeDelivery.deliveryLocation?.latitude?.toFixed(4)}, {activeDelivery.deliveryLocation?.longitude?.toFixed(4)}</span>
                  </div>
                  <a href={`https://www.google.com/maps/dir/${activeDelivery.pickupLocation?.latitude},${activeDelivery.pickupLocation?.longitude}/${activeDelivery.deliveryLocation?.latitude},${activeDelivery.deliveryLocation?.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="block text-center py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
                    🗺️ Open Route in Google Maps (Best Navigation)
                  </a>
                </div>
              )}

              {/* Status Progress */}
              <div className="flex gap-1 mb-3">
                {statusFlow.map((s, i) => (
                  <div key={s} className={`flex-1 h-2.5 rounded-full transition-all ${i <= currentIndex ? 'bg-green-500' : 'bg-gray-200'}`}
                    title={statusLabels[s]} />
                ))}
              </div>
              <p className="text-center text-sm text-gray-600 mb-4">
                Current: <span className="font-bold text-green-700">{statusLabels[activeDelivery.status] || activeDelivery.status}</span>
              </p>

              {/* Next Action Button */}
              {nextStatus && (
                <button onClick={() => updateStatus(nextStatus)} className="btn-primary w-full !py-3.5 text-base">
                  ▶️ {statusLabels[nextStatus]}
                </button>
              )}

              {/* Cash Modal Prompt (DELIVERED state) */}
              {activeDelivery.status === 'DELIVERED' && !showCashModal && (
                <button onClick={() => setShowCashModal(true)} className="btn-primary w-full !py-3.5 text-base !bg-green-600 hover:!bg-green-700 mt-2">
                  💰 Enter Cash Amount & Complete
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Cash Confirmation Modal */}
        <AnimatePresence>
          {showCashModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowCashModal(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Cash on Delivery Confirmation</h3>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-500">Product: <strong>{activeDelivery?.productName}</strong></p>
                  <p className="text-sm text-gray-500">Quantity: <strong>{activeDelivery?.quantity} kg</strong></p>
                  <p className="text-sm text-gray-500">Product Total: <strong>₹{activeDelivery?.productTotal?.toFixed(2)}</strong></p>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cash Amount Received (₹)</label>
                <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)}
                  placeholder="Enter amount received"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-bold text-center focus:border-green-500 focus:outline-none" />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowCashModal(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={confirmCash} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all">
                    ✅ Confirm & Complete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Available Requests */}
        <div className="card mb-6">
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
              {requests.map(req => {
                const isExpanded = expandedReq === req.id;
                const reqMapUrl = req.pickupLocation && req.deliveryLocation
                  ? `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(req.pickupLocation.longitude, req.deliveryLocation.longitude)-0.03}%2C${Math.min(req.pickupLocation.latitude, req.deliveryLocation.latitude)-0.03}%2C${Math.max(req.pickupLocation.longitude, req.deliveryLocation.longitude)+0.03}%2C${Math.max(req.pickupLocation.latitude, req.deliveryLocation.latitude)+0.03}&layer=mapnik&marker=${req.pickupLocation.latitude}%2C${req.pickupLocation.longitude}`
                  : null;
                return (
                <div key={req.id} className="bg-gray-50 rounded-xl overflow-hidden transition-all">
                  {/* Summary Row */}
                  <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{req.productName}</h3>
                      <p className="text-sm text-gray-500">{req.quantity} kg • {req.farmerName} → {req.buyerName}</p>
                      <div className="flex gap-3 mt-2 text-sm flex-wrap">
                        {req.distance > 0 && <span className="text-blue-600">📍 {req.distance.toFixed(1)} km</span>}
                        {req.estimatedDuration > 0 && <span className="text-orange-600">⏱️ ~{Math.round(req.estimatedDuration)} min</span>}
                        <span className="text-green-600 font-medium">💰 Cash on Delivery</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpandedReq(isExpanded ? null : req.id)}
                        className="text-sm px-4 py-2 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-white transition-all">
                        {isExpanded ? '▲ Hide' : '▼ Details'}
                      </button>
                      <button onClick={() => acceptRequest(req.id)} className="btn-primary !text-sm whitespace-nowrap">
                        ✅ Accept
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-200 pt-4">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        {/* Farmer Details */}
                        <div className="bg-blue-50 rounded-xl p-4">
                          <p className="text-[10px] uppercase text-blue-400 font-bold mb-2">👨‍🌾 FARMER (Pickup)</p>
                          <p className="font-bold text-gray-900 text-base">{req.farmerName}</p>
                          {req.farmerPhone && (
                            <a href={`tel:${req.farmerPhone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                              📞 {req.farmerPhone}
                            </a>
                          )}
                          {req.pickupLocation && (
                            <div className="mt-2 text-xs text-gray-500">
                              <p>📍 {req.pickupLocation.latitude?.toFixed(4)}, {req.pickupLocation.longitude?.toFixed(4)}</p>
                              {req.pickupLocation.address && <p className="mt-0.5">{req.pickupLocation.address}</p>}
                            </div>
                          )}
                        </div>

                        {/* Buyer Details */}
                        <div className="bg-purple-50 rounded-xl p-4">
                          <p className="text-[10px] uppercase text-purple-400 font-bold mb-2">🛒 BUYER (Delivery)</p>
                          <p className="font-bold text-gray-900 text-base">{req.buyerName}</p>
                          {req.buyerPhone && (
                            <a href={`tel:${req.buyerPhone}`} className="text-sm text-purple-600 hover:underline flex items-center gap-1 mt-1">
                              📞 {req.buyerPhone}
                            </a>
                          )}
                          {req.deliveryLocation && (
                            <div className="mt-2 text-xs text-gray-500">
                              <p>📍 {req.deliveryLocation.latitude?.toFixed(4)}, {req.deliveryLocation.longitude?.toFixed(4)}</p>
                              {req.deliveryLocation.address && <p className="mt-0.5">{req.deliveryLocation.address}</p>}
                            </div>
                          )}
                        </div>

                        {/* Delivery Info */}
                        <div className="bg-orange-50 rounded-xl p-4">
                          <p className="text-[10px] uppercase text-orange-400 font-bold mb-2">📦 DELIVERY INFO</p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Product</span><span className="font-bold">{req.productName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span className="font-bold">{req.quantity} kg</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-green-700">₹{req.productTotal?.toFixed(2) || '0.00'}</span></div>
                            {req.distance > 0 && <div className="flex justify-between"><span className="text-gray-500">Distance</span><span className="font-bold">{req.distance.toFixed(1)} km</span></div>}
                            {req.estimatedDuration > 0 && <div className="flex justify-between"><span className="text-gray-500">Est. Time</span><span className="font-bold">~{Math.round(req.estimatedDuration)} min</span></div>}
                            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-bold text-green-600">💰 COD</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Route Map */}
                      {reqMapUrl && (
                        <div className="rounded-xl overflow-hidden border border-gray-200">
                          <iframe title="Route Preview" width="100%" height="200" style={{ border: 0 }} src={reqMapUrl} loading="lazy" />
                          <div className="bg-gray-50 px-4 py-2 flex justify-between text-xs text-gray-500 flex-wrap gap-2">
                            <span>🟢 Pickup: {req.pickupLocation?.latitude?.toFixed(4)}, {req.pickupLocation?.longitude?.toFixed(4)}</span>
                            <span>🔴 Delivery: {req.deliveryLocation?.latitude?.toFixed(4)}, {req.deliveryLocation?.longitude?.toFixed(4)}</span>
                          </div>
                          {req.pickupLocation && req.deliveryLocation && (
                            <a href={`https://www.google.com/maps/dir/${req.pickupLocation.latitude},${req.pickupLocation.longitude}/${req.deliveryLocation.latitude},${req.deliveryLocation.longitude}`}
                              target="_blank" rel="noopener noreferrer"
                              className="block text-center py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
                              🗺️ View Route in Google Maps
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delivery History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">📋 Delivery History</h2>
                <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No delivery history yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map(d => (
                    <div key={d.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{d.productName} — {d.quantity} kg</p>
                        <p className="text-sm text-gray-500">{d.farmerName} → {d.buyerName}</p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400">
                          <span>{new Date(d.createdAt).toLocaleDateString('en-IN')}</span>
                          {d.distance > 0 && <span>📍 {d.distance.toFixed(1)} km</span>}
                          {d.cashAmountReceived > 0 && <span className="text-green-600 font-semibold">💰 ₹{d.cashAmountReceived.toFixed(2)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          d.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>{d.status}</span>
                        <button onClick={() => downloadPDF(d)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">
                          📄 Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
