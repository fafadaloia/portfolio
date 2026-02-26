/**
 * Servicio de traducción usando Google Cloud Translation API
 * 
 * Para usar este servicio, necesitás:
 * 1. Crear un proyecto en Google Cloud Console
 * 2. Habilitar la API "Cloud Translation API"
 * 3. Crear una clave de API
 * 4. Agregar la clave en .env como VITE_GOOGLE_TRANSLATE_API_KEY
 * 
 * Alternativamente, podés usar un proxy o servicio intermedio para mayor seguridad.
 */

const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Traduce texto de un idioma a otro usando Google Translate API
 * @param {string} text - Texto a traducir (puede ser HTML)
 * @param {string} targetLang - Idioma destino ('es' para español, 'en' para inglés)
 * @param {string} sourceLang - Idioma origen (opcional, 'auto' detecta automáticamente)
 * @param {boolean} isHtml - Si el texto contiene HTML (usa format: 'html' en lugar de 'text')
 * @returns {Promise<{success: boolean, translatedText?: string, error?: string}>}
 */
export const translateText = async (text, targetLang = 'es', sourceLang = 'auto', isHtml = false) => {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    return { 
      success: false, 
      error: 'Google Translate API no está configurada. Agregá VITE_GOOGLE_TRANSLATE_API_KEY en .env' 
    };
  }

  if (!text || text.trim() === '') {
    return { success: false, error: 'No hay texto para traducir' };
  }

  try {
    const response = await fetch(
      `${TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          source: sourceLang === 'auto' ? undefined : sourceLang,
          format: isHtml ? 'html' : 'text',
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error?.message || `Error ${response.status}: ${response.statusText}` 
      };
    }

    const data = await response.json();
    let translatedText = data.data?.translations?.[0]?.translatedText;

    if (!translatedText) {
      return { success: false, error: 'No se recibió traducción de la API' };
    }

    // Si es HTML, verificar y corregir la estructura HTML si es necesario
    if (isHtml && translatedText) {
      // Verificar si el texto traducido tiene etiquetas HTML
      const hasHtmlTags = /<[^>]+>/.test(translatedText);
      const originalHasHtmlTags = /<[^>]+>/.test(text);
      
      // Si el original tenía HTML pero el traducido no, intentar preservar la estructura básica
      if (originalHasHtmlTags && !hasHtmlTags) {
        // Extraer solo el texto del original (sin HTML)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        const originalTextOnly = tempDiv.textContent || tempDiv.innerText || '';
        
        // Si el texto traducido es similar al texto original (solo traducido), 
        // intentar aplicar la estructura HTML del original
        // Esto es una aproximación simple
        if (originalTextOnly.trim() && translatedText.trim()) {
          // Intentar preservar párrafos y saltos de línea básicos
          // Reemplazar saltos de línea múltiples con <br> o <p>
          translatedText = translatedText
            .replace(/\n\n+/g, '</p><p>')
            .replace(/\n/g, '<br>');
          
          // Si el original tenía párrafos, envolver en <p>
          if (text.includes('<p>') || text.includes('</p>')) {
            if (!translatedText.startsWith('<p>')) {
              translatedText = '<p>' + translatedText + '</p>';
            }
          }
        }
      }
    }

    return { success: true, translatedText };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Error al conectar con el servicio de traducción' 
    };
  }
};

/**
 * Traduce múltiples textos a la vez (más eficiente)
 * @param {string[]} texts - Array de textos a traducir
 * @param {string} targetLang - Idioma destino
 * @param {string} sourceLang - Idioma origen
 * @returns {Promise<{success: boolean, translatedTexts?: string[], error?: string}>}
 */
export const translateMultiple = async (texts, targetLang = 'es', sourceLang = 'auto') => {
  if (!GOOGLE_TRANSLATE_API_KEY) {
    return { 
      success: false, 
      error: 'Google Translate API no está configurada' 
    };
  }

  if (!texts || texts.length === 0) {
    return { success: false, error: 'No hay textos para traducir' };
  }

  try {
    const response = await fetch(
      `${TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: texts,
          target: targetLang,
          source: sourceLang === 'auto' ? undefined : sourceLang,
          format: 'text',
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error?.message || `Error ${response.status}: ${response.statusText}` 
      };
    }

    const data = await response.json();
    const translatedTexts = data.data?.translations?.map(t => t.translatedText) || [];

    if (translatedTexts.length !== texts.length) {
      return { 
        success: false, 
        error: 'No se recibieron todas las traducciones' 
      };
    }

    return { success: true, translatedTexts };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Error al conectar con el servicio de traducción' 
    };
  }
};

/**
 * Verifica si el servicio de traducción está configurado
 */
export const isTranslateAvailable = () => {
  return !!GOOGLE_TRANSLATE_API_KEY;
};
