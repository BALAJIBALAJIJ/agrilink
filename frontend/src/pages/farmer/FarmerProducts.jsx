import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function FarmerProducts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get(`/products/farmer/${user.userId}`);
      setProducts(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const togglePause = async (id) => {
    try {
      await api.put(`/products/${id}/toggle-pause`);
      toast.success('Product updated');
      loadProducts();
    } catch { toast.error('Failed to update'); }
  };

  const removeProduct = async (id) => {
    if (!confirm('Remove this listing?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product removed');
      loadProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove'); }
  };

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title">{t('farmer.myProducts')}</h1>
          <Link to="/farmer/products/create" className="btn-primary">➕ {t('farmer.addProduct')}</Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span className="text-6xl mb-4">🌱</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Products Listed</h2>
            <p className="text-gray-500 mb-6">{t('product.noProducts')}</p>
            <Link to="/farmer/products/create" className="btn-primary">➕ {t('farmer.addProduct')}</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="card group">
                <div className="relative mb-4 rounded-xl overflow-hidden h-48 bg-gray-100">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.vegetableName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-green-50 to-green-100">🥬</div>
                  )}
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${
                    product.paused ? 'bg-yellow-100 text-yellow-700' : product.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.paused ? t('product.paused') : product.available ? t('product.available') : 'Sold Out'}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{product.vegetableName}</h3>
                {product.vegetableNameTamil && <p className="text-sm text-gray-500">{product.vegetableNameTamil}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xl font-bold text-agri-green">₹{product.pricePerKg}{t('product.perKg')}</span>
                  <span className="text-sm text-gray-500">{product.quantityAvailable} kg</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => togglePause(product.id)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-all">
                    {product.paused ? '▶️ Resume' : '⏸️ Pause'}
                  </button>
                  <button onClick={() => removeProduct(product.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all">
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
