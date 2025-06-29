'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, RefreshCw, Home, Music } from 'lucide-react';

export default function OfflinePage() {
    const handleRetry = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-md w-full"
            >
                {/* Offline Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="flex justify-center mb-8"
                >
                    <div className="relative">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                            <Wifi className="w-12 h-12 text-gray-400" />
                        </div>
                        {/* Offline indicator */}
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">!</span>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Vous êtes hors ligne
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Impossible de se connecter à Echo Music Player. Vérifiez votre connexion internet et réessayez.
                    </p>

                    {/* Actions */}
                    <div className="space-y-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRetry}
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Réessayer
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoHome}
                            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            Retour à l'accueil
                        </motion.button>
                    </div>

                    {/* Offline Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-12 p-6 bg-white rounded-lg shadow-sm"
                    >
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Music className="w-5 h-5 text-blue-600" />
                            Fonctionnalités hors ligne
                        </h2>
                        <ul className="text-left text-gray-600 space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Lecture de musique téléchargée
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Consultation des playlists locales
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                Synchronisation automatique au retour en ligne
                            </li>
                        </ul>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
}
