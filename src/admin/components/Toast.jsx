import { useEffect } from 'react';
import { FiCheckCircle, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ isOpen, onClose, message, duration = 3000 }) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-green-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-green-500/30 dark:bg-darkBg/95"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
            <FiCheckCircle size={18} className="text-green-500" />
          </div>
          <p className="text-sm font-medium text-green-700 dark:text-green-400">{message}</p>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded p-1 text-green-600/60 transition-colors duration-200 hover:bg-green-50 hover:text-green-700 dark:text-green-400/60 dark:hover:bg-green-900/20 dark:hover:text-green-400"
          >
            <FiX size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
