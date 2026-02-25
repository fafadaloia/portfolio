import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { FirebaseDataProvider } from './context/FirebaseDataContext';

import './translations/i18n';
import './index.css';

// Detectar el base path automáticamente
const getBasePath = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    // Si estamos en GitHub Pages con subdirectorio
    if (path.startsWith('/portfolio/')) {
      return '/portfolio';
    }
  }
  return '/portfolio';
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter basename={getBasePath()}>
      <ThemeProvider>
        <LanguageProvider>
          <FirebaseDataProvider>
            <App />
          </FirebaseDataProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

