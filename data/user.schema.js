// User Schema - Profils utilisateur, préférences et tokens d'authentification
const userSchema = {
    id: {
        type: 'UUID',
        primaryKey: true,
        defaultValue: 'uuid_generate_v4()'
    },
    email: {
        type: 'VARCHAR(255)',
        unique: true,
        nullable: false
    },
    username: {
        type: 'VARCHAR(100)',
        unique: true,
        nullable: false
    },
    displayName: {
        type: 'VARCHAR(255)',
        nullable: true
    },
    profilePicture: {
        type: 'TEXT',
        nullable: true
    },

    // Préférences utilisateur
    preferences: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            autoPlay: true,
            shuffle: false,
            repeat: 'none', // 'none', 'one', 'all'
            volume: 0.8,
            audioQuality: 'high', // 'low', 'medium', 'high'
            theme: 'dark', // 'light', 'dark', 'auto'
            language: 'fr',
            notifications: {
                newRecommendations: true,
                playlistUpdates: true,
                systemUpdates: false
            }
        })
    },

    // Configuration des services connectés
    connectedServices: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            spotify: { connected: false, userId: null, lastSync: null },
            deezer: { connected: false, userId: null, lastSync: null },
            youtubeMusic: { connected: false, userId: null, lastSync: null },
            lidarr: { connected: false, lastSync: null }
        })
    },

    // Tokens d'authentification (chiffrés)
    authTokens: {
        type: 'JSONB',
        nullable: true,
        // Structure: { service: { accessToken, refreshToken, expiresAt } }
    },

    // Statistiques d'écoute
    listeningStats: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            totalTracks: 0,
            totalPlaytime: 0, // en secondes
            averageSessionLength: 0,
            favoriteGenres: [],
            topArtists: [],
            listeningPatterns: {
                byHour: Array(24).fill(0),
                byDay: Array(7).fill(0),
                byMonth: Array(12).fill(0)
            }
        })
    },

    // Métadonnées
    isActive: {
        type: 'BOOLEAN',
        defaultValue: true
    },
    emailVerified: {
        type: 'BOOLEAN',
        defaultValue: false
    },
    lastLoginAt: {
        type: 'TIMESTAMP',
        nullable: true
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
const userIndexes = [
    'CREATE INDEX idx_users_email ON users (email)',
    'CREATE INDEX idx_users_username ON users (username)',
    'CREATE INDEX idx_users_active ON users (isActive)',
    'CREATE INDEX idx_users_created_at ON users (createdAt)',
    'CREATE INDEX idx_users_connected_services ON users USING GIN (connectedServices)'
];

module.exports = {
    schema: userSchema,
    indexes: userIndexes,
    tableName: 'users'
};
