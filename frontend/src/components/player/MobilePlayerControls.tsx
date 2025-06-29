'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '@/contexts/PlayerContext';
import {
    Play, Pause, SkipBack, SkipForward,
    Shuffle, Repeat, Repeat1, MoreHorizontal,
    ChevronUp, ChevronDown
} from 'lucide-react';

interface MobilePlayerControlsProps {
    isCompact?: boolean;
    onToggleExpanded?: () => void;
}

export const MobilePlayerControls: React.FC<MobilePlayerControlsProps> = ({
    isCompact = false,
    onToggleExpanded
}) => {
    const {
        isPlaying,
        isLoading,
        isRepeat,
        isShuffle,
        play: _play,
        pause,
        resume,
        next,
        previous,
        setRepeat,
        setShuffle
    } = usePlayer();

    const [showMoreControls, setShowMoreControls] = useState(false);

    const toggleRepeat = () => {
        const modes: ('off' | 'one' | 'all')[] = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(isRepeat);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        setRepeat(nextMode);
    };

    const toggleShuffle = () => {
        setShuffle(!isShuffle);
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            pause();
        } else {
            resume();
        }
    };

    const RepeatIcon = isRepeat === 'one' ? Repeat1 : Repeat;

    if (isCompact) {
        return (
            <div className="flex items-center justify-between w-full px-4 py-2">
                {/* Compact Play/Pause */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlayPause}
                    disabled={isLoading}
                    className="w-12 h-12 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="w-5 h-5" />
                    ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                    )}
                </motion.button>

                {/* Track Navigation */}
                <div className="flex items-center space-x-2">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={previous}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <SkipBack className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={next}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <SkipForward className="w-5 h-5" />
                    </motion.button>
                </div>

                {/* Expand Toggle */}
                {onToggleExpanded && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleExpanded}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </motion.button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Controls */}
            <div className="flex items-center justify-center space-x-6">
                {/* Shuffle */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleShuffle}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isShuffle
                            ? 'text-primary-600 bg-primary-100'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    <Shuffle className="w-5 h-5" />
                </motion.button>

                {/* Previous */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={previous}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                    <SkipBack className="w-6 h-6" />
                </motion.button>

                {/* Play/Pause */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlayPause}
                    disabled={isLoading}
                    className="w-16 h-16 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="w-6 h-6" />
                    ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                    )}
                </motion.button>

                {/* Next */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={next}
                    className="w-14 h-14 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                    <SkipForward className="w-6 h-6" />
                </motion.button>

                {/* Repeat */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleRepeat}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isRepeat !== 'off'
                            ? 'text-primary-600 bg-primary-100'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    <RepeatIcon className="w-5 h-5" />
                </motion.button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-center">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMoreControls(!showMoreControls)}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <MoreHorizontal className="w-5 h-5" />
                    <span className="text-sm">Plus</span>
                    <motion.div
                        animate={{ rotate: showMoreControls ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </motion.button>
            </div>

            {/* Expanded Controls */}
            <AnimatePresence>
                {showMoreControls && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-3 gap-4">
                                <button className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-sm">🎵</span>
                                    </div>
                                    <span className="text-xs text-gray-600">Qualité</span>
                                </button>

                                <button className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-sm">⏰</span>
                                    </div>
                                    <span className="text-xs text-gray-600">Sleep Timer</span>
                                </button>

                                <button className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-sm">📱</span>
                                    </div>
                                    <span className="text-xs text-gray-600">Appareils</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapse Toggle */}
            {onToggleExpanded && (
                <div className="flex justify-center pt-2">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleExpanded}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.button>
                </div>
            )}
        </div>
    );
};
