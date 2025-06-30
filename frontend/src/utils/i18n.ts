/**
 * Configuration d'internationalisation pour Echo Music Player
 */

export const defaultLocale = 'en' as const;
export const locales = ['en', 'fr'] as const;

export type Locale = typeof locales[number];

export const translations = {
    en: {
        // Navigation
        nav: {
            dashboard: 'Dashboard',
            search: 'Search',
            playlists: 'Playlists',
            stats: 'Statistics',
            sync: 'Sync',
            settings: 'Settings',
            profile: 'Profile'
        },

        // Authentication
        auth: {
            login: 'Login',
            register: 'Register',
            logout: 'Logout',
            email: 'Email',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            name: 'Name',
            forgotPassword: 'Forgot Password?',
            dontHaveAccount: 'Don\'t have an account?',
            alreadyHaveAccount: 'Already have an account?',
            loginSuccess: 'Successfully logged in',
            loginError: 'Login failed. Please check your credentials.',
            registerSuccess: 'Account created successfully',
            registerError: 'Registration failed. Please try again.'
        },

        // Player
        player: {
            play: 'Play',
            pause: 'Pause',
            next: 'Next track',
            previous: 'Previous track',
            shuffle: 'Shuffle',
            repeat: 'Repeat',
            volume: 'Volume',
            mute: 'Mute',
            unmute: 'Unmute',
            currentTime: 'Current time',
            duration: 'Duration',
            nowPlaying: 'Now Playing',
            addToPlaylist: 'Add to Playlist',
            removeFromPlaylist: 'Remove from Playlist'
        },

        // Search
        search: {
            placeholder: 'Search for music, artists, albums...',
            results: 'Search Results',
            noResults: 'No results found',
            loading: 'Searching...',
            filters: 'Filters',
            all: 'All',
            tracks: 'Tracks',
            artists: 'Artists',
            albums: 'Albums',
            playlists: 'Playlists',
            duration: 'Duration',
            service: 'Service'
        },

        // Playlists
        playlists: {
            create: 'Create Playlist',
            edit: 'Edit Playlist',
            delete: 'Delete Playlist',
            name: 'Playlist Name',
            description: 'Description',
            tracks: 'tracks',
            empty: 'This playlist is empty',
            addTracks: 'Add Tracks',
            save: 'Save',
            cancel: 'Cancel',
            deleteConfirm: 'Are you sure you want to delete this playlist?'
        },

        // Stats
        stats: {
            title: 'Your Music Statistics',
            listeningTime: 'Listening Time',
            topTracks: 'Top Tracks',
            topArtists: 'Top Artists',
            topGenres: 'Top Genres',
            recentActivity: 'Recent Activity',
            thisWeek: 'This Week',
            thisMonth: 'This Month',
            allTime: 'All Time',
            hours: 'hours',
            minutes: 'minutes',
            plays: 'plays'
        },

        // Common
        common: {
            loading: 'Loading...',
            error: 'An error occurred',
            retry: 'Retry',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            add: 'Add',
            remove: 'Remove',
            close: 'Close',
            back: 'Back',
            next: 'Next',
            previous: 'Previous',
            settings: 'Settings',
            darkMode: 'Dark Mode',
            lightMode: 'Light Mode'
        },

        // Accessibility
        a11y: {
            skipToContent: 'Skip to main content',
            openMenu: 'Open menu',
            closeMenu: 'Close menu',
            playMusic: 'Play music',
            pauseMusic: 'Pause music',
            volumeControl: 'Volume control',
            progressBar: 'Progress bar',
            searchInput: 'Search input',
            userMenu: 'User menu',
            navigationMenu: 'Navigation menu'
        }
    },

    fr: {
        // Navigation
        nav: {
            dashboard: 'Tableau de bord',
            search: 'Recherche',
            playlists: 'Playlists',
            stats: 'Statistiques',
            sync: 'Synchronisation',
            settings: 'Paramètres',
            profile: 'Profil'
        },

        // Authentication
        auth: {
            login: 'Connexion',
            register: 'Inscription',
            logout: 'Déconnexion',
            email: 'Email',
            password: 'Mot de passe',
            confirmPassword: 'Confirmer le mot de passe',
            name: 'Nom',
            forgotPassword: 'Mot de passe oublié ?',
            dontHaveAccount: 'Vous n\'avez pas de compte ?',
            alreadyHaveAccount: 'Vous avez déjà un compte ?',
            loginSuccess: 'Connexion réussie',
            loginError: 'Échec de la connexion. Vérifiez vos identifiants.',
            registerSuccess: 'Compte créé avec succès',
            registerError: 'Échec de l\'inscription. Veuillez réessayer.'
        },

        // Player
        player: {
            play: 'Jouer',
            pause: 'Pause',
            next: 'Piste suivante',
            previous: 'Piste précédente',
            shuffle: 'Lecture aléatoire',
            repeat: 'Répéter',
            volume: 'Volume',
            mute: 'Muet',
            unmute: 'Activer le son',
            currentTime: 'Temps actuel',
            duration: 'Durée',
            nowPlaying: 'En cours de lecture',
            addToPlaylist: 'Ajouter à la playlist',
            removeFromPlaylist: 'Retirer de la playlist'
        },

        // Search
        search: {
            placeholder: 'Rechercher de la musique, des artistes, des albums...',
            results: 'Résultats de recherche',
            noResults: 'Aucun résultat trouvé',
            loading: 'Recherche en cours...',
            filters: 'Filtres',
            all: 'Tout',
            tracks: 'Pistes',
            artists: 'Artistes',
            albums: 'Albums',
            playlists: 'Playlists',
            duration: 'Durée',
            service: 'Service'
        },

        // Playlists
        playlists: {
            create: 'Créer une playlist',
            edit: 'Modifier la playlist',
            delete: 'Supprimer la playlist',
            name: 'Nom de la playlist',
            description: 'Description',
            tracks: 'pistes',
            empty: 'Cette playlist est vide',
            addTracks: 'Ajouter des pistes',
            save: 'Enregistrer',
            cancel: 'Annuler',
            deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cette playlist ?'
        },

        // Stats
        stats: {
            title: 'Vos statistiques musicales',
            listeningTime: 'Temps d\'écoute',
            topTracks: 'Top des pistes',
            topArtists: 'Top des artistes',
            topGenres: 'Top des genres',
            recentActivity: 'Activité récente',
            thisWeek: 'Cette semaine',
            thisMonth: 'Ce mois-ci',
            allTime: 'Depuis toujours',
            hours: 'heures',
            minutes: 'minutes',
            plays: 'lectures'
        },

        // Common
        common: {
            loading: 'Chargement...',
            error: 'Une erreur est survenue',
            retry: 'Réessayer',
            save: 'Enregistrer',
            cancel: 'Annuler',
            delete: 'Supprimer',
            edit: 'Modifier',
            add: 'Ajouter',
            remove: 'Retirer',
            close: 'Fermer',
            back: 'Retour',
            next: 'Suivant',
            previous: 'Précédent',
            settings: 'Paramètres',
            darkMode: 'Mode sombre',
            lightMode: 'Mode clair'
        },

        // Accessibility
        a11y: {
            skipToContent: 'Aller au contenu principal',
            openMenu: 'Ouvrir le menu',
            closeMenu: 'Fermer le menu',
            playMusic: 'Jouer la musique',
            pauseMusic: 'Mettre en pause',
            volumeControl: 'Contrôle du volume',
            progressBar: 'Barre de progression',
            searchInput: 'Champ de recherche',
            userMenu: 'Menu utilisateur',
            navigationMenu: 'Menu de navigation'
        }
    }
} as const;
