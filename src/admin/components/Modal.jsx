import { useEffect } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, message, type = 'info', onConfirm = null }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconConfig = {
    success: { icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    error: { icon: FiAlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    info: { icon: FiInfo, color: 'text-primary dark:text-linkDark', bg: 'bg-primary/10 dark:bg-linkDark/10' },
  };

  const config = iconConfig[type] || iconConfig.info;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-primary/10 bg-white/90 p-6 shadow-lg transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/90"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                  <Icon size={24} className={config.color} />
                </div>
                <div className="flex-1">
                  {title && (
                    <h3 className="mb-2 text-lg font-semibold text-primary dark:text-linkDark">{title}</h3>
                  )}
                  <p className="text-sm text-linkLight/80 dark:text-linkDark/80">{message}</p>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 rounded-lg p-1 text-linkLight/60 transition-colors duration-200 hover:bg-primary/10 hover:text-accent dark:text-linkDark/60 dark:hover:bg-linkDark/10 dark:hover:text-primary"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {onConfirm ? (
                  <>
                    <button
                      onClick={onClose}
                      className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        onConfirm();
                        onClose();
                      }}
                      className="btn-gradient text-xs uppercase"
                    >
                      Confirmar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="btn-gradient text-xs uppercase"
                  >
                    Aceptar
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
