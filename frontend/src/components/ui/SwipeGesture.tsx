'use client';

import React, { useRef, useState, useEffect } from 'react';

interface SwipeGestureProps {
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
    className?: string;
}

export const SwipeGesture: React.FC<SwipeGestureProps> = ({
    children,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    className
}) => {
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        setIsDragging(false);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;

        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

        if (deltaX > 10 || deltaY > 10) {
            setIsDragging(true);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current || !isDragging) {
            touchStartRef.current = null;
            setIsDragging(false);
            return;
        }

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;

        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (absDeltaX > absDeltaY && absDeltaX > threshold) {
            // Horizontal swipe
            if (deltaX > 0) {
                onSwipeRight?.();
            } else {
                onSwipeLeft?.();
            }
        } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
            // Vertical swipe
            if (deltaY > 0) {
                onSwipeDown?.();
            } else {
                onSwipeUp?.();
            }
        }

        touchStartRef.current = null;
        setIsDragging(false);
    };

    return (
        <div
            className={className}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {children}
        </div>
    );
};
