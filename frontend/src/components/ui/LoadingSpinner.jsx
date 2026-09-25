import { motion } from 'framer-motion';

export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };

  const spinner = (
    <motion.div
      className={`${sizes[size]} border-4 border-primary-200 border-t-agri-green rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-gray-500 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{spinner}</div>;
}
