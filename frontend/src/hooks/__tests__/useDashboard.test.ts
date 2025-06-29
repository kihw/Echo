import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboard } from '../useDashboard';

// Mock du service dashboard
jest.mock('../../services/dashboard', () => ({
  dashboardService: {
    getDashboardData: jest.fn(),
    getStats: jest.fn()
  }
}));

describe('useDashboard Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle successful data fetch', async () => {
    const mockData = {
      topTracks: [{ id: '1', title: 'Test Song', artist: 'Test Artist' }],
      topArtists: [{ id: '1', name: 'Test Artist', playCount: 100 }],
      recentPlaylists: [{ id: '1', name: 'Test Playlist', trackCount: 10 }],
      listeningHistory: []
    };

    const mockStats = {
      totalListeningTime: 3600,
      totalTracksPlayed: 50,
      uniqueArtists: 25,
      totalPlaylists: 5
    };

    const { dashboardService } = require('../../services/dashboard');
    dashboardService.getDashboardData.mockResolvedValue(mockData);
    dashboardService.getStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBeNull();
  });

  it('should handle error state', async () => {
    const mockError = new Error('Failed to fetch dashboard data');
    const { dashboardService } = require('../../services/dashboard');
    dashboardService.getDashboardData.mockRejectedValue(mockError);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Failed to fetch dashboard data');
  });

  it('should refetch data when hook reruns', async () => {
    const { dashboardService } = require('../../services/dashboard');
    dashboardService.getDashboardData.mockResolvedValue({});
    dashboardService.getStats.mockResolvedValue({});

    const { result, rerender } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Trigger rerender
    rerender();

    await waitFor(() => {
      expect(dashboardService.getDashboardData).toHaveBeenCalledTimes(1);
    });
  });
});
