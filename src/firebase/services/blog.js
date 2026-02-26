import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config';

const BLOG_COLLECTION = 'portfolio/admin/blog';

// Normalizar título a slug (minúsculas, sin espacios, en inglés)
export const normalizeToSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
};

// Convertir artículo de Firebase a formato del frontend
const firebaseToFrontend = (firebaseDoc) => {
  const data = firebaseDoc.data();
  const postDate = data.postDate?.toDate ? data.postDate.toDate() : (data.postDate ? new Date(data.postDate) : null);
  const title = data.title || '';
  
  return {
    id: firebaseDoc.id,
    title: title,
    metaTitle: data.metatitle || '',
    summary: data.metatitle || '',
    content: data.body || '',
    publishedAt: postDate ? postDate.toISOString().split('T')[0] : '',
    imagesURL: data.imagesURL || '',
    tags: data.tags || [],
    views: data.views || 0,
    likes: data.likes || 0,
    slug: normalizeToSlug(title),
    readingTime: data.body
      ? `${Math.max(3, Math.round(data.body.replace(/<[^>]*>/g, '').split(' ').length / 200))} min`
      : '3 min',
  };
};

// Convertir artículo del frontend a formato de Firebase
const frontendToFirebase = (article) => {
  const postDate = article.publishedAt
    ? new Date(article.publishedAt)
    : article.publishedAt
    ? new Date(article.publishedAt)
    : null;

  return {
    title: article.title || '',
    metatitle: article.metaTitle || article.summary || '',
    body: article.content || '',
    imagesURL: article.imagesURL || '',
    tags: article.tags || [],
    postDate: postDate,
    isPublic: article.status === 'published' || article.isPublic || false,
  };
};

// Obtener artículos para admin (solo español)
export const getBlogPosts = async (publicOnly = false) => {
  if (!db) {
    return { success: true, data: [] };
  }
  try {
    const blogRef = collection(db, BLOG_COLLECTION, 'es', 'items');
    let q;
    
    if (publicOnly) {
      try {
        q = query(blogRef, where('isPublic', '==', true), orderBy('postDate', 'desc'));
      } catch (orderError) {
        q = query(blogRef, where('isPublic', '==', true));
      }
    } else {
      try {
        q = query(blogRef, orderBy('postDate', 'desc'));
      } catch (orderError) {
        q = query(blogRef);
      }
    }
    
    const querySnapshot = await getDocs(q);
    let posts = querySnapshot.docs.map(firebaseToFrontend);
    
    // Si no se pudo ordenar en la query, ordenar en memoria
    posts = posts.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
      return dateB - dateA; // Descendente
    });
    
    return { success: true, data: posts };
  } catch (error) {
    // Si el error es por índice faltante, intentar sin ordenar
    if (error.message.includes('index') || error.code === 'failed-precondition') {
      try {
        const blogRef = collection(db, BLOG_COLLECTION, 'es', 'items');
        const q = publicOnly 
          ? query(blogRef, where('isPublic', '==', true))
          : query(blogRef);
        const querySnapshot = await getDocs(q);
        let posts = querySnapshot.docs.map(firebaseToFrontend);
        posts = posts.sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
          const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
          return dateB - dateA;
        });
        return { success: true, data: posts };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message, data: [] };
      }
    }
    return { success: false, error: error.message, data: [] };
  }
};

