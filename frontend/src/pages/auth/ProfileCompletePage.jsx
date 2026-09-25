import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProfileCompletePage() {
  const { t } = useTranslation();
  const { user, completeProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '', dateOfBirth: '', mobileNumber: '',
    email: '', location: { latitude: 0, longitude: 0, address: '', district: '', state: 'Tamil Nadu', pincode: '' },
    vehicleType: '', vehicleNumber: '', vehicleModel: '', vehicleCapacity: 0, fuelType: 'Diesel',
    refrigerated: false, vehicleMileage: 12, serviceArea: '', workingHours: '08:00-20:00',
    baseCharge: 100, perKmCharge: 15, loadingCharge: 50, unloadingCharge: 50,
  });

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm(f => ({ ...f, location: { ...f.location, latitude: pos.coords.latitude, longitude: pos.coords.longitude }}));
          toast.success('Location captured');
        },
        () => toast.error(t('errors.locationDenied'))
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          <div className="text-center mb-8">
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
                    className="btn-secondary w-full !py-3 text-sm">
                    📍 Get GPS Location
                  </button>
                </div>
              </div>
              {form.location.latitude !== 0 && (
                <p className="text-xs text-green-600 mt-2">
                  📍 {form.location.latitude.toFixed(6)}, {form.location.longitude.toFixed(6)}
                </p>
              )}
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
