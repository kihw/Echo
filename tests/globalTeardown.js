const pool = require('../database/connection');

module.exports = async () => {
    console.log('Tearing down test environment...');

    try {
        // Nettoyer les données de test si nécessaire

        // Fermer la connexion à la base de données
        await pool.end();
        console.log('Database connection closed');

    } catch (error) {
        console.error('Error during teardown:', error);
    }
};
