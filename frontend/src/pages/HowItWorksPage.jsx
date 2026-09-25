import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
export default function HowItWorksPage() {
  const { t } = useTranslation();
  const steps = [
    { icon: '👨‍🌾', title: t('howItWorks.step1'), desc: t('howItWorks.step1Desc'), details: ['Create account as Farmer','Add vegetable photos, price, quantity','Set minimum order quantity','Your listing appears on marketplace'] },
    { icon: '🛒', title: t('howItWorks.step2'), desc: t('howItWorks.step2Desc'), details: ['Browse verified farmer listings','Select quantity & delivery location','Place order with GPS coordinates','Upload payment proof (QR/UPI)'] },
    { icon: '🚛', title: t('howItWorks.step3'), desc: t('howItWorks.step3Desc'), details: ['Verified transporters see requests','Accept delivery with vehicle info','Real-time GPS tracking enabled','Route calculated via OSRM'] },
    { icon: '✅', title: t('howItWorks.step4'), desc: t('howItWorks.step4Desc'), details: ['Buyer confirms delivery','PDF receipt generated','Payment settled to farmer','Review & rating system'] },
  ];
  return (
    <div className="pt-20 pb-16 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="section-title text-center mb-12">{t('howItWorks.title')}</motion.h1>
        <div className="space-y-8">
          {steps.map((step, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="card flex flex-col md:flex-row gap-6 items-start">
              <div className="w-20 h-20 bg-gradient-to-br from-agri-green to-agri-leaf rounded-2xl flex items-center justify-center text-4xl shadow-lg shrink-0">
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-agri-sun text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">0{i+1}</span>
                  <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
                </div>
                <p className="text-gray-600 mb-3">{step.desc}</p>
                <ul className="space-y-1">
                  {step.details.map((d, j) => (
                    <li key={j} className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="text-agri-green">✓</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
