-- Echo Music Player Database Initialization
-- Combines migrations 001 and 002

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour recherche textuelle française
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    profile_picture TEXT,
    preferences JSONB DEFAULT '{"autoPlay": true, "shuffle": false, "repeat": "none", "volume": 0.8, "audioQuality": "high", "theme": "dark", "language": "fr", "notifications": {"newRecommendations": true, "playlistUpdates": true, "systemUpdates": false}}',
    connected_services JSONB DEFAULT '{"spotify": {"connected": false, "userId": null, "lastSync": null}, "deezer": {"connected": false, "userId": null, "lastSync": null}, "youtubeMusic": {"connected": false, "userId": null, "lastSync": null}, "lidarr": {"connected": false, "lastSync": null}}',
    auth_tokens JSONB,
    listening_stats JSONB DEFAULT '{"totalTracks": 0, "totalPlaytime": 0, "averageSessionLength": 0, "favoriteGenres": [], "topArtists": [], "listeningPatterns": {"byHour": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "byDay": [0,0,0,0,0,0,0], "byMonth": [0,0,0,0,0,0,0,0,0,0,0,0]}}',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des artistes
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sort_name VARCHAR(255),
    disambiguation VARCHAR(255),
    external_ids JSONB DEFAULT '{"musicbrainz": null, "spotify": null, "deezer": null, "allmusic": null, "discogs": null, "lastfm": null, "wikidata": null, "lidarr": null}',
    biography TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    begin_date DATE,
    end_date DATE,
    type VARCHAR(50) DEFAULT 'person',
    gender VARCHAR(20),
    genres JSONB DEFAULT '[]',
    primary_genre VARCHAR(100),
    images JSONB DEFAULT '{"profile": null, "banner": null, "gallery": [], "fanart": []}',
    stats JSONB DEFAULT '{"totalTracks": 0, "totalAlbums": 0, "totalPlaytime": 0, "uniqueListeners": 0, "popularity": 0, "monthlyListeners": 0, "followerCount": 0, "averageRating": 0}',
    similarities JSONB DEFAULT '{"similar": [], "influences": [], "influenced": [], "collaborations": [], "lastCalculated": null}',
    audio_profile JSONB DEFAULT '{"danceability": null, "energy": null, "valence": null, "acousticness": null, "instrumentalness": null, "loudness": null, "speechiness": null, "tempo": null, "key": null, "mode": null, "lastCalculated": null, "trackCount": 0}',
    lidarr_info JSONB,
    tags JSONB DEFAULT '[]',
    labels JSONB DEFAULT '[]',
    links JSONB DEFAULT '{"website": null, "wikipedia": null, "youtube": null, "twitter": null, "instagram": null, "facebook": null, "soundcloud": null, "bandcamp": null}',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    sync_status VARCHAR(20) DEFAULT 'pending',
    last_sync_at TIMESTAMP,
    data_quality INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des pistes
CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    artist VARCHAR(500) NOT NULL,
    album VARCHAR(500),
    album_artist VARCHAR(500),
    genre VARCHAR(100),
    year INTEGER,
    track_number INTEGER,
    disc_number INTEGER,
    duration INTEGER NOT NULL,
    external_ids JSONB DEFAULT '{"spotify": null, "deezer": null, "youtubeMusic": null, "musicbrainz": null, "isrc": null}',
    file_path TEXT,
    file_size BIGINT,
    file_format VARCHAR(10),
    bitrate INTEGER,
    sample_rate INTEGER,
    streaming_urls JSONB DEFAULT '{"spotify": null, "deezer": null, "youtubeMusic": null, "preview": null}',
    artwork JSONB DEFAULT '{"small": null, "medium": null, "large": null}',
    audio_features JSONB DEFAULT '{"danceability": null, "energy": null, "key": null, "loudness": null, "mode": null, "speechiness": null, "acousticness": null, "instrumentalness": null, "liveness": null, "valence": null, "tempo": null, "timeSignature": null}',
    play_stats JSONB DEFAULT '{"totalPlays": 0, "totalPlaytime": 0, "uniqueListeners": 0, "skipRate": 0.0, "averagePlayDuration": 0, "lastPlayed": null, "popularity": 0}',
    tags JSONB DEFAULT '[]',
    mood VARCHAR(50),
    source VARCHAR(50) NOT NULL DEFAULT 'local',
    sync_status VARCHAR(20) DEFAULT 'synced',
    last_sync_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_explicit BOOLEAN DEFAULT false,
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des playlists
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    is_collaborative BOOLEAN DEFAULT false,
    type VARCHAR(50) NOT NULL DEFAULT 'manual',
    smart_config JSONB,
    generation_rules JSONB DEFAULT '{"maxTracks": 50, "minTracks": 10, "targetDuration": 3600, "genres": [], "excludeGenres": [], "artists": [], "excludeArtists": [], "yearRange": {"min": null, "max": null}, "durationRange": {"min": 60, "max": 600}, "audioFeatures": {"danceability": {"min": null, "max": null}, "energy": {"min": null, "max": null}, "valence": {"min": null, "max": null}, "tempo": {"min": null, "max": null}}, "popularityRange": {"min": 0, "max": 100}, "includeRecentlyPlayed": true, "includeRecentlySkipped": false, "discoveryRatio": 0.3, "recentPlaysPeriod": 30, "excludeRecentlyPlayed": false, "shuffleOrder": true, "artistDiversity": "medium", "genreDiversity": "medium", "autoUpdate": false, "updateFrequency": "weekly", "lastUpdated": null}',
    mood VARCHAR(50),
    context JSONB DEFAULT '{"timeOfDay": null, "activity": null, "weather": null, "season": null, "location": null}',
    artwork JSONB DEFAULT '{"url": null, "color": "#1db954", "gradient": null, "isGenerated": true}',
    stats JSONB DEFAULT '{"totalTracks": 0, "totalDuration": 0, "totalPlays": 0, "uniqueListeners": 0, "averageRating": 0, "lastPlayed": null, "creationMethod": "manual"}',
    version_history JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    category VARCHAR(50),
    source VARCHAR(50) DEFAULT 'echo',
    external_id VARCHAR(255),
    sync_status VARCHAR(20) DEFAULT 'local',
    last_sync_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison playlist-tracks
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_by UUID REFERENCES users(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{"reason": "manual", "confidence": null, "ruleMatched": null}'
);

-- Table de l'historique d'écoute
CREATE TABLE IF NOT EXISTS listening_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    play_duration INTEGER NOT NULL DEFAULT 0,
    track_duration INTEGER NOT NULL,
    completion_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    action_type VARCHAR(20) NOT NULL DEFAULT 'play',
    play_context JSONB DEFAULT '{"source": "library", "playlistId": null, "shuffleMode": false, "repeatMode": "none", "device": "web", "sessionId": null}',
    queue_position INTEGER,
    skip_info JSONB,
    location JSONB,
    tech_info JSONB DEFAULT '{"userAgent": null, "ip": null, "audioQuality": "high", "volume": 0.8, "bufferHealth": null, "errors": []}',
    engagement_score DECIMAL(3,2),
    user_feedback JSONB,
    session_id UUID,
    session_sequence INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour l'historique des synchronisations
CREATE TABLE IF NOT EXISTS sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Type de synchronisation
    sync_type VARCHAR(50) NOT NULL DEFAULT 'full', -- 'full', 'incremental', 'service_specific'
    service_name VARCHAR(50), -- 'spotify', 'deezer', 'youtube', 'lidarr', 'all' pour sync complète
    
    -- Statut de la synchronisation
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'completed_with_errors'
    
    -- Métriques de synchronisation
    items_processed INTEGER DEFAULT 0,
    items_added INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    
    -- Informations temporelles
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER, -- durée en millisecondes
    
    -- Détails et erreurs
    error_message TEXT,
    details JSONB, -- détails spécifiques à chaque service
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour users
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);
CREATE INDEX IF NOT EXISTS idx_users_connected_services ON users USING GIN (connected_services);

-- Index pour artists
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists (name);
CREATE INDEX IF NOT EXISTS idx_artists_sort_name ON artists (sort_name);
CREATE INDEX IF NOT EXISTS idx_artists_type ON artists (type);
CREATE INDEX IF NOT EXISTS idx_artists_primary_genre ON artists (primary_genre);
CREATE INDEX IF NOT EXISTS idx_artists_country ON artists (country);
CREATE INDEX IF NOT EXISTS idx_artists_active ON artists (is_active);
CREATE INDEX IF NOT EXISTS idx_artists_external_ids ON artists USING GIN (external_ids);
CREATE INDEX IF NOT EXISTS idx_artists_genres ON artists USING GIN (genres);
CREATE INDEX IF NOT EXISTS idx_artists_search ON artists USING GIN (to_tsvector('french', name || ' ' || COALESCE(sort_name, '') || ' ' || COALESCE(biography, '')));

