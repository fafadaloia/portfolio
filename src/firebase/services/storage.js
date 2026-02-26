import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config';

/**
 * Sube una imagen a Firebase Storage
 * @param {File} file - Archivo de imagen a subir
 * @param {string} folder - Carpeta donde guardar (ej: 'admin/testimonies', 'admin/proyects')
 * @param {string} fileName - Nombre del archivo (sin extensión, se usará la del archivo original)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadImage = async (file, folder, fileName = null) => {
  if (!storage) {
    return { success: false, error: 'Storage no está configurado' };
  }

  if (!file) {
    return { success: false, error: 'No se proporcionó ningún archivo' };
  }

  // Validar que sea una imagen
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'El archivo debe ser una imagen' };
  }

  try {
    // Generar nombre de archivo único si no se proporciona
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const finalFileName = fileName 
      ? `${fileName}.${fileExtension}`
      : `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Crear referencia en Storage
    const storageRef = ref(storage, `${folder}/${finalFileName}`);

    // Subir el archivo
    await uploadBytes(storageRef, file);

    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(storageRef);

    return { success: true, url: downloadURL };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Elimina una imagen de Firebase Storage
 * @param {string} url - URL completa de la imagen en Storage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteImage = async (url) => {
  if (!storage) {
    return { success: false, error: 'Storage no está configurado' };
  }

  if (!url) {
    return { success: false, error: 'No se proporcionó ninguna URL' };
  }

  try {
    // Extraer la ruta del archivo desde la URL de Storage
    // Las URLs de Storage tienen formato: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      return { success: false, error: 'URL de Storage inválida' };
    }

    // Decodificar la ruta (puede estar codificada)
    const filePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, filePath);

    // Eliminar el archivo
    await deleteObject(storageRef);

    return { success: true };
  } catch (error) {
    // Si el archivo no existe, no es un error crítico
    if (error.code === 'storage/object-not-found') {
      return { success: true };
    }
    return { success: false, error: error.message };
  }
};

/**
 * Verifica si una URL es de Firebase Storage
 * @param {string} url - URL a verificar
 * @returns {boolean}
 */
export const isStorageUrl = (url) => {
  if (!url) return false;
  return url.includes('firebasestorage.googleapis.com') || url.includes('firebase.storage');
};

/**
 * Convierte una ruta relativa de Storage a una URL completa
 * @param {string} path - Ruta relativa (ej: 'admin/proyects/logo.png')
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const getStorageUrlFromPath = async (path) => {
  if (!storage) {
    return { success: false, error: 'Storage no está configurado' };
  }

  if (!path) {
    return { success: false, error: 'No se proporcionó ninguna ruta' };
  }

  // Si ya es una URL completa, retornarla tal cual
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return { success: true, url: path };
  }

  try {
    // Crear referencia en Storage
    const storageRef = ref(storage, path);
    
    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(storageRef);
    
    return { success: true, url: downloadURL };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
