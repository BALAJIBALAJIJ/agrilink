import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Leafy Greens', 'Root Vegetables', 'Gourds', 'Beans & Pods', 'Tubers', 'Fruits', 'Spices', 'Others'];

export default function CreateProduct() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
    category: '', vegetableName: '', vegetableNameTamil: '', quantityAvailable: '',
    pricePerKg: '', minimumSaleQuantity: '1', harvestDate: '', description: '',
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.vegetableName || !form.quantityAvailable || !form.pricePerKg) {
      toast.error('Please fill all required fields'); return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('product', new Blob([JSON.stringify({
        ...form,
        quantityAvailable: Number(form.quantityAvailable),
        pricePerKg: Number(form.pricePerKg),
        minimumSaleQuantity: Number(form.minimumSaleQuantity),
      })], { type: 'application/json' }));
      if (imageFile) formData.append('image', imageFile);

      await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Vegetable listed successfully!');
      navigate('/farmer/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally { setLoading(false); }
  };

  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title mb-8">{t('farmer.addProduct')}</h1>
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('product.image')}</label>
                <div className="relative">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-agri-green transition-all bg-gray-50">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="text-center">
                        <span className="text-4xl">📷</span>
                        <p className="text-sm text-gray-500 mt-2">Click to upload vegetable photo</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('product.category')} *</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="input-field" required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('product.name')} (English) *</label>
                  <input type="text" value={form.vegetableName} onChange={e => setForm({...form, vegetableName: e.target.value})}
                    className="input-field" placeholder="e.g. Tomato" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('product.name')} (Tamil)</label>
                  <input type="text" value={form.vegetableNameTamil} onChange={e => setForm({...form, vegetableNameTamil: e.target.value})}
                    className="input-field" placeholder="e.g. தக்காளி" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('product.quantity')} *</label>
                  <input type="number" value={form.quantityAvailable} onChange={e => setForm({...form, quantityAvailable: e.target.value})}
                    className="input-field" min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('product.pricePerKg')} *</label>
                  <input type="number" value={form.pricePerKg} onChange={e => setForm({...form, pricePerKg: e.target.value})}
                    className="input-field" min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('product.minSaleQty')}</label>
                  <input type="number" value={form.minimumSaleQuantity} onChange={e => setForm({...form, minimumSaleQuantity: e.target.value})}
                    className="input-field" min="1" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('product.harvestDate')}</label>
                <input type="date" value={form.harvestDate} onChange={e => setForm({...form, harvestDate: e.target.value})}
                  className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('product.description')}</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="input-field min-h-[100px]" placeholder="Describe your produce..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? t('common.loading') : t('product.proceedToMarket')}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
