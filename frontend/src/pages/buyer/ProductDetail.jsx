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

  useEffect(() => {
    api.get(`/products/${id}`).then(res => setProduct(res.data.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleOrder = async () => {
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (!quantity || Number(quantity) <= 0) { toast.error('Enter quantity'); return; }
    if (product && Number(quantity) < product.minimumSaleQuantity) {
      toast.error(`Minimum order: ${product.minimumSaleQuantity} kg`); return;
    }
    setOrdering(true);
    try {
      // Get GPS location
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject));
      
      await api.post('/orders', {
        productId: id,
        quantity: Number(quantity),
        deliveryLocation: { latitude: pos.coords.latitude, longitude: pos.coords.longitude, address: 'GPS Location' },
      });
      toast.success('Order placed! Proceed to payment.');
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
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">👨‍🌾</div>
                <div>
                  <p className="font-medium text-gray-900">{product.farmerName}</p>
                  <p className="text-xs text-gray-500">Verified Farmer</p>
                </div>
              </div>

              {/* Order Form */}
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('buyer.selectQuantity')} (kg)</label>
                <div className="flex gap-3">
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                    className="input-field flex-1" placeholder={`Min ${product.minimumSaleQuantity} kg`}
                    min={product.minimumSaleQuantity} max={product.quantityAvailable} />
                  <button onClick={handleOrder} disabled={ordering} className="btn-primary whitespace-nowrap">
                    {ordering ? '...' : `🛒 ${t('buyer.placeOrder')}`}
                  </button>
                </div>
                {quantity && Number(quantity) > 0 && (
                  <p className="mt-3 text-right text-lg font-bold text-agri-green">
                    Total: ₹{(Number(quantity) * product.pricePerKg).toFixed(0)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
