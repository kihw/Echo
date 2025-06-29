'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Music, Users, Album, Filter, Grid, List, Play } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Track, Artist, Album as AlbumType, Playlist } from '@/types';
import { musicApi } from '@/services/api';

interface SearchFilters {
    type: 'all' | 'tracks' | 'artists' | 'albums' | 'playlists';
    service: 'all' | 'spotify' | 'deezer' | 'youtube';
    duration: 'all' | 'short' | 'medium' | 'long';
}

interface SearchResults {
    tracks: Track[];
    artists: Artist[];
    albums: AlbumType[];
    playlists: Playlist[];
    total: number;
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams?.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResults>({
        tracks: [],
        artists: [],
        albums: [],
        playlists: [],
        total: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        type: 'all',
        service: 'all',
        duration: 'all'
    });

    const { play, isPlaying, currentTrack } = usePlayer();
    const { user } = useAuth();

    const searchMusic = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
        if (!searchQuery.trim()) {
            setResults({ tracks: [], artists: [], albums: [], playlists: [], total: 0 });
            return;
        }

        setIsLoading(true);
        try {
            // Use the backend API instead of mock endpoint
            const response = await musicApi.search(searchQuery, searchFilters.type);
            const data = response.data;

            // Transform the response to match our expected format
            const transformedResults = {
                tracks: data.tracks || [],
                artists: data.artists || [],
                albums: data.albums || [],
                playlists: data.playlists || [],
                total: (data.tracks?.length || 0) + (data.artists?.length || 0) + (data.albums?.length || 0) + (data.playlists?.length || 0)
            };

            setResults(transformedResults);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            setResults({ tracks: [], artists: [], albums: [], playlists: [], total: 0 });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSearch = useCallback((searchQuery: string) => {
        setQuery(searchQuery);
        searchMusic(searchQuery, filters);
    }, [filters, searchMusic]);

    const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        if (query.trim()) {
            searchMusic(query, updatedFilters);
        }
    }, [filters, query, searchMusic]);

    const handlePlayTrack = useCallback((track: Track) => {
        // Convert the main Track type to PlayerContext Track type
        const playerTrack = {
            id: track.id,
            title: track.title,
            artist: track.artist.name,
            album: track.album?.title,
            duration: track.duration,
            artwork: track.album?.imageUrl,
            url: track.previewUrl
        };
        play(playerTrack);
    }, [play]);

    useEffect(() => {
        if (initialQuery) {
            searchMusic(initialQuery, filters);
        }
    }, [initialQuery, searchMusic, filters]);

    const renderTrackItem = (track: Track) => (
        <div
            key={track.id}
            className={`group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${viewMode === 'list' ? 'flex items-center space-x-4' : ''
                }`}
            onClick={() => handlePlayTrack(track)}
        >
            <div className={`relative ${viewMode === 'grid' ? 'w-full aspect-square mb-3' : 'w-12 h-12 flex-shrink-0'}`}>
                <img
                    src={track.album?.imageUrl || '/images/default-track.png'}
                    alt={track.title}
                    className="w-full h-full object-cover rounded"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                    <Play className="w-6 h-6 text-white" />
                </div>
                {currentTrack?.id === track.id && isPlaying && (
                    <div className="absolute inset-0 bg-purple-600 bg-opacity-75 flex items-center justify-center rounded">
                        <div className="w-6 h-6 flex space-x-1 items-center justify-center">
                            <div className="w-1 h-4 bg-white animate-pulse"></div>
                            <div className="w-1 h-4 bg-white animate-pulse delay-75"></div>
                            <div className="w-1 h-4 bg-white animate-pulse delay-150"></div>
                        </div>
                    </div>
                )}
            </div>
            <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-1 min-w-0'}`}>
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {track.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {track.artist.name}
                </p>
                {viewMode === 'list' && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {track.album?.title} • {Math.floor(track.duration / 60000)}:{Math.floor((track.duration % 60000) / 1000).toString().padStart(2, '0')}
                    </p>
                )}
            </div>
        </div>
    );

    const renderArtistItem = (artist: Artist) => (
        <div
            key={artist.id}
            className={`group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${viewMode === 'list' ? 'flex items-center space-x-4' : ''
                }`}
        >
            <div className={`relative ${viewMode === 'grid' ? 'w-full aspect-square mb-3' : 'w-12 h-12 flex-shrink-0'}`}>
                <img
                    src={artist.imageUrl || '/images/default-artist.png'}
                    alt={artist.name}
                    className="w-full h-full object-cover rounded-full"
                />
            </div>
            <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-1 min-w-0'}`}>
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {artist.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {artist.followers?.toLocaleString()} followers
                </p>
            </div>
        </div>
    );

    const renderAlbumItem = (album: AlbumType) => (
        <div
            key={album.id}
            className={`group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${viewMode === 'list' ? 'flex items-center space-x-4' : ''
                }`}
        >
            <div className={`relative ${viewMode === 'grid' ? 'w-full aspect-square mb-3' : 'w-12 h-12 flex-shrink-0'}`}>
                <img
                    src={album.imageUrl || '/images/default-album.png'}
                    alt={album.title}
                    className="w-full h-full object-cover rounded"
                />
            </div>
            <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-1 min-w-0'}`}>
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {album.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {album.artist.name}
                </p>
                {viewMode === 'list' && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        {album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'N/A'} • {album.totalTracks || 0} tracks
                    </p>
                )}
            </div>
        </div>
    );

    const renderPlaylistItem = (playlist: Playlist) => (
        <div
            key={playlist.id}
            className={`group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${viewMode === 'list' ? 'flex items-center space-x-4' : ''
                }`}
        >
            <div className={`relative ${viewMode === 'grid' ? 'w-full aspect-square mb-3' : 'w-12 h-12 flex-shrink-0'}`}>
                <img
                    src={playlist.artwork || '/images/default-playlist.png'}
                    alt={playlist.name}
                    className="w-full h-full object-cover rounded"
                />
            </div>
            <div className={`${viewMode === 'grid' ? 'text-center' : 'flex-1 min-w-0'}`}>
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {playlist.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    par {user?.displayName || 'Utilisateur'}
                </p>
                {viewMode === 'list' && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        {playlist.trackCount} tracks
                    </p>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Search Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
                                placeholder="Rechercher des titres, artistes, albums..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                            <button
                                onClick={() => handleSearch(query)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-md transition-colors"
                            >
                                Rechercher
                            </button>
                        </div>

                        {/* Filters and View Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="text-sm">Filtres</span>
                                </button>

                                {/* Quick Filters */}
                                <div className="flex items-center space-x-2">
                                    {(['all', 'tracks', 'artists', 'albums', 'playlists'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => handleFilterChange({ type })}
                                            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${filters.type === type
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {type === 'all' ? 'Tout' :
                                                type === 'tracks' ? 'Titres' :
                                                    type === 'artists' ? 'Artistes' :
                                                        type === 'albums' ? 'Albums' : 'Playlists'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {results.total} résultats
                                </span>
                                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 transition-colors ${viewMode === 'grid'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <Grid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 transition-colors ${viewMode === 'list'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Service de musique
                                        </label>
                                        <select
                                            value={filters.service}
                                            onChange={(e) => handleFilterChange({ service: e.target.value as SearchFilters['service'] })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="all">Tous les services</option>
                                            <option value="spotify">Spotify</option>
                                            <option value="deezer">Deezer</option>
                                            <option value="youtube">YouTube Music</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Durée
                                        </label>
                                        <select
                                            value={filters.duration}
                                            onChange={(e) => handleFilterChange({ duration: e.target.value as SearchFilters['duration'] })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="all">Toute durée</option>
                                            <option value="short">Court (&lt; 3 min)</option>
                                            <option value="medium">Moyen (3-6 min)</option>
                                            <option value="long">Long (&gt; 6 min)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search Results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : results.total === 0 && query ? (
                    <div className="text-center py-20">
                        <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Aucun résultat trouvé
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Essayez avec des mots-clés différents ou vérifiez l'orthographe.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Tracks Section */}
                        {(filters.type === 'all' || filters.type === 'tracks') && results.tracks.length > 0 && (
                            <div>
                                <div className="flex items-center space-x-2 mb-6">
                                    <Music className="w-5 h-5 text-purple-600" />
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Titres ({results.tracks.length})
                                    </h2>
                                </div>
                                <div className={`grid gap-4 ${viewMode === 'grid'
                                        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                                        : 'grid-cols-1'
                                    }`}>
                                    {results.tracks.map(renderTrackItem)}
                                </div>
                            </div>
                        )}

                        {/* Artists Section */}
                        {(filters.type === 'all' || filters.type === 'artists') && results.artists.length > 0 && (
                            <div>
                                <div className="flex items-center space-x-2 mb-6">
                                    <Users className="w-5 h-5 text-purple-600" />
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Artistes ({results.artists.length})
                                    </h2>
                                </div>
                                <div className={`grid gap-4 ${viewMode === 'grid'
                                        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                                        : 'grid-cols-1'
                                    }`}>
                                    {results.artists.map(renderArtistItem)}
                                </div>
                            </div>
                        )}

                        {/* Albums Section */}
                        {(filters.type === 'all' || filters.type === 'albums') && results.albums.length > 0 && (
                            <div>
                                <div className="flex items-center space-x-2 mb-6">
                                    <Album className="w-5 h-5 text-purple-600" />
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Albums ({results.albums.length})
                                    </h2>
                                </div>
                                <div className={`grid gap-4 ${viewMode === 'grid'
                                        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                                        : 'grid-cols-1'
                                    }`}>
                                    {results.albums.map(renderAlbumItem)}
                                </div>
                            </div>
                        )}

                        {/* Playlists Section */}
                        {(filters.type === 'all' || filters.type === 'playlists') && results.playlists.length > 0 && (
                            <div>
                                <div className="flex items-center space-x-2 mb-6">
                                    <Music className="w-5 h-5 text-purple-600" />
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Playlists ({results.playlists.length})
                                    </h2>
                                </div>
                                <div className={`grid gap-4 ${viewMode === 'grid'
                                        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                                        : 'grid-cols-1'
                                    }`}>
                                    {results.playlists.map(renderPlaylistItem)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
