// Artist Schema - Informations artiste, synchronisation Lidarr et similarités
const artistSchema = {
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
    sortName: {
        type: 'VARCHAR(255)',
        nullable: true // pour le tri (ex: "Beatles, The")
    },
    disambiguation: {
        type: 'VARCHAR(255)',
        nullable: true // pour différencier les homonymes
    },

    // Identifiants externes
    externalIds: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            musicbrainz: null,
            spotify: null,
            deezer: null,
            allmusic: null,
            discogs: null,
            lastfm: null,
            wikidata: null,
            lidarr: null
        })
    },

    // Informations biographiques
    biography: {
        type: 'TEXT',
        nullable: true
    },
    country: {
        type: 'VARCHAR(100)',
        nullable: true
    },
    city: {
        type: 'VARCHAR(100)',
        nullable: true
    },

    // Dates importantes
    beginDate: {
        type: 'DATE',
        nullable: true // formation/naissance
    },
    endDate: {
        type: 'DATE',
        nullable: true // séparation/décès
    },

    // Type d'artiste
    type: {
        type: 'VARCHAR(50)',
        defaultValue: 'person'
        // person, group, orchestra, choir, character, other
    },
    gender: {
        type: 'VARCHAR(20)',
        nullable: true
        // male, female, other (pour les personnes)
    },

    // Genres musicaux
    genres: {
        type: 'JSONB',
        defaultValue: JSON.stringify([])
    },
    primaryGenre: {
        type: 'VARCHAR(100)',
        nullable: true
    },

    // Images et visuels
    images: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            profile: null,    // photo principale
            banner: null,     // bannière
            gallery: [],      // galerie d'images
            fanart: []        // fan art
        })
    },

    // Statistiques et popularité
    stats: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            totalTracks: 0,
            totalAlbums: 0,
            totalPlaytime: 0, // temps total d'écoute en secondes
            uniqueListeners: 0,
            popularity: 0, // score 0-100
            monthlyListeners: 0,
            followerCount: 0,
            averageRating: 0
        })
    },

    // Analyse des similarités
    similarities: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            similar: [], // [{ artistId, score, reasons: [] }]
            influences: [], // artistes qui ont influencé
            influenced: [], // artistes influencés
            collaborations: [], // collaborations fréquentes
            lastCalculated: null
        })
    },

    // Caractéristiques audio moyennes (calculées)
    audioProfile: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            danceability: null,
            energy: null,
            valence: null,
            acousticness: null,
            instrumentalness: null,
            loudness: null,
            speechiness: null,
            tempo: null,
            key: null,
            mode: null,
            lastCalculated: null,
            trackCount: 0 // nombre de pistes utilisées pour le calcul
        })
    },

    // Informations Lidarr
    lidarrInfo: {
        type: 'JSONB',
        nullable: true,
        // Structure: { 
        //   id, 
        //   monitored, 
        //   qualityProfile, 
        //   metadataProfile, 
        //   path, 
        //   albums: [],
        //   statistics: {},
        //   lastSync: timestamp 
        // }
    },

    // Tags et labels
    tags: {
        type: 'JSONB',
        defaultValue: JSON.stringify([])
    },
    labels: {
        type: 'JSONB',
        defaultValue: JSON.stringify([])
        // maisons de disques associées
    },

    // Réseaux sociaux et liens
    links: {
        type: 'JSONB',
        defaultValue: JSON.stringify({
            website: null,
            wikipedia: null,
            youtube: null,
            twitter: null,
            instagram: null,
            facebook: null,
            soundcloud: null,
            bandcamp: null
        })
    },

    // État et synchronisation
    isActive: {
        type: 'BOOLEAN',
        defaultValue: true
    },
    isVerified: {
        type: 'BOOLEAN',
        defaultValue: false
    },
    syncStatus: {
        type: 'VARCHAR(20)',
        defaultValue: 'pending'
        // pending, synced, error, manual
    },
    lastSyncAt: {
        type: 'TIMESTAMP',
        nullable: true
    },
    dataQuality: {
        type: 'INTEGER',
        defaultValue: 0
        // score de qualité des données 0-100
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

// Index pour optimiser les requêtes
const artistIndexes = [
    'CREATE INDEX idx_artists_name ON artists (name)',
    'CREATE INDEX idx_artists_sort_name ON artists (sortName)',
    'CREATE INDEX idx_artists_type ON artists (type)',
    'CREATE INDEX idx_artists_primary_genre ON artists (primaryGenre)',
    'CREATE INDEX idx_artists_country ON artists (country)',
    'CREATE INDEX idx_artists_begin_date ON artists (beginDate)',
    'CREATE INDEX idx_artists_active ON artists (isActive)',
    'CREATE INDEX idx_artists_verified ON artists (isVerified)',
    'CREATE INDEX idx_artists_sync_status ON artists (syncStatus)',
    'CREATE INDEX idx_artists_data_quality ON artists (dataQuality)',
    'CREATE INDEX idx_artists_created_at ON artists (createdAt)',
    'CREATE INDEX idx_artists_external_ids ON artists USING GIN (externalIds)',
    'CREATE INDEX idx_artists_genres ON artists USING GIN (genres)',
    'CREATE INDEX idx_artists_tags ON artists USING GIN (tags)',
    'CREATE INDEX idx_artists_similarities ON artists USING GIN (similarities)',
    'CREATE TEXT SEARCH INDEX idx_artists_search ON artists USING GIN (to_tsvector(\'french\', name || \' \' || COALESCE(sortName, \'\') || \' \' || COALESCE(biography, \'\')))',

    // Index pour les statistiques
    'CREATE INDEX idx_artists_popularity ON artists ((stats->>\'popularity\')::numeric)',
    'CREATE INDEX idx_artists_total_tracks ON artists ((stats->>\'totalTracks\')::numeric)'
];

// Vues pour les requêtes fréquentes
const artistViews = [
    `CREATE VIEW popular_artists AS
   SELECT 
     a.*,
     (a.stats->>'popularity')::numeric as popularity_score,
     (a.stats->>'totalTracks')::numeric as track_count
   FROM artists a
   WHERE a.isActive = true 
   ORDER BY (a.stats->>'popularity')::numeric DESC`,

    `CREATE VIEW similar_artists_view AS
   SELECT 
     a1.id as artist_id,
     a1.name as artist_name,
     similarity_data.value->>'artistId' as similar_artist_id,
     a2.name as similar_artist_name,
     (similarity_data.value->>'score')::numeric as similarity_score
   FROM artists a1,
        jsonb_array_elements(a1.similarities->'similar') as similarity_data
   JOIN artists a2 ON a2.id::text = similarity_data.value->>'artistId'
   WHERE a1.isActive = true AND a2.isActive = true`
];

module.exports = {
    schema: artistSchema,
    indexes: artistIndexes,
    views: artistViews,
    tableName: 'artists'
};
