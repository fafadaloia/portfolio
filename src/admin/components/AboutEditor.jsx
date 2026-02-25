import { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import { getTexts, updateTexts } from '../../firebase/services/texts';
import { translateText, isTranslateAvailable } from '../../services/translate';
import { useModal } from '../hooks/useModal';
import Modal from './Modal';
import Toast from './Toast';

const AboutEditor = () => {
  const [heroAbout, setHeroAbout] = useState('');
  const [aboutBody, setAboutBody] = useState(['']);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { modal, toast, showSuccess, showError, closeModal, closeToast } = useModal();

  useEffect(() => {
    loadTexts();
  }, []);

  const loadTexts = async () => {
    setLoading(true);
    const result = await getTexts();
    if (result.success) {
      setHeroAbout(result.data.homeAboutMe || '');
      // aboutMe puede ser string o array, convertir a array
      const aboutMe = result.data.aboutMe || '';
      setAboutBody(Array.isArray(aboutMe) ? aboutMe : aboutMe ? (typeof aboutMe === 'string' ? aboutMe.split('\n\n') : [aboutMe]) : ['']);
    }
    setLoading(false);
  };

  const handleAddParagraph = () => {
    setAboutBody([...aboutBody, '']);
  };

  const handleRemoveParagraph = (index) => {
    if (aboutBody.length > 1) {
      setAboutBody(aboutBody.filter((_, i) => i !== index));
    }
  };

  const handleParagraphChange = (index, value) => {
    const newBody = [...aboutBody];
    newBody[index] = value;
    setAboutBody(newBody);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Traducir automáticamente al inglés
    let finalHeroAboutEn = '';
    let finalAboutBodyEn = [];
    
    if (isTranslateAvailable()) {
      // Traducir heroAbout
      if (heroAbout.trim()) {
        const result = await translateText(heroAbout, 'en', 'es');
        if (result.success) {
          finalHeroAboutEn = result.translatedText;
        }
      }
      
      // Traducir párrafos
      if (aboutBody.length > 0 && aboutBody.some(p => p.trim())) {
        const translations = await Promise.all(
          aboutBody.map(para => para.trim() ? translateText(para, 'en', 'es') : Promise.resolve({ success: false }))
        );
        finalAboutBodyEn = translations.map(t => t.success ? t.translatedText : '');
      }
    }
    
    // Guardar en español y en inglés (traducido)
    const aboutMeText = aboutBody.join('\n\n');
    const aboutMeTextEn = finalAboutBodyEn.join('\n\n');
    const result = await updateTexts(heroAbout, aboutMeText, finalHeroAboutEn, aboutMeTextEn);
    
    if (result.success) {
      showSuccess('Cambios guardados correctamente. La traducción al inglés se guardará automáticamente.');
      setIsEditing(false);
      await loadTexts();
    } else {
      showError('Error al guardar: ' + result.error);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-8 rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
        <p className="text-linkLight/80 dark:text-linkDark/80">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Editor de "Sobre mí"</h2>
          <p className="mt-1 text-sm text-linkLight/80 dark:text-linkDark/80">
            Editá el contenido de "Sobre mí" que aparece en Inicio y en la página dedicada.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="rounded-lg border border-primary/20 px-4 py-2 text-sm uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
        >
          {isEditing ? 'Cancelar' : 'Editar'}
        </button>
      </header>

      <section className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
            "Sobre mí" en Inicio (texto breve)
          </label>
          <textarea
            value={heroAbout}
            onChange={(e) => setHeroAbout(e.target.value)}
            disabled={!isEditing}
            rows={4}
            className="w-full rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none disabled:opacity-50 dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
            placeholder="Soy programador freelance con tres años de experiencia..."
          />
          <p className="mt-1 text-xs text-linkLight/60 dark:text-linkDark/60">
            Este texto aparece en la sección de inicio del portfolio. Se traducirá automáticamente al inglés al guardar.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
              "Sobre mí" en página dedicada (párrafos)
            </label>
            {isEditing && (
              <button
                type="button"
                onClick={handleAddParagraph}
                className="text-xs uppercase tracking-widest text-linkLight/60 hover:text-accent dark:text-linkDark/60 dark:hover:text-primary"
              >
                + Agregar párrafo
              </button>
            )}
          </div>
          <div className="space-y-3">
            {aboutBody.map((paragraph, index) => (
              <div key={index} className="flex gap-2">
                <textarea
                  value={paragraph}
                  onChange={(e) => handleParagraphChange(index, e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className="flex-1 rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none disabled:opacity-50 dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  placeholder={`Párrafo ${index + 1}...`}
                />
                {isEditing && aboutBody.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveParagraph(index)}
                    className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-500 transition-colors duration-200 hover:border-red-500 hover:text-red-600 dark:border-red-500/50 dark:text-red-400"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-linkLight/60 dark:text-linkDark/60">
            Estos párrafos aparecen en la página completa de "Sobre mí". Se traducirán automáticamente al inglés al guardar.
          </p>
        </div>

        {isEditing && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-gradient inline-flex items-center gap-2 text-xs uppercase disabled:opacity-50"
            >
              <FiSave size={16} />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </section>

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />

      <Toast
        isOpen={toast.isOpen}
        onClose={closeToast}
        message={toast.message}
      />
    </div>
  );
};

export default AboutEditor;
