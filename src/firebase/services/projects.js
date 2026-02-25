import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config';

const PROJECTS_COLLECTION = 'portfolio/admin/proyects';

// Convertir proyecto de Firebase a formato del frontend
const firebaseToFrontend = (firebaseDoc) => {
  const data = firebaseDoc.data();
  return {
    id: firebaseDoc.id,
    title: data.title || '',
    description: data.description || '',
    i18nKey: data.i18nKey || '',
    repositoryUrl: data.repoURL || '',
    repositoryLabel: data.repoTag || 'GitHub',
    liveUrl: data.liveURL || '',
    liveLabel: data.liveTag || 'projects.labels.viewMore',
    image: data.image || '',
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
      
      // Verificar si el documento existe
      const docSnap = await getDoc(docRefEn);
      if (docSnap.exists()) {
        // Si existe, actualizar
        await updateDoc(docRefEn, firebaseDataEn);
      } else {
        // Si no existe, crear con el mismo ID usando setDoc
        await setDoc(docRefEn, firebaseDataEn);
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
        projects = projects.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return { success: true, data: projects };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message, data: [] };
      }
    }
    return { success: false, error: error.message, data: [] };
  }
};
