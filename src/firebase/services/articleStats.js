import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../config';

const BLOG_COLLECTION = 'portfolio/admin/blog';

// Incrementar visualizaciones
export const incrementViews = async (articleId, language) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    const articleRef = doc(db, BLOG_COLLECTION, language, 'items', articleId);
    const articleSnap = await getDoc(articleRef);
    
    if (articleSnap.exists()) {
      const currentViews = articleSnap.data().views || 0;
      await updateDoc(articleRef, {
        views: increment(1),
        lastViewedAt: serverTimestamp(),
      });
      return { success: true, views: currentViews + 1 };
    } else {
      // Si no existe, crear con views = 1
      await setDoc(articleRef, {
        views: 1,
        lastViewedAt: serverTimestamp(),
      }, { merge: true });
      return { success: true, views: 1 };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Toggle like (agregar o quitar like)
export const toggleLike = async (articleId, language) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    const articleRef = doc(db, BLOG_COLLECTION, language, 'items', articleId);
    const articleSnap = await getDoc(articleRef);
    
    if (articleSnap.exists()) {
      const currentLikes = articleSnap.data().likes || 0;
      await updateDoc(articleRef, {
        likes: increment(1),
        lastLikedAt: serverTimestamp(),
      });
      return { success: true, likes: currentLikes + 1, liked: true };
    } else {
      // Si no existe, crear con likes = 1
      await setDoc(articleRef, {
        likes: 1,
        lastLikedAt: serverTimestamp(),
      }, { merge: true });
      return { success: true, likes: 1, liked: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener estadísticas de un artículo
export const getArticleStats = async (articleId, language) => {
  if (!db) {
    return { success: true, data: { views: 0, likes: 0 } };
  }
  try {
    const articleRef = doc(db, BLOG_COLLECTION, language, 'items', articleId);
    const articleSnap = await getDoc(articleRef);
    
    if (articleSnap.exists()) {
      const data = articleSnap.data();
      return {
        success: true,
        data: {
          views: data.views || 0,
          likes: data.likes || 0,
        },
      };
    } else {
      return { success: true, data: { views: 0, likes: 0 } };
    }
  } catch (error) {
    return { success: false, error: error.message, data: { views: 0, likes: 0 } };
  }
};
