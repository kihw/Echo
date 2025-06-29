'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Grid, List, Play, Heart, MoreHorizontal } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResponsiveDashboardLayout } from '@/components/layout/ResponsiveDashboardLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { playlistApi } from '@/services/api';
import type { Playlist } from '@/types';

export default function PlaylistsPage() {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadPlaylists();
    }, []);

    const loadPlaylists = async () => {
        try {
            setIsLoading(true);
            const response = await playlistApi.getPlaylists();
            setPlaylists(response.data || []);
        } catch (error) {
            console.error('Erreur lors du chargement des playlists:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;

        try {
            setIsCreating(true);
            const response = await playlistApi.createPlaylist({
                name: newPlaylistName.trim(),
                description: newPlaylistDescription.trim(),
                isPublic: false
            });

            setPlaylists([response.data, ...playlists]);
            setNewPlaylistName('');
            setNewPlaylistDescription('');
            setShowCreateModal(false);
        } catch (error) {
            console.error('Erreur lors de la création de la playlist:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const filteredPlaylists = playlists.filter(playlist =>
        playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playlist.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const PlaylistCard = ({ playlist }: { playlist: Playlist }) => (
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <Link href={`/playlists/${playlist.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {playlist.name}
                        </h3>
                    </Link>
                    {playlist.description && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {playlist.description}
                        </p>
                    )}
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    <span>{playlist.trackCount || 0} titres</span>
                    {playlist.totalDuration && (
                        <span className="ml-2">{Math.round(playlist.totalDuration / 60000)} min</span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                        <Heart className="w-5 h-5" />
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors">
                        <Play className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const PlaylistRow = ({ playlist }: { playlist: Playlist }) => (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎵</span>
                </div>
                <div>
                    <Link href={`/playlists/${playlist.id}`}>
                        <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {playlist.name}
                        </h3>
                    </Link>
                    <p className="text-sm text-gray-500">
                        {playlist.trackCount || 0} titres
                        {playlist.totalDuration && ` • ${Math.round(playlist.totalDuration / 60000)} min`}
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors">
                    <Play className="w-4 h-4" />
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    if (!user) {
        return null;
    }

    return (
        <ResponsiveDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mes Playlists</h1>
                        <p className="text-gray-600 mt-1">
                            Gérez vos playlists et découvrez de nouvelles musiques
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nouvelle playlist</span>
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher dans mes playlists..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Filter className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex border border-gray-300 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    } transition-colors`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    } transition-colors`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : filteredPlaylists.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🎵</span>
                        </div>
                        {searchTerm ? (
                            <>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Aucune playlist trouvée
                                </h3>
                                <p className="text-gray-600">
                                    Essayez de modifier votre recherche ou créez une nouvelle playlist.
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Aucune playlist pour le moment
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Créez votre première playlist pour commencer à organiser votre musique.
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Créer une playlist</span>
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                            : 'space-y-4'
                    }>
                        {filteredPlaylists.map((playlist) =>
                            viewMode === 'grid' ? (
                                <PlaylistCard key={playlist.id} playlist={playlist} />
                            ) : (
                                <PlaylistRow key={playlist.id} playlist={playlist} />
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Create Playlist Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Créer une nouvelle playlist"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="playlist-name" className="block text-sm font-medium text-gray-700 mb-2">
                            Nom de la playlist
                        </label>
                        <input
                            id="playlist-name"
                            type="text"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            placeholder="Ma nouvelle playlist"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label htmlFor="playlist-description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description (optionnel)
                        </label>
                        <textarea
                            id="playlist-description"
                            value={newPlaylistDescription}
                            onChange={(e) => setNewPlaylistDescription(e.target.value)}
                            placeholder="Décrivez votre playlist..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleCreatePlaylist}
                            disabled={!newPlaylistName.trim() || isCreating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isCreating ? 'Création...' : 'Créer'}
                        </button>
                    </div>
                </div>
            </Modal>
        </ResponsiveDashboardLayout>
    );
}
