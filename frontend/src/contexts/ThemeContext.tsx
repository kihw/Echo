'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { log } from '@/services/logger';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    systemTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'echo-theme';

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = THEME_STORAGE_KEY
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);
    const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');
    const [mounted, setMounted] = useState(false);

    // Détecter le thème système
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateSystemTheme = () => {
            setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
        };

        updateSystemTheme();
        mediaQuery.addEventListener('change', updateSystemTheme);

        return () => mediaQuery.removeEventListener('change', updateSystemTheme);
    }, []);

    // Charger le thème sauvegardé
    useEffect(() => {
        try {
            const savedTheme = localStorage.getItem(storageKey) as Theme;
            if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
                setThemeState(savedTheme);
            }
        } catch (error) {
            log.warn('Erreur lors du chargement du thème:', error);
        }
        setMounted(true);
    }, [storageKey]);

    // Calculer le thème résolu
    const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

    // Appliquer le thème au DOM
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        const body = document.body;

        // Nettoyer les classes existantes
        root.classList.remove('light', 'dark');
        body.classList.remove('light', 'dark');

        // Appliquer le nouveau thème
        root.classList.add(resolvedTheme);
        body.classList.add(resolvedTheme);

        // Mettre à jour la couleur de la barre de statut
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute(
                'content',
                resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'
            );
        }

        // Transition smooth pour éviter les flashs
        root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }, [resolvedTheme, mounted]);

    const setTheme = (newTheme: Theme) => {
        try {
            localStorage.setItem(storageKey, newTheme);
            setThemeState(newTheme);
        } catch (error) {
            log.warn('Erreur lors de la sauvegarde du thème:', error);
            setThemeState(newTheme);
        }
    };

    const toggleTheme = () => {
        const currentResolved = theme === 'system' ? systemTheme : theme;
        setTheme(currentResolved === 'light' ? 'dark' : 'light');
    };

    // Éviter l'hydratation SSR mismatch
    if (!mounted) {
        return (
            <ThemeContext.Provider value={{
                theme: defaultTheme,
                resolvedTheme: 'light',
                setTheme: () => { },
                toggleTheme: () => { },
                systemTheme: 'light'
            }}>
                {children}
            </ThemeContext.Provider>
        );
    }

    return (
        <ThemeContext.Provider value={{
            theme,
            resolvedTheme,
            setTheme,
            toggleTheme,
            systemTheme
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme doit être utilisé dans un ThemeProvider');
    }
    return context;
}

// Hook pour obtenir les classes de thème
export function useThemeClasses() {
    const { resolvedTheme } = useTheme();

    return {
        // Backgrounds
        bgPrimary: resolvedTheme === 'dark'
            ? 'bg-slate-900'
            : 'bg-white',
        bgSecondary: resolvedTheme === 'dark'
            ? 'bg-slate-800'
            : 'bg-slate-50',
        bgTertiary: resolvedTheme === 'dark'
            ? 'bg-slate-700'
            : 'bg-slate-100',

        // Textes
        textPrimary: resolvedTheme === 'dark'
            ? 'text-slate-100'
            : 'text-slate-900',
        textSecondary: resolvedTheme === 'dark'
            ? 'text-slate-300'
            : 'text-slate-600',
        textMuted: resolvedTheme === 'dark'
            ? 'text-slate-400'
            : 'text-slate-500',

        // Bordures
        border: resolvedTheme === 'dark'
            ? 'border-slate-700'
            : 'border-slate-200',
        borderFocus: resolvedTheme === 'dark'
            ? 'border-primary-400'
            : 'border-primary-500',

        // Hover states
        hoverBg: resolvedTheme === 'dark'
            ? 'hover:bg-slate-700'
            : 'hover:bg-slate-100',

        // Focus states
        focusRing: resolvedTheme === 'dark'
            ? 'focus:ring-primary-400 focus:ring-opacity-50'
            : 'focus:ring-primary-500 focus:ring-opacity-50'
    };
}
