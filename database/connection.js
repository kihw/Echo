const { Pool } = require('pg');
require('dotenv').config({ path: './config/secrets.env' });

// Configuration de la connexion PostgreSQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'echo_music',
    user: process.env.DB_USER || 'echo_user',
    password: process.env.DB_PASSWORD || 'echo_password_123',

    // Configuration du pool de connexions
    max: 20, // nombre maximum de connexions dans le pool
    idleTimeoutMillis: 30000, // temps avant qu'une connexion inactive soit fermée
    connectionTimeoutMillis: 2000, // temps d'attente pour une nouvelle connexion

    // Configuration SSL pour la production
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,

    // Configuration des requêtes
    statement_timeout: 30000, // timeout des requêtes (30 secondes)
    query_timeout: 30000,

    // Gestion des erreurs de connexion
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
};

// Création du pool de connexions
const pool = new Pool(dbConfig);

// Gestion des événements du pool
pool.on('connect', (client) => {
    console.log('📊 Nouvelle connexion à la base de données établie');

    // Configuration de la session pour chaque nouvelle connexion
    client.query(`
    SET timezone = 'UTC';
    SET search_path = public;
    SET statement_timeout = '30s';
  `).catch(err => {
        console.error('❌ Erreur lors de la configuration de session:', err);
    });
});

pool.on('error', (err, client) => {
    console.error('❌ Erreur de connexion à la base de données:', err);

    // Tentative de reconnexion en cas d'erreur
    setTimeout(() => {
        console.log('🔄 Tentative de reconnexion...');
    }, 5000);
});

pool.on('acquire', (client) => {
    console.log('🔗 Connexion acquise du pool');
});

pool.on('remove', (client) => {
    console.log('🔌 Connexion supprimée du pool');
});

// Fonction de test de connexion
async function testConnection() {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT NOW(), version() as db_version');
            console.log('✅ Connexion à la base de données réussie');
            console.log(`📅 Timestamp serveur: ${result.rows[0].now}`);
            console.log(`🏷️  Version PostgreSQL: ${result.rows[0].db_version.split(' ')[1]}`);
            return true;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Échec de la connexion à la base de données:', error.message);
        return false;
    }
}

// Fonction pour exécuter une requête avec gestion d'erreur
async function query(text, params = []) {
    const startTime = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - startTime;

        if (process.env.LOG_LEVEL === 'debug') {
            console.log('🔍 Query executed:', {
                query: text.substring(0, 100) + '...',
                duration: `${duration}ms`,
                rows: result.rowCount
            });
        }

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error('❌ Erreur de requête:', {
            query: text.substring(0, 100) + '...',
            error: error.message,
            duration: `${duration}ms`,
            params: params.length > 0 ? 'avec paramètres' : 'sans paramètres'
        });
        throw error;
    }
}

// Fonction pour exécuter une transaction
async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Fonction pour obtenir les statistiques du pool
function getPoolStats() {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
    };
}

// Fonction de fermeture propre
async function closePool() {
    try {
        await pool.end();
        console.log('🔒 Pool de connexions fermé proprement');
    } catch (error) {
        console.error('❌ Erreur lors de la fermeture du pool:', error);
    }
}

// Gestion de l'arrêt propre de l'application
process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt de l\'application en cours...');
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Arrêt de l\'application demandé...');
    await closePool();
    process.exit(0);
});

// Fonctions utilitaires pour les requêtes communes
const db = {
    // Requête simple
    query,

    // Transaction
    transaction,

    // Test de connexion
    testConnection,

    // Statistiques du pool
    getStats: getPoolStats,

    // Fermeture
    close: closePool,

    // Requêtes préparées communes
    findById: async (table, id) => {
        const result = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        return result.rows[0] || null;
    },

    findMany: async (table, conditions = {}, limit = 100, offset = 0) => {
        let queryText = `SELECT * FROM ${table}`;
        const params = [];

        if (Object.keys(conditions).length > 0) {
            const whereClause = Object.keys(conditions).map((key, index) => {
                params.push(conditions[key]);
                return `${key} = $${index + 1}`;
            }).join(' AND ');
            queryText += ` WHERE ${whereClause}`;
        }

        queryText += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows;
    },

    create: async (table, data) => {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

        const queryText = `
      INSERT INTO ${table} (${keys.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;

        const result = await query(queryText, values);
        return result.rows[0];
    },

    update: async (table, id, data) => {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');

        const queryText = `
      UPDATE ${table} 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;

        const result = await query(queryText, [id, ...values]);
        return result.rows[0];
    },

    delete: async (table, id) => {
        const result = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
        return result.rows[0];
    },

    // Recherche textuelle
    search: async (table, searchTerm, columns = ['*'], limit = 50) => {
        const columnStr = columns.join(', ');
        const queryText = `
      SELECT ${columnStr}, ts_rank_cd(search_vector, plainto_tsquery('french', $1)) as rank
      FROM ${table}
      WHERE search_vector @@ plainto_tsquery('french', $1)
      ORDER BY rank DESC
      LIMIT $2
    `;

        const result = await query(queryText, [searchTerm, limit]);
        return result.rows;
    }
};

module.exports = db;
