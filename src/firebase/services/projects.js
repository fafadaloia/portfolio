import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config';

const PROJECTS_COLLECTION = 'portfolio/admin/proyects';

// Función para normalizar título a slug (minusculas, sin espacios)
export const normalizeToSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
};

// Función helper para preservar estructura HTML del español con texto traducido en inglés
const preserveHtmlStructure = (htmlWithStructure, translatedText) => {
  if (!htmlWithStructure || !translatedText) return translatedText;
  
  // Si el texto traducido ya tiene HTML, usarlo directamente
  if (/<[^>]+>/.test(translatedText)) {
    return translatedText;
  }
  
  // Si el texto traducido no tiene HTML pero el español sí, usar el HTML del español
  // Esto preserva el formato aunque el texto quede en español
  // Es mejor tener formato en español que texto en inglés sin formato
  // El usuario puede editar manualmente para traducir el contenido si lo necesita
  if (htmlWithStructure && /<[^>]+>/.test(htmlWithStructure)) {
    return htmlWithStructure;
  }
  
  // Si ninguno tiene HTML, retornar el texto traducido con estructura básica
  let result = translatedText;
  if (htmlWithStructure.includes('<p>') || htmlWithStructure.includes('</p>')) {
    result = '<p>' + result.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
  } else if (htmlWithStructure.includes('<br>') || htmlWithStructure.includes('<br/>')) {
    result = result.replace(/\n/g, '<br>');
  }
  
  return result;
};

// Convertir proyecto de Firebase a formato del frontend
const firebaseToFrontend = (firebaseDoc) => {
  const data = firebaseDoc.data();
  let image = data.image || '';
  // Corregir rutas que empiezan con /public/
  if (image && image.startsWith('/public/')) {
    image = image.replace('/public/', '/');
  }
  return {
    id: firebaseDoc.id,
    title: data.title || '',
    description: data.description || '',
    shortHistory: data.shortHistory || '',
    extendedDescription: data.extendedDescription || '',
    i18nKey: data.i18nKey || '',
    repositoryUrl: data.repoURL || '',
    repositoryLabel: data.repoTag || 'GitHub',
    liveUrl: data.liveURL || '',
    liveLabel: data.liveTag || 'projects.labels.viewMore',
    image: image,
    techStack: data.TAGS ? (Array.isArray(data.TAGS) ? data.TAGS : [data.TAGS]) : [],
    displayOrder: data.place || 0,
    hidden: !data.isPublic,
  };
};

// Convertir proyecto del frontend a formato de Firebase
const frontendToFirebase = (project) => {
  return {
    title: project.title || '',
    description: project.description || '',
    shortHistory: project.shortHistory || '',
    extendedDescription: project.extendedDescription || '',
    i18nKey: project.i18nKey || '',
    repoURL: project.repositoryUrl || '',
    repoTag: project.repositoryLabel || 'GitHub',
    liveURL: project.liveUrl || '',
    liveTag: project.liveLabel || 'projects.labels.viewMore',
    image: project.image || '',
    TAGS: Array.isArray(project.techStack) ? project.techStack : [],
    place: project.displayOrder || 0,
    isPublic: !project.hidden,
  };
};

// Obtener proyectos para admin (solo español)
export const getProjects = async (publicOnly = false) => {
  if (!db) {
    return { success: true, data: [] };
  }
  try {
    const projectsRef = collection(db, PROJECTS_COLLECTION, 'es', 'items');
    let q;
    
    if (publicOnly) {
      try {
        q = query(projectsRef, where('isPublic', '==', true), orderBy('place', 'asc'));
      } catch (orderError) {
        q = query(projectsRef, where('isPublic', '==', true));
      }
    } else {
      try {
        q = query(projectsRef, orderBy('place', 'asc'));
      } catch (orderError) {
        q = query(projectsRef);
      }
    }
    
    const querySnapshot = await getDocs(q);
    let projects = querySnapshot.docs.map(firebaseToFrontend);
    
    // Si no se pudo ordenar en la query, ordenar en memoria
    projects = projects.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    return { success: true, data: projects };
  } catch (error) {
    // Si el error es por índice faltante, intentar sin ordenar
    if (error.message.includes('index') || error.code === 'failed-precondition') {
      try {
        const projectsRef = collection(db, PROJECTS_COLLECTION, 'es', 'items');
        const q = publicOnly 
          ? query(projectsRef, where('isPublic', '==', true))
          : query(projectsRef);
        const querySnapshot = await getDocs(q);
        let projects = querySnapshot.docs.map(firebaseToFrontend);
        projects = projects.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return { success: true, data: projects };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message, data: [] };
      }
    }
    return { success: false, error: error.message, data: [] };
  }
};

