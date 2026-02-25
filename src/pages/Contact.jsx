import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendMessage } from '../firebase/services/messages';

const Contact = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('loading');

    const formData = new FormData(event.target);
    const name = formData.get('user_name');
    const email = formData.get('user_email');
    const message = formData.get('message');

    const result = await sendMessage(name, email, message);
    
    if (result.success) {
      alert('Mensaje enviado correctamente. ¡Gracias por contactarte!');
      event.target.reset();
      setStatus('idle');
    } else {
      alert('Error al enviar el mensaje. Por favor intentá nuevamente.');
      setStatus('idle');
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-primary dark:text-linkDark">{t('contact.title')}</h1>
        <p className="text-base text-linkLight/80 dark:text-linkDark/80">{t('contact.description')}</p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-primary/10 bg-white/50 p-6 transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
            Nombre
            <input
              type="text"
              name="user_name"
              required
              className="rounded-md border border-primary/20 bg-white/70 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/60 dark:text-linkDark"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
            Email
            <input
              type="email"
              name="user_email"
              required
              className="rounded-md border border-primary/20 bg-white/70 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/60 dark:text-linkDark"
            />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
          Mensaje
          <textarea
            name="message"
            rows="5"
            required
            className="rounded-md border border-primary/20 bg-white/70 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/60 dark:text-linkDark"
          />
        </label>

        <div className="mt-6 flex justify-end">
          <button type="submit" className="btn-gradient" disabled={status === 'loading'}>
            {t('contact.button')}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Contact;

