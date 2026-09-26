import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

export default function LiveTracker({ transportRequestId, onClose }) {
  const [location, setLocation] = useState(null);
  const [transport, setTransport] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadTransport();
    fetchLocation();
    intervalRef.current = setInterval(fetchLocation, 10000);
    return () => clearInterval(intervalRef.current);
  }, [transportRequestId]);

  const loadTransport = async () => {
    try {
      const res = await api.get(`/transport/requests/${transportRequestId}`);
      setTransport(res.data.data);
    } catch {}
  };

  const fetchLocation = async () => {
    try {
      const res = await api.get(`/transport/${transportRequestId}/location`);
      if (res.data.data) setLocation(res.data.data);
    } catch {}
  };

  const statusColors = {
    GOING_TO_PICKUP: 'bg-blue-100 text-blue-700',
    ARRIVED_AT_PICKUP: 'bg-yellow-100 text-yellow-700',
    PICKED_UP: 'bg-orange-100 text-orange-700',
    IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
    NEAR_DESTINATION: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-green-100 text-green-700',
  };

  const statusLabels = {
    ACCEPTED: '✅ Transporter Assigned',
    GOING_TO_PICKUP: '🚛 Heading to Farm',
    ARRIVED_AT_PICKUP: '📍 At Farm',
    PICKED_UP: '📦 Picked Up',
    IN_TRANSIT: '🛣️ On the Way',
    NEAR_DESTINATION: '📍 Almost There!',
    DELIVERED: '✅ Delivered',
    COMPLETED: '🎉 Completed',
  };

  const mapUrl = location
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude-0.01}%2C${location.latitude-0.01}%2C${location.longitude+0.01}%2C${location.latitude+0.01}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`
    : null;

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-300 p-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          🚛 Live Delivery Tracking
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
        </h3>
        {onClose && <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>}
      </div>

      {transport && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-[10px] text-gray-400 uppercase">Product</p>
            <p className="text-sm font-bold">{transport.productName} — {transport.quantity} kg</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-[10px] text-gray-400 uppercase">Status</p>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[transport.status] || 'bg-gray-100 text-gray-600'}`}>
              {statusLabels[transport.status] || transport.status}
            </span>
          </div>
          {transport.transporterName && (
            <div className="bg-blue-50 rounded-lg p-2.5 col-span-2">
              <p className="text-[10px] text-blue-400 uppercase">Transporter</p>
              <p className="text-sm font-bold">{transport.transporterName}</p>
              {transport.distance > 0 && <span className="text-xs text-gray-500">📍 {transport.distance.toFixed(1)} km • ⏱️ ~{Math.round(transport.estimatedDuration)} min</span>}
            </div>
          )}
        </div>
      )}

      {mapUrl ? (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <iframe title="Live Location" width="100%" height="200" style={{ border: 0 }} src={mapUrl} loading="lazy" />
          <div className="bg-gray-50 px-3 py-1.5 text-[10px] text-gray-400 flex justify-between">
            <span>📍 {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
            {location.speed > 0 && <span>🏎️ {(location.speed * 3.6).toFixed(0)} km/h</span>}
            <span>Updated: {new Date(location.timestamp).toLocaleTimeString('en-IN')}</span>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <span className="text-3xl">📍</span>
          <p className="text-gray-500 text-sm mt-2">Waiting for transporter location...</p>
          <p className="text-gray-400 text-xs">Location updates every 10 seconds</p>
        </div>
      )}
    </div>
  );
}