-- Index pour tracks
CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks (title);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks (artist);
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks (album);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks (genre);
CREATE INDEX IF NOT EXISTS idx_tracks_year ON tracks (year);
CREATE INDEX IF NOT EXISTS idx_tracks_duration ON tracks (duration);
CREATE INDEX IF NOT EXISTS idx_tracks_source ON tracks (source);
CREATE INDEX IF NOT EXISTS idx_tracks_active ON tracks (is_active);
CREATE INDEX IF NOT EXISTS idx_tracks_external_ids ON tracks USING GIN (external_ids);
CREATE INDEX IF NOT EXISTS idx_tracks_audio_features ON tracks USING GIN (audio_features);
CREATE INDEX IF NOT EXISTS idx_tracks_search ON tracks USING GIN (to_tsvector('french', title || ' ' || artist || ' ' || COALESCE(album, '')));

-- Index pour playlists
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists (user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_type ON playlists (type);
CREATE INDEX IF NOT EXISTS idx_playlists_public ON playlists (is_public);
CREATE INDEX IF NOT EXISTS idx_playlists_active ON playlists (is_active);
CREATE INDEX IF NOT EXISTS idx_playlists_tags ON playlists USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_playlists_search ON playlists USING GIN (to_tsvector('french', name || ' ' || COALESCE(description, '')));

-- Index pour playlist_tracks
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks (playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks (track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks (playlist_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS idx_playlist_tracks_unique ON playlist_tracks (playlist_id, track_id, position);

-- Index pour listening_history
CREATE INDEX IF NOT EXISTS idx_history_user_id ON listening_history (user_id);
CREATE INDEX IF NOT EXISTS idx_history_track_id ON listening_history (track_id);
CREATE INDEX IF NOT EXISTS idx_history_played_at ON listening_history (played_at);
CREATE INDEX IF NOT EXISTS idx_history_user_played_at ON listening_history (user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_action_type ON listening_history (action_type);
CREATE INDEX IF NOT EXISTS idx_history_session_id ON listening_history (session_id);

-- Index pour sync_history
CREATE INDEX IF NOT EXISTS idx_sync_history_user_id ON sync_history (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON sync_history (status);
CREATE INDEX IF NOT EXISTS idx_sync_history_sync_type ON sync_history (sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_history_service ON sync_history (service_name);
CREATE INDEX IF NOT EXISTS idx_sync_history_started_at ON sync_history (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_completed_at ON sync_history (completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_user_service ON sync_history (user_id, service_name, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_user_recent ON sync_history (user_id, started_at DESC) 
    WHERE status IN ('completed', 'completed_with_errors');

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables appropriées
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vue pour les statistiques de synchronisation
CREATE OR REPLACE VIEW sync_statistics AS
SELECT 
    user_id,
    service_name,
    COUNT(*) as total_syncs,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_syncs,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_syncs,
    COUNT(CASE WHEN status = 'completed_with_errors' THEN 1 END) as partial_syncs,
    AVG(duration_ms) as avg_duration_ms,
    SUM(items_added) as total_items_added,
    SUM(items_updated) as total_items_updated,
    MAX(completed_at) as last_successful_sync,
    MIN(started_at) as first_sync
FROM sync_history
WHERE completed_at IS NOT NULL
GROUP BY user_id, service_name;

-- Fonction pour nettoyer l'historique ancien
CREATE OR REPLACE FUNCTION cleanup_sync_history()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT user_id FROM sync_history
    LOOP
        WITH old_syncs AS (
            SELECT id 
            FROM sync_history 
            WHERE user_id = user_record.user_id
            ORDER BY started_at DESC 
            OFFSET 100
        )
        DELETE FROM sync_history 
        WHERE id IN (SELECT id FROM old_syncs);
        
        GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insertion de données de test
INSERT INTO users (email, username, display_name) VALUES 
('admin@echo.com', 'admin', 'Echo Admin'),
('demo@echo.com', 'demo', 'Demo User'),
('test@echo.com', 'test', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Données de test pour les artistes
INSERT INTO artists (name, primary_genre, country) VALUES 
('The Beatles', 'Rock', 'UK'),
('Miles Davis', 'Jazz', 'USA'),
('Daft Punk', 'Electronic', 'France')
ON CONFLICT DO NOTHING;

-- Données de test pour les pistes
INSERT INTO tracks (title, artist, album, genre, year, duration) VALUES 
('Yesterday', 'The Beatles', 'Help!', 'Rock', 1965, 125),
('Kind of Blue', 'Miles Davis', 'Kind of Blue', 'Jazz', 1959, 562),
('One More Time', 'Daft Punk', 'Discovery', 'Electronic', 2001, 320)
ON CONFLICT DO NOTHING;

COMMENT ON SCHEMA public IS 'Echo Music Player Database - Version 1.1 (with sync_history)';
