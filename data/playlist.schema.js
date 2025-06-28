// Playlist Schema - Playlists générées, règles et métadonnées
const playlistSchema = {
    id: {
        type: 'UUID',
        primaryKey: true,
        defaultValue: 'uuid_generate_v4()'
    },

    // Informations de base
    name: {
        type: 'VARCHAR(255)',
        nullable: false
    },
    description: {
        type: 'TEXT',
        nullable: true
    },

    // Propriétaire et visibilité
    userId: {
        type: 'UUID',
        nullable: false,
        references: 'users(id)',
        onDelete: 'CASCADE'
    },
    isPublic: {
        type: 'BOOLEAN',
        defaultValue: false
    },
    isCollaborative: {
        type: 'BOOLEAN',
        defaultValue: false
    },

    // Type de playlist
    type: {
        type: 'VARCHAR(50)',
        nullable: false,
        defaultValue: 'manual'
        // 'manual', 'smart', 'daily_mix', 'discover_weekly', 'radio', 'mood_based'
    },

    // Configuration pour playlists intelligentes
    smartConfig: {
        type: 'JSONB',
        nullable: true,
        // Structure détaillée des règles de génération
    },

    // Règles de génération (pour playlists intelligentes)
    generationRules: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            maxTracks: 50,
            minTracks: 10,
            targetDuration: 3600, // en secondes (1h par défaut)

            // Filtres de base
            genres: [], // genres inclus
            excludeGenres: [], // genres exclus
            artists: [], // artistes spécifiques
            excludeArtists: [], // artistes exclus
            yearRange: { min: null, max: null },
            durationRange: { min: 60, max: 600 }, // 1min - 10min

            // Critères audio
            audioFeatures: {
                danceability: { min: null, max: null },
                energy: { min: null, max: null },
                valence: { min: null, max: null },
                tempo: { min: null, max: null }
            },

            // Critères de popularité/découverte
            popularityRange: { min: 0, max: 100 },
            includeRecentlyPlayed: true,
            includeRecentlySkipped: false,
            discoveryRatio: 0.3, // 30% de nouvelles découvertes

            // Critères temporels
            recentPlaysPeriod: 30, // jours
            excludeRecentlyPlayed: false,

            // Ordre et diversité
            shuffleOrder: true,
            artistDiversity: 'medium', // low, medium, high
            genreDiversity: 'medium',

            // Mise à jour automatique
            autoUpdate: false,
            updateFrequency: 'weekly', // daily, weekly, monthly
            lastUpdated: null
        })
    },

    // Contexte et humeur
    mood: {
        type: 'VARCHAR(50)',
        nullable: true
        // happy, sad, energetic, calm, party, focus, workout, chill, etc.
    },
    context: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            timeOfDay: null, // morning, afternoon, evening, night
            activity: null, // work, workout, commute, party, study, sleep
            weather: null, // sunny, rainy, cloudy, snow
            season: null, // spring, summer, autumn, winter
            location: null // home, car, office, gym
        })
    },

    // Métadonnées visuelles
    artwork: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            url: null,
            color: '#1db954', // couleur dominante
            gradient: null,
            isGenerated: true // true si artwork généré automatiquement
        })
    },

    // Statistiques
    stats: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            totalTracks: 0,
            totalDuration: 0, // en secondes
            totalPlays: 0,
            uniqueListeners: 0,
            averageRating: 0,
            lastPlayed: null,
            creationMethod: 'manual' // manual, ai_generated, imported
        })
    },

    // Historique des modifications
    versionHistory: {
        type: 'JSONB',
        defaultValue: JSON.stringify([])
        // [{ version: 1, changes: [], timestamp: '', userId: '' }]
    },

    // Tags et catégories
    tags: {
        type: 'JSONB',
        defaultValue: JSON.stringify([])
    },
    category: {
        type: 'VARCHAR(50)',
        nullable: true
        // pop, rock, electronic, jazz, classical, etc.
    },

    // Source et synchronisation
    source: {
        type: 'VARCHAR(50)',
        defaultValue: 'echo'
        // echo, spotify, deezer, youtube, imported
    },
    externalId: {
        type: 'VARCHAR(255)',
        nullable: true
    },
    syncStatus: {
        type: 'VARCHAR(20)',
        defaultValue: 'local'
        // local, synced, pending, error
    },
    lastSyncAt: {
        type: 'TIMESTAMP',
        nullable: true
    },

    // État
    isActive: {
        type: 'BOOLEAN',
        defaultValue: true
    },
    isFeatured: {
        type: 'BOOLEAN',
        defaultValue: false
    },

    // Métadonnées système
    createdAt: {
        type: 'TIMESTAMP',
        defaultValue: 'CURRENT_TIMESTAMP'
    },
    updatedAt: {
        type: 'TIMESTAMP',
        defaultValue: 'CURRENT_TIMESTAMP'
    }
};

