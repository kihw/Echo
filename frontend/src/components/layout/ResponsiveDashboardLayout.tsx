'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AudioPlayer } from '@/components/player/AudioPlayer';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { MobilePlayerControls } from '@/components/player/MobilePlayerControls';
import { FullScreenPlayer } from '@/components/player/FullScreenPlayer';
import { usePlayer } from '@/contexts/PlayerContext';

interface ResponsiveDashboardLayoutProps {
    children: React.ReactNode;
}

export const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { currentTrack } = usePlayer();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isMobilePlayerExpanded, setIsMobilePlayerExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close mobile nav when screen size changes
    useEffect(() => {
        if (!isMobile) {
            setIsMobileNavOpen(false);
            setIsMobilePlayerExpanded(false);
        }
    }, [isMobile]);

    if (!isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Desktop Sidebar */}
            {!isMobile && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Mobile Navigation */}
            {isMobile && (
                <MobileNavigation
                    isOpen={isMobileNavOpen}
                    onToggle={() => setIsMobileNavOpen(!isMobileNavOpen)}
                    onClose={() => setIsMobileNavOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col ${!isMobile ? 'ml-64' : ''}`}>
                {/* Top Bar */}
                {!isMobile && (
                    <TopBar
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    />
                )}

                {/* Mobile Top Space */}
                {isMobile && <div className="h-16" />}

                {/* Page Content */}
                <main className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 py-4' : 'p-6'
                    } ${currentTrack && isMobile ? 'pb-32' : currentTrack ? 'pb-24' : 'pb-4'}`}>
                    {children}
                </main>

                {/* Desktop Audio Player */}
                {!isMobile && currentTrack && (
                    <div className="border-t border-gray-200 bg-white">
                        <AudioPlayer />
                    </div>
                )}
            </div>

            {/* Mobile Player */}
            {isMobile && currentTrack && (
                <>
                    {/* Compact Player Bar */}
                    <AnimatePresence>
                        {!isMobilePlayerExpanded && (
                            <motion.div
                                initial={{ y: 100 }}
                                animate={{ y: 0 }}
                                exit={{ y: 100 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30"
                            >
                                <div className="px-4 py-2">
                                    {/* Track Info */}
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-10 h-10 bg-gray-300 rounded-lg flex-shrink-0"></div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {currentTrack.title || 'Titre inconnu'}
                                            </h4>
                                            <p className="text-xs text-gray-500 truncate">
                                                {currentTrack.artist || 'Artiste inconnu'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Compact Controls */}
                                    <MobilePlayerControls
                                        isCompact={true}
                                        onToggleExpanded={() => setIsMobilePlayerExpanded(true)}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Expanded Player */}
                    <FullScreenPlayer
                        isOpen={isMobilePlayerExpanded}
                        onClose={() => setIsMobilePlayerExpanded(false)}
                    />
                </>
            )}
        </div>
    );
};
