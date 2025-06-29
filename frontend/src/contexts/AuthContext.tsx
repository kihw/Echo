'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  spotifyId?: string;
  deezerId?: string;
  youtubeId?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    autoplay: boolean;
    crossfade: boolean;
    volume: number;
  };
  subscription: {
    type: 'free' | 'premium';
    expiresAt?: string;
  };
  createdAt: string;
  lastLoginAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (_email: string, _password: string) => Promise<void>;
  loginWithSpotify: () => Promise<void>;
  loginWithDeezer: () => Promise<void>;
  register: (_email: string, _password: string, _displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (_updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check for existing authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await api.get('/user/profile');
      setUser(response.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // MODE DE DÉVELOPPEMENT - Utilisateurs de test
      const testUsers = [
        {
          email: 'test@echo.com',
          password: 'password123',
          user: {
            id: '1',
            email: 'test@echo.com',
            displayName: 'Utilisateur Test',
            preferences: {
              theme: 'system' as const,
              language: 'fr',
              autoplay: true,
              crossfade: false,
              volume: 0.8
            },
            subscription: {
              type: 'free' as const
            },
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          }
        },
        {
          email: 'admin@echo.com',
          password: 'admin123',
          user: {
            id: '2',
            email: 'admin@echo.com',
            displayName: 'Admin Echo',
            spotifyId: 'spotify_admin_123',
            deezerId: 'deezer_admin_456',
            preferences: {
              theme: 'dark' as const,
              language: 'fr',
              autoplay: true,
              crossfade: true,
              volume: 0.9
            },
            subscription: {
              type: 'premium' as const
            },
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            lastLoginAt: new Date().toISOString()
          }
        }
      ];

      const testUser = testUsers.find(u => u.email === email && u.password === password);

      if (testUser) {
        // Simulation d'un token JWT
        const token = `test_token_${testUser.user.id}_${Date.now()}`;
        localStorage.setItem('auth_token', token);
        setUser(testUser.user as User);
        router.push('/dashboard');
        return;
      }

      // Si ce n'est pas un utilisateur de test, essayer l'API
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('auth_token', token);
      setUser(userData);

      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Email ou mot de passe incorrect');
    }
  };

  const loginWithSpotify = async () => {
    try {
      // Redirect to Spotify OAuth
      const response = await api.get('/auth/spotify/url');
      window.location.href = response.data.authUrl;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Spotify login failed');
    }
  };

  const loginWithDeezer = async () => {
    try {
      // Redirect to Deezer OAuth
      const response = await api.get('/auth/deezer/url');
      window.location.href = response.data.authUrl;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Deezer login failed');
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        displayName
      });
      const { token, user: userData } = response.data;

      localStorage.setItem('auth_token', token);
      setUser(userData);

      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
      router.push('/');
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      const response = await api.patch('/user/profile', updates);
      setUser(response.data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/user/profile');
      setUser(response.data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Refresh failed');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginWithSpotify,
    loginWithDeezer,
    register,
    logout,
    updateUser,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
