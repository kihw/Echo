'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Search, Music, BarChart3, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { log } from '@/services/logger';
import notifications from '@/services/notifications';

interface MobileNavigationProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
    isOpen,
    onToggle,
    onClose
}) => {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const navItems: NavItem[] = [
        {
            name: 'Dashboard',
            href: '/',
            icon: Home
        },
        {
            name: 'Rechercher',
            href: '/search',
            icon: Search
        },
        {
            name: 'Playlists',
            href: '/playlists',
            icon: Music
        },
        {
            name: 'Statistiques',
            href: '/stats',
            icon: BarChart3
        },
        {
            name: 'Profil',
            href: '/profile',
            icon: User
        },
        {
            name: 'Paramètres',
            href: '/settings',
            icon: Settings
        }
    ];

    // Close menu when route changes
    useEffect(() => {
        onClose();
    }, [pathname, onClose]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            onClose();
        } catch (error) {
            log.error('Logout error:', error);
            notifications.error('Erreur lors de la déconnexion');
        }
    };

    return (
        <>
            {/* Mobile Burger Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onToggle}
                className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-5 h-5 text-gray-700" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="menu"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Menu className="w-5 h-5 text-gray-700" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                            onClick={onClose}
                        />

                        {/* Mobile Menu */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="md:hidden fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto"
                        >
                            <div className="p-6">
                                {/* User Profile Section */}
                                <div className="mb-8 pt-12">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {user?.displayName || 'Utilisateur'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {user?.email || 'Non connecté'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Items */}
                                <nav className="space-y-2">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/' && pathname.startsWith(item.href));

                                        return (
                                            <Link key={item.name} href={item.href}>
                                                <motion.div
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                                            ? 'bg-primary-100 text-primary-700'
                                                            : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-500'
                                                        }`} />
                                                    <span className="font-medium">{item.name}</span>
                                                    {item.badge && (
                                                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </motion.div>
                                            </Link>
                                        );
                                    })}
                                </nav>

                                {/* Quick Actions */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-500 mb-3">Actions rapides</h4>
                                    <div className="space-y-2">
                                        <Link href="/sync">
                                            <motion.div
                                                whileTap={{ scale: 0.98 }}
                                                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                                                    <span className="text-xs">🔄</span>
                                                </div>
                                                <span className="text-sm">Synchroniser</span>
                                            </motion.div>
                                        </Link>

                                        <Link href="/playlists/create">
                                            <motion.div
                                                whileTap={{ scale: 0.98 }}
                                                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                                                    <span className="text-xs">➕</span>
                                                </div>
                                                <span className="text-sm">Créer Playlist</span>
                                            </motion.div>
                                        </Link>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <span className="text-sm font-medium">Déconnexion</span>
                                    </motion.button>

                                    <div className="mt-4 text-center">
                                        <p className="text-xs text-gray-400">Echo Music Player</p>
                                        <p className="text-xs text-gray-400">Version 1.0.0</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
