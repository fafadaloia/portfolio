import { useState, useEffect } from 'react';
import { FiPlus, FiEdit3, FiTrash2, FiStar, FiSave, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '../../firebase/services/testimonials';
import { translateText, isTranslateAvailable } from '../../services/translate';
import { useModal } from '../hooks/useModal';
import Modal from './Modal';
import Toast from './Toast';

const TestimonialsEditor = () => {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { modal, toast, showSuccess, showError, showConfirm, closeModal, closeToast } = useModal();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    quote: '',
    avatar: '',
    featured: false,
    displayOrder: 0,
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    const result = await getTestimonials(false);
    if (result.success) {
      // Ordenar por displayOrder
      const sorted = result.data.sort((a, b) => a.displayOrder - b.displayOrder);
      setTestimonials(sorted);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      quote: '',
      avatar: '',
      featured: false,
      displayOrder: testimonials.length,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };


  const handleSave = async () => {
    // Validar campos requeridos
    if (!formData.name || !formData.role || !formData.quote) {
      showError('Por favor completá todos los campos requeridos');
      return;
    }

    // Traducir automáticamente al inglés
    let testimonialEn = null;
    
    if (isTranslateAvailable()) {
      const translations = await Promise.all([
        translateText(formData.name, 'en', 'es'),
        translateText(formData.role, 'en', 'es'),
        translateText(formData.quote, 'en', 'es'),
      ]);

      testimonialEn = {
        name: translations[0].success ? translations[0].translatedText : formData.name,
        role: translations[1].success ? translations[1].translatedText : formData.role,
        quote: translations[2].success ? translations[2].translatedText : formData.quote,
        avatar: formData.avatar, // Siempre copiar el avatar
        featured: formData.featured,
        displayOrder: formData.displayOrder,
      };
    } else {
      // Si no hay traducción disponible, crear testimonio en inglés con los mismos datos
      // pero manteniendo el avatar y otros campos no traducibles
      testimonialEn = {
        name: formData.name,
        role: formData.role,
        quote: formData.quote,
        avatar: formData.avatar, // Siempre copiar el avatar
        featured: formData.featured,
        displayOrder: formData.displayOrder,
      };
    }

    if (editingId) {
      const result = await updateTestimonial(editingId, formData, testimonialEn);
      if (result.success) {
        await loadTestimonials();
        showSuccess('Testimonio actualizado correctamente');
        resetForm();
      } else {
        showError('Error al actualizar: ' + result.error);
      }
    } else {
      const result = await createTestimonial(formData, testimonialEn);
      if (result.success) {
        await loadTestimonials();
        showSuccess('Testimonio creado correctamente');
        resetForm();
      } else {
        showError('Error al crear: ' + result.error);
      }
    }
  };

  const handleEdit = (testimonial) => {
    setFormData({
      name: testimonial.name || '',
      nameEs: testimonial.nameEs || '',
      role: testimonial.role || '',
      roleEs: testimonial.roleEs || '',
      quote: testimonial.quote || '',
      quoteEs: testimonial.quoteEs || '',
      avatar: testimonial.avatar || '',
      featured: testimonial.featured || false,
      displayOrder: testimonial.displayOrder || 0,
    });
    setEditingId(testimonial.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    showConfirm(
      '¿Estás seguro de que querés eliminar este testimonio?',
      async () => {
        const result = await deleteTestimonial(id);
        if (result.success) {
          await loadTestimonials();
          if (editingId === id) {
            resetForm();
          }
          showSuccess('Testimonio eliminado correctamente');
        } else {
          showError('Error al eliminar: ' + result.error);
        }
      },
      'Eliminar testimonio'
    );
  };

  const handleToggleFeatured = async (id) => {
    const testimonial = testimonials.find((t) => t.id === id);
    if (testimonial) {
      const updatedTestimonial = { ...testimonial, featured: !testimonial.featured };
      const result = await updateTestimonial(id, updatedTestimonial);
      if (result.success) {
        await loadTestimonials();
      } else {
        showError('Error al actualizar: ' + result.error);
      }
    }
  };

  const handleMoveOrder = async (id, direction) => {
    const sorted = [...testimonials].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((t) => t.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    const testimonial1 = sorted[index];
    const testimonial2 = sorted[newIndex];
    const tempOrder = testimonial1.displayOrder;
    testimonial1.displayOrder = testimonial2.displayOrder;
    testimonial2.displayOrder = tempOrder;

    // Actualizar ambos testimonios
    await updateTestimonial(testimonial1.id, testimonial1);
    await updateTestimonial(testimonial2.id, testimonial2);
    await loadTestimonials();
  };

  const featuredCount = testimonials.filter((t) => t.featured).length;

  return (
    <div className="space-y-8 rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Gestión de Testimonios</h2>
          <p className="mt-1 text-sm text-linkLight/80 dark:text-linkDark/80">
            Administrá los testimonios que aparecen en el sitio. Podés destacar hasta 6 testimonios.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-gradient inline-flex items-center gap-2 text-xs uppercase"
        >
          <FiPlus size={16} />
          Nuevo testimonio
        </button>
      </header>

      {showForm && (
        <div className="rounded-2xl border border-primary/10 bg-white/80 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/70">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-primary dark:text-linkDark">
              {editingId ? 'Editar testimonio' : 'Nuevo testimonio'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-linkLight/60 hover:text-accent dark:text-linkDark/60 dark:hover:text-primary"
            >
              <FiX size={20} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4"
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Nombre
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Rol/Cargo
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Testimonio
                <textarea
                  name="quote"
                  value={formData.quote}
                  onChange={handleInputChange}
                  rows={4}
                  required
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
              </label>
              <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                Se traducirá automáticamente al inglés al guardar.
              </p>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
              URL del avatar (opcional)
              <input
                type="text"
                name="avatar"
                value={formData.avatar}
                onChange={(e) => {
                  let value = e.target.value;
                  // Corregir automáticamente si el usuario ingresa /public/
                  if (value.startsWith('/public/')) {
                    value = value.replace('/public/', '/');
                  }
                  setFormData((prev) => ({
                    ...prev,
                    avatar: value,
                  }));
                }}
                placeholder="/images/testimonios/testimonio-01.jpg"
                className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
              />
              <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                La ruta debe empezar con / (ej: /images/testimonios/foto.jpg). No incluir /public/
              </p>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  disabled={!formData.featured && featuredCount >= 6}
                  className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary disabled:opacity-50 dark:border-primary/30 dark:text-linkDark"
                />
                <label
                  htmlFor="featured"
                  className="text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80"
                >
                  Destacar (mostrar en inicio) {featuredCount >= 6 && !formData.featured && '(máximo 6)'}
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Orden de visualización
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  min="0"
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-primary/20 px-4 py-2 text-sm uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-gradient inline-flex items-center gap-2 text-xs uppercase">
                <FiSave size={16} />
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-primary dark:text-linkDark">Testimonios</h3>
          <span className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
            Destacados: {featuredCount}/6
          </span>
        </div>
        <div className="space-y-4">
          {testimonials.length === 0 ? (
            <p className="text-sm text-linkLight/60 dark:text-linkDark/60">
              No hay testimonios. Agregá uno nuevo para comenzar.
            </p>
          ) : (
            testimonials.map((testimonial) => {
              const name = testimonial.name || '';
              const role = testimonial.role || '';
              const quote = testimonial.quote || '';

              return (
                <div
                  key={testimonial.id}
                  className={`rounded-xl border border-primary/10 bg-white/80 p-4 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 ${
                    testimonial.featured ? 'ring-2 ring-primary/20 dark:ring-linkDark/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-primary dark:text-linkDark">{name}</h4>
                        {testimonial.featured && (
                          <FiStar
                            size={16}
                            className="text-primary dark:text-linkDark"
                            title="Destacado"
                          />
                        )}
                      </div>
                      <p className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                        {role}
                      </p>
                      <p className="mt-2 text-sm text-linkLight/80 dark:text-linkDark/80">"{quote}"</p>
                      {testimonial.avatar && (
                        <p className="mt-2 text-xs text-linkLight/60 dark:text-linkDark/60">
                          Avatar: {testimonial.avatar}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(testimonial.id, 'up')}
                          disabled={testimonials.findIndex((t) => t.id === testimonial.id) === 0}
                          className="rounded-lg border border-primary/20 p-1 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent disabled:opacity-30 dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                          title="Mover arriba"
                        >
                          <FiArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(testimonial.id, 'down')}
                          disabled={testimonials.findIndex((t) => t.id === testimonial.id) === testimonials.length - 1}
                          className="rounded-lg border border-primary/20 p-1 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent disabled:opacity-30 dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                          title="Mover abajo"
                        >
                          <FiArrowDown size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(testimonial.id)}
                        disabled={!testimonial.featured && featuredCount >= 6}
                        className={`rounded-lg border p-2 transition-colors duration-200 disabled:opacity-30 ${
                          testimonial.featured
                            ? 'border-primary bg-primary/10 text-primary dark:border-linkDark dark:bg-linkDark/10 dark:text-linkDark'
                            : 'border-primary/20 text-linkLight hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary'
                        }`}
                      >
                        <FiStar size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(testimonial)}
                        className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                      >
                        <FiEdit3 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(testimonial.id)}
                        className="rounded-lg border border-red-300 p-2 text-red-500 transition-colors duration-200 hover:border-red-500 hover:text-red-600 dark:border-red-500/50 dark:text-red-400"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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

export default TestimonialsEditor;
