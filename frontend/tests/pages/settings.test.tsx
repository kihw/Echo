import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from '@/app/settings/page';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/layout/DashboardLayout', () => {
  return function MockDashboardLayout({ children }: any) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

const mockUpdateUser = jest.fn();
const mockUser = {
  id: '1',
  email: 'test@echo.com',
  displayName: 'Test User',
  preferences: {
    theme: 'system',
    language: 'fr',
    autoplay: true,
    crossfade: false,
    volume: 0.8,
  },
  subscription: { type: 'free' },
  createdAt: '2023-01-01T00:00:00.000Z',
  lastLoginAt: '2023-01-01T00:00:00.000Z',
};

describe('SettingsPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
    });

    // Mock window.alert
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render settings page with user preferences', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Paramètres')).toBeInTheDocument();
    expect(screen.getByText('Thème')).toBeInTheDocument();
    expect(screen.getByText('Langue')).toBeInTheDocument();
    expect(screen.getByText('Lecture automatique')).toBeInTheDocument();
    expect(screen.getByText('Crossfade')).toBeInTheDocument();
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('should not render when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      updateUser: mockUpdateUser,
    });

    const { container } = render(<SettingsPage />);
    expect(container.firstChild).toBeNull();
  });

  it('should update theme preference', async () => {
    render(<SettingsPage />);

    const themeSelect = screen.getByDisplayValue('system');
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    const saveButton = screen.getByText('Sauvegarder les paramètres');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        preferences: {
          ...mockUser.preferences,
          theme: 'dark',
        },
      });
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Paramètres sauvegardés avec succès !');
    });
  });

  it('should update language preference', async () => {
    render(<SettingsPage />);

    const languageSelect = screen.getByDisplayValue('fr');
    fireEvent.change(languageSelect, { target: { value: 'en' } });

    const saveButton = screen.getByText('Sauvegarder les paramètres');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        preferences: {
          ...mockUser.preferences,
          language: 'en',
        },
      });
    });
  });

  it('should handle save error', async () => {
    mockUpdateUser.mockRejectedValue(new Error('Update failed'));

    render(<SettingsPage />);

    const saveButton = screen.getByText('Sauvegarder les paramètres');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Update failed');
    });
  });

  it('should handle save error without message', async () => {
    mockUpdateUser.mockRejectedValue({});

    render(<SettingsPage />);

    const saveButton = screen.getByText('Sauvegarder les paramètres');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Erreur lors de la sauvegarde des paramètres');
    });
  });

  it('should initialize with user preferences', () => {
    const customUser = {
      ...mockUser,
      preferences: {
        theme: 'dark',
        language: 'en',
        autoplay: false,
        crossfade: true,
        volume: 0.5,
      },
    };

    (useAuth as jest.Mock).mockReturnValue({
      user: customUser,
      updateUser: mockUpdateUser,
    });

    render(<SettingsPage />);

    expect(screen.getByDisplayValue('dark')).toBeInTheDocument();
    expect(screen.getByDisplayValue('en')).toBeInTheDocument();
  });
});
