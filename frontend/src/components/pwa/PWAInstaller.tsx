'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstaller: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        const checkInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true) {
                setIsInstalled(true);
            }
        };

        checkInstalled();

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show install banner after a delay
            setTimeout(() => {
                if (!isInstalled && !localStorage.getItem('pwa-install-dismissed')) {
                    setShowInstallBanner(true);
                }
            }, 5000);
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowInstallBanner(false);
            setDeferredPrompt(null);
            localStorage.setItem('pwa-installed', 'true');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isInstalled]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
                localStorage.setItem('pwa-install-dismissed', 'true');
            }

            setDeferredPrompt(null);
            setShowInstallBanner(false);
        } catch (error) {
            console.error('Install prompt failed:', error);
        }
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (isInstalled || !showInstallBanner) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
            >
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                Installer Echo Music Player
                            </h3>
                            <p className="text-xs text-gray-600 mb-3">
                                Accédez rapidement à votre musique depuis votre écran d'accueil
                            </p>

                            <div className="flex space-x-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleInstallClick}
                                    className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                                >
                                    <Download className="w-3 h-3" />
                                    Installer
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleDismiss}
                                    className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
