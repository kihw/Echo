# Plan TODO - Echo

## 📋 Vue d'ensemble
Lecteur web de musique intelligent avec synchronisation multi-plateforme et recommandations personnalisées basé sur Lidarr et services tiers.

---

## 🏗️ Infrastructure & Configuration

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| ✅ DONE | CREATE | package.json | Config | CRITICAL | Low | Complete | NPM config with all dependencies | N/A |
| ✅ DONE | CREATE | config/secrets.env.example | Config | CRITICAL | Low | Complete | Template for API keys and configs | N/A |
| ✅ DONE | CREATE | config/secrets.env | Config | CRITICAL | Low | Complete | Local environment variables | N/A |
| ✅ DONE | CREATE | docker-compose.yml | Config | HIGH | Medium | Complete | Containerized development environment | N/A |
| ✅ DONE | CREATE | .gitignore | Config | HIGH | Low | Complete | Ignore node_modules, env files, logs | N/A |
| TODO | CREATE | .env.example | Config | HIGH | Low | Missing | Environment variables template | N/A |

---

## 🗄️ Base de données & Schémas

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| ✅ DONE | CREATE | data/user.schema.js | Schema | CRITICAL | Medium | Complete | User profile, preferences, auth tokens | tests/schemas/user.test.js |
| ✅ DONE | CREATE | data/track.schema.js | Schema | CRITICAL | Medium | Complete | Track metadata, file paths, stats | tests/schemas/track.test.js |
| ✅ DONE | CREATE | data/history.schema.js | Schema | CRITICAL | Medium | Complete | Listening history, skips, duration | tests/schemas/history.test.js |
| ✅ DONE | CREATE | data/playlist.schema.js | Schema | HIGH | Medium | Complete | Generated playlists, rules, metadata | tests/schemas/playlist.test.js |
| ✅ DONE | CREATE | data/artist.schema.js | Schema | HIGH | Medium | Complete | Artist info, Lidarr sync, similarities | tests/schemas/artist.test.js |
| ✅ DONE | CREATE | migrations/001_initial_setup.sql | Migration | CRITICAL | Medium | Complete | Database initialization script | N/A |
| ✅ DONE | CREATE | database/connection.js | Database | CRITICAL | Medium | Complete | PostgreSQL connection pool | tests/database/connection.test.js |

---

## 🔐 Authentification & Sécurité

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| ✅ DONE | CREATE | backend/routes/auth/spotify.js | Auth | CRITICAL | High | Complete | Spotify OAuth2 flow | tests/auth/spotify.test.js |
| ✅ DONE | CREATE | backend/routes/auth/deezer.js | Auth | CRITICAL | High | Complete | Deezer OAuth2 flow | tests/auth/deezer.test.js |
| ✅ DONE | CREATE | backend/routes/auth/google.js | Auth | CRITICAL | High | Complete | YouTube Music OAuth2 flow | tests/auth/google.test.js |
| ✅ DONE | CREATE | backend/middleware/auth.js | Middleware | CRITICAL | Medium | Complete | JWT validation middleware | tests/middleware/auth.test.js |
| ✅ DONE | CREATE | backend/services/tokenManager.js | Service | CRITICAL | Medium | Complete | Token refresh, storage, encryption | tests/services/tokenManager.test.js |

---

## 🎵 Services d'import musical

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| ✅ DONE | CREATE | backend/services/spotify.js | Service | CRITICAL | High | Complete | Spotify API client, playlists import | tests/services/spotify.test.js |
| ✅ DONE | CREATE | backend/services/deezer.js | Service | CRITICAL | High | Complete | Deezer API client, favorites import | tests/services/deezer.test.js |
| ✅ DONE | CREATE | backend/services/ytmusic.js | Service | HIGH | High | Complete | YouTube Music API via ytmusicapi | tests/services/ytmusic.test.js |
| ✅ DONE | CREATE | backend/services/lidarr.js | Service | CRITICAL | High | Complete | Lidarr API client, artists sync | tests/services/lidarr.test.js |
| ✅ DONE | CREATE | backend/services/dataSync.js | Service | HIGH | High | Complete | Unified data synchronization service | tests/services/dataSync.test.js |

---

