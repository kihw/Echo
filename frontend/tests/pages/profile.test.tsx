import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '@/app/profile/page';
import { useAuth } from '@/hooks/useAuth';

// Mock dependencies with proper ES module structure
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: any) => <div data-testid="dashboard-layout">{children}</div>,
  __esModule: true,
  default: ({ children }: any) => <div data-testid="dashboard-layout">{children}</div>,
}));

const mockUpdateUser = jest.fn();
const mockUser = {
  id: '1',
  email: 'test@echo.com',
  displayName: 'Test User',
  preferences: {
    theme: 'system' as const,
    language: 'fr',
    autoplay: true,
    crossfade: false,
    volume: 0.8,
  },
  subscription: { type: 'free' as const },
  createdAt: '2023-01-01T00:00:00.000Z',
  lastLoginAt: '2023-01-01T00:00:00.000Z',
};

describe('ProfilePage', () => {
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

  it('should render profile page with user information', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Mon Profil')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@echo.com')).toBeInTheDocument();
    expect(screen.getByText('Modifier')).toBeInTheDocument();
  });

  it('should not render when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      updateUser: mockUpdateUser,
    });

    const { container } = render(<ProfilePage />);
    expect(container.firstChild).toBeNull();
  });

  it('should enter edit mode when Modifier button is clicked', () => {
    render(<ProfilePage />);

    const editButton = screen.getByText('Modifier');
    fireEvent.click(editButton);

    expect(screen.getByText('Annuler')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@echo.com')).toBeInTheDocument();
  });

  it('should exit edit mode when Annuler button is clicked', () => {
    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Modifier');
    fireEvent.click(editButton);

    // Exit edit mode
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    expect(screen.getByText('Modifier')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Test User')).not.toBeInTheDocument();
  });

  it('should update displayName', async () => {
    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Modifier');
    fireEvent.click(editButton);

    // Update display name
    const displayNameInput = screen.getByDisplayValue('Test User');
    fireEvent.change(displayNameInput, { target: { value: 'Updated User' } });

    // Save changes
    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        displayName: 'Updated User',
        email: 'test@echo.com',
      });
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Profil mis à jour avec succès !');
    });
  });

  it('should update email', async () => {
    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Modifier');
    fireEvent.click(editButton);

    // Update email
    const emailInput = screen.getByDisplayValue('test@echo.com');
    fireEvent.change(emailInput, { target: { value: 'updated@echo.com' } });

    // Save changes
    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        displayName: 'Test User',
        email: 'updated@echo.com',
      });
    });
  });

  it('should handle update error', async () => {
    mockUpdateUser.mockRejectedValue(new Error('Update failed'));

    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Modifier');
    fireEvent.click(editButton);

    // Try to save
    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Update failed');
    });
  });

  it('should handle update error without message', async () => {
    mockUpdateUser.mockRejectedValue({});

    render(<ProfilePage />);

    // Enter edit mode
    const editButton = screen.getByText('Modifier');
    fireEvent.click(editButton);

    // Try to save
    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Erreur lors de la mise à jour du profil');
    });
  });

  it('should display user avatar with first letter of display name', () => {
    render(<ProfilePage />);

    const avatar = screen.getByText('T');
    expect(avatar).toBeInTheDocument();
  });

  it('should display subscription type', () => {
    render(<ProfilePage />);

    expect(screen.getByText('free')).toBeInTheDocument();
  });

  it('should display member since date', () => {
    render(<ProfilePage />);

    expect(screen.getByText(/Membre depuis/)).toBeInTheDocument();
  });
});
