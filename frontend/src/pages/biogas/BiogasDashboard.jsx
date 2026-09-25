import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function BiogasDashboard() {
  const { t } = useTranslation();
  return (
    <div className="pt-20 pb-12 bg-gray-50 min-h-screen">
      <div className="page-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">⚡ {t('biogas.title')}</h1>
            <p className="text-white/80">Convert agricultural waste into biogas energy and organic fertilizer</p>
          </div>
          <div className="empty-state card">
            <span className="text-6xl mb-4">⚡</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Biogas Requests</h2>
            <p className="text-gray-500 mb-6">Submit agricultural waste for biogas conversion and earn from waste recycling.</p>
            <button className="btn-primary">🌿 {t('biogas.submitWaste')}</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
