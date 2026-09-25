import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title text-center mb-8">{t('nav.about')}</h1>
          <div className="card space-y-6 text-gray-600 leading-relaxed">
            <p className="text-lg">
              <span className="font-bold text-agri-green">AGRILINK</span> is a farm-to-market digital platform
              designed to eliminate middlemen and connect farmers directly with buyers through transparent pricing,
              real-time logistics, and a zero-waste circular economy approach.
            </p>
            <div className="grid md:grid-cols-3 gap-6 py-6">
              {[
                { icon: '🌾', title: 'Mission', desc: 'Empower farmers with fair prices by removing intermediaries.' },
                { icon: '🌍', title: 'Vision', desc: 'A world where no agricultural produce goes to waste.' },
                { icon: '💡', title: 'Approach', desc: 'Technology-driven marketplace with GPS tracking and surplus recovery.' },
              ].map((item, i) => (
                <div key={i} className="text-center p-6 bg-gray-50 rounded-xl">
                  <span className="text-4xl">{item.icon}</span>
                  <h3 className="font-bold text-gray-900 mt-3 mb-2">{item.title}</h3>
                  <p className="text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-agri-green to-agri-leaf rounded-xl p-8 text-white text-center">
              <h2 className="font-display text-2xl font-bold mb-2">Empowering Farmers • Smart Selling • Zero Waste</h2>
              <p className="text-white/80">Built in Tamil Nadu, India 🇮🇳</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