## 🧠 Logique de recommandations

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| ✅ DONE | CREATE | backend/logic/playlistBuilder.js | Logic | CRITICAL | High | Complete | Smart playlist generation engine | tests/logic/playlistBuilder.test.js |
| TODO | CREATE | backend/logic/profileAnalyzer.js | Logic | HIGH | High | Missing | User listening profile analysis | tests/logic/profileAnalyzer.test.js |
| TODO | CREATE | backend/logic/similarityEngine.js | Logic | HIGH | High | Missing | Artist/track similarity calculations | tests/logic/similarityEngine.test.js |
| TODO | CREATE | backend/logic/ruleEngine.js | Logic | HIGH | Medium | Missing | Configurable playlist generation rules | tests/logic/ruleEngine.test.js |
| TODO | CREATE | backend/logic/moodDetector.js | Logic | MEDIUM | High | Missing | Audio feature-based mood detection | tests/logic/moodDetector.test.js |

---

## 🌐 API Routes & Controllers

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| ✅ DONE | CREATE | backend/routes/user/profile.js | Route | CRITICAL | Medium | Complete | User profile CRUD operations | tests/routes/user.test.js |
| TODO | CREATE | backend/routes/user/history.js | Route | HIGH | Medium | Missing | Listening history endpoints | tests/routes/history.test.js |
| ✅ DONE | CREATE | backend/routes/playlist/generate.js | Route | CRITICAL | Medium | Complete | Playlist generation endpoints | tests/routes/playlist.test.js |
| TODO | CREATE | backend/routes/playlist/manage.js | Route | HIGH | Medium | Missing | Playlist CRUD operations | tests/routes/playlist.test.js |
| ✅ DONE | CREATE | backend/routes/music/player.js | Route | CRITICAL | Medium | Complete | Music player control endpoints | tests/routes/player.test.js |
| ✅ DONE | CREATE | backend/routes/sync/import.js | Route | HIGH | Medium | Complete | Data import from external services | tests/routes/sync.test.js |
| ✅ DONE | CREATE | backend/app.js | Main | CRITICAL | Medium | Complete | Express app setup, middleware config | tests/app.test.js |

---

## 🎨 Frontend - Interface utilisateur

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| TODO | CREATE | frontend/package.json | Config | CRITICAL | Low | Missing | React/Next.js dependencies | N/A |
| TODO | CREATE | frontend/src/components/Player/AudioPlayer.jsx | Component | CRITICAL | High | Missing | Main audio player component | tests/components/AudioPlayer.test.jsx |
| TODO | CREATE | frontend/src/components/Player/PlayQueue.jsx | Component | HIGH | Medium | Missing | Play queue management | tests/components/PlayQueue.test.jsx |
| TODO | CREATE | frontend/src/components/Player/Controls.jsx | Component | HIGH | Medium | Missing | Player controls (play, pause, skip) | tests/components/Controls.test.jsx |
| TODO | CREATE | frontend/src/components/Library/TrackList.jsx | Component | HIGH | Medium | Missing | Music library display | tests/components/TrackList.test.jsx |
| TODO | CREATE | frontend/src/components/Playlists/PlaylistGenerator.jsx | Component | CRITICAL | High | Missing | Smart playlist generation UI | tests/components/PlaylistGenerator.test.jsx |
| TODO | CREATE | frontend/src/components/Settings/ServiceConnection.jsx | Component | HIGH | Medium | Missing | OAuth service connection UI | tests/components/ServiceConnection.test.jsx |
| TODO | CREATE | frontend/src/components/Dashboard/ListeningStats.jsx | Component | MEDIUM | Medium | Missing | User listening statistics display | tests/components/ListeningStats.test.jsx |

---

## 📱 Frontend - Pages & Navigation

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| TODO | CREATE | frontend/src/pages/index.js | Page | CRITICAL | Medium | Missing | Home page with player | tests/pages/index.test.js |
| TODO | CREATE | frontend/src/pages/library.js | Page | HIGH | Medium | Missing | Music library page | tests/pages/library.test.js |
| TODO | CREATE | frontend/src/pages/playlists.js | Page | HIGH | Medium | Missing | Playlists management page | tests/pages/playlists.test.js |
| TODO | CREATE | frontend/src/pages/settings.js | Page | HIGH | Medium | Missing | Settings and connections page | tests/pages/settings.test.js |
| TODO | CREATE | frontend/src/pages/auth/callback.js | Page | CRITICAL | Medium | Missing | OAuth callback handler | tests/pages/auth.test.js |
| TODO | CREATE | frontend/src/contexts/PlayerContext.js | Context | CRITICAL | Medium | Missing | Global player state management | tests/contexts/PlayerContext.test.js |
| TODO | CREATE | frontend/src/contexts/AuthContext.js | Context | CRITICAL | Medium | Missing | Authentication state management | tests/contexts/AuthContext.test.js |

