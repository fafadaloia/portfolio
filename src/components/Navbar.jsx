import { Fragment, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { key: 'home', to: '/' },
  { key: 'about', to: '/about' },
  { key: 'projects', to: '/projects' },
  { key: 'services', to: '/services' },
  { key: 'blog', to: '/blog' },
  { key: 'contact', to: '/contact' },
];

const Navbar = () => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-lightBg/80 backdrop-blur-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-primary dark:text-linkDark">
          <motion.img
            layoutId="brand-mark"
            src="/images/logo.svg"
            alt="Ir al inicio"
            className="h-12 w-auto"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium uppercase tracking-widest transition-colors duration-200 ${
                  isActive ? 'text-primary dark:text-linkDark' : 'text-linkLight dark:text-linkDark'
                } hover:text-accent dark:hover:text-primary`
              }
            >
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center justify-center rounded-md border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-linkDark/30 dark:text-linkDark dark:hover:text-primary md:hidden"
          aria-label="Abrir navegación"
        >
          <FiMenu size={20} />
        </button>
      </div>

      <Transition appear show={mobileOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={closeMobile}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-darkBg/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 flex justify-end">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="flex h-full w-72 flex-col gap-8 bg-lightBg px-6 py-8 shadow-xl transition-colors duration-300 dark:bg-darkBg">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-primary dark:text-linkDark">Menu</Dialog.Title>
                  <button
                    type="button"
                    onClick={closeMobile}
                    className="rounded-md border border-transparent p-2 text-linkLight transition-colors duration-200 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-linkDark dark:hover:text-primary"
                    aria-label="Cerrar navegación"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      onClick={closeMobile}
                      className={({ isActive }) =>
                        `text-base font-semibold uppercase tracking-widest ${
                          isActive ? 'text-primary dark:text-linkDark' : 'text-linkLight dark:text-linkDark'
                        } hover:text-accent dark:hover:text-primary`
                      }
                    >
                      {t(`nav.${item.key}`)}
                    </NavLink>
                  ))}
                </div>

                <AnimatePresence>
                  <motion.div
                    key="toggles"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="mt-auto flex flex-col gap-3"
                  >
                    <LanguageToggle variant="mobile" />
                    <ThemeToggle variant="mobile" />
                  </motion.div>
                </AnimatePresence>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </header>
  );
};

export default Navbar;

