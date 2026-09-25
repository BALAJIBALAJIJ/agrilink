import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function DryUnitDashboard() {
  const { t } = useTranslation();
  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">🏭 {t('dryUnit.title')}</h1>
            <p className="text-white/80">Process surplus vegetables into dried products</p>
          </div>
          <div className="empty-state card">
            <span className="text-6xl mb-4">🏭</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Dry Unit Requests</h2>
            <p className="text-gray-500 mb-6">Send surplus vegetables for drying when they aren't sold on the marketplace.</p>
            <button className="btn-primary">📝 {t('dryUnit.sendRequest')}</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
