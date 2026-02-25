import { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPublicTexts } from '../firebase/services/texts';
import { getPublicProjects } from '../firebase/services/projects';
import { getPublicTestimonials } from '../firebase/services/testimonials';
import { getPublicBlogPosts } from '../firebase/services/blog';

const FirebaseDataContext = createContext(null);

export const FirebaseDataProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [texts, setTexts] = useState({ homeAboutMe: '', aboutMe: '' });
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [i18n.language]);

  const loadAllData = async () => {
    setLoading(true);
    const language = i18n.language || 'es';
    
    try {
      // Cargar todos los datos en paralelo según el idioma
      const [textsResult, projectsResult, testimonialsResult, blogResult] = await Promise.all([
        getPublicTexts(language),
        getPublicProjects(language, true), // Solo públicos
        getPublicTestimonials(language, true), // Solo públicos
        getPublicBlogPosts(language, true), // Solo públicos
      ]);

      if (textsResult.success) {
        setTexts(textsResult.data);
      }
      if (projectsResult.success) {
        setProjects(projectsResult.data);
      }
      if (testimonialsResult.success) {
        // Primero eliminar duplicados por ID
        let uniqueById = testimonialsResult.data.reduce((acc, current) => {
          const existing = acc.find((item) => item.id === current.id);
          if (!existing) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        // Luego eliminar duplicados por contenido (mismo nombre y quote en cualquier idioma)
        // Si hay duplicados, mantener el que tenga más información (ambos idiomas)
        const uniqueTestimonials = uniqueById.reduce((acc, current) => {
          // Normalizar para comparar (sin espacios extra, lowercase)
          const normalize = (str) => (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
          
          // Obtener nombres y quotes normalizados
          const currentNameEn = normalize(current.name || '');
          const currentNameEs = normalize(current.nameEs || '');
          const currentQuoteEn = normalize(current.quote || '');
          const currentQuoteEs = normalize(current.quoteEs || '');
          
          // Usar el nombre y quote principal (el que tenga contenido)
          const currentName = currentNameEs || currentNameEn;
          const currentQuote = currentQuoteEs || currentQuoteEn;
          
          // Solo comparar si ambos tienen contenido
          if (!currentName || !currentQuote) {
            acc.push(current);
            return acc;
          }
          
          // Buscar si ya existe uno con el mismo nombre y quote (comparando ambos idiomas)
          const existingIndex = acc.findIndex((item) => {
            const itemNameEn = normalize(item.name || '');
            const itemNameEs = normalize(item.nameEs || '');
            const itemQuoteEn = normalize(item.quote || '');
            const itemQuoteEs = normalize(item.quoteEs || '');
            
            const itemName = itemNameEs || itemNameEn;
            const itemQuote = itemQuoteEs || itemQuoteEn;
            
            // Comparar: mismo nombre y mismo quote (en cualquier idioma)
            return itemName === currentName && itemQuote === currentQuote && itemName !== '' && itemQuote !== '';
          });
          
          if (existingIndex === -1) {
            // No existe, agregar
            acc.push(current);
          } else {
            // Existe duplicado, mantener el que tenga más información (ambos idiomas)
            const existing = acc[existingIndex];
            const existingHasBoth = (existing.name && existing.nameEs) || (existing.quote && existing.quoteEs);
            const currentHasBoth = (current.name && current.nameEs) || (current.quote && current.quoteEs);
            
            if (currentHasBoth && !existingHasBoth) {
              // El actual tiene ambos idiomas, reemplazar el existente
              acc[existingIndex] = current;
            }
          }
          
          return acc;
        }, []);
        
        setTestimonials(uniqueTestimonials);
      }
      if (blogResult.success) {
        setBlogPosts(blogResult.data);
      }
    } catch (error) {
      // Error silencioso
    } finally {
      setLoading(false);
    }
  };

  return (
    <FirebaseDataContext.Provider value={{ texts, projects, testimonials, blogPosts, loading, reload: loadAllData }}>
      {children}
    </FirebaseDataContext.Provider>
  );
};

export const useFirebaseData = () => {
  const context = useContext(FirebaseDataContext);
  if (!context) {
    throw new Error('useFirebaseData debe usarse dentro de FirebaseDataProvider');
  }
  return context;
};
