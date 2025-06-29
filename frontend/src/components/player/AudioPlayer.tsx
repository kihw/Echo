'use client';

import React from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { PlayerControls } from './PlayerControls';
import { VolumeControl } from './VolumeControl';
import { ProgressBar } from './ProgressBar';
import { CurrentTrack } from './CurrentTrack';

export const AudioPlayer: React.FC = () => {
    const { currentTrack, isPlaying: _isPlaying } = usePlayer();

    if (!currentTrack) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-40">
            <div className="lg:ml-64">
                {/* Progress bar */}
                <ProgressBar />

                {/* Player content */}
                <div className="flex items-center justify-between px-4 py-3">
                    {/* Current track info */}
                    <div className="flex items-center min-w-0 flex-1">
                        <CurrentTrack />
                    </div>

                    {/* Player controls */}
                    <div className="flex items-center justify-center flex-1 max-w-md">
                        <PlayerControls />
                    </div>

                    {/* Volume control */}
                    <div className="flex items-center justify-end flex-1">
                        <VolumeControl />
                    </div>
                </div>
            </div>
        </div>
    );
};
