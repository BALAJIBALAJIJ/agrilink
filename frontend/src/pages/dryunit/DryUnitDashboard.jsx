import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DryUnitDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isFarmer = user?.role === 'FARMER';
  const isManager = user?.role === 'DRY_UNIT_MANAGER';

  const [requests, setRequests] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(null);
  const [form, setForm] = useState({ vegetableName: '', quantityKg: '', requestedRatePerKg: '', description: '', imageUrl: '' });
  const [offerForm, setOfferForm] = useState({ ratePerKg: '', totalAmount: '', processingTime: '' });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [reqRes, unitRes] = await Promise.allSettled([
        isFarmer ? api.get('/dry-unit/requests/farmer?page=0&size=50') :
        isManager ? api.get('/dry-unit/manager/requests?page=0&size=50') : null,
        api.get('/dry-unit/units'),
      ]);
      if (reqRes.status === 'fulfilled' && reqRes.value) setRequests(reqRes.value.data.data?.content || []);
      if (unitRes.status === 'fulfilled') setUnits(unitRes.value.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const uploadImage = async () => {
    if (!imageFile) return '';
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data.data?.url || res.data.data || '';
    } catch { toast.error('Image upload failed'); return ''; }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vegetableName || !form.quantityKg) { toast.error('Fill required fields'); return; }

    try {
      let imageUrl = form.imageUrl;
      if (imageFile) imageUrl = await uploadImage();

      const profileRes = await api.get('/profile/me');
      const farmerProfile = profileRes.data.data?.[1];
      const loc = farmerProfile?.farmLocation || { latitude: 11.0168, longitude: 76.9558, address: 'Tamil Nadu' };

      await api.post('/dry-unit/requests', {
        vegetableName: form.vegetableName,
        quantityKg: Number(form.quantityKg),
        requestedRatePerKg: Number(form.requestedRatePerKg) || 0,
        description: form.description,
        imageUrl,
        pickupLocation: loc,
      });
      toast.success('🏭 Request sent to nearest Dry Unit!');
      setShowForm(false);
      setForm({ vegetableName: '', quantityKg: '', requestedRatePerKg: '', description: '', imageUrl: '' });
      setImageFile(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleOffer = async (reqId) => {
    if (!offerForm.ratePerKg || !offerForm.totalAmount) { toast.error('Fill offer details'); return; }
    try {
      await api.put(`/dry-unit/manager/requests/${reqId}/offer`, {
        ratePerKg: Number(offerForm.ratePerKg),
        totalAmount: Number(offerForm.totalAmount),
        processingTime: offerForm.processingTime || '2-3 Days',
      });
      toast.success('💰 Offer sent to farmer!');
      setShowOfferModal(null);
      setOfferForm({ ratePerKg: '', totalAmount: '', processingTime: '' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAction = async (url, msg) => {
    try { await api.put(url); toast.success(msg); loadData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusColors = {
    SUBMITTED: 'bg-yellow-100 text-yellow-700',
    OFFER_SENT: 'bg-blue-100 text-blue-700',
    FARMER_ACCEPTED: 'bg-green-100 text-green-700',
    FARMER_REJECTED: 'bg-red-100 text-red-700',
    TRANSPORT_REQUESTED: 'bg-indigo-100 text-indigo-700',
    IN_TRANSIT: 'bg-purple-100 text-purple-700',
    RECEIVED: 'bg-green-100 text-green-700',
    PAYMENT_COMPLETED: 'bg-green-200 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 sm:p-8 text-white mb-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">🏭 Dry Unit Management</h1>
              <p className="text-white/80">{isFarmer ? 'Send surplus vegetables for drying' : 'Manage incoming vegetable requests'}</p>
            </div>
            {isFarmer && (
              <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-white text-orange-600 rounded-xl font-semibold hover:bg-white/90 transition-all">
                {showForm ? '✕ Close' : '📝 Send to Dry Unit'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Farmer Request Form */}
        <AnimatePresence>
          {showForm && isFarmer && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit} className="card mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">📝 New Dry Unit Request</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Vegetable Name *</label>
                  <input type="text" value={form.vegetableName} onChange={e => setForm({ ...form, vegetableName: e.target.value })}
                    className="input-field mt-1" placeholder="e.g. Tomato, Chilli" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Quantity (KG) *</label>
                  <input type="number" value={form.quantityKg} onChange={e => setForm({ ...form, quantityKg: e.target.value })}
                    className="input-field mt-1" placeholder="100" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Expected Price (₹/kg)</label>
                  <input type="number" value={form.requestedRatePerKg} onChange={e => setForm({ ...form, requestedRatePerKg: e.target.value })}
                    className="input-field mt-1" placeholder="30" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Vegetable Image</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
                    className="input-field mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Quality / Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field mt-1" rows="2" placeholder="Fresh, slightly bruised, etc." />
                </div>
              </div>
              <button type="submit" disabled={uploading} className="btn-primary mt-4 w-full">
                {uploading ? '⏳ Uploading...' : '🏭 Submit Request to Nearest Dry Unit'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Requests List */}
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {isManager ? '📋 Incoming Requests' : '📋 My Dry Unit Requests'}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <span className="text-5xl mb-3">🏭</span>
              <p className="text-gray-500">No requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="p-5 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4 flex-1">
                      {req.imageUrl && (
                        <img src={req.imageUrl} alt={req.vegetableName} className="w-16 h-16 rounded-xl object-cover" />
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{req.vegetableName}</h3>
                        <p className="text-sm text-gray-500">{req.quantityKg} kg • {req.farmerName}</p>
                        {req.dryUnitName && <p className="text-xs text-orange-600 mt-1">🏭 {req.dryUnitName}</p>}
                        {req.description && <p className="text-xs text-gray-400 mt-1">{req.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">📅 {new Date(req.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${statusColors[req.status] || 'bg-gray-100 text-gray-600'}`}>
                        {req.status?.replace(/_/g, ' ')}
                      </span>

                      {/* Offer details */}
                      {req.totalOfferedAmount > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-700">₹{req.totalOfferedAmount.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">₹{req.offeredRatePerKg}/kg • {req.expectedProcessingTime}</p>
                        </div>
                      )}

                      {/* Manager actions */}
                      {isManager && req.status === 'SUBMITTED' && (
                        <div className="flex gap-2">
                          <button onClick={() => { setShowOfferModal(req.id); setOfferForm({ ratePerKg: '', totalAmount: '', processingTime: '' }); }}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">💰 Offer</button>
                          <button onClick={() => handleAction(`/dry-unit/manager/requests/${req.id}/reject`, '❌ Rejected')}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">✕ Reject</button>
                        </div>
                      )}

                      {/* Manager payment */}
                      {isManager && req.status === 'FARMER_ACCEPTED' && (
                        <button onClick={() => handleAction(`/dry-unit/manager/requests/${req.id}/payment`, '💰 Payment completed')}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">💰 Mark Payment Done</button>
                      )}

                      {/* Farmer actions */}
                      {isFarmer && req.status === 'OFFER_SENT' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(`/dry-unit/requests/${req.id}/accept`, '✅ Offer accepted!')}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">✅ Accept</button>
                          <button onClick={() => handleAction(`/dry-unit/requests/${req.id}/reject`, '❌ Offer rejected')}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">✕ Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dry Unit Locations Map */}
        {units.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📍 Tamil Nadu Dry Unit Locations ({units.length})</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {units.map(u => (
                <div key={u.id} className="p-3 bg-orange-50 rounded-xl">
                  <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.district}</p>
                  <p className="text-xs text-gray-400">{u.address}</p>
                  <p className="text-xs text-orange-600 mt-1">📞 {u.contactNumber}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offer Modal */}
        <AnimatePresence>
          {showOfferModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowOfferModal(null)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Send Price Offer</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rate per KG (₹)</label>
                    <input type="number" value={offerForm.ratePerKg}
                      onChange={e => {
                        const rate = e.target.value;
                        const req = requests.find(r => r.id === showOfferModal);
                        setOfferForm({ ...offerForm, ratePerKg: rate, totalAmount: req ? (rate * req.quantityKg).toFixed(2) : '' });
                      }}
                      className="input-field mt-1" placeholder="30" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Total Amount (₹)</label>
                    <input type="number" value={offerForm.totalAmount}
                      onChange={e => setOfferForm({ ...offerForm, totalAmount: e.target.value })}
                      className="input-field mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Processing Duration</label>
                    <input type="text" value={offerForm.processingTime}
                      onChange={e => setOfferForm({ ...offerForm, processingTime: e.target.value })}
                      className="input-field mt-1" placeholder="2-3 Days" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowOfferModal(null)} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600">Cancel</button>
                  <button onClick={() => handleOffer(showOfferModal)} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">
                    💰 Send Offer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
