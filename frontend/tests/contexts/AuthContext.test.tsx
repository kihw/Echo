import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockPush = jest.fn();

// Test wrapper
const wrapper = ({ children }: any) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });

    it('should provide auth context', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toMatchObject({
        user: null,
        isAuthenticated: false,
        isLoading: expect.any(Boolean),
        login: expect.any(Function),
        loginWithSpotify: expect.any(Function),
        loginWithDeezer: expect.any(Function),
        register: expect.any(Function),
        logout: expect.any(Function),
        updateUser: expect.any(Function),
        refreshUser: expect.any(Function),
      });
    });
  });

  describe('Authentication', () => {
    it('should check existing authentication on mount', async () => {
      const mockUser = { id: '1', email: 'test@echo.com' };
      (window.localStorage.getItem as jest.Mock).mockReturnValue('test-token');
      (api.get as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        // Wait for the effect to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(api.get).toHaveBeenCalledWith('/user/profile');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle auth check failure', async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('invalid-token');
      (api.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Login', () => {
    it('should login with test user credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@echo.com', 'password123');
      });

      expect(window.localStorage.setItem).toHaveBeenCalledWith('auth_token', expect.stringContaining('test_token_1_'));
      expect(result.current.user?.email).toBe('test@echo.com');
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should login with admin test user credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('admin@echo.com', 'admin123');
      });

      expect(window.localStorage.setItem).toHaveBeenCalledWith('auth_token', expect.stringContaining('test_token_2_'));
      expect(result.current.user?.email).toBe('admin@echo.com');
      expect(result.current.user?.displayName).toBe('Admin Echo');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle API login for non-test users', async () => {
      const mockResponse = {
        data: {
          token: 'api-token',
          user: { id: '3', email: 'api@echo.com' },
        },
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('api@echo.com', 'password');
      });

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'api@echo.com',
        password: 'password',
      });
      expect(window.localStorage.setItem).toHaveBeenCalledWith('auth_token', 'api-token');
      expect(result.current.user).toEqual(mockResponse.data.user);
    });

    it('should handle login failure', async () => {
      (api.post as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login('wrong@echo.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('OAuth Login', () => {
    it('should redirect to Spotify OAuth', async () => {
      (api.get as jest.Mock).mockResolvedValue({
        data: { authUrl: 'https://spotify.com/oauth' },
      });

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.loginWithSpotify();
      });

      expect(api.get).toHaveBeenCalledWith('/auth/spotify/url');
      expect(window.location.href).toBe('https://spotify.com/oauth');
    });

    it('should redirect to Deezer OAuth', async () => {
      (api.get as jest.Mock).mockResolvedValue({
        data: { authUrl: 'https://deezer.com/oauth' },
      });

      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.loginWithDeezer();
      });

      expect(api.get).toHaveBeenCalledWith('/auth/deezer/url');
      expect(window.location.href).toBe('https://deezer.com/oauth');
    });
  });

  describe('Register', () => {
    it('should register new user', async () => {
      const mockResponse = {
        data: {
          token: 'register-token',
          user: { id: '4', email: 'new@echo.com', displayName: 'New User' },
        },
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register('new@echo.com', 'password123', 'New User');
      });

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'new@echo.com',
        password: 'password123',
        displayName: 'New User',
      });
      expect(window.localStorage.setItem).toHaveBeenCalledWith('auth_token', 'register-token');
      expect(result.current.user).toEqual(mockResponse.data.user);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Logout', () => {
    it('should logout user', async () => {
      // First login
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@echo.com', 'password123');
      });

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should handle logout API failure gracefully', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // First login
      await act(async () => {
        await result.current.login('test@echo.com', 'password123');
      });

      // Then logout (should not throw)
      await act(async () => {
        await result.current.logout();
      });

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(result.current.user).toBeNull();
    });
  });

  describe('Update User', () => {
    it('should update user data', async () => {
      const updatedUser = { id: '1', email: 'updated@echo.com' };
      (api.patch as jest.Mock).mockResolvedValue({
        data: { user: updatedUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // First login
      await act(async () => {
        await result.current.login('test@echo.com', 'password123');
      });

      // Then update
      await act(async () => {
        await result.current.updateUser({ email: 'updated@echo.com' });
      });

      expect(api.patch).toHaveBeenCalledWith('/user/profile', { email: 'updated@echo.com' });
      expect(result.current.user).toEqual(updatedUser);
    });
  });

  describe('Refresh User', () => {
    it('should refresh user data', async () => {
      const refreshedUser = { id: '1', email: 'refreshed@echo.com' };
      (api.get as jest.Mock).mockResolvedValue({
        data: { user: refreshedUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(api.get).toHaveBeenCalledWith('/user/profile');
      expect(result.current.user).toEqual(refreshedUser);
    });
  });
});
