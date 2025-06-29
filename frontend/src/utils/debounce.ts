/**
 * Debounce utility functions for performance optimization
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };

        const callNow = immediate && !timeout;

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(later, wait);

        if (callNow) {
            func(...args);
        }
    };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    let lastFunc: NodeJS.Timeout;
    let lastRan: number;

    return function (this: any, ...args: Parameters<T>) {
        if (!inThrottle) {
            func.apply(this, args);
            lastRan = Date.now();
            inThrottle = true;
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(() => {
                if (Date.now() - lastRan >= wait) {
                    func.apply(this, args);
                    lastRan = Date.now();
                }
            }, Math.max(wait - (Date.now() - lastRan), 0));
        }
    };
}

/**
 * Hook for using debounced values in React components
 */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook for debounced callbacks
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
    const [debouncedCallback] = useState(() => debounce(callback, delay));

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (debouncedCallback) {
                clearTimeout((debouncedCallback as any).timeout);
            }
        };
    }, deps);

    return debouncedCallback;
}

/**
 * Hook for throttled callbacks
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
    const [throttledCallback] = useState(() => throttle(callback, delay));

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (throttledCallback) {
                clearTimeout((throttledCallback as any).lastFunc);
            }
        };
    }, deps);

    return throttledCallback;
}

/**
 * Advanced debounce with cancellation support
 */
export class AdvancedDebouncer<T extends (...args: any[]) => any> {
    private timeout: NodeJS.Timeout | null = null;
    private promise: Promise<ReturnType<T>> | null = null;
    private resolve: ((value: ReturnType<T>) => void) | null = null;
    private reject: ((reason: any) => void) | null = null;

    constructor(
        private func: T,
        private wait: number,
        private immediate: boolean = false
    ) { }

    execute(...args: Parameters<T>): Promise<ReturnType<T>> {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;

            const later = async () => {
                this.timeout = null;
                if (!this.immediate) {
                    try {
                        const result = await this.func(...args);
                        this.resolve?.(result);
                    } catch (error) {
                        this.reject?.(error);
                    }
                }
            };

            const callNow = this.immediate && !this.timeout;

            if (this.timeout) {
                clearTimeout(this.timeout);
            }

            this.timeout = setTimeout(later, this.wait);

            if (callNow) {
                this.func(...args).then(this.resolve).catch(this.reject);
            }
        });
    }

    cancel(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (this.reject) {
            this.reject(new Error('Debounced function cancelled'));
            this.reject = null;
            this.resolve = null;
        }
    }

    flush(...args: Parameters<T>): Promise<ReturnType<T>> {
        this.cancel();
        return this.func(...args);
    }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
    private queue: Array<() => void> = [];
    private isProcessing = false;

    constructor(
        private maxCalls: number,
        private timeWindow: number // in milliseconds
    ) { }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });

            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const calls: Array<() => void> = [];

        // Take up to maxCalls from the queue
        for (let i = 0; i < this.maxCalls && this.queue.length > 0; i++) {
            const call = this.queue.shift();
            if (call) {
                calls.push(call);
            }
        }

        // Execute all calls in parallel
        await Promise.all(calls.map(call => call()));

        // Wait for the time window before processing more
        setTimeout(() => {
            this.isProcessing = false;
            this.processQueue();
        }, this.timeWindow);
    }
}
