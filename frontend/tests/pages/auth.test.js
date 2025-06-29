import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CallbackPage from '@/app/auth/callback/page';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockRefreshUser = jest.fn();
const mockSearchParamsGet = jest.fn();

describe('CallbackPage', () => {
  beforeEach(() => {
    const { useRouter, useSearchParams } = require('next/navigation');

    useRouter.mockReturnValue({
      push: mockPush,
    });

    useSearchParams.mockReturnValue({
      get: mockSearchParamsGet,
    });

    useAuth.mockReturnValue({
      refreshUser: mockRefreshUser,
    });

    // Set default search params
    mockSearchParamsGet.mockImplementation((key) => {
      const params = {
        code: 'test-auth-code',
        state: 'test-state',
        provider: 'spotify',
      };
      return params[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful OAuth callback', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: '1', email: 'test@echo.com' },
      },
    };

    api.post.mockResolvedValue(mockResponse);

    render(<CallbackPage />);

    // Should show loading state initially
    expect(screen.getByText('Finalisation de la connexion...')).toBeInTheDocument();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/spotify/callback', {
        code: 'test-auth-code',
        state: 'test-state',
      });
    });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle OAuth error', async () => {
    // Mock URLSearchParams to return error
    require('next/navigation').useSearchParams.mockReturnValue({
      get: jest.fn((key) => {
        if (key === 'error') return 'access_denied';
        return null;
      }),
    });

    render(<CallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur d\'authentification')).toBeInTheDocument();
      expect(screen.getByText(/OAuth error: access_denied/)).toBeInTheDocument();
    });
  });

  it('should handle missing authorization code', async () => {
    // Mock URLSearchParams to return no code
    require('next/navigation').useSearchParams.mockReturnValue({
      get: jest.fn(() => null),
    });

    render(<CallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur d\'authentification')).toBeInTheDocument();
      expect(screen.getByText(/No authorization code received/)).toBeInTheDocument();
    });
  });

  it('should handle API error during callback', async () => {
    api.post.mockRejectedValue(new Error('Network error'));

    render(<CallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur d\'authentification')).toBeInTheDocument();
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('should redirect to login on retry button click', async () => {
    api.post.mockRejectedValue(new Error('Test error'));

    render(<CallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur d\'authentification')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retourner à la connexion');
    fireEvent.click(retryButton);

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
});

// Tests for Login/Register flows would be added here
describe('Login Flow', () => {
  // TODO: Add tests for login page
  it('should be implemented', () => {
    expect(true).toBe(true);
  });
});

describe('Register Flow', () => {
  // TODO: Add tests for register page  
  it('should be implemented', () => {
    expect(true).toBe(true);
  });
});