// Obtener un proyecto por slug
export const getProjectBySlug = async (slug, language = 'es') => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado', data: null };
  }
  try {
    const projectsRef = collection(db, PROJECTS_COLLECTION, language, 'items');
    const querySnapshot = await getDocs(query(projectsRef, where('isPublic', '==', true)));
    
    const projects = querySnapshot.docs.map(firebaseToFrontend);
    
    // Buscar proyecto por slug (normalizando el título)
    const project = projects.find(p => normalizeToSlug(p.title) === slug);
    
    if (project) {
      return { success: true, data: project };
    }
    
    return { success: false, error: 'Proyecto no encontrado', data: null };
  } catch (error) {
    return { success: false, error: error.message, data: null };
  }
};

export const createProject = async (project, projectEn = null) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    // Guardar en español
    const projectsRefEs = collection(db, PROJECTS_COLLECTION, 'es', 'items');
    const firebaseDataEs = frontendToFirebase(project);
    const docRefEs = await addDoc(projectsRefEs, firebaseDataEs);
    
    // Guardar en inglés (traducido) si se proporciona
    if (projectEn) {
      const docRefEn = doc(db, PROJECTS_COLLECTION, 'en', 'items', docRefEs.id);
      const firebaseDataEn = frontendToFirebase(projectEn);
      // Asegurar que la imagen siempre se copie desde español si no está en inglés
      if (!firebaseDataEn.image && firebaseDataEs.image) {
        firebaseDataEn.image = firebaseDataEs.image;
      }
      await setDoc(docRefEn, firebaseDataEn);
    } else {
      // Si no hay traducción, crear documento básico en inglés con la imagen
      const docRefEn = doc(db, PROJECTS_COLLECTION, 'en', 'items', docRefEs.id);
      const firebaseDataEn = {
        title: firebaseDataEs.title || '',
        description: firebaseDataEs.description || '',
        shortHistory: firebaseDataEs.shortHistory || '',
        extendedDescription: firebaseDataEs.extendedDescription || '',
        i18nKey: firebaseDataEs.i18nKey || '',
        repoURL: firebaseDataEs.repoURL || '',
        repoTag: firebaseDataEs.repoTag || 'GitHub',
        liveURL: firebaseDataEs.liveURL || '',
        liveTag: firebaseDataEs.liveTag || 'projects.labels.viewMore',
        image: firebaseDataEs.image || '', // Siempre copiar la imagen
        TAGS: firebaseDataEs.TAGS || [],
        place: firebaseDataEs.place || 0,
        isPublic: firebaseDataEs.isPublic || false,
      };
      await setDoc(docRefEn, firebaseDataEn);
    }
    
    return { success: true, id: docRefEs.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateProject = async (projectId, project, projectEn = null) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    // Actualizar en español
    const docRefEs = doc(db, PROJECTS_COLLECTION, 'es', 'items', projectId);
    const firebaseDataEs = frontendToFirebase(project);
    await updateDoc(docRefEs, firebaseDataEs);
    
    // Actualizar o crear en inglés (traducido) si se proporciona
    if (projectEn) {
      const docRefEn = doc(db, PROJECTS_COLLECTION, 'en', 'items', projectId);
      const firebaseDataEn = frontendToFirebase(projectEn);
      // Asegurar que la imagen siempre se copie desde español si no está en inglés
      if (!firebaseDataEn.image && firebaseDataEs.image) {
        firebaseDataEn.image = firebaseDataEs.image;
      }
      
      // Verificar si el documento existe
      const docSnap = await getDoc(docRefEn);
      if (docSnap.exists()) {
        // Si existe, actualizar
        await updateDoc(docRefEn, firebaseDataEn);
      } else {
        // Si no existe, crear con el mismo ID usando setDoc
        await setDoc(docRefEn, firebaseDataEn);
      }
    } else {
      // Si no hay traducción, asegurar que la imagen se copie desde español
      const docRefEn = doc(db, PROJECTS_COLLECTION, 'en', 'items', projectId);
      const docSnap = await getDoc(docRefEn);
      if (docSnap.exists() && firebaseDataEs.image) {
        await updateDoc(docRefEn, { image: firebaseDataEs.image });
      } else if (firebaseDataEs.image) {
        // Si el documento en inglés no existe pero hay imagen en español, crear documento con imagen
        await setDoc(docRefEn, {
          title: firebaseDataEs.title || '',
          description: firebaseDataEs.description || '',
          shortHistory: firebaseDataEs.shortHistory || '',
          extendedDescription: firebaseDataEs.extendedDescription || '',
          i18nKey: firebaseDataEs.i18nKey || '',
          repoURL: firebaseDataEs.repoURL || '',
          repoTag: firebaseDataEs.repoTag || 'GitHub',
          liveURL: firebaseDataEs.liveURL || '',
          liveTag: firebaseDataEs.liveTag || 'projects.labels.viewMore',
          image: firebaseDataEs.image,
          TAGS: firebaseDataEs.TAGS || [],
          place: firebaseDataEs.place || 0,
          isPublic: firebaseDataEs.isPublic || false,
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteProject = async (projectId) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    // Eliminar de ambas colecciones
    const docRefEs = doc(db, PROJECTS_COLLECTION, 'es', 'items', projectId);
    const docRefEn = doc(db, PROJECTS_COLLECTION, 'en', 'items', projectId);
    await Promise.all([deleteDoc(docRefEs), deleteDoc(docRefEn)]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener proyectos para frontend público (según idioma)
export const getPublicProjects = async (language = 'es', publicOnly = true) => {
  if (!db) {
    return { success: true, data: [] };
  }
  try {
    const projectsRef = collection(db, PROJECTS_COLLECTION, language, 'items');
    let q;
    
    if (publicOnly) {
      try {
        q = query(projectsRef, where('isPublic', '==', true), orderBy('place', 'asc'));
      } catch (orderError) {
        q = query(projectsRef, where('isPublic', '==', true));
      }
    } else {
      try {
        q = query(projectsRef, orderBy('place', 'asc'));
      } catch (orderError) {
        q = query(projectsRef);
      }
    }
    
    const querySnapshot = await getDocs(q);
    let projects = querySnapshot.docs.map(firebaseToFrontend);
    
    // Si el idioma es inglés, buscar fallbacks desde español
    if (language === 'en') {
      const projectsNeedingFallback = projects.filter(p => !p.image || !p.description || 
        (!p.description.match(/<[^>]+>/) && p.description.trim()));
      
      if (projectsNeedingFallback.length > 0) {
        try {
          const fallbackRef = collection(db, PROJECTS_COLLECTION, 'es', 'items');
          const fallbackQuery = query(fallbackRef);
          const fallbackSnapshot = await getDocs(fallbackQuery);

          const fallbackMapById = new Map();
          const fallbackMapByTitle = new Map();

          fallbackSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const fallbackData = {
              image: data.image || '',
              description: data.description || '',
              shortHistory: data.shortHistory || '',
              extendedDescription: data.extendedDescription || '',
            };
            
            // Corregir rutas de imagen
            if (fallbackData.image && fallbackData.image.startsWith('/public/')) {
              fallbackData.image = fallbackData.image.replace('/public/', '/');
            }
            
            fallbackMapById.set(doc.id, fallbackData);
            const normalizedTitle = (data.title || '').toLowerCase().trim();
            if (normalizedTitle) {
              fallbackMapByTitle.set(normalizedTitle, fallbackData);
            }
          });

          projects.forEach(project => {
            let fallbackData = null;
            
            // Buscar por ID primero
            if (fallbackMapById.has(project.id)) {
              fallbackData = fallbackMapById.get(project.id);
            } else {
              // Buscar por título
              const normalizedTitle = (project.title || '').toLowerCase().trim();
              if (normalizedTitle && fallbackMapByTitle.has(normalizedTitle)) {
                fallbackData = fallbackMapByTitle.get(normalizedTitle);
              }
            }

            if (fallbackData) {
              // Fallback para imagen
              if (!project.image && fallbackData.image) {
                project.image = fallbackData.image;
              }
              
              // Fallback para descripción: si la descripción en inglés no tiene HTML pero la de español sí,
              // preservar la estructura HTML del español pero mantener el texto traducido en inglés
              if (project.description && fallbackData.description) {
                const enHasHtml = /<[^>]+>/.test(project.description);
                const esHasHtml = /<[^>]+>/.test(fallbackData.description);
                
                if (!enHasHtml && esHasHtml) {
                  // La descripción en inglés perdió el HTML, preservar estructura del español con texto traducido
                  project.description = preserveHtmlStructure(fallbackData.description, project.description);
                }
              }
              
              // Similar para shortHistory
              if (fallbackData.shortHistory) {
                const enHasHtml = project.shortHistory ? /<[^>]+>/.test(project.shortHistory) : false;
                const esHasHtml = /<[^>]+>/.test(fallbackData.shortHistory);
                
                if (!enHasHtml && esHasHtml) {
                  project.shortHistory = preserveHtmlStructure(fallbackData.shortHistory, project.shortHistory || '');
                }
              }
              
              // extendedDescription es texto plano, no necesita fallback de HTML
              // Si no existe en inglés pero existe en español, copiar directamente
              if (!project.extendedDescription && fallbackData.extendedDescription) {
                project.extendedDescription = fallbackData.extendedDescription;
              }
            }
          });
        } catch (error) {
          // Silenciar error de fallback
        }
      }
    }
    
    // Si no se pudo ordenar en la query, ordenar en memoria
    projects = projects.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    return { success: true, data: projects };
  } catch (error) {
    if (error.message.includes('index') || error.code === 'failed-precondition') {
      try {
        const projectsRef = collection(db, PROJECTS_COLLECTION, language, 'items');
        const q = publicOnly 
          ? query(projectsRef, where('isPublic', '==', true))
          : query(projectsRef);
        const querySnapshot = await getDocs(q);
        let projects = querySnapshot.docs.map(firebaseToFrontend);
        
        // Si el idioma es inglés, buscar fallbacks desde español
        if (language === 'en') {
          const projectsNeedingFallback = projects.filter(p => !p.image || !p.description || 
            (!p.description.match(/<[^>]+>/) && p.description.trim()));
          
          if (projectsNeedingFallback.length > 0) {
            try {
              const fallbackRef = collection(db, PROJECTS_COLLECTION, 'es', 'items');
              const fallbackQuery = query(fallbackRef);
              const fallbackSnapshot = await getDocs(fallbackQuery);

              const fallbackMapById = new Map();
              const fallbackMapByTitle = new Map();

              fallbackSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const fallbackData = {
                  image: data.image || '',
                  description: data.description || '',
                  shortHistory: data.shortHistory || '',
                  extendedDescription: data.extendedDescription || '',
                };
                
                // Corregir rutas de imagen
                if (fallbackData.image && fallbackData.image.startsWith('/public/')) {
                  fallbackData.image = fallbackData.image.replace('/public/', '/');
                }
                
                fallbackMapById.set(doc.id, fallbackData);
                const normalizedTitle = (data.title || '').toLowerCase().trim();
                if (normalizedTitle) {
                  fallbackMapByTitle.set(normalizedTitle, fallbackData);
                }
              });

              projects.forEach(project => {
                let fallbackData = null;
                
                // Buscar por ID primero
                if (fallbackMapById.has(project.id)) {
                  fallbackData = fallbackMapById.get(project.id);
                } else {
                  // Buscar por título
                  const normalizedTitle = (project.title || '').toLowerCase().trim();
                  if (normalizedTitle && fallbackMapByTitle.has(normalizedTitle)) {
                    fallbackData = fallbackMapByTitle.get(normalizedTitle);
                  }
                }

                if (fallbackData) {
                  // Fallback para imagen
                  if (!project.image && fallbackData.image) {
                    project.image = fallbackData.image;
                  }
                  
                  // Fallback para descripción: si la descripción en inglés no tiene HTML pero la de español sí,
                  // preservar la estructura HTML del español pero mantener el texto traducido en inglés
                  if (project.description && fallbackData.description) {
                    const enHasHtml = /<[^>]+>/.test(project.description);
                    const esHasHtml = /<[^>]+>/.test(fallbackData.description);
                    
                    if (!enHasHtml && esHasHtml) {
                      // La descripción en inglés perdió el HTML, preservar estructura del español con texto traducido
                      project.description = preserveHtmlStructure(fallbackData.description, project.description);
                    }
                  }
                  
                  // Similar para shortHistory
                  if (fallbackData.shortHistory) {
                    const enHasHtml = project.shortHistory ? /<[^>]+>/.test(project.shortHistory) : false;
                    const esHasHtml = /<[^>]+>/.test(fallbackData.shortHistory);
                    
                    if (!enHasHtml && esHasHtml) {
                      project.shortHistory = preserveHtmlStructure(fallbackData.shortHistory, project.shortHistory || '');
                    }
                  }
                  
                  // extendedDescription es texto plano, no necesita fallback de HTML
                  // Si no existe en inglés pero existe en español, copiar directamente
                  if (!project.extendedDescription && fallbackData.extendedDescription) {
                    project.extendedDescription = fallbackData.extendedDescription;
                  }
                }
              });
            } catch (error) {
              // Silenciar error de fallback
            }
          }
        }
        
        projects = projects.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return { success: true, data: projects };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message, data: [] };
      }
    }
    return { success: false, error: error.message, data: [] };
  }
};
