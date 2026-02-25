import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config';

const TESTIMONIALS_COLLECTION = 'portfolio/admin/testimonies';

// Convertir testimonio de Firebase a formato del frontend
const firebaseToFrontend = (firebaseDoc) => {
  const data = firebaseDoc.data();
  let avatar = data.photoURL || '';
  
  // Corregir rutas que empiezan con /public/ (deben empezar con /)
  if (avatar && avatar.startsWith('/public/')) {
    avatar = avatar.replace('/public/', '/');
  }
  
  return {
    id: firebaseDoc.id,
    name: data.name || '',
    role: data.rol || '',
    quote: data.testimony || '',
    avatar: avatar,
    featured: data.isPublic || false,
    displayOrder: data.place || 0,
  };
};

// Convertir testimonio del frontend a formato de Firebase
const frontendToFirebase = (testimonial) => {
  return {
    name: testimonial.name || '',
    rol: testimonial.role || '',
    testimony: testimonial.quote || '',
    photoURL: testimonial.avatar || '',
    isPublic: testimonial.featured || false,
    place: testimonial.displayOrder || 0,
  };
};

// Obtener testimonios para admin (solo español)
export const getTestimonials = async (publicOnly = false) => {
  if (!db) {
    return { success: true, data: [] };
  }
  try {
    const testimonialsRef = collection(db, TESTIMONIALS_COLLECTION, 'es', 'items');
    let q;
    
    if (publicOnly) {
      // Intentar ordenar por place, si falla intentar sin ordenar
      try {
        q = query(testimonialsRef, where('isPublic', '==', true), orderBy('place', 'asc'));
      } catch (orderError) {
        // Si falla el ordenamiento (falta índice), obtener sin ordenar y ordenar en memoria
        q = query(testimonialsRef, where('isPublic', '==', true));
      }
    } else {
      try {
        q = query(testimonialsRef, orderBy('place', 'asc'));
      } catch (orderError) {
        q = query(testimonialsRef);
      }
    }
    
    const querySnapshot = await getDocs(q);
    let testimonials = querySnapshot.docs.map(firebaseToFrontend);
    
    // Siempre ordenar en memoria para asegurar el orden correcto
    testimonials = testimonials.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    return { success: true, data: testimonials };
  } catch (error) {
    // Si el error es por índice faltante, intentar sin ordenar
    if (error.message.includes('index') || error.code === 'failed-precondition') {
      try {
        const testimonialsRef = collection(db, TESTIMONIALS_COLLECTION, 'es', 'items');
        const q = publicOnly 
          ? query(testimonialsRef, where('isPublic', '==', true))
          : query(testimonialsRef);
        const querySnapshot = await getDocs(q);
        let testimonials = querySnapshot.docs.map(firebaseToFrontend);
        testimonials = testimonials.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return { success: true, data: testimonials };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message, data: [] };
      }
    }
    return { success: false, error: error.message, data: [] };
  }
};

