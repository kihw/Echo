// History Schema - Historique d'écoute, skips et durées d'écoute
const historySchema = {
    id: {
        type: 'UUID',
        primaryKey: true,
        defaultValue: 'uuid_generate_v4()'
    },

    // Relations
    userId: {
        type: 'UUID',
        nullable: false,
        references: 'users(id)',
        onDelete: 'CASCADE'
    },
    trackId: {
        type: 'UUID',
        nullable: false,
        references: 'tracks(id)',
        onDelete: 'CASCADE'
    },

    // Informations de lecture
    playedAt: {
        type: 'TIMESTAMP',
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP'
    },
    playDuration: {
        type: 'INTEGER', // durée écoutée en secondes
        nullable: false,
        defaultValue: 0
    },
    trackDuration: {
        type: 'INTEGER', // durée totale de la piste au moment de l'écoute
        nullable: false
    },
    completionRate: {
        type: 'DECIMAL(5,4)', // pourcentage d'écoute (0.0000 - 1.0000)
        nullable: false,
        defaultValue: 0.0
    },

    // Type d'action
    actionType: {
        type: 'VARCHAR(20)',
        nullable: false,
        defaultValue: 'play'
        // 'play', 'skip', 'pause', 'seek', 'complete'
    },

    // Contexte d'écoute
    playContext: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            source: 'library', // library, playlist, radio, search, recommendation
            playlistId: null,
            shuffleMode: false,
            repeatMode: 'none', // none, one, all
            device: 'web', // web, mobile, desktop
            sessionId: null
        })
    },

    // Position dans la queue
    queuePosition: {
        type: 'INTEGER',
        nullable: true
    },

    // Informations sur le skip (si applicable)
    skipInfo: {
        type: 'JSONB',
        nullable: true,
        // Structure: { reason: 'user'|'auto', skipAt: seconds, skipType: 'next'|'previous' }
    },

    // Géolocalisation (optionnelle, avec consentement)
    location: {
        type: 'JSONB',
        nullable: true,
        // Structure: { country: 'FR', city: 'Paris', lat: null, lon: null }
    },

    // Informations techniques
    techInfo: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            userAgent: null,
            ip: null, // hashé pour privacy
            audioQuality: 'high',
            volume: 0.8,
            bufferHealth: null, // pour analyser les problèmes de streaming
            errors: [] // erreurs durant la lecture
        })
    },

    // Score d'engagement (calculé)
    engagementScore: {
        type: 'DECIMAL(3,2)', // 0.00 - 1.00
        nullable: true
        // Calculé basé sur durée d'écoute, interactions, contexte, etc.
    },

    // Feedback utilisateur
    userFeedback: {
        type: 'JSONB',
        nullable: true,
        // Structure: { liked: boolean, disliked: boolean, rating: 1-5, tags: [] }
    },

    // Session d'écoute
    sessionId: {
        type: 'UUID',
        nullable: true
    },
    sessionSequence: {
        type: 'INTEGER',
        nullable: true // position dans la session
    },

    // Métadonnées
    createdAt: {
        type: 'TIMESTAMP',
        defaultValue: 'CURRENT_TIMESTAMP'
    }
};

// Index pour optimiser les requêtes
const historyIndexes = [
    'CREATE INDEX idx_history_user_id ON listening_history (userId)',
    'CREATE INDEX idx_history_track_id ON listening_history (trackId)',
    'CREATE INDEX idx_history_played_at ON listening_history (playedAt)',
    'CREATE INDEX idx_history_user_played_at ON listening_history (userId, playedAt DESC)',
    'CREATE INDEX idx_history_action_type ON listening_history (actionType)',
    'CREATE INDEX idx_history_completion_rate ON listening_history (completionRate)',
    'CREATE INDEX idx_history_session_id ON listening_history (sessionId)',
    'CREATE INDEX idx_history_engagement_score ON listening_history (engagementScore)',
    'CREATE INDEX idx_history_play_context ON listening_history USING GIN (playContext)',

    // Index composites pour les requêtes complexes
    'CREATE INDEX idx_history_user_track_recent ON listening_history (userId, trackId, playedAt DESC)',
    'CREATE INDEX idx_history_daily_stats ON listening_history (userId, DATE(playedAt), actionType)',
    'CREATE INDEX idx_history_session_sequence ON listening_history (sessionId, sessionSequence)'
];

// Vues matérialisées pour les statistiques
const historyViews = [
    `CREATE MATERIALIZED VIEW daily_listening_stats AS
   SELECT 
     userId,
     DATE(playedAt) as date,
     COUNT(*) as total_plays,
     COUNT(DISTINCT trackId) as unique_tracks,
     SUM(playDuration) as total_duration,
     AVG(completionRate) as avg_completion_rate,
     COUNT(CASE WHEN actionType = 'skip' THEN 1 END) as total_skips,
     COUNT(CASE WHEN completionRate > 0.8 THEN 1 END) as completed_tracks
   FROM listening_history 
   WHERE actionType IN ('play', 'complete', 'skip')
   GROUP BY userId, DATE(playedAt)`,

    `CREATE MATERIALIZED VIEW track_popularity AS
   SELECT 
     trackId,
     COUNT(*) as play_count,
     COUNT(DISTINCT userId) as unique_listeners,
     AVG(completionRate) as avg_completion_rate,
     AVG(engagementScore) as avg_engagement,
     MAX(playedAt) as last_played
   FROM listening_history 
   WHERE actionType IN ('play', 'complete')
   GROUP BY trackId`
];

module.exports = {
    schema: historySchema,
    indexes: historyIndexes,
    views: historyViews,
    tableName: 'listening_history'
};
