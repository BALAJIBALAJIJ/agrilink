import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { subscribeToGps, unsubscribe } from '../../services/websocket';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['GOING_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'DELIVERED'];

export default function LiveTracking() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [gpsActive, setGpsActive] = useState(false);
  const watchRef = useRef(null);

  useEffect(() => {
    loadRequest();
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      unsubscribe(`gps-${requestId}`);
    };
  }, [requestId]);

  const loadRequest = async () => {
    try {
      const res = await api.get(`/transport/requests/${requestId}`);
      setRequest(res.data.data);
      const idx = STATUS_FLOW.indexOf(res.data.data?.status);
      if (idx >= 0) setCurrentStep(idx);
    } catch { toast.error('Transport request not found'); }
  };

  const startGpsTracking = () => {
    if (!navigator.geolocation) { toast.error('GPS unavailable'); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        api.post('/transport/location', {
          requestId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed: pos.coords.speed || 0,
          heading: pos.coords.heading || 0,
        }).catch(() => {});
      },
      () => toast.error('GPS error'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setGpsActive(true);
    toast.success('GPS tracking started');
  };

  const updateStatus = async (status) => {
    try {
      await api.put(`/transport/requests/${requestId}/status`, { status });
      toast.success('Status updated');
      loadRequest();
      const idx = STATUS_FLOW.indexOf(status);
      if (idx >= 0) setCurrentStep(idx);
      if (status === 'GOING_TO_PICKUP' && !gpsActive) startGpsTracking();
      if (status === 'DELIVERED' && watchRef.current) {
        navigator.geolocation.clearWatch(watchRef.current);
        setGpsActive(false);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const nextStatus = STATUS_FLOW[currentStep] || null;

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title mb-6">Live Delivery Tracking</h1>

          {/* Status Steps */}
          <div className="card mb-6">
            <div className="space-y-4">
              {STATUS_FLOW.map((status, i) => (
                <div key={status} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    i < currentStep ? 'bg-green-500 text-white' :
                    i === currentStep ? 'bg-agri-sun text-white animate-pulse' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${i <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                      {status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`w-0.5 h-6 ml-5 ${i < currentStep ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* GPS Status */}
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${gpsActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="font-medium text-gray-900">GPS Tracking</span>
              </div>
              <span className={`text-sm font-medium ${gpsActive ? 'text-green-600' : 'text-gray-500'}`}>
                {gpsActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Request Details */}
          {request && (
            <div className="card mb-6">
              <h2 className="font-bold text-gray-900 mb-3">Delivery Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Product</span><span className="font-medium">{request.productName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span className="font-medium">{request.quantity} kg</span></div>
                <div className="flex justify-between"><span className="text-gray-500">From</span><span className="font-medium">{request.farmerName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">To</span><span className="font-medium">{request.buyerName}</span></div>
                {request.distance > 0 && <div className="flex justify-between"><span className="text-gray-500">Distance</span><span className="font-medium">{request.distance} km</span></div>}
                {request.totalTransportCharge > 0 && <div className="flex justify-between"><span className="text-gray-500">Charge</span><span className="font-bold text-agri-green">₹{request.totalTransportCharge.toFixed(0)}</span></div>}
              </div>
            </div>
          )}

          {/* Next Action Button */}
          {nextStatus && currentStep < STATUS_FLOW.length && (
            <button onClick={() => updateStatus(nextStatus)}
              className="btn-primary w-full !py-4 text-lg">
              {nextStatus === 'GOING_TO_PICKUP' ? '🚛 Start Trip' :
               nextStatus === 'ARRIVED_AT_PICKUP' ? '📍 Arrived at Pickup' :
               nextStatus === 'PICKED_UP' ? '📦 Confirm Pickup' :
               nextStatus === 'IN_TRANSIT' ? '🛣️ Start Delivery' :
               nextStatus === 'NEAR_DESTINATION' ? '📍 Near Destination' :
               nextStatus === 'DELIVERED' ? '✅ Mark Delivered' : 'Next Step'}
            </button>
          )}

          {currentStep >= STATUS_FLOW.length && (
            <div className="text-center py-8">
              <span className="text-5xl">🎉</span>
              <h2 className="text-xl font-bold text-gray-900 mt-4">Delivery Completed!</h2>
              <p className="text-gray-500 mt-2">Great job. Your earnings have been updated.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
