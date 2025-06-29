import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, defaultLocale, translations } from '../utils/i18n';
import type { ReactNode } from 'react';

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
    children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
    const [locale, setLocale] = useState<Locale>(defaultLocale);

    useEffect(() => {
        // Récupérer la langue depuis localStorage ou le navigateur
        const savedLocale = localStorage.getItem('echo-locale') as Locale;
        if (savedLocale && translations[savedLocale]) {
            setLocale(savedLocale);
        } else {
            // Détecter la langue du navigateur
            const browserLang = navigator.language.split('-')[0] as Locale;
            if (translations[browserLang]) {
                setLocale(browserLang);
            }
        }
    }, []);

    const handleSetLocale = (newLocale: Locale) => {
        setLocale(newLocale);
        localStorage.setItem('echo-locale', newLocale);
        document.documentElement.lang = newLocale;
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[locale];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback vers l'anglais si la clé n'existe pas
                value = translations[defaultLocale];
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        return key; // Retourner la clé si aucune traduction n'est trouvée
                    }
                }
                break;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

// Hook pour formater les nombres selon la locale
export function useNumberFormat() {
    const { locale } = useI18n();

    return {
        formatNumber: (num: number) => new Intl.NumberFormat(locale).format(num),
        formatTime: (seconds: number) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);

            if (hours > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        },
        formatDuration: (minutes: number) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;

            if (hours > 0) {
                return `${hours}h ${mins}m`;
            }
            return `${mins}m`;
        }
    };
}

// Hook pour formater les dates selon la locale
export function useDateFormat() {
    const { locale } = useI18n();

    return {
        formatDate: (date: Date | string) => {
            const d = typeof date === 'string' ? new Date(date) : date;
            return new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(d);
        },
        formatDateTime: (date: Date | string) => {
            const d = typeof date === 'string' ? new Date(date) : date;
            return new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(d);
        },
        formatRelativeTime: (date: Date | string) => {
            const d = typeof date === 'string' ? new Date(date) : date;
            const now = new Date();
            const diffMs = now.getTime() - d.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
            return `${Math.floor(diffDays / 365)} years ago`;
        }
    };
}
