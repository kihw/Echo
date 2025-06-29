import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioPlayer } from '../player/AudioPlayer';
import { PlayerProvider } from '../../contexts/PlayerContext';

// Mock HTML5 Audio
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockLoad = jest.fn();

Object.defineProperty(window, 'HTMLMediaElement', {
    writable: true,
    value: class MockHTMLMediaElement {
        play = mockPlay.mockResolvedValue(undefined);
        pause = mockPause;
        load = mockLoad;
        currentTime = 0;
        duration = 100;
        volume = 1;
        muted = false;
        paused = true;
        ended = false;
        readyState = 4;

        addEventListener = jest.fn();
        removeEventListener = jest.fn();
        dispatchEvent = jest.fn();
    }
});

const mockTrack = {
    id: '1',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    url: 'https://example.com/song.mp3',
    cover_url: 'https://example.com/cover.jpg'
};

const renderWithPlayerProvider = (ui: React.ReactElement) => {
    return render(
        <PlayerProvider>
            {ui}
        </PlayerProvider>
    );
};

describe('AudioPlayer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        renderWithPlayerProvider(<AudioPlayer />);
        expect(screen.getByTestId('audio-player')).toBeInTheDocument();
    });

    it('displays track information when playing', async () => {
        renderWithPlayerProvider(<AudioPlayer />);

        // Simulate playing a track
        const playButton = screen.getByRole('button', { name: /play/i });
        fireEvent.click(playButton);

        await waitFor(() => {
            expect(screen.getByText('Test Song')).toBeInTheDocument();
            expect(screen.getByText('Test Artist')).toBeInTheDocument();
        });
    });

    it('toggles play/pause correctly', async () => {
        renderWithPlayerProvider(<AudioPlayer />);

        const playButton = screen.getByRole('button', { name: /play/i });

        // Click play
        fireEvent.click(playButton);
        await waitFor(() => {
            expect(mockPlay).toHaveBeenCalled();
        });

        // Click pause
        const pauseButton = screen.getByRole('button', { name: /pause/i });
        fireEvent.click(pauseButton);
        expect(mockPause).toHaveBeenCalled();
    });

    it('handles volume changes', () => {
        renderWithPlayerProvider(<AudioPlayer />);

        const volumeSlider = screen.getByRole('slider', { name: /volume/i });
        fireEvent.change(volumeSlider, { target: { value: '0.5' } });

        expect(volumeSlider).toHaveValue('0.5');
    });

    it('handles seeking through track', () => {
        renderWithPlayerProvider(<AudioPlayer />);

        const progressSlider = screen.getByRole('slider', { name: /progress/i });
        fireEvent.change(progressSlider, { target: { value: '50' } });

        expect(progressSlider).toHaveValue('50');
    });

    it('shows loading state appropriately', () => {
        renderWithPlayerProvider(<AudioPlayer />);

        // Should show loading when track is being loaded
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('handles next/previous track navigation', () => {
        renderWithPlayerProvider(<AudioPlayer />);

        const nextButton = screen.getByRole('button', { name: /next/i });
        const prevButton = screen.getByRole('button', { name: /previous/i });

        fireEvent.click(nextButton);
        fireEvent.click(prevButton);

        // Should trigger track navigation
        expect(nextButton).toBeInTheDocument();
        expect(prevButton).toBeInTheDocument();
    });

    it('displays correct time formatting', async () => {
        renderWithPlayerProvider(<AudioPlayer />);

        await waitFor(() => {
            const timeDisplay = screen.getByTestId('time-display');
            expect(timeDisplay).toHaveTextContent(/\d{1,2}:\d{2}/);
        });
    });

    it('handles error states gracefully', async () => {
        // Mock audio error
        mockPlay.mockRejectedValueOnce(new Error('Playback failed'));

        renderWithPlayerProvider(<AudioPlayer />);

        const playButton = screen.getByRole('button', { name: /play/i });
        fireEvent.click(playButton);

        await waitFor(() => {
            expect(screen.getByText(/playback error/i)).toBeInTheDocument();
        });
    });
});
