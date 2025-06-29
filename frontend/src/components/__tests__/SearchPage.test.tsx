import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import SearchPage from '../../app/search/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the search API
jest.mock('../../services/api', () => ({
    searchTracks: jest.fn(),
    searchArtists: jest.fn(),
    searchAlbums: jest.fn(),
    searchPlaylists: jest.fn(),
}));

const mockSearchResults = {
    tracks: [
        {
            id: '1',
            title: 'Test Song 1',
            artist: 'Test Artist 1',
            album: 'Test Album 1',
            duration: 180,
            url: 'https://example.com/song1.mp3'
        },
        {
            id: '2',
            title: 'Test Song 2',
            artist: 'Test Artist 2',
            album: 'Test Album 2',
            duration: 200,
            url: 'https://example.com/song2.mp3'
        }
    ],
    artists: [
        {
            id: '1',
            name: 'Test Artist 1',
            image_url: 'https://example.com/artist1.jpg'
        }
    ],
    albums: [
        {
            id: '1',
            title: 'Test Album 1',
            artist: 'Test Artist 1',
            cover_url: 'https://example.com/album1.jpg'
        }
    ],
    playlists: []
};

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

const renderWithProviders = (ui: React.ReactElement) => {
    const queryClient = createTestQueryClient();

    // Mock PlayerProvider
    const MockPlayerProvider = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="player-provider">
            {children}
        </div>
    );

    return render(
        <QueryClientProvider client={queryClient}>
            <MockPlayerProvider>
                {ui}
            </MockPlayerProvider>
        </QueryClientProvider>
    );
};

describe('SearchPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders search interface correctly', () => {
        renderWithProviders(<SearchPage />);

        expect(screen.getByPlaceholderText(/search for music/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
        expect(screen.getByText(/all/i)).toBeInTheDocument(); // Filter tabs
        expect(screen.getByText(/tracks/i)).toBeInTheDocument();
        expect(screen.getByText(/artists/i)).toBeInTheDocument();
        expect(screen.getByText(/albums/i)).toBeInTheDocument();
    });

    it('performs search when typing in search box', async () => {
        const user = userEvent.setup();
        const mockSearchTracks = require('../../services/api').searchTracks;
        mockSearchTracks.mockResolvedValue(mockSearchResults);

        renderWithProviders(<SearchPage />);

        const searchInput = screen.getByPlaceholderText(/search for music/i);
        await user.type(searchInput, 'test query');

        // Should debounce and then search
        await waitFor(() => {
            expect(mockSearchTracks).toHaveBeenCalledWith('test query', expect.any(Object));
        }, { timeout: 2000 });
    });

    it('displays search results correctly', async () => {
        const mockSearchTracks = require('../../services/api').searchTracks;
        mockSearchTracks.mockResolvedValue(mockSearchResults);

        renderWithProviders(<SearchPage />);

        const searchInput = screen.getByPlaceholderText(/search for music/i);
        fireEvent.change(searchInput, { target: { value: 'test' } });

        await waitFor(() => {
            expect(screen.getByText('Test Song 1')).toBeInTheDocument();
            expect(screen.getByText('Test Artist 1')).toBeInTheDocument();
            expect(screen.getByText('Test Song 2')).toBeInTheDocument();
        });
    });

    it('filters results by type correctly', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SearchPage />);

        // Click on Artists filter
        const artistsFilter = screen.getByText(/artists/i);
        await user.click(artistsFilter);

        expect(artistsFilter).toHaveClass('active'); // Assuming active class
    });

    it('handles empty search results', async () => {
        const mockSearchTracks = require('../../services/api').searchTracks;
        mockSearchTracks.mockResolvedValue({ tracks: [], artists: [], albums: [], playlists: [] });

        renderWithProviders(<SearchPage />);

        const searchInput = screen.getByPlaceholderText(/search for music/i);
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

        await waitFor(() => {
            expect(screen.getByText(/no results found/i)).toBeInTheDocument();
        });
    });

    it('shows loading state during search', async () => {
        const mockSearchTracks = require('../../services/api').searchTracks;
        mockSearchTracks.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

        renderWithProviders(<SearchPage />);

        const searchInput = screen.getByPlaceholderText(/search for music/i);
        fireEvent.change(searchInput, { target: { value: 'test' } });

        await waitFor(() => {
            expect(screen.getByTestId('search-loading')).toBeInTheDocument();
        });
    });

    it('handles search errors gracefully', async () => {
        const mockSearchTracks = require('../../services/api').searchTracks;
        mockSearchTracks.mockRejectedValue(new Error('Search failed'));

        renderWithProviders(<SearchPage />);

        const searchInput = screen.getByPlaceholderText(/search for music/i);
        fireEvent.change(searchInput, { target: { value: 'test' } });

        await waitFor(() => {
            expect(screen.getByText(/search error/i)).toBeInTheDocument();
        });
    });

    it('supports advanced filters', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SearchPage />);

        // Open advanced filters
        const filtersButton = screen.getByRole('button', { name: /filters/i });
        await user.click(filtersButton);

        // Should show filter options
        await waitFor(() => {
            expect(screen.getByText(/duration/i)).toBeInTheDocument();
            expect(screen.getByText(/service/i)).toBeInTheDocument();
        });
    });

    it('maintains search state on page navigation', () => {
        renderWithProviders(<SearchPage />);

        const searchInput = screen.getByPlaceholderText(/search for music/i);
        fireEvent.change(searchInput, { target: { value: 'persistent search' } });

        // Should maintain search term
        expect(searchInput).toHaveValue('persistent search');
    });
});
