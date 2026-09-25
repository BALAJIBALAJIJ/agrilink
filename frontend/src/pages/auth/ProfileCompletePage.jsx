import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom red marker for GPS location
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// Default location: Thoothukudi, Tamil Nadu
const THOOTHUKUDI = { lat: 8.7642, lng: 78.1348 };

// Map click handler component
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? <Marker position={[position.lat, position.lng]} icon={redIcon} /> : null;
}

// Component to fly to a new position
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 15, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

export default function ProfileCompletePage() {
  const { t } = useTranslation();
  const { user, completeProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const fileInputRef = useRef(null);
  const [mapPosition, setMapPosition] = useState(THOOTHUKUDI);
  const [form, setForm] = useState({
    fullName: user?.fullName || '', dateOfBirth: '', mobileNumber: '',
    email: '', location: { latitude: THOOTHUKUDI.lat, longitude: THOOTHUKUDI.lng, address: '', district: 'Thoothukudi', state: 'Tamil Nadu', pincode: '' },
    vehicleType: '', vehicleNumber: '', vehicleModel: '', vehicleCapacity: 0, fuelType: 'Diesel',
    refrigerated: false, vehicleMileage: 12, serviceArea: '', workingHours: '08:00-20:00',
    baseCharge: 100, perKmCharge: 15, loadingCharge: 50, unloadingCharge: 50,
  });

  // Sync map position with form location
  useEffect(() => {
    setForm(f => ({
      ...f,
      location: { ...f.location, latitude: mapPosition.lat, longitude: mapPosition.lng }
    }));
  }, [mapPosition]);

  const getLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Getting your live location...', { id: 'gps' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapPosition(newPos);
          toast.success('Live location captured! 📍', { id: 'gps' });
        },
        () => toast.error('Location access denied. You can set it manually on the map.', { id: 'gps' }),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error('Geolocation not supported by your browser');
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePhoto(ev.target.result);
    reader.readAsDataURL(file);

    // Upload to Cloudinary via backend
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfilePhotoUrl(res.data.data);
      toast.success('Profile photo uploaded! 📷');
    } catch (err) {
      toast.error('Photo upload failed. You can add it later.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mobileNumber || !/^[6-9]\d{9}$/.test(form.mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const auth = await completeProfile(form);
      toast.success('Profile completed!');
      const paths = { FARMER: '/farmer/dashboard', BUYER: '/buyer/dashboard', TRANSPORTER: '/transporter/dashboard' };
      navigate(paths[auth.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 pt-24 pb-12 px-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="glass-card p-8 shadow-xl">
          {/* Header with Profile Photo */}
          <div className="text-center mb-8">
            {/* Profile Photo Circle */}
            <div className="relative inline-block mb-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-full border-4 border-dashed border-green-300 flex items-center justify-center cursor-pointer overflow-hidden bg-green-50 hover:border-green-500 transition-all hover:shadow-lg group"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <span className="text-3xl">📷</span>
                    <p className="text-[10px] text-gray-500 mt-1 group-hover:text-green-600">Add Photo</p>
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {profilePhoto && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setProfilePhoto(null); setProfilePhotoUrl(''); }}
                  className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 text-white rounded-full text-sm flex items-center justify-center shadow-lg hover:bg-red-600"
                >✕</button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            </div>
            <p className="text-xs text-gray-400 mb-3">Profile photo (optional)</p>

            <h1 className="font-display text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-500 text-sm mt-1">
              {user?.role === 'FARMER' ? '🌾 Set up your farm details' :
               user?.role === 'BUYER' ? '🛍️ Set up your buyer profile' :
               '🚛 Set up your transport details'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Common fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                  className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})}
                  className="input-field" />
              </div>
            </div>

            {/* Mobile Number - Mandatory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">📱 Mobile Number * <span className="text-xs text-red-500">(Required for transport & orders)</span></label>
              <input type="tel" value={form.mobileNumber} 
                onChange={e => setForm({...form, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                className="input-field" placeholder="9876543210" maxLength={10} required />
              {form.mobileNumber && !/^[6-9]\d{9}$/.test(form.mobileNumber) && (
                <p className="text-red-500 text-xs mt-1">Enter a valid 10-digit mobile number</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {user?.role === 'FARMER' ? 'Farm Location *' : 'Location *'}
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Address" value={form.location.address}
                  onChange={e => setForm({...form, location: {...form.location, address: e.target.value}})}
                  className="input-field" />
                <input type="text" placeholder="District" value={form.location.district}
                  onChange={e => setForm({...form, location: {...form.location, district: e.target.value}})}
                  className="input-field" />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <input type="text" placeholder="Pincode" value={form.location.pincode}
                  onChange={e => setForm({...form, location: {...form.location, pincode: e.target.value}})}
                  className="input-field" />
                <div className="col-span-2">
                  <button type="button" onClick={getLocation}
                    className="btn-secondary w-full !py-3 text-sm font-medium">
                    📍 Get Live GPS Location
                  </button>
                </div>
              </div>

              {/* Map */}
              <div className="mt-4 rounded-xl overflow-hidden border-2 border-green-200 shadow-lg" style={{ height: '300px' }}>
                <MapContainer
                  center={[THOOTHUKUDI.lat, THOOTHUKUDI.lng]}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                  <FlyToLocation position={mapPosition} />
                </MapContainer>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-green-600 font-medium">
                  📍 {mapPosition.lat.toFixed(6)}, {mapPosition.lng.toFixed(6)}
                </p>
                <p className="text-xs text-gray-400">Click map to set location manually</p>
              </div>
            </div>

            {/* Transporter-specific fields */}
            {user?.role === 'TRANSPORTER' && (
              <>
                <hr className="border-gray-200" />
                <h3 className="font-semibold text-gray-900">Vehicle Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type *</label>
                    <select value={form.vehicleType} onChange={e => setForm({...form, vehicleType: e.target.value})}
                      className="input-field">
                      <option value="">Select</option>
                      <option>Mini Truck</option><option>Pickup Van</option>
                      <option>Tempo</option><option>Truck</option><option>Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Number *</label>
                    <input type="text" value={form.vehicleNumber} onChange={e => setForm({...form, vehicleNumber: e.target.value})}
                      className="input-field" placeholder="TN 01 AB 1234" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity (kg)</label>
                    <input type="number" value={form.vehicleCapacity} onChange={e => setForm({...form, vehicleCapacity: Number(e.target.value)})}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mileage (km/l)</label>
                    <input type="number" value={form.vehicleMileage} onChange={e => setForm({...form, vehicleMileage: Number(e.target.value)})}
                      className="input-field" />
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mt-4">Charges</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Base (₹)</label>
                    <input type="number" value={form.baseCharge} onChange={e => setForm({...form, baseCharge: Number(e.target.value)})}
                      className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Per KM (₹)</label>
                    <input type="number" value={form.perKmCharge} onChange={e => setForm({...form, perKmCharge: Number(e.target.value)})}
                      className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Loading (₹)</label>
                    <input type="number" value={form.loadingCharge} onChange={e => setForm({...form, loadingCharge: Number(e.target.value)})}
                      className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unloading (₹)</label>
                    <input type="number" value={form.unloadingCharge} onChange={e => setForm({...form, unloadingCharge: Number(e.target.value)})}
                      className="input-field text-sm" />
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 text-base mt-6">
              {loading ? 'Saving...' : 'Complete Profile & Continue'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
