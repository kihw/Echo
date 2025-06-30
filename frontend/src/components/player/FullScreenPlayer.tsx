'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '@/contexts/PlayerContext';
import { SwipeGesture } from '@/components/ui/SwipeGesture';
import {
    ChevronDown,
    Heart,
    Share,
    MoreVertical,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Repeat1,
    Volume2,
    List
} from 'lucide-react';

interface FullScreenPlayerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({ isOpen, onClose }) => {
    const {
        currentTrack,
        isPlaying,
        isLoading,
        isRepeat,
        isShuffle,
        volume,
        duration,
        play: _play,
        pause,
        resume,
        next,
        previous,
        setRepeat,
        setShuffle,
        setVolume,
        seek
    } = usePlayer();

    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showQueue, setShowQueue] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    // Simulate current time for demo
    useEffect(() => {
        if (isPlaying) {
            const interval = setInterval(() => {
                setCurrentTime(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isPlaying]);

    // Format time for display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress percentage
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handlePlayPause = () => {
        if (isPlaying) {
            pause();
        } else {
            resume();
        }
    };

    const toggleRepeat = () => {
        const modes: ('off' | 'one' | 'all')[] = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(isRepeat);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        setRepeat(nextMode);
    };

    const toggleShuffle = () => {
        setShuffle(!isShuffle);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;
        seek(newTime);
    };

    const RepeatIcon = isRepeat === 'one' ? Repeat1 : Repeat;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 z-50 overflow-hidden"
            >
                <SwipeGesture
                    onSwipeDown={onClose}
                    onSwipeLeft={next}
                    onSwipeRight={previous}
                    className="h-full flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 text-white">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                        >
                            <ChevronDown className="w-6 h-6" />
                        </motion.button>

                        <div className="text-center">
                            <p className="text-sm opacity-80">En lecture depuis</p>
                            <p className="font-medium">Ma bibliothèque</p>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </motion.button>
                    </div>

                    {/* Album Art */}
                    <div className="flex-1 flex items-center justify-center px-8 py-8">
                        <motion.div
                            className="relative w-80 h-80 max-w-full max-h-full"
                            animate={{
                                rotate: isPlaying ? 360 : 0,
                                scale: isPlaying ? 1 : 0.95
                            }}
                            transition={{
                                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                                scale: { duration: 0.3 }
                            }}
                        >
                            <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 rounded-3xl backdrop-blur-sm border border-white/20 shadow-2xl flex items-center justify-center">
                                {/* Placeholder for album art */}
                                <div className="text-white/50 text-6xl">🎵</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Track Info */}
                    <div className="px-6 py-4 text-white text-center">
                        <h1 className="text-2xl font-bold mb-2 truncate">
                            {currentTrack?.title || 'Aucun titre'}
                        </h1>
                        <p className="text-lg opacity-80 truncate">
                            {currentTrack?.artist ? (typeof currentTrack.artist === 'string' ? currentTrack.artist : (currentTrack.artist as any)?.name) : 'Artiste inconnu'}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-6 py-4">
                        <div className="flex items-center space-x-3 text-white text-sm">
                            <span className="w-12 text-right">{formatTime(currentTime)}</span>
                            <div className="flex-1">
                                <div
                                    className="h-2 bg-white/20 rounded-full cursor-pointer"
                                    onClick={handleProgressClick}
                                >
                                    <div
                                        className="h-full bg-white rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                            <span className="w-12">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center space-x-8 px-6 py-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsLiked(!isLiked)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${isLiked ? 'text-red-400' : 'text-white/60'
                                }`}
                        >
                            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
                        >
                            <Share className="w-5 h-5" />
                        </motion.button>
                    </div>

                    {/* Controls */}
                    <div className="px-6 py-8">
                        <div className="flex items-center justify-center space-x-6">
                            {/* Shuffle */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleShuffle}
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${isShuffle ? 'text-blue-400 bg-blue-400/20' : 'text-white/60'
                                    }`}
                            >
                                <Shuffle className="w-5 h-5" />
                            </motion.button>

                            {/* Previous */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={previous}
                                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white"
                            >
                                <SkipBack className="w-6 h-6" />
                            </motion.button>

                            {/* Play/Pause */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handlePlayPause}
                                disabled={isLoading}
                                className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black shadow-lg disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : isPlaying ? (
                                    <Pause className="w-8 h-8" />
                                ) : (
                                    <Play className="w-8 h-8 ml-1" />
                                )}
                            </motion.button>

                            {/* Next */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={next}
                                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white"
                            >
                                <SkipForward className="w-6 h-6" />
                            </motion.button>

                            {/* Repeat */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleRepeat}
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${isRepeat !== 'off' ? 'text-blue-400 bg-blue-400/20' : 'text-white/60'
                                    }`}
                            >
                                <RepeatIcon className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="flex items-center justify-between px-6 py-4 text-white/60">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                            className="flex items-center space-x-2"
                        >
                            <Volume2 className="w-5 h-5" />
                            {showVolumeSlider && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 'auto', opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="flex items-center space-x-2"
                                >
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume * 100}
                                        onChange={(e) => setVolume(Number(e.target.value) / 100)}
                                        className="w-20 h-1 bg-white/20 rounded-lg"
                                    />
                                    <span className="text-xs w-8">{Math.round(volume * 100)}%</span>
                                </motion.div>
                            )}
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowQueue(!showQueue)}
                            className="flex items-center space-x-2"
                        >
                            <List className="w-5 h-5" />
                            <span className="text-sm">File d'attente</span>
                        </motion.button>
                    </div>

                    {/* Safe area for bottom */}
                    <div className="h-safe-area-inset-bottom" />
                </SwipeGesture>
            </motion.div>
        </AnimatePresence>
    );
};
