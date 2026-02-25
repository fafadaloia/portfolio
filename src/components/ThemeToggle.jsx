import { FiMoon, FiSun } from 'react-icons/fi';

import useTheme from '../hooks/useTheme';

const ThemeToggle = ({ variant = 'default' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
      className={`rounded-full border border-transparent bg-white/10 p-2 text-linkLight transition-colors duration-200 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-darkBg/80 dark:text-linkDark dark:hover:text-primary ${
        variant === 'mobile' ? 'w-full justify-center border-none bg-transparent p-3' : ''
      }`}
    >
      {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
    </button>
  );
};

export default ThemeToggle;

