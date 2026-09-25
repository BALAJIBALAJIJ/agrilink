import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export default function FarmerProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      const data = res.data.data;
      setProfileData(data[0]); // User data
      setFarmerProfile(data[1]); // Farmer profile data
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const location = farmerProfile?.farmLocation || farmerProfile?.location || null;
  const hasLocation = location && location.latitude && location.longitude;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-700 to-green-500 rounded-2xl p-8 text-white shadow-xl mb-6">
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full border-4 border-white/50 overflow-hidden shadow-2xl flex-shrink-0">
              {profileData?.profilePhotoUrl ? (
                <img src={profileData.profilePhotoUrl} alt={profileData.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-green-800 flex items-center justify-center text-5xl">👨‍🌾</div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profileData?.fullName || user?.fullName}</h1>
              <p className="text-green-100 mt-1">🌾 Farmer</p>
              <div className="flex gap-2 mt-3">
                <span className={`text-xs px-3 py-1 rounded-full ${
                  profileData?.verificationStatus === 'APPROVED' ? 'bg-green-400/30 text-green-100' :
                  'bg-yellow-400/30 text-yellow-100'
                }`}>
                  {profileData?.verificationStatus === 'APPROVED' ? '✅ Verified' : '⏳ Pending'}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-white/20">
                  {profileData?.profileCompleted ? '📋 Profile Complete' : '📋 Incomplete'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm">👤</span>
            Personal Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoCard label="Full Name" value={profileData?.fullName} icon="📝" />
            <InfoCard label="Mobile Number" value={profileData?.mobileNumber || 'Not set'} icon="📱" />
            <InfoCard label="Email" value={profileData?.email || 'Not provided'} icon="📧" />
            <InfoCard label="Date of Birth" value={profileData?.dateOfBirth || 'Not set'} icon="🎂" />
            <InfoCard label="Role" value={profileData?.role} icon="👨‍🌾" />
            <InfoCard label="Language" value={profileData?.preferredLanguage === 'ta' ? 'Tamil' : 'English'} icon="🌐" />
            <InfoCard label="Registered On" value={profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'} icon="📅" />
            <InfoCard label="Last Login" value={profileData?.lastLoginAt ? new Date(profileData.lastLoginAt).toLocaleString('en-IN') : 'Never'} icon="🕐" />
          </div>
        </motion.div>

        {/* Farm Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-sm">📍</span>
            Farm Location
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <InfoCard label="Address" value={location?.address || 'Not set'} icon="🏠" />
            <InfoCard label="District" value={location?.district || 'Not set'} icon="🗺️" />
            <InfoCard label="State" value={location?.state || 'Tamil Nadu'} icon="🏛️" />
            <InfoCard label="Pincode" value={location?.pincode || 'Not set'} icon="📮" />
            <InfoCard label="Latitude" value={location?.latitude?.toFixed(6) || 'N/A'} icon="🧭" />
            <InfoCard label="Longitude" value={location?.longitude?.toFixed(6) || 'N/A'} icon="🧭" />
          </div>

          {/* Map */}
          {hasLocation && (
            <div className="rounded-xl overflow-hidden border-2 border-green-200 shadow-lg" style={{ height: '300px' }}>
              <MapContainer
                center={[location.latitude, location.longitude]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[location.latitude, location.longitude]} icon={redIcon} />
              </MapContainer>
            </div>
          )}
        </motion.div>

        {/* Account Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-sm">🔐</span>
            Account Status
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{profileData?.verificationStatus === 'APPROVED' ? '✅' : '⏳'}</p>
              <p className="text-sm font-medium text-gray-700">Verification</p>
              <p className="text-xs text-gray-500">{profileData?.verificationStatus?.replace(/_/g, ' ')}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{profileData?.profileCompleted ? '📋' : '⚠️'}</p>
              <p className="text-sm font-medium text-gray-700">Profile</p>
              <p className="text-xs text-gray-500">{profileData?.profileCompleted ? 'Completed' : 'Incomplete'}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{profileData?.active ? '🟢' : '🔴'}</p>
              <p className="text-sm font-medium text-gray-700">Account</p>
              <p className="text-xs text-gray-500">{profileData?.active ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
      <p className="text-sm text-gray-900 font-semibold truncate">{value || 'N/A'}</p>
    </div>
  );
}
