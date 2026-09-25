import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDistrict, setDeliveryDistrict] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [locationType, setLocationType] = useState('manual'); // 'manual' or 'gps'

  const isBuyer = user?.role === 'BUYER';
  const isFarmer = user?.role === 'FARMER';

  useEffect(() => {
    api.get(`/products/${id}`).then(res => setProduct(res.data.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const getGPS = () => {
    if (!navigator.geolocation) { toast.error('GPS not supported'); return; }
    toast.loading('Getting your live location...', { id: 'gps' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationType('gps');
        toast.success('📍 GPS location captured!', { id: 'gps' });
      },
      () => toast.error('Location access denied', { id: 'gps' }),
      { enableHighAccuracy: true }
    );
  };

  const handleOrder = async () => {
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (isFarmer) { toast.error('Only Buyers can place orders'); return; }
    if (!quantity || Number(quantity) <= 0) { toast.error('Enter quantity'); return; }
    if (product && Number(quantity) < product.minimumSaleQuantity) {
      toast.error(`Minimum order: ${product.minimumSaleQuantity} kg`); return;
    }

    // Validate delivery location
    if (locationType === 'manual' && !deliveryAddress.trim()) {
      toast.error('Please enter delivery address'); return;
    }
    if (locationType === 'gps' && !gpsLocation) {
      toast.error('Please get GPS location first'); return;
    }

    setOrdering(true);
    try {
      const deliveryLocation = locationType === 'gps' 
        ? { latitude: gpsLocation.lat, longitude: gpsLocation.lng, address: deliveryAddress || 'GPS Location', district: deliveryDistrict, pincode: deliveryPincode }
        : { latitude: 0, longitude: 0, address: deliveryAddress, district: deliveryDistrict, pincode: deliveryPincode };

      await api.post('/orders', {
        productId: id,
        quantity: Number(quantity),
        deliveryLocation,
      });
      toast.success('Order placed successfully! 🎉');
      navigate('/buyer/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally { setOrdering(false); }
  };

  if (loading) return <div className="pt-20 min-h-screen flex items-center justify-center text-gray-500">{t('common.loading')}</div>;
  if (!product) return <div className="pt-20 min-h-screen flex items-center justify-center">Product not found</div>;

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl overflow-hidden h-72 md:h-full bg-gray-100">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.vegetableName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-green-50 to-green-100">🥬</div>
              )}
            </div>
            <div>
              <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-3">{product.category}</span>
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">{product.vegetableName}</h1>
              {product.vegetableNameTamil && <p className="text-lg text-gray-500 mb-4">{product.vegetableNameTamil}</p>}
              
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-agri-green">₹{product.pricePerKg}</span>
                <span className="text-gray-500">{t('product.perKg')}</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Available</span><span className="font-medium">{product.quantityAvailable} kg</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Min Order</span><span className="font-medium">{product.minimumSaleQuantity} kg</span></div>
                {product.harvestDate && <div className="flex justify-between text-sm"><span className="text-gray-500">Harvest Date</span><span className="font-medium">{product.harvestDate}</span></div>}
              </div>

              {product.description && <p className="text-gray-600 text-sm mb-6">{product.description}</p>}

              <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  {product.farmerProfilePhotoUrl ? <img src={product.farmerProfilePhotoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : '👨‍🌾'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{product.farmerName}</p>
                  <p className="text-xs text-gray-500">Verified Farmer</p>
                </div>
              </div>

              {/* ORDER SECTION - Only for Buyers */}
              {isFarmer ? (
                <div className="border-t border-gray-200 pt-6 text-center">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-yellow-700 font-medium">👁️ View Only</p>
                    <p className="text-yellow-600 text-sm mt-1">Farmers cannot place orders. Only Buyers can order produce.</p>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📦 Quantity (kg) *</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                      className="input-field" placeholder={`Min ${product.minimumSaleQuantity} kg`}
                      min={product.minimumSaleQuantity} max={product.quantityAvailable} />
                  </div>

                  {/* Delivery Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📍 Delivery Location *</label>
                    
                    {/* Location type toggle */}
                    <div className="flex gap-2 mb-3">
                      <button type="button" onClick={() => setLocationType('manual')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          locationType === 'manual' ? 'bg-agri-green text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        ✍️ Type Address
                      </button>
                      <button type="button" onClick={() => { setLocationType('gps'); getGPS(); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          locationType === 'gps' ? 'bg-agri-green text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                        📍 Live GPS
                      </button>
                    </div>

                    {locationType === 'gps' && gpsLocation && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <p className="text-green-700 text-sm font-medium">✅ GPS Location Captured</p>
                        <p className="text-green-600 text-xs">Lat: {gpsLocation.lat.toFixed(6)}, Lng: {gpsLocation.lng.toFixed(6)}</p>
                      </div>
                    )}

                    <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                      className="input-field mb-2" placeholder="Full delivery address" required />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={deliveryDistrict} onChange={e => setDeliveryDistrict(e.target.value)}
                        className="input-field" placeholder="District" />
                      <input type="text" value={deliveryPincode} onChange={e => setDeliveryPincode(e.target.value)}
                        className="input-field" placeholder="Pincode" />
                    </div>
                  </div>

                  {/* Total & Order Button */}
                  {quantity && Number(quantity) > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-3xl font-bold text-agri-green">₹{(Number(quantity) * product.pricePerKg).toFixed(0)}</p>
                    </div>
                  )}

                  <button onClick={handleOrder} disabled={ordering} 
                    className="btn-primary w-full !py-3.5 text-base disabled:opacity-60">
                    {ordering ? 'Placing Order...' : `🛒 ${t('buyer.placeOrder')}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
