import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - replace with actual backend calls
const mockTracks = [
    {
        id: '1',
        title: 'Blinding Lights',
        artist: { id: '1', name: 'The Weeknd', imageUrl: '/images/weeknd.jpg', genres: [], popularity: 95, externalIds: {}, createdAt: '', updatedAt: '' },
        album: { id: '1', title: 'After Hours', imageUrl: '/images/after-hours.jpg', artist: { id: '1', name: 'The Weeknd' }, externalIds: {}, createdAt: '', updatedAt: '' },
        duration: 200000,
        popularity: 95,
        explicit: false,
        externalIds: {},
        createdAt: '',
        updatedAt: ''
    },
    {
        id: '2',
        title: 'Levitating',
        artist: { id: '2', name: 'Dua Lipa', imageUrl: '/images/dualipa.jpg', genres: [], popularity: 90, externalIds: {}, createdAt: '', updatedAt: '' },
        album: { id: '2', title: 'Future Nostalgia', imageUrl: '/images/future-nostalgia.jpg', artist: { id: '2', name: 'Dua Lipa' }, externalIds: {}, createdAt: '', updatedAt: '' },
        duration: 183000,
        popularity: 90,
        explicit: false,
        externalIds: {},
        createdAt: '',
        updatedAt: ''
    }
];

const mockArtists = [
    {
        id: '1',
        name: 'The Weeknd',
        imageUrl: '/images/weeknd.jpg',
        genres: ['Pop', 'R&B'],
        popularity: 95,
        followers: 85000000,
        externalIds: {},
        createdAt: '',
        updatedAt: ''
    },
    {
        id: '2',
        name: 'Dua Lipa',
        imageUrl: '/images/dualipa.jpg',
        genres: ['Pop', 'Dance'],
        popularity: 90,
        followers: 75000000,
        externalIds: {},
        createdAt: '',
        updatedAt: ''
    }
];

const mockAlbums = [
    {
        id: '1',
        title: 'After Hours',
        imageUrl: '/images/after-hours.jpg',
        artist: { id: '1', name: 'The Weeknd', imageUrl: '/images/weeknd.jpg', genres: [], popularity: 95, externalIds: {}, createdAt: '', updatedAt: '' },
        releaseDate: '2020-03-20',
        totalTracks: 14,
        externalIds: {},
        createdAt: '',
        updatedAt: ''
    },
    {
        id: '2',
        title: 'Future Nostalgia',
        imageUrl: '/images/future-nostalgia.jpg',
        artist: { id: '2', name: 'Dua Lipa', imageUrl: '/images/dualipa.jpg', genres: [], popularity: 90, externalIds: {}, createdAt: '', updatedAt: '' },
        releaseDate: '2020-03-27',
        totalTracks: 11,
        externalIds: {},
        createdAt: '',
        updatedAt: ''
    }
];

const mockPlaylists = [
    {
        id: '1',
        name: 'Today\'s Top Hits',
        description: 'The biggest songs right now',
        userId: 'system',
        isPublic: true,
        isCollaborative: false,
        type: 'manual' as const,
        source: 'local' as const,
        trackCount: 50,
        totalDuration: 180000,
        artwork: '/images/top-hits.jpg',
        createdAt: '',
        updatedAt: ''
    },
    {
        id: '2',
        name: 'Chill Vibes',
        description: 'Relaxing music for any time',
        userId: 'system',
        isPublic: true,
        isCollaborative: false,
        type: 'smart' as const,
        source: 'local' as const,
        trackCount: 35,
        totalDuration: 150000,
        artwork: '/images/chill.jpg',
        createdAt: '',
        updatedAt: ''
    }
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.toLowerCase() || '';
        const type = searchParams.get('type') || 'all';
        const _service = searchParams.get('service') || 'all'; // Prefix with _ to indicate unused
        const duration = searchParams.get('duration') || 'all';

        if (!query.trim()) {
            return NextResponse.json({
                tracks: [],
                artists: [],
                albums: [],
                playlists: [],
                total: 0
            });
        }

        // Filter results based on query
        let filteredTracks = mockTracks.filter(track =>
            track.title.toLowerCase().includes(query) ||
            track.artist.name.toLowerCase().includes(query) ||
            track.album?.title.toLowerCase().includes(query)
        );

        let filteredArtists = mockArtists.filter(artist =>
            artist.name.toLowerCase().includes(query)
        );

        let filteredAlbums = mockAlbums.filter(album =>
            album.title.toLowerCase().includes(query) ||
            album.artist.name.toLowerCase().includes(query)
        );

        let filteredPlaylists = mockPlaylists.filter(playlist =>
            playlist.name.toLowerCase().includes(query) ||
            playlist.description?.toLowerCase().includes(query)
        );

        // Apply duration filter for tracks
        if (duration !== 'all') {
            filteredTracks = filteredTracks.filter(track => {
                const durationMinutes = track.duration / 60000;
                switch (duration) {
                    case 'short':
                        return durationMinutes < 3;
                    case 'medium':
                        return durationMinutes >= 3 && durationMinutes <= 6;
                    case 'long':
                        return durationMinutes > 6;
                    default:
                        return true;
                }
            });
        }

        // Apply type filter
        const results = {
            tracks: (type === 'all' || type === 'tracks') ? filteredTracks : [],
            artists: (type === 'all' || type === 'artists') ? filteredArtists : [],
            albums: (type === 'all' || type === 'albums') ? filteredAlbums : [],
            playlists: (type === 'all' || type === 'playlists') ? filteredPlaylists : [],
            total: 0
        };

        results.total = results.tracks.length + results.artists.length + results.albums.length + results.playlists.length;

        // TODO: Replace with actual backend API calls
        // Example:
        // const backendResponse = await fetch(`${process.env.BACKEND_URL}/api/search`, {
        //   method: 'GET',
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //     'Content-Type': 'application/json'
        //   },
        //   params: { q: query, type, service, duration }
        // });
        // const results = await backendResponse.json();

        return NextResponse.json(results);
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