---

## 🔧 Services Frontend

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| TODO | CREATE | frontend/src/services/api.js | Service | CRITICAL | Medium | Missing | API client with auth headers | tests/services/api.test.js |
| TODO | CREATE | frontend/src/services/audioEngine.js | Service | CRITICAL | High | Missing | Web Audio API integration | tests/services/audioEngine.test.js |
| TODO | CREATE | frontend/src/services/storageManager.js | Service | HIGH | Medium | Missing | Local storage for user preferences | tests/services/storageManager.test.js |
| TODO | CREATE | frontend/src/hooks/usePlayer.js | Hook | HIGH | Medium | Missing | Custom hook for player logic | tests/hooks/usePlayer.test.js |
| TODO | CREATE | frontend/src/hooks/usePlaylist.js | Hook | HIGH | Medium | Missing | Custom hook for playlist operations | tests/hooks/usePlaylist.test.js |

---

## 🧪 Tests & Qualité

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| TODO | CREATE | tests/setup.js | Test | HIGH | Low | Missing | Jest/testing setup configuration | N/A |
| TODO | CREATE | tests/helpers/mockData.js | Test | HIGH | Medium | Missing | Mock data for API responses | N/A |
| TODO | CREATE | tests/integration/playlistGeneration.test.js | Test | HIGH | High | Missing | End-to-end playlist generation tests | N/A |
| TODO | CREATE | tests/integration/serviceSync.test.js | Test | HIGH | High | Missing | External service synchronization tests | N/A |
| ✅ DONE | CREATE | .eslintrc.js | Config | MEDIUM | Low | Complete | ESLint configuration | N/A |
| ✅ DONE | CREATE | .prettierrc | Config | MEDIUM | Low | Complete | Prettier code formatting | N/A |

---

## 📚 Documentation

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| TODO | CREATE | docs/CONFIGURATION.md | Doc | HIGH | Medium | Missing | Detailed setup and configuration guide | N/A |
| TODO | CREATE | docs/USAGE.md | Doc | HIGH | Medium | Missing | User guide and feature explanation | N/A |
| TODO | CREATE | docs/API.md | Doc | HIGH | Medium | Missing | Complete API documentation | N/A |
| TODO | CREATE | docs/DEVELOPMENT.md | Doc | MEDIUM | Medium | Missing | Developer setup and contribution guide | N/A |
| TODO | CREATE | CONTRIBUTING.md | Doc | MEDIUM | Low | Missing | Contribution guidelines | N/A |
| TODO | CREATE | LICENSE | Doc | MEDIUM | Low | Missing | MIT license file | N/A |

---

## 🚀 Déploiement & Production

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|--------|------|------|----------|------------|---------------|--------------|-----------------| 
| TODO | CREATE | Dockerfile | Deploy | MEDIUM | Medium | Missing | Production container configuration | N/A |
| TODO | CREATE | docker-compose.prod.yml | Deploy | MEDIUM | Medium | Missing | Production deployment setup | N/A |
| TODO | CREATE | scripts/deploy.sh | Script | MEDIUM | Low | Missing | Automated deployment script | N/A |
| TODO | CREATE | nginx.conf | Config | MEDIUM | Low | Missing | Reverse proxy configuration | N/A |

---

## 📊 Résumé des priorités

### 🔴 CRITICAL (Bloquant pour le MVP)
- Configuration de base (package.json, env)
- Schémas de base de données 
- Authentification OAuth pour services tiers
- Lecteur audio principal
- Générateur de playlists intelligent
- API routes essentielles

### 🟡 HIGH (Fonctionnalités clés)
- Services d'import complets
- Interface utilisateur complète  
- Logique de recommandations avancée
- Tests d'intégration
- Documentation utilisateur

### 🟢 MEDIUM/LOW (Améliorations)
- Fonctionnalités avancées (mood detection)
- Tests unitaires exhaustifs
- Configuration de déploiement
- Documentation développeur

---

## 🎯 Prochaines étapes recommandées

1. **Phase 1** : Infrastructure (CRITICAL) - Configuration, BDD, Auth
2. **Phase 2** : Core Features (CRITICAL) - Player, API, Services
3. **Phase 3** : Intelligence (HIGH) - Recommandations, Playlists
4. **Phase 4** : Polish (MEDIUM) - UI/UX, Tests, Documentation

**Estimation totale : 3-4 mois de développement à temps plein**