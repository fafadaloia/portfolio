import { Navigate, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { onAuthChange, getCurrentUser } from './firebase/auth';

import About from './pages/About';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ArticleDetail from './pages/ArticleDetail';
import Services from './pages/Services';
import AdminDashboard from './admin/AdminDashboard';
import Login from './admin/components/Login';

const ProtectedAdminRoute = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const unsubscribe = onAuthChange((currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });

      // Verificar usuario actual inmediatamente
      setUser(getCurrentUser());
      setLoading(false);

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (error) {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-linkLight/80 dark:text-linkDark/80">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => setUser(getCurrentUser())} />;
  }

  return <AdminDashboard />;
};

// Componente que determina si el slug es un proyecto o un artículo
const DynamicRouteHandler = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const language = i18n.language || 'es';
  const [loading, setLoading] = useState(true);
  const [routeType, setRouteType] = useState(null);

  useEffect(() => {
    const checkRoute = async () => {
      if (!slug) {
        navigate('/');
        return;
      }

      // Primero intentar como proyecto
      try {
        const { getProjectBySlug } = await import('./firebase/services/projects');
        const projectResult = await getProjectBySlug(slug, language);
        
        if (projectResult.success && projectResult.data) {
          setRouteType('project');
          setLoading(false);
          return;
        }
      } catch (err) {
        // Continuar con artículo
      }

      // Si no es proyecto, intentar como artículo
      try {
        const { getArticleBySlug } = await import('./firebase/services/blog');
        const articleResult = await getArticleBySlug(slug, language);
        
        if (articleResult.success && articleResult.data) {
          setRouteType('article');
          setLoading(false);
          return;
        }
      } catch (err) {
        // No es ni proyecto ni artículo
      }

      // No se encontró nada, redirigir
      navigate('/');
      setLoading(false);
    };

    checkRoute();
  }, [slug, language, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-linkLight/80 dark:text-linkDark/80">Cargando...</p>
      </div>
    );
  }

  return routeType === 'project' ? <ProjectDetail /> : <ArticleDetail />;
};

const AppRoutes = () => (
  <Routes>
    <Route index element={<Home />} />
    <Route path="about" element={<About />} />
    <Route path="projects" element={<Projects />} />
    <Route path="services" element={<Services />} />
    <Route path="blog" element={<Blog />} />
    <Route path="contact" element={<Contact />} />
    <Route path="admin" element={<ProtectedAdminRoute />} />
    <Route path=":slug" element={<DynamicRouteHandler />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;

