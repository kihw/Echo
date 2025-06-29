import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../AuthContext';
import { AuthProvider } from '../AuthContext';
import React from 'react';

// Mock the API calls
jest.mock('../../services/api', () => ({
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
}));

const mockApiCalls = require('../../services/api');

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </QueryClientProvider>
    );
};

describe('useAuth Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('initializes with correct default state', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoading).toBe(false);
    });

    it('handles successful login', async () => {
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
        };

        mockApiCalls.login.mockResolvedValue({
            user: mockUser,
            token: 'mock-token',
        });

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.login('test@example.com', 'password');
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(localStorage.getItem('auth-token')).toBe('mock-token');
    });

    it('handles login failure', async () => {
        mockApiCalls.login.mockRejectedValue(new Error('Invalid credentials'));

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            try {
                await result.current.login('test@example.com', 'wrong-password');
            } catch (error: any) {
                expect(error.message).toBe('Invalid credentials');
            }
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles successful registration', async () => {
        const mockUser = {
            id: '1',
            email: 'newuser@example.com',
            name: 'New User',
        };

        mockApiCalls.register.mockResolvedValue({
            user: mockUser,
            token: 'mock-token',
        });

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await result.current.register('newuser@example.com', 'password', 'New User');
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles logout correctly', async () => {
        // Setup authenticated user first
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
        };

        mockApiCalls.login.mockResolvedValue({
            user: mockUser,
            token: 'mock-token',
        });

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        // Login first
        await act(async () => {
            await result.current.login('test@example.com', 'password');
        });

        // Then logout
        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(localStorage.getItem('auth-token')).toBeNull();
    });

    it('handles token refresh', async () => {
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
        };

        mockApiCalls.refreshToken.mockResolvedValue({
            user: mockUser,
            token: 'new-mock-token',
        });

        // Set initial token
        localStorage.setItem('auth-token', 'old-token');

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            // Simulate token refresh functionality if available
            // await result.current.refreshToken();
        });

        expect(result.current.user).toEqual(mockUser);
        expect(localStorage.getItem('auth-token')).toBe('new-mock-token');
    });

    it('handles token persistence on page reload', async () => {
        const mockUser = {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
        };

        mockApiCalls.getCurrentUser.mockResolvedValue(mockUser);
        localStorage.setItem('auth-token', 'existing-token');

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        // Wait for initial load
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles invalid token on page load', async () => {
        mockApiCalls.getCurrentUser.mockRejectedValue(new Error('Token expired'));
        localStorage.setItem('auth-token', 'invalid-token');

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        // Wait for initial load
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(localStorage.getItem('auth-token')).toBeNull();
    });

    it('manages loading states correctly', async () => {
        mockApiCalls.login.mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve({
                user: { id: '1', email: 'test@example.com', name: 'Test User' },
                token: 'mock-token'
            }), 100))
        );

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        // Start login
        act(() => {
            result.current.login('test@example.com', 'password');
        });

        // Should be loading
        expect(result.current.isLoading).toBe(true);

        // Wait for completion
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 150));
        });

        // Should not be loading anymore
        expect(result.current.isLoading).toBe(false);
    });
});
