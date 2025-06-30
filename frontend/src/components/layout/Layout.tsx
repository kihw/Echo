'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { useTheme } from '../../contexts/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`
      min-h-screen transition-colors duration-300 ease-in-out
      ${resolvedTheme === 'dark'
        ? 'bg-slate-900 text-slate-100'
        : 'bg-white text-slate-900'
      }
    `}>
      {children}
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider defaultTheme="system">
      <LayoutContent>
        {children}
      </LayoutContent>
    </ThemeProvider>
  );
}

// Hook pour obtenir les classes de layout courantes
export function useLayoutClasses() {
  const { resolvedTheme } = useTheme();

  return {
    // Container principal
    container: `min-h-screen transition-colors duration-300 ease-in-out ${resolvedTheme === 'dark'
        ? 'bg-slate-900 text-slate-100'
        : 'bg-white text-slate-900'
      }`,

    // Sidebar
    sidebar: `h-full transition-colors duration-300 ease-in-out ${resolvedTheme === 'dark'
        ? 'bg-slate-800 border-slate-700'
        : 'bg-slate-50 border-slate-200'
      }`,

    // Header/Topbar
    header: `transition-colors duration-300 ease-in-out border-b ${resolvedTheme === 'dark'
        ? 'bg-slate-800 border-slate-700'
        : 'bg-white border-slate-200'
      }`,

    // Main content
    main: `flex-1 transition-colors duration-300 ease-in-out ${resolvedTheme === 'dark'
        ? 'bg-slate-900'
        : 'bg-white'
      }`,

    // Cards
    card: `transition-colors duration-300 ease-in-out rounded-lg border ${resolvedTheme === 'dark'
        ? 'bg-slate-800 border-slate-700'
        : 'bg-white border-slate-200'
      }`,

    // Player bar
    player: `transition-colors duration-300 ease-in-out border-t ${resolvedTheme === 'dark'
        ? 'bg-slate-800 border-slate-700'
        : 'bg-white border-slate-200'
      }`,

    // Buttons
    buttonPrimary: `transition-all duration-200 ease-in-out rounded-lg px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${resolvedTheme === 'dark'
        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-slate-900'
        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-white'
      }`,

    buttonSecondary: `transition-all duration-200 ease-in-out rounded-lg px-4 py-2 font-medium border focus:outline-none focus:ring-2 focus:ring-offset-2 ${resolvedTheme === 'dark'
        ? 'bg-slate-700 text-slate-100 border-slate-600 hover:bg-slate-600 focus:ring-slate-500 focus:ring-offset-slate-900'
        : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50 focus:ring-slate-500 focus:ring-offset-white'
      }`,

    // Input fields
    input: `transition-all duration-200 ease-in-out w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 ${resolvedTheme === 'dark'
        ? 'bg-slate-800 text-slate-100 border-slate-600 placeholder:text-slate-400 focus:ring-blue-500 focus:border-blue-500 focus:ring-offset-slate-900'
        : 'bg-white text-slate-900 border-slate-300 placeholder:text-slate-500 focus:ring-blue-500 focus:border-blue-500 focus:ring-offset-white'
      }`,

    // Text classes pour éviter les problèmes de contraste
    textPrimary: resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900',
    textSecondary: resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600',
    textMuted: resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500',

    // Hover states
    hoverBg: resolvedTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
  };
}
