import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config';

const TEXTS_COLLECTION = 'portfolio/admin/texts';

// Obtener textos para admin (solo español)
export const getTexts = async () => {
  if (!db) {
    return { success: true, data: { homeAboutMe: '', aboutMe: '' } };
  }
  try {
    const docRef = doc(db, TEXTS_COLLECTION, 'es');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        success: true, 
        data: {
          homeAboutMe: data.homeAboutMe || '',
          aboutMe: data.aboutMe || '',
        }
      };
    } else {
      return { success: true, data: { homeAboutMe: '', aboutMe: '' } };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Guardar textos (solo español, se traduce automáticamente)
export const updateTexts = async (homeAboutMe, aboutMe, homeAboutMeEn = null, aboutMeEn = null) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    // Guardar en español
    const docRefEs = doc(db, TEXTS_COLLECTION, 'es');
    await setDoc(docRefEs, {
      homeAboutMe: homeAboutMe || '',
      aboutMe: aboutMe || '',
    }, { merge: true });
    
    // Guardar en inglés si se proporciona la traducción
    if (homeAboutMeEn !== null || aboutMeEn !== null) {
      const docRefEn = doc(db, TEXTS_COLLECTION, 'en');
      await setDoc(docRefEn, {
        homeAboutMe: homeAboutMeEn || '',
        aboutMe: aboutMeEn || '',
      }, { merge: true });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener textos para frontend público (según idioma)
export const getPublicTexts = async (language = 'es') => {
  if (!db) {
    return { success: true, data: { homeAboutMe: '', aboutMe: '' } };
  }
  try {
    const docRef = doc(db, TEXTS_COLLECTION, language);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        success: true, 
        data: {
          homeAboutMe: data.homeAboutMe || '',
          aboutMe: data.aboutMe || '',
        }
      };
    } else {
      return { success: true, data: { homeAboutMe: '', aboutMe: '' } };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
