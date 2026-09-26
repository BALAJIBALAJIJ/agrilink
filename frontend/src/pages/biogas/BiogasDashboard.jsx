import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const WASTE_TYPES = ['Vegetable Waste', 'Paddy Straw', 'Sugarcane Waste', 'Coconut Waste', 'Cow Dung', 'Agricultural Waste'];

export default function BiogasDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isFarmer = user?.role === 'FARMER';
  const isManager = user?.role === 'BIOGAS_MANAGER';

  const [requests, setRequests] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(null);
  const [form, setForm] = useState({ wasteType: 'Vegetable Waste', quantityKg: '', description: '', imageUrl: '' });
  const [offerForm, setOfferForm] = useState({ ratePerKg: '', totalAmount: '', suitability: 'SUITABLE' });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [reqRes, plantRes] = await Promise.allSettled([
        isFarmer ? api.get('/biogas/requests/farmer?page=0&size=50') :
        isManager ? api.get('/biogas/manager/requests?page=0&size=50') : null,
        api.get('/biogas/plants'),
      ]);
      if (reqRes.status === 'fulfilled' && reqRes.value) setRequests(reqRes.value.data.data?.content || []);
      if (plantRes.status === 'fulfilled') setPlants(plantRes.value.data.data || []);
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
    if (!form.wasteType || !form.quantityKg) { toast.error('Fill required fields'); return; }

    try {
      let imageUrl = form.imageUrl;
      if (imageFile) imageUrl = await uploadImage();

      const profileRes = await api.get('/profile/me');
      const farmerProfile = profileRes.data.data?.[1];
      const loc = farmerProfile?.farmLocation || { latitude: 11.0168, longitude: 76.9558, address: 'Tamil Nadu' };

      await api.post('/biogas/requests', {
        wasteType: form.wasteType,
        quantityKg: Number(form.quantityKg),
        description: form.description,
        imageUrl,
        location: loc,
      });
      toast.success('⚡ Request sent to nearest Biogas Plant!');
      setShowForm(false);
      setForm({ wasteType: 'Vegetable Waste', quantityKg: '', description: '', imageUrl: '' });
      setImageFile(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleOffer = async (reqId) => {
    if (!offerForm.totalAmount) { toast.error('Enter offer amount'); return; }
    try {
      await api.put(`/biogas/manager/requests/${reqId}/offer`, {
        ratePerKg: Number(offerForm.ratePerKg) || 0,
        totalAmount: Number(offerForm.totalAmount),
        suitability: offerForm.suitability,
      });
      toast.success('💰 Purchase offer sent!');
      setShowOfferModal(null);
      setOfferForm({ ratePerKg: '', totalAmount: '', suitability: 'SUITABLE' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAction = async (url, msg) => {
    try { await api.put(url); toast.success(msg); loadData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusColors = {
    SUBMITTED: 'bg-yellow-100 text-yellow-700',
    UNDER_REVIEW: 'bg-blue-100 text-blue-700',
    SUITABLE: 'bg-green-100 text-green-700',
    NOT_SUITABLE: 'bg-red-100 text-red-700',
    OFFER_SENT: 'bg-blue-100 text-blue-700',
    FARMER_ACCEPTED: 'bg-green-100 text-green-700',
    FARMER_REJECTED: 'bg-red-100 text-red-700',
    COLLECTION_REQUESTED: 'bg-indigo-100 text-indigo-700',
    COLLECTED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-green-200 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 sm:p-8 text-white mb-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">⚡ Biogas Waste Management</h1>
              <p className="text-white/80">{isFarmer ? 'Sell agricultural waste for biogas energy' : 'Manage waste collection requests'}</p>
            </div>
            {isFarmer && (
              <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-white text-green-600 rounded-xl font-semibold hover:bg-white/90 transition-all">
                {showForm ? '✕ Close' : '🌿 Sell Organic Waste'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Farmer Submit Form */}
        <AnimatePresence>
          {showForm && isFarmer && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit} className="card mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🌿 Submit Waste for Biogas</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Waste Type *</label>
                  <select value={form.wasteType} onChange={e => setForm({ ...form, wasteType: e.target.value })}
                    className="input-field mt-1">
                    {WASTE_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Quantity (KG) *</label>
                  <input type="number" value={form.quantityKg} onChange={e => setForm({ ...form, quantityKg: e.target.value })}
                    className="input-field mt-1" placeholder="100" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Waste Image</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
                    className="input-field mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field mt-1" placeholder="Fresh vegetable waste, dry straw, etc." />
                </div>
              </div>
              <button type="submit" disabled={uploading} className="btn-primary mt-4 w-full !bg-green-600 hover:!bg-green-700">
                {uploading ? '⏳ Uploading...' : '⚡ Submit to Nearest Biogas Plant'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Requests */}
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {isManager ? '📋 Incoming Waste Requests' : '📋 My Biogas Requests'}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <span className="text-5xl mb-3">⚡</span>
              <p className="text-gray-500">No requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="p-5 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4 flex-1">
                      {req.imageUrl && (
                        <img src={req.imageUrl} alt={req.wasteType} className="w-16 h-16 rounded-xl object-cover" />
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{req.wasteType}</h3>
                        <p className="text-sm text-gray-500">{req.quantityKg} kg • {req.farmerName}</p>
                        {req.description && <p className="text-xs text-gray-400 mt-1">{req.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">📅 {new Date(req.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${statusColors[req.status] || 'bg-gray-100 text-gray-600'}`}>
                        {req.status?.replace(/_/g, ' ')}
                      </span>

                      {req.totalPurchaseAmount > 0 && (
                        <p className="text-sm font-bold text-green-700">₹{req.totalPurchaseAmount.toFixed(2)}</p>
                      )}

                      {/* Manager actions */}
                      {isManager && (req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW') && (
                        <div className="flex gap-2">
                          <button onClick={() => { setShowOfferModal(req.id); setOfferForm({ ratePerKg: '', totalAmount: '', suitability: 'SUITABLE' }); }}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">💰 Offer</button>
                          <button onClick={() => handleAction(`/biogas/manager/requests/${req.id}/reject`, '❌ Rejected')}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">✕ Reject</button>
                        </div>
                      )}

                      {isManager && req.status === 'FARMER_ACCEPTED' && (
                        <button onClick={() => handleAction(`/biogas/manager/requests/${req.id}/payment`, '💰 Payment completed')}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">💰 Mark Payment</button>
                      )}

                      {/* Farmer actions */}
                      {isFarmer && req.status === 'OFFER_SENT' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(`/biogas/requests/${req.id}/accept`, '✅ Accepted!')}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">✅ Accept</button>
                          <button onClick={() => handleAction(`/biogas/requests/${req.id}/reject`, '❌ Rejected')}
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

        {/* Biogas Plant Locations */}
        {plants.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📍 Tamil Nadu Biogas Plants ({plants.length})</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {plants.map(p => (
                <div key={p.id} className="p-3 bg-green-50 rounded-xl">
                  <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.district}</p>
                  <p className="text-xs text-gray-400">{p.address}</p>
                  <p className="text-xs text-green-600 mt-1">📞 {p.contactNumber}</p>
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Send Purchase Offer</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Waste Suitability</label>
                    <select value={offerForm.suitability} onChange={e => setOfferForm({ ...offerForm, suitability: e.target.value })}
                      className="input-field mt-1">
                      <option value="SUITABLE">✅ Suitable</option>
                      <option value="NEEDS_REVIEW">🔍 Needs Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rate per KG (₹)</label>
                    <input type="number" value={offerForm.ratePerKg}
                      onChange={e => {
                        const rate = e.target.value;
                        const req = requests.find(r => r.id === showOfferModal);
                        setOfferForm({ ...offerForm, ratePerKg: rate, totalAmount: req ? (rate * req.quantityKg).toFixed(2) : '' });
                      }}
                      className="input-field mt-1" placeholder="5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Total Amount (₹)</label>
                    <input type="number" value={offerForm.totalAmount}
                      onChange={e => setOfferForm({ ...offerForm, totalAmount: e.target.value })}
                      className="input-field mt-1" />
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
