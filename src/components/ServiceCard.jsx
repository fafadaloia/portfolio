import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiCode, FiFeather, FiPenTool } from 'react-icons/fi';

const icons = {
  FiCode,
  FiFeather,
  FiPenTool,
};

const ServiceCard = ({ service, index }) => {
  const { t } = useTranslation();
  const Icon = icons[service.icon] ?? FiCode;

  const title = service.i18nKey ? t(`${service.i18nKey}.title`) : service.title;
  const description = service.i18nKey ? t(`${service.i18nKey}.description`) : service.description;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-white/50 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-linkDark/10 dark:text-linkDark">
        <Icon size={22} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-primary dark:text-linkDark">{title}</h3>
        <p className="mt-2 text-sm text-linkLight/80 dark:text-linkDark/80">{description}</p>
      </div>
      {/* TODO: Enlazar CTA con detalles de servicio provenientes del CMS */}
    </motion.article>
  );
};

export default ServiceCard;

