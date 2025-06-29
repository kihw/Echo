-- Migration pour le système de recommandations et synchronisation
-- Version: 003_recommendations_and_sync.sql

-- Table pour l'analyse des caractéristiques audio
CREATE TABLE IF NOT EXISTS audio_features (
    id SERIAL PRIMARY KEY,
    track_id VARCHAR(255) NOT NULL,
    service VARCHAR(50) NOT NULL,
    
    -- Caractéristiques audio Spotify
    tempo DECIMAL(8,3),
    energy DECIMAL(5,3),
    valence DECIMAL(5,3),
    danceability DECIMAL(5,3),
    acousticness DECIMAL(5,3),
    instrumentalness DECIMAL(5,3),
    liveness DECIMAL(5,3),
    speechiness DECIMAL(5,3),
    loudness DECIMAL(6,3),
    key INTEGER,
    mode INTEGER,
    duration_ms INTEGER,
    
    -- Métadonnées enrichies
    popularity INTEGER,
    explicit BOOLEAN DEFAULT FALSE,
    genres JSONB,
    
    -- Scores calculés
    energy_score DECIMAL(5,3),
    mood VARCHAR(50),
    contexts JSONB,
    
    -- Métadonnées
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(track_id, service)
);

CREATE INDEX idx_audio_features_track_service ON audio_features(track_id, service);
CREATE INDEX idx_audio_features_mood ON audio_features(mood);
CREATE INDEX idx_audio_features_energy_score ON audio_features(energy_score);

-- Table pour les profils utilisateur
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Préférences musicales
    top_genres JSONB,
    average_features JSONB,
    top_artists JSONB,
    top_tracks JSONB,
    preferred_contexts JSONB,
    
    -- Métadonnées
    built_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Table pour l'historique des recommandations
CREATE TABLE IF NOT EXISTS recommendation_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    track_id VARCHAR(255) NOT NULL,
    service VARCHAR(50) NOT NULL,
    
    -- Contexte de la recommandation
    recommendation_type VARCHAR(50), -- daily_mix, mood, context, similar
    recommendation_context JSONB,
    
    -- Feedback utilisateur
    rating DECIMAL(3,1), -- 1-5 étoiles
    action VARCHAR(50), -- like, dislike, skip, play, add_to_playlist
    feedback_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    recommended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX(user_id, recommended_at),
    INDEX(track_id, service),
    INDEX(recommendation_type)
);

-- Table pour les mappings entre services
CREATE TABLE IF NOT EXISTS sync_mappings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Service source et cible
    service_type VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    internal_id VARCHAR(255) NOT NULL,
    
    -- Type d'entité
    entity_type VARCHAR(50) NOT NULL, -- playlist, track, artist, album
    
    -- Métadonnées de mapping
    confidence_score DECIMAL(5,3) DEFAULT 1.0,
    mapping_method VARCHAR(50), -- exact_match, fuzzy_match, manual
    
    -- Horodatage
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, service_type, external_id, entity_type)
);

CREATE INDEX idx_sync_mappings_user_service ON sync_mappings(user_id, service_type);
CREATE INDEX idx_sync_mappings_entity ON sync_mappings(entity_type, internal_id);

-- Table pour l'historique de synchronisation
CREATE TABLE IF NOT EXISTS sync_history (
    id SERIAL PRIMARY KEY,
    sync_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Configuration de la synchronisation
    sync_type VARCHAR(50) NOT NULL, -- manual, auto, scheduled
    services JSONB NOT NULL,
    options JSONB,
    
    -- Résultats
    status VARCHAR(50) NOT NULL, -- success, error, partial, in_progress
    results JSONB,
    conflicts JSONB,
    statistics JSONB,
    
    -- Durée et timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Détails d'erreur
    error_details TEXT,
    
    INDEX(user_id, started_at),
    INDEX(sync_id),
    INDEX(status)
);

-- Table pour les conflits de synchronisation
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id SERIAL PRIMARY KEY,
    sync_id VARCHAR(100) REFERENCES sync_history(sync_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Détails du conflit
    conflict_type VARCHAR(50) NOT NULL, -- playlist_conflict, favorite_conflict, etc.
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    
    -- Services en conflit
    services JSONB NOT NULL,
    conflict_data JSONB NOT NULL,
    
    -- Résolution
    resolved BOOLEAN DEFAULT FALSE,
    resolution_strategy VARCHAR(50),
    resolution_data JSONB,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(50), -- auto, manual
    
    -- Métadonnées
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX(user_id, resolved),
    INDEX(conflict_type),
    INDEX(resolved, detected_at)
);

