import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="text-8xl mb-6">🌾</div>
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">404</h1>
        <p className="text-lg text-gray-500 mb-8">This field is empty. The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">🏠 Back to Home</Link>
      </motion.div>
    </div>
  );
}
