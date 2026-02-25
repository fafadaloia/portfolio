import { useState } from 'react';
import { FiHome, FiFolder, FiMessageSquare, FiFileText, FiMail, FiLogOut } from 'react-icons/fi';
import { logout } from '../firebase/auth';
import { useNavigate } from 'react-router-dom';

import './admin.css';
import AboutEditor from './components/AboutEditor';
import BlogEditor from './components/BlogEditor';
import MessagesViewer from './components/MessagesViewer';
import ProjectsManager from './components/ProjectsManager';
import TestimonialsEditor from './components/TestimonialsEditor';

const TABS = [
  { key: 'about', label: 'Sobre mí', icon: FiHome },
  { key: 'projects', label: 'Proyectos', icon: FiFolder },
  { key: 'testimonials', label: 'Testimonios', icon: FiMessageSquare },
  { key: 'blog', label: 'Blog', icon: FiFileText },
  { key: 'messages', label: 'Mensajes', icon: FiMail },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('about');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutEditor />;
      case 'projects':
        return <ProjectsManager />;
      case 'testimonials':
        return <TestimonialsEditor />;
      case 'blog':
        return <BlogEditor />;
      case 'messages':
        return <MessagesViewer />;
      default:
        return <AboutEditor />;
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex items-start justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-primary dark:text-linkDark">Panel de Administración</h1>
          <p className="text-base text-linkLight/80 dark:text-linkDark/80">
            Gestioná todo el contenido de tu portfolio desde un solo lugar.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/20 px-4 py-2 text-sm uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
        >
          <FiLogOut size={16} />
          Salir
        </button>
      </header>

      <nav className="flex flex-wrap gap-3 rounded-2xl border border-primary/10 bg-white/70 p-4 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/70">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold uppercase tracking-widest transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-buttonLightFrom to-buttonLightTo text-buttonTextLight dark:from-buttonDarkFrom dark:to-buttonDarkTo dark:text-buttonTextDark'
                  : 'text-linkLight/80 hover:text-accent dark:text-linkDark/70 dark:hover:text-primary'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main>{renderContent()}</main>
    </div>
  );
};

export default AdminDashboard;
