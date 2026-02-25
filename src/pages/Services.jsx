import { useTranslation } from 'react-i18next';

import ServiceCard from '../components/ServiceCard';
import services from '../data/services';

const Services = () => {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-primary dark:text-linkDark">{t('services.title')}</h1>
        <p className="text-base text-linkLight/80 dark:text-linkDark/80">
          {t('services.description')} {/* TODO: Reemplazar con copy dinámico */}
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <ServiceCard key={service.id} service={service} index={index} />
        ))}
      </div>
    </section>
  );
};

export default Services;