export const createBlogPost = async (article, articleEn = null) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    // Guardar en español
    const blogRefEs = collection(db, BLOG_COLLECTION, 'es', 'items');
    const firebaseDataEs = frontendToFirebase(article);
    const docRefEs = await addDoc(blogRefEs, firebaseDataEs);
    
    // Guardar en inglés (traducido) si se proporciona
    if (articleEn) {
      const docRefEn = doc(db, BLOG_COLLECTION, 'en', 'items', docRefEs.id);
      const firebaseDataEn = frontendToFirebase(articleEn);
      await setDoc(docRefEn, firebaseDataEn);
    }
    
    return { success: true, id: docRefEs.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateBlogPost = async (articleId, article, articleEn = null) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    // Actualizar en español
    const docRefEs = doc(db, BLOG_COLLECTION, 'es', 'items', articleId);
    const firebaseDataEs = frontendToFirebase(article);
    await updateDoc(docRefEs, firebaseDataEs);
    
    // Actualizar o crear en inglés (traducido) si se proporciona
    if (articleEn) {
      const docRefEn = doc(db, BLOG_COLLECTION, 'en', 'items', articleId);
      const firebaseDataEn = frontendToFirebase(articleEn);
      
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

export const deleteBlogPost = async (articleId) => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado' };
  }
  try {
    // Eliminar de ambas colecciones
    const docRefEs = doc(db, BLOG_COLLECTION, 'es', 'items', articleId);
    const docRefEn = doc(db, BLOG_COLLECTION, 'en', 'items', articleId);
    await Promise.all([deleteDoc(docRefEs), deleteDoc(docRefEn)]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener artículos para frontend público (según idioma)
export const getPublicBlogPosts = async (language = 'es', publicOnly = true) => {
  if (!db) {
    return { success: true, data: [] };
  }
  try {
    const blogRef = collection(db, BLOG_COLLECTION, language, 'items');
    let q;
    
    if (publicOnly) {
      try {
        q = query(blogRef, where('isPublic', '==', true), orderBy('postDate', 'desc'));
      } catch (orderError) {
        q = query(blogRef, where('isPublic', '==', true));
      }
    } else {
      try {
        q = query(blogRef, orderBy('postDate', 'desc'));
      } catch (orderError) {
        q = query(blogRef);
      }
    }
    
    const querySnapshot = await getDocs(q);
    let posts = querySnapshot.docs.map(firebaseToFrontend);
    
    // Si no se pudo ordenar en la query, ordenar en memoria
    posts = posts.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
      return dateB - dateA; // Descendente
    });
    
    return { success: true, data: posts };
  } catch (error) {
    if (error.message.includes('index') || error.code === 'failed-precondition') {
      try {
        const blogRef = collection(db, BLOG_COLLECTION, language, 'items');
        const q = publicOnly 
          ? query(blogRef, where('isPublic', '==', true))
          : query(blogRef);
        const querySnapshot = await getDocs(q);
        let posts = querySnapshot.docs.map(firebaseToFrontend);
        posts = posts.sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
          const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
          return dateB - dateA;
        });
        return { success: true, data: posts };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message, data: [] };
      }
    }
    return { success: false, error: error.message, data: [] };
  }
};

// Obtener un artículo por slug
export const getArticleBySlug = async (slug, language = 'es') => {
  if (!db) {
    return { success: false, error: 'Firebase no está configurado', data: null };
  }
  try {
    const blogRef = collection(db, BLOG_COLLECTION, language, 'items');
    const querySnapshot = await getDocs(query(blogRef, where('isPublic', '==', true)));
    
    const articles = querySnapshot.docs.map(firebaseToFrontend);
    
    // Buscar artículo por slug
    const article = articles.find(a => normalizeToSlug(a.title) === slug);
    
    if (article) {
      return { success: true, data: article };
    }
    
    return { success: false, error: 'Artículo no encontrado', data: null };
  } catch (error) {
    return { success: false, error: error.message, data: null };
  }
};

// Obtener artículos recomendados basados en tags
export const getRecommendedArticles = async (currentArticleId, currentTags, language = 'es', limit = 3) => {
  if (!db || !currentTags || currentTags.length === 0) {
    return { success: true, data: [] };
  }
  try {
    const blogRef = collection(db, BLOG_COLLECTION, language, 'items');
    const querySnapshot = await getDocs(query(blogRef, where('isPublic', '==', true)));
    
    const articles = querySnapshot.docs.map(firebaseToFrontend);
    
    // Filtrar el artículo actual y calcular coincidencias de tags
    const articlesWithMatches = articles
      .filter(article => article.id !== currentArticleId)
      .map(article => {
        const matchingTags = article.tags.filter(tag => 
          currentTags.some(currentTag => 
            currentTag.toLowerCase() === tag.toLowerCase()
          )
        );
        return {
          ...article,
          matchingTagsCount: matchingTags.length,
        };
      })
      .filter(article => article.matchingTagsCount > 0) // Al menos 1 tag en común
      .sort((a, b) => b.matchingTagsCount - a.matchingTagsCount) // Ordenar por más coincidencias
      .slice(0, limit); // Limitar resultados
    
    return { success: true, data: articlesWithMatches };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
};
