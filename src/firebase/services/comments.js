import { collection, addDoc, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../config';

const COMMENTS_COLLECTION = 'portfolio/admin/blog';

// Crear un comentario
export const createComment = async (articleId, language, commentData) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION, language, 'items', articleId, 'comments');
    const comment = {
      name: commentData.name || '',
      mail: commentData.mail || '',
      comment: commentData.comment || '',
      createdAt: new Date(),
    };
    const docRef = await addDoc(commentsRef, comment);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener comentarios de un artículo
export const getArticleComments = async (articleId, language) => {
  if (!db) {
    return { success: true, data: [] };
  }
  try {
    const commentsRef = collection(db, COMMENTS_COLLECTION, language, 'items', articleId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const comments = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
    }));
    return { success: true, data: comments };
  } catch (error) {
    // Si no hay índice, intentar sin ordenar
    if (error.message.includes('index') || error.code === 'failed-precondition') {
      try {
        const commentsRef = collection(db, COMMENTS_COLLECTION, language, 'items', articleId, 'comments');
        const querySnapshot = await getDocs(commentsRef);
        const comments = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
        }));
        // Ordenar en memoria
        comments.sort((a, b) => b.createdAt - a.createdAt);
        return { success: true, data: comments };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message, data: [] };
      }
    }
    return { success: false, error: error.message, data: [] };
  }
};
