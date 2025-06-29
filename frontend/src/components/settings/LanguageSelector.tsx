import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { locales, Locale } from '../../utils/i18n';
import { AccessibleButton } from '../../utils/accessibility';

interface LanguageSelectorProps {
    className?: string;
}

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
    const { locale, setLocale, t } = useI18n();
    const [isOpen, setIsOpen] = React.useState(false);

    const languages = {
        en: { name: 'English', flag: '🇺🇸' },
        fr: { name: 'Français', flag: '🇫🇷' }
    };

    const handleLanguageChange = (newLocale: Locale) => {
        setLocale(newLocale);
        setIsOpen(false);
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-language-selector]')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} data-language-selector>
            <AccessibleButton
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t('common.settings')}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
                <span>{languages[locale].flag}</span>
                <span>{languages[locale].name}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </AccessibleButton>

            {isOpen && (
                <div
                    role="listbox"
                    aria-label="Select language"
                    className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50"
                >
                    {locales.map((lang) => (
                        <button
                            key={lang}
                            role="option"
                            aria-selected={locale === lang}
                            onClick={() => handleLanguageChange(lang)}
                            className={`
                w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700
                ${locale === lang ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
                first:rounded-t-md last:rounded-b-md
              `}
                        >
                            <span>{languages[lang].flag}</span>
                            <span>{languages[lang].name}</span>
                            {locale === lang && (
                                <svg
                                    className="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Composant pour le mode sombre/clair
export function ThemeToggle({ className = '' }: { className?: string }) {
    const { t } = useI18n();
    const [isDark, setIsDark] = React.useState(false);

    React.useEffect(() => {
        // Vérifier le thème sauvegardé ou la préférence système
        const savedTheme = localStorage.getItem('echo-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
        setIsDark(shouldBeDark);

        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        localStorage.setItem('echo-theme', newIsDark ? 'dark' : 'light');

        if (newIsDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <AccessibleButton
            onClick={toggleTheme}
            aria-label={isDark ? t('common.lightMode') : t('common.darkMode')}
            className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
        >
            {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </AccessibleButton>
    );
}
