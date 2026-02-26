import { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiSave,
  FiArrowUp,
  FiArrowDown,
  FiX,
  FiUpload,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { getProjects, createProject, updateProject, deleteProject } from '../../firebase/services/projects';
import { translateText, isTranslateAvailable } from '../../services/translate';
import { uploadImage, getStorageUrlFromPath } from '../../firebase/services/storage';
import { useModal } from '../hooks/useModal';
import Modal from './Modal';
import Toast from './Toast';
import RichTextEditor from './RichTextEditor';

// Tags disponibles basados en el archivo de traducciones
const AVAILABLE_TAGS = [
  'ARTIFICIAL_INTELLIGENCE',
  'REACT',
  'TAILWINDCSS',
  'FRAMER_MOTION',
  'NODE',
  'BACKGROUND_REMOVER',
  'PYTHON',
  'FASTAPI',
  'DOCKER',
  'AUTOMATION',
  'HIGH_DEFINITION',
  'COMPLETELY_FREE',
  'GAMING',
  'HTML',
  'CSS',
  'SECURE_PAYMENT',
];

const ProjectsManager = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { modal, toast, showSuccess, showError, showConfirm, closeModal, closeToast } = useModal();
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    shortHistory: '',
    extendedDescription: '',
    techStack: [],
    repositoryUrl: '',
    repositoryLabel: 'GitHub',
    liveUrl: '',
    liveLabel: 'projects.labels.viewMore',
    image: '',
    i18nKey: '',
    displayOrder: 0,
    hidden: false,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const result = await getProjects(false);
    if (result.success) {
      setProjects(result.data.sort((a, b) => a.displayOrder - b.displayOrder));
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      shortHistory: '',
      extendedDescription: '',
      techStack: [],
      repositoryUrl: '',
      repositoryLabel: 'GitHub',
      liveUrl: '',
      liveLabel: 'projects.labels.viewMore',
      image: '',
      i18nKey: '',
      displayOrder: projects.length,
      hidden: false,
    });
    setEditingId(null);
    setShowForm(false);
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Actualizar preview si es el campo de imagen
    if (name === 'image' && value) {
      setImagePreview(value);
    } else if (name === 'image' && !value) {
      setImagePreview(null);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      showError('El archivo debe ser una imagen');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Generar nombre basado en el título del proyecto si está disponible
      const fileName = formData.title 
        ? formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')
        : null;

      const result = await uploadImage(file, 'admin/proyects', fileName);

      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          image: result.url,
        }));
        setImagePreview(result.url);
        showSuccess('Imagen subida correctamente');
      } else {
        showError('Error al subir la imagen: ' + result.error);
      }
    } catch (error) {
      showError('Error al subir la imagen: ' + error.message);
    } finally {
      setUploadingImage(false);
      // Limpiar el input para permitir subir el mismo archivo de nuevo
      e.target.value = '';
    }
  };

  const handleImagePathBlur = async (e) => {
    const value = e.target.value.trim();
    if (!value) return;

    // Si ya es una URL completa (http/https), no hacer nada
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return;
    }

    // Si parece una ruta relativa de Storage (no empieza con /)
    // y contiene 'admin/testimonies' o 'admin/proyects'
    if (value.includes('admin/')) {
      setUploadingImage(true);
      try {
        const result = await getStorageUrlFromPath(value);
        if (result.success) {
          setFormData((prev) => ({
            ...prev,
            image: result.url,
          }));
          setImagePreview(result.url);
        } else {
          // Si falla, dejar el valor como está (puede ser una ruta local)
        }
      } catch (error) {
        // Si falla, dejar el valor como está
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleTagToggle = (tag) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.includes(tag)
        ? prev.techStack.filter((t) => t !== tag)
        : [...prev.techStack, tag],
    }));
  };

  const handleSave = async () => {
    // Validar campos requeridos
    if (!formData.title || !formData.description) {
      showError('Por favor completá el título y la descripción');
      return;
    }

    // Traducir automáticamente al inglés
    let projectEn = null;
    
    if (isTranslateAvailable()) {
      const translations = await Promise.all([
        translateText(formData.description, 'en', 'es', true), // Descripción con HTML
        translateText(formData.shortHistory || '', 'en', 'es', true), // Historia con HTML
        translateText(formData.extendedDescription || '', 'en', 'es', false), // Descripción extendida sin HTML (texto plano)
      ]);

      projectEn = {
        ...formData,
        title: formData.title, // El título NO se traduce, se mantiene igual en ambos idiomas
        description: translations[0].success ? translations[0].translatedText : formData.description,
        shortHistory: translations[1].success ? translations[1].translatedText : formData.shortHistory,
        extendedDescription: translations[2].success ? translations[2].translatedText : formData.extendedDescription,
      };
    }

    if (editingId) {
      const result = await updateProject(editingId, formData, projectEn);
      if (result.success) {
        await loadProjects();
        showSuccess('Proyecto actualizado correctamente');
        resetForm();
      } else {
        showError('Error al actualizar: ' + result.error);
      }
    } else {
      const result = await createProject(formData, projectEn);
      if (result.success) {
        await loadProjects();
        showSuccess('Proyecto creado correctamente');
        resetForm();
      } else {
        showError('Error al crear: ' + result.error);
      }
    }
  };

  const handleEdit = (project) => {
    setFormData({ ...project });
    setEditingId(project.id);
    setShowForm(true);
    setImagePreview(project.image || null);
  };

  const handleDelete = async (id) => {
    showConfirm(
      '¿Estás seguro de que querés eliminar este proyecto?',
      async () => {
        const result = await deleteProject(id);
        if (result.success) {
          await loadProjects();
          if (editingId === id) {
            resetForm();
          }
          showSuccess('Proyecto eliminado correctamente');
        } else {
          showError('Error al eliminar: ' + result.error);
        }
      },
      'Eliminar proyecto'
    );
  };

  const handleToggleHidden = async (id) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      const updatedProject = { ...project, hidden: !project.hidden };
      const result = await updateProject(id, updatedProject);
      if (result.success) {
        await loadProjects();
      } else {
        showError('Error al actualizar: ' + result.error);
      }
    }
  };

  const handleMoveOrder = async (id, direction) => {
    const sorted = [...projects].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((p) => p.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    const project1 = sorted[index];
    const project2 = sorted[newIndex];
    const tempOrder = project1.displayOrder;
    project1.displayOrder = project2.displayOrder;
    project2.displayOrder = tempOrder;

    // Actualizar ambos proyectos
    await updateProject(project1.id, project1);
    await updateProject(project2.id, project2);
    await loadProjects();
  };

  const visibleProjects = projects.filter((p) => !p.hidden);
  const hiddenProjects = projects.filter((p) => p.hidden);

  return (
    <div className="space-y-8 rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">
            Gestión de Proyectos
          </h2>
          <p className="mt-1 text-sm text-linkLight/80 dark:text-linkDark/80">
            Administrá los proyectos destacados que aparecen en Inicio y en la página de Proyectos.
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
          Nuevo proyecto
        </button>
      </header>

      {showForm && (
        <div className="rounded-2xl border border-primary/10 bg-white/80 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/70">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-primary dark:text-linkDark">
              {editingId ? 'Editar proyecto' : 'Nuevo proyecto'}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Título
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Clave i18n (opcional)
                <input
                  type="text"
                  name="i18nKey"
                  value={formData.i18nKey}
                  onChange={handleInputChange}
                  placeholder="projects.items.miProyecto"
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
              Descripción breve (para la card)
              <RichTextEditor
                value={formData.description}
                onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                placeholder="Escribí la descripción breve del proyecto..."
                minHeight="120px"
              />
              <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                Se traducirá automáticamente al inglés al guardar. Los links solo funcionarán en la página del proyecto, no en la card.
              </p>
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
              Historia breve (para la página del proyecto)
              <RichTextEditor
                value={formData.shortHistory}
                onChange={(html) => setFormData((prev) => ({ ...prev, shortHistory: html }))}
                placeholder="Escribí la historia breve del proyecto..."
                minHeight="150px"
              />
              <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                Historia breve del proyecto que aparecerá en la página individual.
              </p>
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
              Descripción extendida (para la página del proyecto)
              <textarea
                name="extendedDescription"
                value={formData.extendedDescription}
                onChange={handleInputChange}
                rows={10}
                placeholder="Escribí la descripción extendida del proyecto...&#10;&#10;Separá los párrafos con una línea en blanco."
                className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                style={{ whiteSpace: 'pre-wrap' }}
              />
              <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                Descripción detallada del proyecto que aparecerá en la página individual. Separá los párrafos con una línea en blanco. Se traducirá automáticamente al inglés al guardar.
              </p>
            </label>

            <div className="space-y-4">
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Imagen del proyecto
                <div className="flex gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary/20 bg-white/80 px-4 py-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark dark:hover:text-primary">
                    <FiUpload size={16} />
                    {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                  Subí una imagen desde tu computadora o ingresá una URL manualmente abajo.
                </p>
              </label>

              {imagePreview && (
                <div className="flex items-center gap-4 rounded-lg border border-primary/20 bg-white/80 p-3 dark:border-primary/30 dark:bg-darkBg/70">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-lg object-cover"
                    onError={() => setImagePreview(null)}
                  />
                  <div className="flex-1">
                    <p className="text-xs text-linkLight/60 dark:text-linkDark/60">Vista previa</p>
                    <p className="truncate text-xs text-linkLight/80 dark:text-linkDark/80">{imagePreview}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, image: '' }));
                      setImagePreview(null);
                    }}
                    className="text-linkLight/60 hover:text-red-500 dark:text-linkDark/60"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              )}

              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                O ingresá una URL manualmente
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  onBlur={handleImagePathBlur}
                  placeholder="admin/proyects/logo.png o https://ejemplo.com/imagen.jpg"
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
                <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                  Podés ingresar una ruta de Storage (ej: admin/proyects/logo.png) o una URL completa.
                  {uploadingImage && ' Convirtiendo ruta...'}
                </p>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Orden de visualización
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))
                  }
                  min="0"
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                URL del repositorio
                <input
                  type="url"
                  name="repositoryUrl"
                  value={formData.repositoryUrl}
                  onChange={handleInputChange}
                  placeholder="https://github.com/usuario/repo"
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Etiqueta del repositorio
                <input
                  type="text"
                  name="repositoryLabel"
                  value={formData.repositoryLabel}
                  onChange={handleInputChange}
                  placeholder="GitHub"
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                URL en vivo
                <input
                  type="url"
                  name="liveUrl"
                  value={formData.liveUrl}
                  onChange={handleInputChange}
                  placeholder="https://mi-proyecto.com"
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Etiqueta del link en vivo
                <input
                  type="text"
                  name="liveLabel"
                  value={formData.liveLabel}
                  onChange={handleInputChange}
                  placeholder="projects.labels.viewMore"
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Tags/Tecnologías
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest transition-colors duration-200 ${
                      formData.techStack.includes(tag)
                        ? 'border-primary bg-primary/10 text-primary dark:border-linkDark dark:bg-linkDark/10 dark:text-linkDark'
                        : 'border-primary/20 text-linkLight hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary'
                    }`}
                  >
                    {t(`projects.tags.${tag}`, tag)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hidden"
                name="hidden"
                checked={formData.hidden}
                onChange={(e) => setFormData((prev) => ({ ...prev, hidden: e.target.checked }))}
                className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary dark:border-primary/30 dark:text-linkDark"
              />
              <label
                htmlFor="hidden"
                className="text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80"
              >
                Ocultar proyecto (no se mostrará en el sitio)
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
        <h3 className="mb-4 text-xl font-semibold text-primary dark:text-linkDark">Proyectos visibles</h3>
        <div className="space-y-4">
          {visibleProjects.length === 0 ? (
            <p className="text-sm text-linkLight/60 dark:text-linkDark/60">
              No hay proyectos visibles. Agregá uno nuevo para comenzar.
            </p>
          ) : (
            visibleProjects.map((project, index) => (
              <div
                key={project.id}
                className="flex items-center gap-4 rounded-xl border border-primary/10 bg-white/80 p-4 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(project.id, 'up')}
                    disabled={index === 0}
                    className="disabled:opacity-30"
                  >
                    <FiArrowUp size={16} className="text-linkLight/60 dark:text-linkDark/60" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(project.id, 'down')}
                    disabled={index === visibleProjects.length - 1}
                    className="disabled:opacity-30"
                  >
                    <FiArrowDown size={16} className="text-linkLight/60 dark:text-linkDark/60" />
                  </button>
                  <span className="text-xs text-linkLight/60 dark:text-linkDark/60">
                    Orden: {project.displayOrder}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary dark:text-linkDark">{project.title}</h4>
                  <p className="text-sm text-linkLight/70 dark:text-linkDark/70">{project.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {project.techStack?.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60"
                      >
                        {t(`projects.tags.${tag}`, tag)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(project)}
                    className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                  >
                    <FiEdit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleHidden(project.id)}
                    className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                  >
                    <FiEyeOff size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    className="rounded-lg border border-red-300 p-2 text-red-500 transition-colors duration-200 hover:border-red-500 hover:text-red-600 dark:border-red-500/50 dark:text-red-400"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {hiddenProjects.length > 0 && (
        <section>
          <h3 className="mb-4 text-xl font-semibold text-primary dark:text-linkDark">Proyectos ocultos</h3>
          <div className="space-y-4">
            {hiddenProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-4 rounded-xl border border-primary/10 bg-white/80 p-4 opacity-60 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-primary dark:text-linkDark">{project.title}</h4>
                  <p className="text-sm text-linkLight/70 dark:text-linkDark/70">{project.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(project)}
                    className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                  >
                    <FiEdit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleHidden(project.id)}
                    className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                  >
                    <FiEye size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    className="rounded-lg border border-red-300 p-2 text-red-500 transition-colors duration-200 hover:border-red-500 hover:text-red-600 dark:border-red-500/50 dark:text-red-400"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <Toast
        isOpen={toast.isOpen}
        onClose={closeToast}
        message={toast.message}
      />
    </div>
  );
};

export default ProjectsManager;
