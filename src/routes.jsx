import { Navigate, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthChange, getCurrentUser } from './firebase/auth';

import About from './pages/About';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Projects from './pages/Projects';
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

const AppRoutes = () => (
  <Routes>
    <Route index element={<Home />} />
    <Route path="about" element={<About />} />
    <Route path="projects" element={<Projects />} />
    <Route path="services" element={<Services />} />
    <Route path="blog" element={<Blog />} />
    <Route path="contact" element={<Contact />} />
    <Route path="admin" element={<ProtectedAdminRoute />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;