// Table de liaison playlist-tracks avec ordre
const playlistTracksSchema = {
    id: {
        type: 'UUID',
        primaryKey: true,
        defaultValue: 'uuid_generate_v4()'
    },
    playlistId: {
        type: 'UUID',
        nullable: false,
        references: 'playlists(id)',
        onDelete: 'CASCADE'
    },
    trackId: {
        type: 'UUID',
        nullable: false,
        references: 'tracks(id)',
        onDelete: 'CASCADE'
    },
    position: {
        type: 'INTEGER',
        nullable: false
    },
    addedBy: {
        type: 'UUID',
        nullable: true,
        references: 'users(id)'
    },
    addedAt: {
        type: 'TIMESTAMP',
        defaultValue: 'CURRENT_TIMESTAMP'
    },

    // Métadonnées spécifiques à cette inclusion
    metadata: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            reason: 'manual', // manual, recommendation, rule_based
            confidence: null, // pour les recommandations
            ruleMatched: null // quelle règle a ajouté cette piste
        })
    }
};

// Index pour optimiser les requêtes
const playlistIndexes = [
    'CREATE INDEX idx_playlists_user_id ON playlists (userId)',
    'CREATE INDEX idx_playlists_type ON playlists (type)',
    'CREATE INDEX idx_playlists_public ON playlists (isPublic)',
    'CREATE INDEX idx_playlists_mood ON playlists (mood)',
    'CREATE INDEX idx_playlists_category ON playlists (category)',
    'CREATE INDEX idx_playlists_source ON playlists (source)',
    'CREATE INDEX idx_playlists_active ON playlists (isActive)',
    'CREATE INDEX idx_playlists_featured ON playlists (isFeatured)',
    'CREATE INDEX idx_playlists_created_at ON playlists (createdAt)',
    'CREATE INDEX idx_playlists_updated_at ON playlists (updatedAt)',
    'CREATE INDEX idx_playlists_tags ON playlists USING GIN (tags)',
    'CREATE INDEX idx_playlists_generation_rules ON playlists USING GIN (generationRules)',
    'CREATE TEXT SEARCH INDEX idx_playlists_search ON playlists USING GIN (to_tsvector(\'french\', name || \' \' || COALESCE(description, \'\')))',

    // Index pour playlist_tracks
    'CREATE INDEX idx_playlist_tracks_playlist_id ON playlist_tracks (playlistId)',
    'CREATE INDEX idx_playlist_tracks_track_id ON playlist_tracks (trackId)',
    'CREATE INDEX idx_playlist_tracks_position ON playlist_tracks (playlistId, position)',
    'CREATE INDEX idx_playlist_tracks_added_at ON playlist_tracks (addedAt)',
    'CREATE UNIQUE INDEX idx_playlist_tracks_unique ON playlist_tracks (playlistId, trackId, position)'
];

module.exports = {
    schema: playlistSchema,
    playlistTracksSchema,
    indexes: playlistIndexes,
    tableName: 'playlists',
    relatedTables: ['playlist_tracks']
};
