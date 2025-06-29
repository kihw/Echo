'use client';

import React, { useState, useRef } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';

export const ProgressBar: React.FC = () => {
  const { position, duration, seek } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newPosition = percentage * duration;

    if (isDragging) {
      setDragPosition(newPosition);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && duration) {
      seek(dragPosition);
    }
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newPosition = Math.max(0, Math.min(duration, percentage * duration));

    seek(newPosition);
  };

  // Use drag position if dragging, otherwise use actual position
  const displayPosition = isDragging ? dragPosition : position;
  const progressPercentage = duration ? (displayPosition / duration) * 100 : 0;

  return (
    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-3">
        {/* Current time */}
        <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-right">
          {formatTime(displayPosition)}
        </span>

        {/* Progress bar */}
        <div
          ref={progressRef}
          className="flex-1 relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer group"
          onMouseDown={handleMouseDown}
          onMouseMove={isDragging ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={!isDragging ? handleClick : undefined}
        >
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
          >
            {/* Progress thumb */}
            <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
              <div className={`w-3 h-3 bg-blue-600 rounded-full transition-opacity ${isDragging || progressPercentage > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`} />
            </div>
          </div>

          {/* Hover effect */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 bg-blue-600 transition-opacity" />
        </div>

        {/* Total time */}
        <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px]">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
