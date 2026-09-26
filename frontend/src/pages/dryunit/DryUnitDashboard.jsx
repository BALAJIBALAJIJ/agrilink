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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [requestedRate, setRequestedRate] = useState('');
  const [requestedQty, setRequestedQty] = useState('');
  const [description, setDescription] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ ratePerKg: '', totalAmount: '', processingTime: '' });
  const [showProfile, setShowProfile] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const calls = [api.get('/dry-unit/units')];
      if (isFarmer) {
        calls.push(api.get('/dry-unit/requests/farmer?page=0&size=50'));
        calls.push(api.get(`/products/farmer/${user.userId}`));
      } else if (isManager) {
        calls.push(api.get('/dry-unit/manager/requests?page=0&size=50'));
      }
      const results = await Promise.allSettled(calls);
      if (results[0].status === 'fulfilled') setUnits(results[0].value.data.data || []);
      if (results[1]?.status === 'fulfilled') {
        const d = results[1].value.data.data;
        setRequests(d?.content || d || []);
      }
      if (results[2]?.status === 'fulfilled') setProducts(results[2].value.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleSendRequest = async () => {
    if (!selectedProduct) { toast.error('Select a product first'); return; }
    if (!requestedQty || Number(requestedQty) <= 0) { toast.error('Enter quantity'); return; }

    try {
      const profileRes = await api.get('/profile/me');
      const farmerProfile = profileRes.data.data?.[1];
      const loc = farmerProfile?.farmLocation || { latitude: 11.0168, longitude: 76.9558, address: 'Tamil Nadu' };

      await api.post('/dry-unit/requests', {
        vegetableName: selectedProduct.name,
        quantityKg: Number(requestedQty),
        requestedRatePerKg: Number(requestedRate) || selectedProduct.pricePerKg || 0,
        description: description || `Quality: ${selectedProduct.quality || 'Fresh'}`,
        imageUrl: selectedProduct.imageUrl || '',
        pickupLocation: loc,
      });
      toast.success('🏭 Request sent to nearest Dry Unit!');
      setShowProducts(false);
      setSelectedProduct(null);
      setRequestedRate('');
      setRequestedQty('');
      setDescription('');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send request'); }
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
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAction = async (method, url, msg) => {
    try {
      if (method === 'put') await api.put(url);
      else await api.post(url);
      toast.success(msg);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const viewProfile = async (farmerId, farmerName) => {
    try {
      // We'll show what we have from the request data
      setShowProfile({ farmerId, farmerName });
      setProfileData(null);
    } catch {}
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
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 sm:p-8 text-white mb-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">🏭 Dry Unit Management</h1>
              <p className="text-white/80">{isFarmer ? 'Send surplus marketplace vegetables for drying' : 'Manage incoming vegetable requests'}</p>
            </div>
            {isFarmer && (
              <button onClick={() => setShowProducts(!showProducts)}
                className="px-5 py-2.5 bg-white text-orange-600 rounded-xl font-semibold hover:bg-white/90 transition-all">
                {showProducts ? '✕ Close' : '🏭 Send to Dry Unit'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Farmer: Select from marketplace products */}
        <AnimatePresence>
          {showProducts && isFarmer && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="card mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">📦 Select from Your Marketplace Listings</h2>
              <p className="text-sm text-gray-500 mb-4">Choose which vegetable you want to send to the nearest Dry Unit</p>

              {products.length === 0 ? (
                <div className="empty-state py-8">
                  <span className="text-4xl mb-3">🥬</span>
                  <p className="text-gray-500">No products listed in marketplace</p>
                  <p className="text-sm text-gray-400">List vegetables in marketplace first, then send surplus here</p>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {products.map(p => (
                      <div key={p.id}
                        onClick={() => {
                          setSelectedProduct(p);
                          setRequestedQty(String(p.quantityAvailable || ''));
                          setRequestedRate(String(p.pricePerKg || ''));
                        }}
                        className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                          selectedProduct?.id === p.id
                            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                            : 'border-gray-200 bg-gray-50 hover:border-orange-300'
                        }`}>
                        <div className="flex items-start gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-14 h-14 rounded-lg object-cover" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-orange-100 flex items-center justify-center text-2xl">🥬</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{p.name}</h3>
                            <p className="text-sm text-gray-500">{p.quantityAvailable} kg available</p>
                            <p className="text-sm text-orange-600 font-semibold">₹{p.pricePerKg}/kg</p>
                            {p.quality && <p className="text-xs text-gray-400 mt-0.5">Quality: {p.quality}</p>}
                          </div>
                          {selectedProduct?.id === p.id && (
                            <span className="text-orange-500 text-xl">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Request form after selection */}
                  {selectedProduct && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border-t border-gray-200 pt-4">
                      <div className="flex items-center gap-4 mb-4 p-3 bg-orange-50 rounded-xl">
                        {selectedProduct.imageUrl && (
                          <img src={selectedProduct.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-bold text-gray-900">Selected: {selectedProduct.name}</p>
                          <p className="text-sm text-gray-500">Market price: ₹{selectedProduct.pricePerKg}/kg • Available: {selectedProduct.quantityAvailable} kg</p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Quantity to Send (KG) *</label>
                          <input type="number" value={requestedQty}
                            onChange={e => setRequestedQty(e.target.value)}
                            max={selectedProduct.quantityAvailable}
                            className="input-field mt-1" placeholder="50" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Expected Rate (₹/kg)</label>
                          <input type="number" value={requestedRate}
                            onChange={e => setRequestedRate(e.target.value)}
                            className="input-field mt-1" placeholder="30" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Quality / Notes</label>
                          <input type="text" value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="input-field mt-1" placeholder="Fresh, slightly bruised..." />
                        </div>
                      </div>
                      <button onClick={handleSendRequest}
                        className="btn-primary w-full !py-3 text-base">
                        🏭 Send {selectedProduct.name} ({requestedQty || 0} kg) to Nearest Dry Unit
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
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
              {isFarmer && <p className="text-sm text-gray-400 mt-1">Select products from marketplace to send to Dry Unit</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="p-5 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4 flex-1">
                      {req.imageUrl ? (
                        <img src={req.imageUrl} alt={req.vegetableName} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">🥬</div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{req.vegetableName}</h3>
                        <p className="text-sm text-gray-500">{req.quantityKg} kg</p>

                        {/* Farmer name - clickable for manager */}
                        {isManager ? (
                          <button onClick={() => viewProfile(req.farmerId, req.farmerName)}
                            className="text-sm text-blue-600 hover:underline font-medium mt-1">
                            👨‍🌾 {req.farmerName} →
                          </button>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">👨‍🌾 {req.farmerName}</p>
                        )}

                        {req.requestedRatePerKg > 0 && (
                          <p className="text-xs text-orange-600 mt-1">Requested: ₹{req.requestedRatePerKg}/kg</p>
                        )}
                        {req.dryUnitName && <p className="text-xs text-orange-500 mt-1">🏭 {req.dryUnitName}</p>}
                        {req.description && <p className="text-xs text-gray-400 mt-1">{req.description}</p>}

                        {/* Pickup location */}
                        {req.pickupLocation && (
                          <p className="text-xs text-gray-400 mt-1">
                            📍 {req.pickupLocation.address || `${req.pickupLocation.latitude?.toFixed(4)}, ${req.pickupLocation.longitude?.toFixed(4)}`}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-1">📅 {new Date(req.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${statusColors[req.status] || 'bg-gray-100 text-gray-600'}`}>
                        {req.status?.replace(/_/g, ' ')}
                      </span>

                      {/* Offer details */}
                      {req.totalOfferedAmount > 0 && (
                        <div className="text-right bg-green-50 px-3 py-2 rounded-lg">
                          <p className="text-sm font-bold text-green-700">₹{req.totalOfferedAmount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">₹{req.offeredRatePerKg}/kg</p>
                          {req.expectedProcessingTime && <p className="text-xs text-gray-400">⏱️ {req.expectedProcessingTime}</p>}
                        </div>
                      )}

                      {/* Manager actions */}
                      {isManager && req.status === 'SUBMITTED' && (
                        <div className="flex gap-2">
                          <button onClick={() => {
                            setShowOfferModal(req.id);
                            setOfferForm({ ratePerKg: '', totalAmount: '', processingTime: '' });
                          }} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                            💰 Send Offer
                          </button>
                          <button onClick={() => handleAction('put', `/dry-unit/manager/requests/${req.id}/reject`, '❌ Rejected')}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">✕ Reject</button>
                        </div>
                      )}

                      {isManager && req.status === 'FARMER_ACCEPTED' && (
                        <button onClick={() => handleAction('put', `/dry-unit/manager/requests/${req.id}/payment`, '💰 Payment completed')}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">💰 Complete Payment</button>
                      )}

                      {/* Farmer actions on offer */}
                      {isFarmer && req.status === 'OFFER_SENT' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction('put', `/dry-unit/requests/${req.id}/accept`, '✅ Offer accepted!')}
                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">✅ Accept Offer</button>
                          <button onClick={() => handleAction('put', `/dry-unit/requests/${req.id}/reject`, '❌ Offer rejected')}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">✕ Reject</button>
                        </div>
                      )}

                      {/* Payment received indicator */}
                      {req.status === 'PAYMENT_COMPLETED' && (
                        <div className="text-right">
                          <p className="text-xs text-green-700 font-bold">💰 ₹{req.totalOfferedAmount?.toFixed(2)} Paid</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dry Unit Locations */}
        {units.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📍 Tamil Nadu Dry Units ({units.length} Districts)</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {units.map(u => (
                <div key={u.id} className="p-3 bg-orange-50 rounded-xl">
                  <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.district} District</p>
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
                <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Send Price Offer to Farmer</h3>
                {(() => {
                  const req = requests.find(r => r.id === showOfferModal);
                  return req ? (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                      <p><strong>{req.vegetableName}</strong> — {req.quantityKg} kg</p>
                      <p className="text-gray-500">From: {req.farmerName}</p>
                      {req.requestedRatePerKg > 0 && <p className="text-orange-600">Farmer expects: ₹{req.requestedRatePerKg}/kg</p>}
                    </div>
                  ) : null;
                })()}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Your Rate per KG (₹)</label>
                    <input type="number" value={offerForm.ratePerKg}
                      onChange={e => {
                        const rate = e.target.value;
                        const req = requests.find(r => r.id === showOfferModal);
                        setOfferForm({ ...offerForm, ratePerKg: rate, totalAmount: req ? (rate * req.quantityKg).toFixed(2) : '' });
                      }}
                      className="input-field mt-1" placeholder="25" />
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
                  <button onClick={() => setShowOfferModal(null)} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-medium">Cancel</button>
                  <button onClick={() => handleOffer(showOfferModal)} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">
                    💰 Send Offer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Farmer Profile Modal */}
        <AnimatePresence>
          {showProfile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowProfile(null)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-900 mb-4">👨‍🌾 Farmer Profile</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-[10px] uppercase text-blue-400 font-bold">Farmer Name</p>
                    <p className="font-bold text-gray-900 text-lg">{showProfile.farmerName}</p>
                  </div>
                  {/* Show all requests from this farmer */}
                  {requests.filter(r => r.farmerId === showProfile.farmerId).map(r => (
                    <div key={r.id} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                      {r.imageUrl && <img src={r.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <div>
                        <p className="font-medium text-sm">{r.vegetableName} — {r.quantityKg} kg</p>
                        <p className="text-xs text-gray-400">{r.pickupLocation?.address || 'Location available'}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${statusColors[r.status] || 'bg-gray-100'}`}>
                        {r.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowProfile(null)} className="w-full mt-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-medium">Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
