-- Migration pour créer la table sync_history
-- Cette table stocke l'historique des synchronisations

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

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_sync_history_user_id ON sync_history (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON sync_history (status);
CREATE INDEX IF NOT EXISTS idx_sync_history_sync_type ON sync_history (sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_history_service ON sync_history (service_name);
CREATE INDEX IF NOT EXISTS idx_sync_history_started_at ON sync_history (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_completed_at ON sync_history (completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_history_user_service ON sync_history (user_id, service_name, completed_at DESC);

-- Index pour les requêtes complexes
CREATE INDEX IF NOT EXISTS idx_sync_history_user_recent ON sync_history (user_id, started_at DESC) 
    WHERE status IN ('completed', 'completed_with_errors');

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

-- Fonction pour nettoyer l'historique ancien (garder seulement les 100 dernières entrées par utilisateur)
CREATE OR REPLACE FUNCTION cleanup_sync_history()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Pour chaque utilisateur, garder seulement les 100 dernières synchronisations
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

-- Commentaires pour la documentation
COMMENT ON TABLE sync_history IS 'Historique des synchronisations avec les services externes';
COMMENT ON COLUMN sync_history.sync_type IS 'Type de synchronisation: full, incremental, service_specific';
COMMENT ON COLUMN sync_history.service_name IS 'Nom du service synchronisé ou all pour synchronisation complète';
COMMENT ON COLUMN sync_history.status IS 'Statut: in_progress, completed, failed, completed_with_errors';
COMMENT ON COLUMN sync_history.details IS 'Détails JSON spécifiques à chaque service et type de sync';
COMMENT ON FUNCTION cleanup_sync_history() IS 'Nettoie l\'historique en gardant les 100 dernières entrées par utilisateur';
