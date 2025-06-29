import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import CallbackPage from '@/app/auth/callback/page';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';

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
const mockSearchParams = {
  get: jest.fn(),
};

describe('CallbackPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    (useAuth as jest.Mock).mockReturnValue({
      refreshUser: mockRefreshUser,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful OAuth callback', async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      const params: Record<string, string> = {
        code: 'test-auth-code',
        state: 'test-state',
        provider: 'spotify',
      };
      return params[key] || null;
    });

    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: '1', email: 'test@echo.com' },
      },
    };

    (api.post as jest.Mock).mockResolvedValue(mockResponse);

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
      expect(localStorage.getItem('auth_token')).toBe('test-token');
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle OAuth error', async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'error') return 'access_denied';
      return null;
    });

    render(<CallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur d\'authentification')).toBeInTheDocument();
      expect(screen.getByText(/OAuth error: access_denied/)).toBeInTheDocument();
    });
  });

  it('should handle missing authorization code', async () => {
    mockSearchParams.get.mockReturnValue(null);

    render(<CallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur d\'authentification')).toBeInTheDocument();
      expect(screen.getByText(/No authorization code received/)).toBeInTheDocument();
    });
  });

  it('should handle API error during callback', async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      const params: Record<string, string> = {
        code: 'test-auth-code',
        state: 'test-state',
        provider: 'spotify',
      };
      return params[key] || null;
    });

    (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<CallbackPage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur d\'authentification')).toBeInTheDocument();
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it('should redirect to login on retry button click', async () => {
    mockSearchParams.get.mockReturnValue(null);

    (api.post as jest.Mock).mockRejectedValue(new Error('Test error'));

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
