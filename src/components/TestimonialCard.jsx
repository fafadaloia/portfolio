import { motion } from 'framer-motion';
import { FiMessageCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const TestimonialCard = ({ testimonial, index }) => {
  const { t } = useTranslation();
  const { name, role, quote, avatar } = testimonial;

  // Si no hay nombre ni quote, no mostrar el testimonio
  if (!name && !quote) {
    return null;
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-white/50 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60"
    >
      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-12 w-12 rounded-full object-cover border-2 border-primary/10 dark:border-linkDark/10"
            onError={(e) => {
              // Si la imagen falla, ocultar y mostrar el ícono por defecto
              e.target.style.display = 'none';
              const fallback = e.target.parentElement.querySelector('.avatar-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-linkDark/10 dark:text-linkDark avatar-fallback ${
            avatar ? 'hidden' : ''
          }`}
        >
          <FiMessageCircle size={20} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-primary dark:text-linkDark">{name}</h3>
          <p className="text-sm text-linkLight/80 dark:text-linkDark/80">{role}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-linkLight/90 dark:text-linkDark/90">"{quote}"</p>
      {/* TODO: Integrar avatar dinámico cuando se conecte la API de testimonios */}
    </motion.article>
  );
};

export default TestimonialCard;

