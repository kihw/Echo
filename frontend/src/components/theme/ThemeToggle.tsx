'use client';

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { SunIcon as SunIconSolid, MoonIcon as MoonIconSolid } from '@heroicons/react/24/solid';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ThemeToggle({
  variant = 'button',
  size = 'md',
  className = ''
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8 p-1.5',
    md: 'h-10 w-10 p-2',
    lg: 'h-12 w-12 p-2.5'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          ${className}
          relative rounded-lg 
          bg-slate-100 dark:bg-slate-800 
          text-slate-700 dark:text-slate-300
          hover:bg-slate-200 dark:hover:bg-slate-700
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          transition-all duration-200 ease-in-out
          group
        `}
        title={`Basculer vers le thème ${resolvedTheme === 'light' ? 'sombre' : 'clair'}`}
        aria-label={`Basculer vers le thème ${resolvedTheme === 'light' ? 'sombre' : 'clair'}`}
      >
        <div className="relative overflow-hidden">
          <SunIconSolid
            className={`
              ${iconSizeClasses[size]}
              absolute transition-all duration-300 ease-in-out
              ${resolvedTheme === 'light'
                ? 'rotate-0 scale-100 opacity-100'
                : 'rotate-90 scale-0 opacity-0'
              }
            `}
          />
          <MoonIconSolid
            className={`
              ${iconSizeClasses[size]}
              absolute transition-all duration-300 ease-in-out
              ${resolvedTheme === 'dark'
                ? 'rotate-0 scale-100 opacity-100'
                : '-rotate-90 scale-0 opacity-0'
              }
            `}
          />
        </div>
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="
            appearance-none bg-transparent border border-slate-300 dark:border-slate-600
            rounded-lg px-3 py-2 pr-8
            text-slate-700 dark:text-slate-300
            bg-white dark:bg-slate-800
            hover:border-slate-400 dark:hover:border-slate-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            text-sm font-medium
          "
        >
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
          <option value="system">Système</option>
        </select>
        <div className="
          absolute right-2 top-1/2 -translate-y-1/2 
          pointer-events-none text-slate-500 dark:text-slate-400
        ">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }

  // Variant button (3 boutons séparés)
  const themes = [
    {
      key: 'light',
      label: 'Clair',
      icon: SunIcon,
      activeIcon: SunIconSolid
    },
    {
      key: 'dark',
      label: 'Sombre',
      icon: MoonIcon,
      activeIcon: MoonIconSolid
    },
    {
      key: 'system',
      label: 'Système',
      icon: ComputerDesktopIcon,
      activeIcon: ComputerDesktopIcon
    }
  ] as const;

  return (
    <div className={`
      ${className}
      inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1
      border border-slate-200 dark:border-slate-700
    `}>
      {themes.map(({ key, label, icon: Icon, activeIcon: ActiveIcon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={`
            ${sizeClasses[size]}
            relative rounded-md transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800
            ${theme === key
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }
          `}
          title={`Thème ${label}`}
          aria-label={`Thème ${label}`}
          aria-pressed={theme === key}
        >
          {theme === key ? (
            <ActiveIcon className={iconSizeClasses[size]} />
          ) : (
            <Icon className={iconSizeClasses[size]} />
          )}
        </button>
      ))}
    </div>
  );
}

// Hook pour obtenir l'icône du thème actuel
export function useThemeIcon(size: 'sm' | 'md' | 'lg' = 'md') {
  const { resolvedTheme } = useTheme();

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (resolvedTheme === 'dark') {
    return <MoonIconSolid className={iconSizeClasses[size]} />;
  }

  return <SunIconSolid className={iconSizeClasses[size]} />;
}
