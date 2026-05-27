import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useTranslation from '../hooks/useTranslation';

const BottomNavBar = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { name: t('explore'), icon: 'explore', path: '/discovery', alternatePath: '/' },
    { name: t('genie'), icon: 'auto_fix_high', path: '/generator' },
    { name: t('family_hub'), icon: 'group', path: '/family-hub' },
    { name: t('pantry'), icon: 'kitchen', path: '/pantry' },
    { name: t('planner'), icon: 'calendar_today', path: '/planner' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg md:max-w-2xl z-50 flex justify-around items-center px-4 pb-6 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] bg-surface border-t border-outline-variant/20 rounded-t-3xl md:rounded-3xl md:border md:mb-6 md:pb-3 md:pt-3 print:hidden transition-all duration-300">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || location.pathname === item.alternatePath;
        return (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center rounded-full px-1.5 sm:px-4 py-1 active:scale-90 transition-transform duration-150 cursor-pointer ${
              isActive
                ? 'bg-primary-container dark:bg-primary-fixed-dim text-on-primary-container dark:text-on-primary-fixed-variant'
                : 'text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed'
            }`}
          >
            <span
              className="material-icons text-[22px] sm:text-[24px]"
            >
              {item.icon}
            </span>
            <span className="text-[10px] sm:text-label-sm font-label-sm mt-0.5 tracking-tight whitespace-nowrap">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;
