import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes';

const App = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="flex min-h-screen flex-col bg-lightBg text-lightText font-sans transition-colors duration-300 dark:bg-darkBg dark:text-darkText">
      {!isAdminPage && <Navbar />}
      <main className={isAdminPage ? 'flex-1' : 'flex-1 px-4 py-12 sm:px-6 lg:px-8'}>
        <AppRoutes />
      </main>
      {!isAdminPage && <Footer />}
    </div>
  );
};

export default App;