-- Table pour les tâches de synchronisation programmées
CREATE TABLE IF NOT EXISTS sync_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Configuration de la programmation
    frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    time_of_day TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Configuration de synchronisation
    services JSONB NOT NULL,
    sync_options JSONB,
    
    -- État
    active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Table pour les playlists auto-générées
CREATE TABLE IF NOT EXISTS auto_playlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Configuration de la playlist
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- daily_mix, mood_based, context_based, discovery
    
    -- Critères de génération
    criteria JSONB NOT NULL,
    
    -- Métadonnées
    track_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE,
    auto_update BOOLEAN DEFAULT TRUE,
    update_frequency VARCHAR(20) DEFAULT 'daily',
    
    -- Références externes
    service_playlists JSONB, -- IDs des playlists créées sur les services
    
    -- Horodatage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX(user_id, type),
    INDEX(auto_update, last_updated)
);

-- Table pour les tracks des playlists auto-générées
CREATE TABLE IF NOT EXISTS auto_playlist_tracks (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER REFERENCES auto_playlists(id) ON DELETE CASCADE,
    track_id VARCHAR(255) NOT NULL,
    service VARCHAR(50) NOT NULL,
    
    -- Position et métadonnées
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recommendation_score DECIMAL(5,3),
    
    -- Raison de l'inclusion
    inclusion_reason VARCHAR(100),
    
    UNIQUE(playlist_id, track_id, service),
    INDEX(playlist_id, position)
);

-- Table pour les sessions d'écoute
CREATE TABLE IF NOT EXISTS listening_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Contexte de la session
    context VARCHAR(50), -- workout, study, party, chill, commute
    device_type VARCHAR(50),
    location JSONB,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Statistiques
    tracks_played INTEGER DEFAULT 0,
    skips_count INTEGER DEFAULT 0,
    
    INDEX(user_id, started_at),
    INDEX(context)
);

-- Table pour les tracks jouées dans les sessions
CREATE TABLE IF NOT EXISTS session_tracks (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES listening_sessions(session_id) ON DELETE CASCADE,
    track_id VARCHAR(255) NOT NULL,
    service VARCHAR(50) NOT NULL,
    
    -- Détails de lecture
    played_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_played_ms INTEGER,
    total_duration_ms INTEGER,
    completion_rate DECIMAL(5,3), -- 0-1
    
    -- Actions utilisateur
    liked BOOLEAN,
    skipped BOOLEAN,
    added_to_playlist BOOLEAN,
    
    INDEX(session_id, played_at),
    INDEX(track_id, service)
);

-- Fonctions pour les triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_mappings_updated_at BEFORE UPDATE ON sync_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_schedules_updated_at BEFORE UPDATE ON sync_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_playlists_updated_at BEFORE UPDATE ON auto_playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vues pour les statistiques
CREATE OR REPLACE VIEW user_sync_stats AS
SELECT 
    user_id,
    COUNT(*) as total_syncs,
    COUNT(*) FILTER (WHERE status = 'success') as successful_syncs,
    COUNT(*) FILTER (WHERE status = 'error') as failed_syncs,
    AVG(duration_ms) as avg_duration_ms,
    MAX(started_at) as last_sync_at
FROM sync_history
GROUP BY user_id;

CREATE OR REPLACE VIEW user_recommendation_stats AS
SELECT 
    user_id,
    COUNT(*) as total_recommendations,
    COUNT(*) FILTER (WHERE action = 'like') as liked_count,
    COUNT(*) FILTER (WHERE action = 'dislike') as disliked_count,
    COUNT(*) FILTER (WHERE action = 'skip') as skipped_count,
    AVG(rating) as avg_rating
FROM recommendation_history
WHERE feedback_at IS NOT NULL
GROUP BY user_id;

-- Index additionnels pour les performances
CREATE INDEX idx_listening_sessions_user_date ON listening_sessions(user_id, started_at DESC);
CREATE INDEX idx_session_tracks_completion ON session_tracks(completion_rate) WHERE completion_rate >= 0.8;
CREATE INDEX idx_auto_playlists_auto_update ON auto_playlists(auto_update, last_updated) WHERE auto_update = true;
