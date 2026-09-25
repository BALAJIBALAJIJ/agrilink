import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center bg-hero-pattern overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating clouds */}
          <div className="absolute top-[15%] left-0 w-32 h-16 bg-white/10 rounded-full blur-xl animate-cloud-move" style={{ animationDelay: '0s' }} />
          <div className="absolute top-[25%] left-0 w-48 h-20 bg-white/8 rounded-full blur-2xl animate-cloud-move" style={{ animationDelay: '8s' }} />
          {/* Floating leaves */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-leaf-fall opacity-60"
              style={{
                left: `${15 + i * 15}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: `${10 + i * 2}s`,
              }}
            >
              🍃
            </div>
          ))}
          {/* Sun glow */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse-soft" />
          {/* Pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-white"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                AgriTech Platform
              </motion.div>

              <motion.h1 variants={fadeUp} className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                {t('hero.title')}
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8 max-w-xl">
                {t('hero.subtitle')}
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
                <Link to="/market" className="btn-accent !text-base !px-8 !py-4 shadow-xl">
                  🛒 {t('hero.exploreMarket')}
                </Link>
                <Link to="/auth/register" className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all text-base">
                  🌱 {t('hero.joinAgrilink')}
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div variants={fadeUp} className="flex gap-8 mt-12 pt-8 border-t border-white/10">
                {[
                  { label: 'Direct Connection', icon: '🤝' },
                  { label: 'Live Tracking', icon: '📍' },
                  { label: 'Zero Waste', icon: '♻️' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className="text-sm text-white/70 font-medium">{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block relative"
            >
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Connection visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Central hub */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-32 h-32 bg-white/20 backdrop-blur-lg rounded-3xl flex flex-col items-center justify-center shadow-2xl border border-white/30 overflow-hidden"
                  >
                    <img src="/logo.png" alt="AGRILINK" className="w-24 h-24 object-contain drop-shadow-lg" />
                    <span className="text-white font-bold text-sm">AGRILINK</span>
                  </motion.div>

                  {/* Farmer */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 0 }}
                    className="absolute -top-4 -left-4 w-24 h-24 bg-white/15 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center border border-white/20"
                  >
                    <span className="text-3xl">👨‍🌾</span>
                    <span className="text-white text-xs font-medium mt-1">Farmer</span>
                  </motion.div>

                  {/* Buyer */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    className="absolute -top-4 -right-4 w-24 h-24 bg-white/15 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center border border-white/20"
                  >
                    <span className="text-3xl">🛍️</span>
                    <span className="text-white text-xs font-medium mt-1">Buyer</span>
                  </motion.div>

                  {/* Transporter */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-24 bg-white/15 backdrop-blur-lg rounded-2xl flex flex-col items-center justify-center border border-white/20"
                  >
                    <span className="text-3xl">🚛</span>
                    <span className="text-white text-xs font-medium mt-1">Transport</span>
                  </motion.div>

                  {/* Floating vegetables */}
                  {['🍅', '🥕', '🥬', '🌽', '🍆'].map((veg, i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
                      className="absolute text-3xl"
                      style={{
                        top: `${20 + Math.sin(i * 1.2) * 30}%`,
                        left: `${20 + Math.cos(i * 1.5) * 30}%`,
                      }}
                    >
                      {veg}
                    </motion.span>
                  ))}
                </div>

                {/* Glowing ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-8 border-2 border-dashed border-white/10 rounded-full"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full">
            <path d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,85.3C672,75,768,53,864,48C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#f8faf8"/>
          </svg>
        </div>
      </section>

      {/* ===== WHY AGRILINK ===== */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="section-title mb-4">{t('why.title')}</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 text-lg max-w-2xl mx-auto">
              A transparent digital ecosystem for Indian agriculture
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🤝', title: t('why.directConnection'), desc: t('why.directConnectionDesc'), color: 'from-green-400 to-green-600' },
              { icon: '💰', title: t('why.farmerPricing'), desc: t('why.farmerPricingDesc'), color: 'from-yellow-400 to-orange-500' },
              { icon: '🔍', title: t('why.transparent'), desc: t('why.transparentDesc'), color: 'from-blue-400 to-blue-600' },
              { icon: '🚛', title: t('why.transport'), desc: t('why.transportDesc'), color: 'from-purple-400 to-purple-600' },
              { icon: '📍', title: t('why.tracking'), desc: t('why.trackingDesc'), color: 'from-red-400 to-red-600' },
              { icon: '♻️', title: t('why.surplus'), desc: t('why.surplusDesc'), color: 'from-teal-400 to-teal-600' },
            ].map((card, i) => (
              <motion.div key={i} variants={fadeUp} className="card-interactive group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="section-title mb-4">{t('howItWorks.title')}</motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: '👨‍🌾', title: t('howItWorks.step1'), desc: t('howItWorks.step1Desc') },
              { step: '02', icon: '🛒', title: t('howItWorks.step2'), desc: t('howItWorks.step2Desc') },
              { step: '03', icon: '🚛', title: t('howItWorks.step3'), desc: t('howItWorks.step3Desc') },
              { step: '04', icon: '✅', title: t('howItWorks.step4'), desc: t('howItWorks.step4Desc') },
            ].map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="relative text-center group">
                <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-agri-green to-agri-leaf rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-agri-sun text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 -right-4 w-8 text-agri-green">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== ZERO WASTE ===== */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-teal-50">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="section-title mb-4">{t('zeroWaste.title')}</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 text-lg max-w-2xl mx-auto">{t('zeroWaste.subtitle')}</motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div variants={fadeUp} className="card-interactive bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-100">
              <div className="text-4xl mb-4">🏭</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('zeroWaste.dryUnit')}</h3>
              <p className="text-gray-600">{t('zeroWaste.dryUnitDesc')}</p>
              <div className="mt-6 flex items-center gap-2 text-sm text-orange-600 font-medium">
                <span>🥬</span> → <span>☀️</span> → <span>📦</span>
                <span className="ml-2">Dried Products</span>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="card-interactive bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('zeroWaste.biogas')}</h3>
              <p className="text-gray-600">{t('zeroWaste.biogasDesc')}</p>
              <div className="mt-6 flex items-center gap-2 text-sm text-green-600 font-medium">
                <span>🌿</span> → <span>⚡</span> → <span>🌱</span>
                <span className="ml-2">Energy + Fertilizer</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== ROLE SELECTION CTA ===== */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="section-title mb-4">{t('roles.selectRole')}</motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { role: 'FARMER', icon: '👨‍🌾', title: t('roles.farmer'), desc: t('roles.farmerDesc'), color: 'from-green-500 to-emerald-600', glow: 'hover:shadow-green-200' },
              { role: 'BUYER', icon: '🛍️', title: t('roles.buyer'), desc: t('roles.buyerDesc'), color: 'from-blue-500 to-indigo-600', glow: 'hover:shadow-blue-200' },
              { role: 'TRANSPORTER', icon: '🚛', title: t('roles.transporter'), desc: t('roles.transporterDesc'), color: 'from-orange-500 to-red-600', glow: 'hover:shadow-orange-200' },
            ].map((card) => (
              <motion.div key={card.role} variants={fadeUp}>
                <Link
                  to={`/auth/register?role=${card.role}`}
                  className={`block card-interactive text-center py-10 ${card.glow} hover:shadow-2xl`}
                >
                  <motion.div
                    whileHover={{ rotateY: 15, rotateX: -5, scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="perspective-1000"
                  >
                    <div className={`w-24 h-24 mx-auto bg-gradient-to-br ${card.color} rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-xl`}>
                      {card.icon}
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{card.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed px-4">{card.desc}</p>
                  <div className="mt-6">
                    <span className={`inline-flex items-center gap-2 bg-gradient-to-r ${card.color} text-white px-6 py-2 rounded-full text-sm font-semibold`}>
                      Get Started →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-agri-green text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="AGRILINK" className="w-16 h-16 object-contain drop-shadow-md" />
                <span className="font-display font-bold text-xl">AGRILINK</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Empowering Farmers • Smart Selling • Zero Waste
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-white/70 text-sm">
                <Link to="/market" className="block hover:text-white">Marketplace</Link>
                <Link to="/how-it-works" className="block hover:text-white">How It Works</Link>
                <Link to="/about" className="block hover:text-white">About</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Roles</h4>
              <div className="space-y-2 text-white/70 text-sm">
                <Link to="/auth/register?role=FARMER" className="block hover:text-white">For Farmers</Link>
                <Link to="/auth/register?role=BUYER" className="block hover:text-white">For Buyers</Link>
                <Link to="/auth/register?role=TRANSPORTER" className="block hover:text-white">For Transporters</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="space-y-2 text-white/70 text-sm">
                <p>📧 contact@agrilink.in</p>
                <p>📱 +91 XXXXXXXXXX</p>
                <p>📍 Tamil Nadu, India</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/50 text-sm">
            © {new Date().getFullYear()} AGRILINK. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