export const createTestimonial = async (testimonial, testimonialEn = null) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    // Guardar en español
    const testimonialsRefEs = collection(db, TESTIMONIALS_COLLECTION, 'es', 'items');
    const firebaseDataEs = frontendToFirebase(testimonial);
    const docRefEs = await addDoc(testimonialsRefEs, firebaseDataEs);
    
    // Guardar en inglés (traducido) si se proporciona
    if (testimonialEn) {
      const docRefEn = doc(db, TESTIMONIALS_COLLECTION, 'en', 'items', docRefEs.id);
      const firebaseDataEn = frontendToFirebase(testimonialEn);
      // Asegurarse de que el photoURL siempre se copie del español si no está en inglés
      if (!firebaseDataEn.photoURL && firebaseDataEs.photoURL) {
        firebaseDataEn.photoURL = firebaseDataEs.photoURL;
      }
      await setDoc(docRefEn, firebaseDataEn);
    } else {
      // Si no se proporciona testimonialEn, crear uno básico con el photoURL
      const docRefEn = doc(db, TESTIMONIALS_COLLECTION, 'en', 'items', docRefEs.id);
      const firebaseDataEn = {
        name: testimonial.name || '',
        rol: testimonial.role || '',
        testimony: testimonial.quote || '',
        photoURL: firebaseDataEs.photoURL || '', // Siempre copiar el photoURL
        isPublic: testimonial.featured || false,
        place: testimonial.displayOrder || 0,
      };
      await setDoc(docRefEn, firebaseDataEn);
    }
    
    return { success: true, id: docRefEs.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateTestimonial = async (testimonialId, testimonial, testimonialEn = null) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    // Actualizar en español
    const docRefEs = doc(db, TESTIMONIALS_COLLECTION, 'es', 'items', testimonialId);
    const firebaseDataEs = frontendToFirebase(testimonial);
    await updateDoc(docRefEs, firebaseDataEs);
    
    // Actualizar o crear en inglés (traducido) si se proporciona
    if (testimonialEn) {
      const docRefEn = doc(db, TESTIMONIALS_COLLECTION, 'en', 'items', testimonialId);
      const firebaseDataEn = frontendToFirebase(testimonialEn);
      
      // Asegurarse de que el photoURL siempre se copie del español si no está en inglés
      if (!firebaseDataEn.photoURL && firebaseDataEs.photoURL) {
        firebaseDataEn.photoURL = firebaseDataEs.photoURL;
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
      // Si no se proporciona testimonialEn, asegurarse de que el photoURL se copie
      const docRefEn = doc(db, TESTIMONIALS_COLLECTION, 'en', 'items', testimonialId);
      const docSnap = await getDoc(docRefEn);
      if (docSnap.exists()) {
        // Si el documento en inglés existe, actualizar el photoURL si está en español
          if (firebaseDataEs.photoURL) {
            const currentData = docSnap.data();
            if (!currentData.photoURL) {
              await updateDoc(docRefEn, { photoURL: firebaseDataEs.photoURL });
            }
          }
      } else if (firebaseDataEs.photoURL) {
        // Si el documento en inglés no existe pero hay photoURL en español, crear el documento
        const docRefEs = doc(db, TESTIMONIALS_COLLECTION, 'es', 'items', testimonialId);
        const docSnapEs = await getDoc(docRefEs);
        if (docSnapEs.exists()) {
          const dataEs = docSnapEs.data();
          await setDoc(docRefEn, {
            name: dataEs.name || '',
            rol: dataEs.rol || '',
            testimony: dataEs.testimony || '',
            photoURL: firebaseDataEs.photoURL,
            isPublic: dataEs.isPublic || false,
            place: dataEs.place || 0,
          });
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteTestimonial = async (testimonialId) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    // Eliminar de ambas colecciones
    const docRefEs = doc(db, TESTIMONIALS_COLLECTION, 'es', 'items', testimonialId);
    const docRefEn = doc(db, TESTIMONIALS_COLLECTION, 'en', 'items', testimonialId);
    await Promise.all([deleteDoc(docRefEs), deleteDoc(docRefEn)]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener testimonios para frontend público (según idioma)
export const getPublicTestimonials = async (language = 'es', publicOnly = true) => {
  if (!db) {
    return { success: true, data: [] };
  }
  try {
    const testimonialsRef = collection(db, TESTIMONIALS_COLLECTION, language, 'items');
    let q;
    
    if (publicOnly) {
      try {
        q = query(testimonialsRef, where('isPublic', '==', true), orderBy('place', 'asc'));
      } catch (orderError) {
        q = query(testimonialsRef, where('isPublic', '==', true));
      }
    } else {
      try {
        q = query(testimonialsRef, orderBy('place', 'asc'));
      } catch (orderError) {
        q = query(testimonialsRef);
      }
    }
    
    const querySnapshot = await getDocs(q);
    let testimonials = querySnapshot.docs.map(firebaseToFrontend);
    
    // Si estamos cargando en inglés y algún testimonio no tiene photoURL,
    // cargar todos los testimonios en español y hacer un mapeo
    if (language === 'en') {
      const testimonialsWithoutAvatar = testimonials.filter(t => !t.avatar);
      
      if (testimonialsWithoutAvatar.length > 0) {
        try {
          const fallbackRef = collection(db, TESTIMONIALS_COLLECTION, 'es', 'items');
          const fallbackQuery = query(fallbackRef);
          const fallbackSnapshot = await getDocs(fallbackQuery);
          
          // Crear dos mapas: uno por ID y otro por nombre (normalizado)
          const fallbackMapById = new Map();
          const fallbackMapByName = new Map();
          
          fallbackSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.photoURL) {
              // Mapa por ID
              fallbackMapById.set(doc.id, data.photoURL);
              // Mapa por nombre (normalizado para comparación)
              const normalizedName = (data.name || '').toLowerCase().trim();
              if (normalizedName) {
                fallbackMapByName.set(normalizedName, data.photoURL);
              }
            }
          });
          
          // Aplicar el photoURL del español a los testimonios en inglés que no lo tienen
          testimonials.forEach(testimonial => {
            if (!testimonial.avatar) {
              let photoURL = null;
              
              // Primero intentar por ID
              if (fallbackMapById.has(testimonial.id)) {
                photoURL = fallbackMapById.get(testimonial.id);
              } else {
                // Si no se encuentra por ID, intentar por nombre
                const normalizedName = (testimonial.name || '').toLowerCase().trim();
                if (normalizedName && fallbackMapByName.has(normalizedName)) {
                  photoURL = fallbackMapByName.get(normalizedName);
                }
              }
              
              if (photoURL) {
                // Corregir rutas que empiezan con /public/
                if (photoURL.startsWith('/public/')) {
                  photoURL = photoURL.replace('/public/', '/');
                }
                testimonial.avatar = photoURL;
              }
            }
          });
        } catch (error) {
          // Error silencioso
        }
      }
    }
    
    testimonials = testimonials.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    return { success: true, data: testimonials };
  } catch (error) {
    if (error.message.includes('index') || error.code === 'failed-precondition') {
      try {
        const testimonialsRef = collection(db, TESTIMONIALS_COLLECTION, language, 'items');
        const q = publicOnly 
          ? query(testimonialsRef, where('isPublic', '==', true))
          : query(testimonialsRef);
        const querySnapshot = await getDocs(q);
        let testimonials = querySnapshot.docs.map(firebaseToFrontend);
        
        // Si estamos cargando en inglés y algún testimonio no tiene photoURL,
        // cargar todos los testimonios en español y hacer un mapeo
        if (language === 'en') {
          const testimonialsWithoutAvatar = testimonials.filter(t => !t.avatar);
          if (testimonialsWithoutAvatar.length > 0) {
            try {
              const fallbackRef = collection(db, TESTIMONIALS_COLLECTION, 'es', 'items');
              const fallbackQuery = query(fallbackRef);
              const fallbackSnapshot = await getDocs(fallbackQuery);
              
              // Crear dos mapas: uno por ID y otro por nombre (normalizado)
              const fallbackMapById = new Map();
              const fallbackMapByName = new Map();
              
              fallbackSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.photoURL) {
                  fallbackMapById.set(doc.id, data.photoURL);
                  const normalizedName = (data.name || '').toLowerCase().trim();
                  if (normalizedName) {
                    fallbackMapByName.set(normalizedName, data.photoURL);
                  }
                }
              });
              
              // Aplicar el photoURL del español a los testimonios en inglés que no lo tienen
              testimonials.forEach(testimonial => {
                if (!testimonial.avatar) {
                  let photoURL = null;
                  
                  // Primero intentar por ID
                  if (fallbackMapById.has(testimonial.id)) {
                    photoURL = fallbackMapById.get(testimonial.id);
                  } else {
                    // Si no se encuentra por ID, intentar por nombre
                    const normalizedName = (testimonial.name || '').toLowerCase().trim();
                    if (normalizedName && fallbackMapByName.has(normalizedName)) {
                      photoURL = fallbackMapByName.get(normalizedName);
                    }
                  }
                  
                  if (photoURL) {
                    // Corregir rutas que empiezan con /public/
                    if (photoURL.startsWith('/public/')) {
                      photoURL = photoURL.replace('/public/', '/');
                    }
                    testimonial.avatar = photoURL;
                  }
                }
              });
            } catch (error) {
              // Error silencioso
            }
          }
        }
        
        testimonials = testimonials.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        return { success: true, data: testimonials };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message, data: [] };
      }
    }
    return { success: false, error: error.message, data: [] };
  }
};
