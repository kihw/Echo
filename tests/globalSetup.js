const pool = require('../database/connection');

module.exports = async () => {
    console.log('Setting up test environment...');

    try {
        // Vérifier la connexion à la base de données
        await pool.query('SELECT 1');
        console.log('Database connection established for tests');

        // Créer les tables de test si nécessaire
        // (En production, cela serait fait via les migrations)

    } catch (error) {
        console.error('Failed to setup test environment:', error);
        process.exit(1);
    }
};
