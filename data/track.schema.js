// Track Schema - Métadonnées des pistes, chemins de fichiers et statistiques
const trackSchema = {
    id: {
        type: 'UUID',
        primaryKey: true,
        defaultValue: 'uuid_generate_v4()'
    },

    // Métadonnées principales
    title: {
        type: 'VARCHAR(500)',
        nullable: false
    },
    artist: {
        type: 'VARCHAR(500)',
        nullable: false
    },
    album: {
        type: 'VARCHAR(500)',
        nullable: true
    },
    albumArtist: {
        type: 'VARCHAR(500)',
        nullable: true
    },
    genre: {
        type: 'VARCHAR(100)',
        nullable: true
    },
    year: {
        type: 'INTEGER',
        nullable: true
    },
    trackNumber: {
        type: 'INTEGER',
        nullable: true
    },
    discNumber: {
        type: 'INTEGER',
        nullable: true
    },
    duration: {
        type: 'INTEGER', // en secondes
        nullable: false
    },

    // Identifiants externes
    externalIds: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            spotify: null,
            deezer: null,
            youtubeMusic: null,
            musicbrainz: null,
            isrc: null
        })
    },

    // Chemins et fichiers
    filePath: {
        type: 'TEXT',
        nullable: true // null si piste streaming uniquement
    },
    fileSize: {
        type: 'BIGINT',
        nullable: true
    },
    fileFormat: {
        type: 'VARCHAR(10)',
        nullable: true // mp3, flac, wav, etc.
    },
    bitrate: {
        type: 'INTEGER',
        nullable: true
    },
    sampleRate: {
        type: 'INTEGER',
        nullable: true
    },

    // URLs streaming
    streamingUrls: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            spotify: null,
            deezer: null,
            youtubeMusic: null,
            preview: null // URL de preview 30s
        })
    },

    // Artwork
    artwork: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            small: null,  // 300x300
            medium: null, // 640x640
            large: null   // 1280x1280
        })
    },

    // Caractéristiques audio (pour recommandations)
    audioFeatures: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            danceability: null,    // 0.0 - 1.0
            energy: null,          // 0.0 - 1.0
            key: null,             // 0-11 (C, C#, D, etc.)
            loudness: null,        // dB
            mode: null,            // 0 = minor, 1 = major
            speechiness: null,     // 0.0 - 1.0
            acousticness: null,    // 0.0 - 1.0
            instrumentalness: null, // 0.0 - 1.0
            liveness: null,        // 0.0 - 1.0
            valence: null,         // 0.0 - 1.0 (musical positiveness)
            tempo: null,           // BPM
            timeSignature: null    // 3, 4, 5, 6, 7
        })
    },

    // Statistiques d'écoute globales
    playStats: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            totalPlays: 0,
            totalPlaytime: 0, // temps total écouté en secondes
            uniqueListeners: 0,
            skipRate: 0.0, // pourcentage de skips
            averagePlayDuration: 0, // durée moyenne d'écoute
            lastPlayed: null,
            popularity: 0 // score de popularité 0-100
        })
    },

    // Tags et humeur
    tags: {
        type: 'JSONB',
        defaultValue: JSON.stringify([])
    },
    mood: {
        type: 'VARCHAR(50)',
        nullable: true // happy, sad, energetic, calm, etc.
    },

    // Source et synchronisation
    source: {
        type: 'VARCHAR(50)',
        nullable: false,
        defaultValue: 'local' // local, spotify, deezer, youtube, lidarr
    },
    syncStatus: {
        type: 'VARCHAR(20)',
        defaultValue: 'synced' // synced, pending, error
    },
    lastSyncAt: {
        type: 'TIMESTAMP',
        nullable: true
    },

    // Métadonnées système
    isActive: {
        type: 'BOOLEAN',
        defaultValue: true
    },
    isExplicit: {
        type: 'BOOLEAN',
        defaultValue: false
    },
    addedBy: {
        type: 'UUID',
        nullable: true,
        references: 'users(id)'
    },
    createdAt: {
        type: 'TIMESTAMP',
        defaultValue: 'CURRENT_TIMESTAMP'
    },
    updatedAt: {
        type: 'TIMESTAMP',
        defaultValue: 'CURRENT_TIMESTAMP'
    }
};

// Index pour optimiser les requêtes
const trackIndexes = [
    'CREATE INDEX idx_tracks_title ON tracks (title)',
    'CREATE INDEX idx_tracks_artist ON tracks (artist)',
    'CREATE INDEX idx_tracks_album ON tracks (album)',
    'CREATE INDEX idx_tracks_genre ON tracks (genre)',
    'CREATE INDEX idx_tracks_year ON tracks (year)',
    'CREATE INDEX idx_tracks_duration ON tracks (duration)',
    'CREATE INDEX idx_tracks_source ON tracks (source)',
    'CREATE INDEX idx_tracks_active ON tracks (isActive)',
    'CREATE INDEX idx_tracks_created_at ON tracks (createdAt)',
    'CREATE INDEX idx_tracks_external_ids ON tracks USING GIN (externalIds)',
    'CREATE INDEX idx_tracks_audio_features ON tracks USING GIN (audioFeatures)',
    'CREATE INDEX idx_tracks_play_stats ON tracks USING GIN (playStats)',
    'CREATE INDEX idx_tracks_tags ON tracks USING GIN (tags)',
    'CREATE TEXT SEARCH INDEX idx_tracks_search ON tracks USING GIN (to_tsvector(\'french\', title || \' \' || artist || \' \' || COALESCE(album, \'\')))'
];

module.exports = {
    schema: trackSchema,
    indexes: trackIndexes,
    tableName: 'tracks'
};
