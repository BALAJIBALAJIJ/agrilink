import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../services/api';

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => { loadProducts(); }, [page, search]);

  const loadProducts = async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}&page=${page}&size=20` : `?page=${page}&size=20`;
      const res = await api.get(`/products${params}`);
      setProducts(res.data.data?.content || []);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="section-title">{t('nav.marketplace')}</h1>
            <p className="text-gray-500 mt-1">Fresh produce directly from verified farmers</p>
          </div>
          <div className="relative w-full sm:w-80">
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="input-field pl-10" placeholder={t('common.search')} />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span className="text-6xl mb-4">🌾</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Produce Available</h2>
            <p className="text-gray-500">{t('empty.noListings')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Link to={`/buyer/product/${product.id}`} className="card-interactive block">
                  <div className="relative h-44 rounded-xl overflow-hidden bg-gray-100 mb-4">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.vegetableName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-green-50 to-green-100">🥬</div>
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-gray-700">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900">{product.vegetableName}</h3>
                  {product.vegetableNameTamil && <p className="text-xs text-gray-500">{product.vegetableNameTamil}</p>}
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <span className="text-2xl font-bold text-agri-green">₹{product.pricePerKg}</span>
                      <span className="text-sm text-gray-500">{t('product.perKg')}</span>
                    </div>
                    <span className="text-sm text-gray-500">{product.quantityAvailable} kg</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs">
                      {product.farmerProfilePhotoUrl ? <img src={product.farmerProfilePhotoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : '👨‍🌾'}
                    </div>
                    <span className="text-xs text-gray-500">{product.farmerName}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
