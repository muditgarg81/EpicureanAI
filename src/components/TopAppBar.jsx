import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import useAuthStore from '../store/useAuthStore';
import useTranslation from '../hooks/useTranslation';

const TopAppBar = ({ title = "Modern Kitchen" }) => {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const { language: currentLanguage, setLanguage } = useAppStore();

  const languages = [
    { name: 'English', flag: '🇺🇸', code: 'en' },
    { name: 'Spanish', flag: '🇪🇸', code: 'es' },
    { name: 'Hindi', flag: '🇮🇳', code: 'hi' },
    { name: 'Bengali', flag: '🇮🇳', code: 'bn' },
    { name: 'Telugu', flag: '🇮🇳', code: 'te' },
    { name: 'Marathi', flag: '🇮🇳', code: 'mr' },
    { name: 'Tamil', flag: '🇮🇳', code: 'ta' },
    { name: 'Urdu', flag: '🇮🇳', code: 'ur' },
    { name: 'Gujarati', flag: '🇮🇳', code: 'gu' },
    { name: 'Kannada', flag: '🇮🇳', code: 'kn' },
    { name: 'Odia', flag: '🇮🇳', code: 'or' },
    { name: 'Malayalam', flag: '🇮🇳', code: 'ml' },
    { name: 'Punjabi', flag: '🇮🇳', code: 'pa' }
  ];

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  // Sharpened high-resolution default avatar
  const defaultAvatar = "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=100";
  const avatarUrl = user?.user_metadata?.avatar_url || defaultAvatar;

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md shadow-sm dark:shadow-none transition-colors duration-300 print:hidden">
        <div className="flex items-center justify-between px-container-margin w-full max-w-7xl mx-auto h-16">
          {/* Left: Menu & Brand */}
          <div className="flex items-center gap-4">
            <button 
              className="active:scale-95 transition-transform duration-200"
              onClick={() => setIsMenuOpen(true)}
            >
              <span className="material-icons text-primary dark:text-primary-fixed">menu</span>
            </button>
            <Link to="/discovery" className="flex items-center gap-2 group">
              <span className="material-icons text-primary dark:text-primary-fixed group-hover:rotate-12 transition-transform">auto_awesome</span>
              <h1 className="hidden sm:block font-headline-md text-headline-md text-primary dark:text-primary-fixed tracking-tight">
                {title}
              </h1>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/discovery" className="text-on-surface-variant dark:text-outline-variant hover:text-primary transition-colors font-label-lg text-label-lg">{t('explore')}</Link>
            <Link to="/generator" className="text-on-surface-variant dark:text-outline-variant hover:text-primary transition-colors font-label-lg text-label-lg">{t('recipes')}</Link>
            <Link to="/family-hub" className="text-on-surface-variant dark:text-outline-variant hover:text-primary transition-colors font-label-lg text-label-lg">{t('kitchen')}</Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-highest dark:bg-surface-variant text-on-surface hover:opacity-80 transition-all"
                title="Change Language"
              >
                <span className="material-icons text-primary dark:text-primary-fixed">language</span>
              </button>
              <AnimatePresence>
                {isLangMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-surface-container-high border border-outline-variant/30 rounded-3xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-outline-variant/20 bg-surface/50">
                        <p className="text-label-sm text-on-surface-variant">Select Language</p>
                      </div>
                      <div className="p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                        {languages.map(lang => (
                          <button 
                            key={lang.code}
                            onClick={() => {
                              setLanguage(lang.name);
                              setIsLangMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface-container-highest text-on-surface transition-colors ${currentLanguage === lang.name ? 'bg-primary/10 text-primary font-bold' : ''}`}
                          >
                            <span className="text-xl">{lang.flag}</span>
                            <span className="font-label-lg">{lang.name}</span>
                            {currentLanguage === lang.name && <span className="ml-auto material-icons text-[18px]">check_circle</span>}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <Link 
              to="/favorites"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-highest dark:bg-surface-variant text-on-surface hover:opacity-80 transition-all active:scale-95"
              title="Saved Recipes"
            >
              <span className="material-icons text-primary dark:text-primary-fixed">favorite</span>
            </Link>

            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-highest dark:bg-surface-variant text-on-surface hover:opacity-80 transition-all"
              aria-label="Toggle Dark Mode"
            >
              <span className="material-icons text-primary dark:text-primary-fixed">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-primary/20 dark:border-primary-fixed/20 overflow-hidden hover:ring-4 hover:ring-primary/20 transition-all shadow-md active:scale-95"
              >
                <img
                  alt="User Profile"
                  className="w-full h-full object-cover scale-105"
                  src={avatarUrl}
                  loading="eager"
                />
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-surface-container-high border border-outline-variant/30 rounded-3xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-outline-variant/20 bg-surface/50">
                        <p className="text-label-sm text-on-surface-variant">Signed in as</p>
                        <p className="font-headline-sm truncate">{userName}</p>
                      </div>
                      <div className="p-2">
                        <Link 
                          to="/profile" 
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface-container-highest text-on-surface transition-colors"
                        >
                          <span className="material-icons text-primary">account_circle</span>
                          <span className="font-label-lg">{t('mastery_profile')}</span>
                        </Link>
                        <Link 
                          to="/settings" 
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface-container-highest text-on-surface transition-colors"
                        >
                          <span className="material-icons text-primary">settings</span>
                          <span className="font-label-lg">{t('account_settings')}</span>
                        </Link>
                        <div className="h-px bg-outline-variant/20 my-2" />
                        <button 
                          onClick={async () => { 
                            setIsProfileMenuOpen(false); 
                            await useAuthStore.getState().signOut();
                            window.location.href = '/';
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 text-red-500 transition-colors text-left"
                        >
                          <span className="material-icons">logout</span>
                          <span className="font-label-lg">{t('sign_out')}</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Drawer Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-3/4 max-w-sm bg-surface z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 flex justify-between items-center border-b border-outline-variant/30">
                <h2 className="font-headline-md text-headline-md text-primary">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-surface-container rounded-full active:scale-95">
                  <span className="material-icons text-on-surface">close</span>
                </button>
              </div>
              <nav className="flex-1 p-6 flex flex-col gap-4">
                <Link to="/planner" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary-container text-on-surface group transition-colors">
                  <span className="material-icons text-secondary group-hover:text-on-secondary-container">calendar_month</span>
                  <span className="font-label-lg text-label-lg font-medium">{t('planner')}</span>
                </Link>
                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary-container text-on-surface group transition-colors">
                  <span className="material-icons text-secondary group-hover:text-on-secondary-container">account_circle</span>
                  <span className="font-label-lg text-label-lg font-medium">{t('mastery_profile')}</span>
                </Link>
                <Link to="/family-hub" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary-container text-on-surface group transition-colors">
                  <span className="material-icons text-secondary group-hover:text-on-secondary-container">group</span>
                  <span className="font-label-lg text-label-lg font-medium">{t('family_hub')}</span>
                </Link>
                <Link to="/favorites" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary-container text-on-surface group transition-colors">
                  <span className="material-icons text-secondary group-hover:text-on-secondary-container">favorite</span>
                  <span className="font-label-lg text-label-lg font-medium">{t('favorites') || 'Saved Recipes'}</span>
                </Link>
                <Link to="/help" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary-container text-on-surface group transition-colors">
                  <span className="material-icons text-secondary group-hover:text-on-secondary-container">help</span>
                  <span className="font-label-lg text-label-lg font-medium">{t('help_center')}</span>
                </Link>
                <Link to="/legal" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary-container text-on-surface group transition-colors">
                  <span className="material-icons text-secondary group-hover:text-on-secondary-container">gavel</span>
                  <span className="font-label-lg text-label-lg font-medium">{t('legal_policies') || 'Legal Policies'}</span>
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default TopAppBar;
