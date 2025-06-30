/**
 * Utilitaires d'accessibilité pour Echo Music Player
 * Conforme aux guidelines WCAG 2.1 AA
 */

import React from 'react';

// Hook pour gérer le focus et la navigation au clavier
export function useFocusManagement() {
    const trapFocus = (element: HTMLElement) => {
        const focusableElements = element.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }

            if (e.key === 'Escape') {
                // Fermer le modal/menu
                const closeButton = element.querySelector('[data-close]') as HTMLElement;
                if (closeButton) {
                    closeButton.click();
                }
            }
        };

        element.addEventListener('keydown', handleTabKey);
        firstElement?.focus();

        return () => {
            element.removeEventListener('keydown', handleTabKey);
        };
    };

    return { trapFocus };
}

// Hook pour gérer les annonces aux lecteurs d'écran
export function useScreenReader() {
    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.setAttribute('class', 'sr-only');
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    };

    return { announce };
}

// Hook pour la gestion des raccourcis clavier
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = `${event.ctrlKey ? 'Ctrl+' : ''}${event.altKey ? 'Alt+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.key}`;

            if (shortcuts[key]) {
                event.preventDefault();
                shortcuts[key]();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

// Composant Skip Link pour la navigation
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white focus:no-underline"
            onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    (target as HTMLElement).focus();
                    target.scrollIntoView();
                }
            }}
        >
            {children}
        </a>
    );
}

// Composant pour les régions landmarks
export function Landmark({
    as: Component = 'div',
    role,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    children,
    ...props
}: {
    as?: keyof React.JSX.IntrinsicElements;
    role?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    children: React.ReactNode;
    [key: string]: any;
}) {
    return React.createElement(
        Component,
        {
            role,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledBy,
            ...props
        },
        children
    );
}

// Hook pour la gestion des états de chargement accessibles
export function useAccessibleLoading() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [loadingMessage, setLoadingMessage] = React.useState('');

    const startLoading = (message: string = 'Loading...') => {
        setIsLoading(true);
        setLoadingMessage(message);
    };

    const stopLoading = () => {
        setIsLoading(false);
        setLoadingMessage('');
    };

    return {
        isLoading,
        loadingMessage,
        startLoading,
        stopLoading,
        LoadingAnnouncer: () => isLoading ? (
            <div
                aria-live="polite"
                aria-busy={isLoading}
                className="sr-only"
            >
                {loadingMessage}
            </div>
        ) : null
    };
}

// Composant pour les erreurs accessibles
export function AccessibleError({
    error,
    onRetry,
    id
}: {
    error: string;
    onRetry?: () => void;
    id?: string;
}) {
    return (
        <div
            role="alert"
            aria-live="assertive"
            id={id}
            className="p-4 bg-red-50 border border-red-200 rounded-md"
        >
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                        {error}
                    </p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 underline"
                        >
                            Try again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Utilitaires pour les couleurs et contraste
export const colorUtils = {
    // Vérifier le contraste des couleurs (WCAG AA = 4.5:1, AAA = 7:1)
    getContrastRatio: (_color1: string, _color2: string): number => {
        // Implémentation simplifiée - utiliser une vraie lib comme 'color' en prod
        return 4.5; // Placeholder
    },

    // Obtenir une couleur accessible basée sur l'arrière-plan
    getAccessibleColor: (_backgroundColor: string): string => {
        // Logique pour déterminer si utiliser du texte clair ou foncé
        return '#000000'; // Placeholder
    }
};

// Composant pour les boutons accessibles
export function AccessibleButton({
    children,
    onClick,
    disabled = false,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    className = '',
    ...props
}: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    'aria-label'?: string;
    'aria-describedby'?: string;
    className?: string;
    [key: string]: any;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            className={`
        min-h-[44px] min-w-[44px] 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
            {...props}
        >
            {children}
        </button>
    );
}