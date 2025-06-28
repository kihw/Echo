# 🎵 Echo

**Lecteur web de musique intelligent avec synchronisation multi-plateforme et recommandations personnalisées**

## 📝 Description générale

Echo est un lecteur web de musique intelligent, conçu pour synchroniser, centraliser et enrichir la bibliothèque musicale personnelle d'un utilisateur en s'appuyant sur :

- **Habitudes réelles d'écoute** - Analyse de vos comportements musicaux
- **Import de comptes tiers** - Spotify, YouTube Music, Deezer
- **Recommandations dynamiques** - Fournies par Lidarr et Lidarr Extended

Echo permet également de générer automatiquement des playlists logiques, inspirées de l'approche des "Mix Spotify", mais selon des **règles explicites, transparentes et personnalisables**.

## 🎯 Objectifs fonctionnels

### 1. 🎧 Lecteur web de musique
- Lecture de fichiers musicaux stockés localement ou en streaming
- Support des formats standards (MP3, FLAC, AAC…)
- Fonctions de lecture de base : play, pause, skip, file d'attente
- Suivi des morceaux écoutés, durée, skips, répétitions

### 2. 🔗 Connexion à Lidarr et Lidarr Extended
- Requête automatique à Lidarr pour :
  - Connaître les artistes déjà présents
  - Découvrir des artistes similaires
- Utilisation de Lidarr Extended pour enrichir les recommandations par :
  - Genres
  - Connexions sémantiques
  - Proximité artistique

### 3. 📱 Import multi-plateforme
Authentification OAuth sécurisée pour :
- **Spotify** (API officielle)
- **Deezer** (API officielle)
- **YouTube Music** (via ytmusicapi ou script local)

**Récupération des données utilisateur :**
- Playlists
- Titres likés
- Historique d'écoute (si disponible)
- Artistes suivis
- Stockage et fusion des données importées dans une bibliothèque unifiée

### 4. 📊 Historique et profil d'écoute local
- Enregistrement des sessions d'écoute (morceaux, durée, sauts)
- Génération d'un profil utilisateur musical dynamique :
  - Genres dominants
  - Artistes récurrents
  - Patterns d'écoute (heures, durées, moods…)

### 5. 🤖 Générateur de playlists intelligentes

Inspiré des "Mix Spotify", mais basé sur des **règles logiques maîtrisables** :

#### 🔧 Critères de génération :
- Durée cible définie (ex. 30 min, 1h)
- Énergie croissante ou stable
- Cohérence de genre
- Alternance nouveauté / récurrence
- Éviter les doublons
- Pondération par fréquence d'écoute réelle
- Intégration d'artistes similaires proposés par Lidarr

#### 🧠 Exemple de règles :
- Ne jamais répéter un artiste plus de 1 fois par mix
- Si un morceau a été joué moins de 30 sec plusieurs fois → exclusion
- Si un genre représente >60% des titres écoutés récemment → surpondération
- Priorité aux morceaux déjà présents en local, sinon ajout via Lidarr

## 🏗️ Stack technique

| Domaine | Technologie |
|---------|-------------|
| **Frontend** | React.js / Next.js |
| **Backend API** | Node.js (Express) ou Python (FastAPI) |
| **Authentification** | OAuth 2.0 (Spotify, Deezer, Google) |
| **Base de données** | PostgreSQL (ou MongoDB selon besoin) |
| **Gestion musique** | Lidarr (via API REST) |
| **Recommandations** | Lidarr Extended + logique maison |
| **Import données** | Spotify API, Deezer API, ytmusicapi |

## 📁 Structure du projet

```
/echo
├── /frontend              # lecteur + config utilisateur
├── /backend
│   ├── /routes
│   │   ├── auth/
│   │   ├── user/
│   │   └── playlist/
│   ├── /services
│   │   ├── spotify.js
│   │   ├── deezer.js
│   │   ├── ytmusic.js
│   │   └── lidarr.js
│   └── /logic
│       └── playlistBuilder.js
├── /data
│   ├── user.schema.js
│   ├── track.schema.js
│   └── history.schema.js
└── /config
    └── secrets.env
```

## ✅ Résultats attendus

- **Application web musicale** personnelle et intelligente
- **Bibliothèque musicale enrichie** de façon continue et cohérente
- **Playlists logiques** explicables, pertinentes et évolutives
- **Indépendance progressive** des plateformes tierces
- **Système transparent** où l'utilisateur contrôle réellement ses recommandations

## 🚀 Installation et configuration

```bash
# Cloner le dépôt
git clone https://github.com/kihw/Echo.git
cd Echo

# Installation des dépendances
npm install

# Configuration
cp config/secrets.env.example config/secrets.env
# Éditer secrets.env avec vos clés API

# Lancement en développement
npm run dev
```

## 🔧 Configuration requise

### APIs tierces
- **Spotify API** : Client ID et Client Secret
- **Deezer API** : Application ID et Secret Key
- **YouTube Music** : Authentification Google OAuth2

### Services externes
- **Lidarr** : URL et clé API
- **Lidarr Extended** : Configuration et endpoints

## 📖 Documentation

- [Configuration détaillée](docs/CONFIGURATION.md)
- [Guide d'utilisation](docs/USAGE.md)
- [API Reference](docs/API.md)
- [Développement](docs/DEVELOPMENT.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez consulter le [guide de contribution](CONTRIBUTING.md) pour plus de détails.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🎼 Vision

Echo vise à redonner le contrôle à l'utilisateur sur sa découverte musicale, en combinant :
- La puissance des algorithmes modernes
- La transparence des règles de recommandation
- La propriété des données personnelles
- L'enrichissement continu de la bibliothèque locale

---

**Made with ❤️ for music lovers who want to own their listening experience**