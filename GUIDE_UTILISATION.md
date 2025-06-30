# 🎵 GUIDE D'UTILISATION - NOUVELLES FONCTIONNALITÉS ECHO

## 🚀 **DÉMARRAGE RAPIDE**

### **1. Lancer l'application**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### **2. Accéder à l'interface**
- **Dashboard principal** : http://localhost:3000/dashboard
- **Page de test** : http://localhost:3000/test

---

## 🎨 **SYSTÈME DE THÈME**

### **Utilisation dans un composant React**
```tsx
import { useTheme, useThemeClasses } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/theme/ThemeToggle';

function MonComposant() {
  const { theme, resolvedTheme } = useTheme();
  const themeClasses = useThemeClasses();
  
  return (
    <div className={themeClasses.bgPrimary}>
      <h1 className={themeClasses.textPrimary}>Mon titre</h1>
      <ThemeToggle variant="button" />
    </div>
  );
}
```

### **Variantes du ThemeToggle**
- `variant="button"` : Bouton simple avec icône
- `variant="dropdown"` : Menu déroulant avec options
- `variant="compact"` : Version minimaliste

---

## 🧠 **RECOMMANDATIONS PERSONNALISÉES**

### **Utilisation du hook**
```tsx
import { useRecommendations } from '../hooks/useRecommendations';

function Recommandations() {
  const {
    recommendations,
    loading,
    error,
    refreshRecommendations,
    analyzeTrack,
    provideFeedback
  } = useRecommendations({
    limit: 20,
    mood: 'energetic',
    context: 'workout'
  });

  // Feedback utilisateur
  const handleLike = (trackId) => {
    provideFeedback(trackId, 'like');
  };

  return (
    <div>
      {recommendations.map(track => (
        <TrackCard 
          key={track.id} 
          track={track}
          onLike={() => handleLike(track.id)}
        />
      ))}
    </div>
  );
}
```

### **API Backend**
```javascript
// Obtenir des recommandations
GET /api/recommendations?limit=20&mood=energetic&context=workout

// Recommandations par contexte
GET /api/recommendations/context/workout

// Analyser une track
POST /api/recommendations/analyze
{
  "trackId": "track_123",
  "audioFile": "base64_audio_data"
}

// Feedback utilisateur
POST /api/recommendations/feedback
{
  "trackId": "track_123",
  "type": "like",
  "context": "workout"
}
```

---

## 🔄 **SYNCHRONISATION MULTI-SERVICES**

### **Utilisation du hook**
```tsx
import { useSync } from '../hooks/useSync';

function SyncPanel() {
  const {
    syncStatus,
    syncHistory,
    conflicts,
    loading,
    startFullSync,
    startServiceSync,
    resolveConflict,
    isSyncInProgress
  } = useSync();

  const handleSyncAll = () => {
    startFullSync({
      services: ['spotify', 'deezer', 'ytmusic'],
      syncPlaylists: true,
      syncFavorites: true,
      resolveConflicts: true
    });
  };

  const handleResolveConflict = (conflictId) => {
    resolveConflict(conflictId, 'source'); // 'source', 'target', ou 'merge'
  };

  return (
    <div>
      <button onClick={handleSyncAll} disabled={isSyncInProgress}>
        {isSyncInProgress ? 'Sync en cours...' : 'Synchroniser tout'}
      </button>
      
      {conflicts.map(conflict => (
        <ConflictCard 
          key={conflict.id}
          conflict={conflict}
          onResolve={handleResolveConflict}
        />
      ))}
    </div>
  );
}
```

### **API Backend**
```javascript
// Synchronisation complète
POST /api/sync/full
{
  "services": ["spotify", "deezer", "ytmusic"],
  "syncPlaylists": true,
  "syncFavorites": true,
  "resolveConflicts": true
}

// Synchronisation des playlists uniquement
POST /api/sync/playlists
{
  "services": ["spotify", "deezer"],
  "bidirectional": true
}

// Statut de synchronisation
GET /api/sync/status/:syncId

// Historique
GET /api/sync/history?limit=10

// Conflits
GET /api/sync/conflicts

// Résolution de conflit
POST /api/sync/conflicts/:conflictId/resolve
{
  "resolution": "source",
  "strategy": "overwrite"
}
```

---

## 🛠️ **DÉVELOPPEMENT ET EXTENSION**

### **Ajouter une nouvelle source de recommandations**
1. **Backend** : Étendre `recommendation.js`
```javascript
// Dans services/recommendation.js
async function getContextualRecommendations(userId, context, options = {}) {
  switch(context) {
    case 'nouveau_contexte':
      return await getNouvelleSouceRecommendations(userId, options);
    // ...
  }
}
```

2. **Frontend** : Utiliser le hook existant
```tsx
const { recommendations } = useRecommendations({
  context: 'nouveau_contexte',
  limit: 15
});
```

### **Ajouter un nouveau service de synchronisation**
1. **Backend** : Créer un nouveau service dans `services/`
```javascript
// services/nouveauService.js
class NouveauService {
  async getPlaylists() { /* ... */ }
  async syncPlaylist() { /* ... */ }
}
```

2. **Intégrer dans** `unifiedSync.js`
```javascript
// Dans services/unifiedSync.js
const nouveauService = require('./nouveauService');

const services = {
  spotify: spotifyService,
  deezer: deezerService,
  nouveau: nouveauService
};
```

### **Personnaliser le thème**
```css
/* Dans globals.css */
:root {
  --primary: 59 130 246; /* Nouvelle couleur primaire */
  --secondary: 156 163 175;
}

.dark {
  --primary: 147 197 253; /* Version sombre */
}
```

---

## 🔧 **DÉPANNAGE**

### **Problèmes courants**

**1. Thème ne se charge pas correctement**
```tsx
// Vérifier que ThemeProvider entoure l'app
<ThemeProvider>
  <App />
</ThemeProvider>
```

**2. Recommandations vides**
```javascript
// Vérifier l'authentification et les données utilisateur
const token = localStorage.getItem('token');
if (!token) {
  // Rediriger vers login
}
```

**3. Synchronisation échoue**
```javascript
// Vérifier les tokens des services
const spotifyToken = await tokenManager.getValidToken('spotify');
if (!spotifyToken) {
  // Réauthentifier
}
```

### **Debug et logs**
```javascript
// Backend - Logger Winston
logger.info('Sync started', { userId, services });
logger.error('Sync failed', { error: error.message });

// Frontend - Console avec contexte
console.log('[Recommendations]', { recommendations, loading, error });
console.log('[Sync]', { syncStatus, isSyncInProgress });
```

---

## 📚 **RESSOURCES SUPPLÉMENTAIRES**

- **Code source** : `/frontend/src/` et `/backend/`
- **Documentation API** : http://localhost:8000/api/docs (si implémenté)
- **Tests** : `/frontend/src/**/*.test.tsx`
- **Schémas DB** : `/migrations/*.sql`

---

## 🎉 **FÉLICITATIONS !**

Vous maîtrisez maintenant toutes les nouvelles fonctionnalités avancées d'Echo Music Player. 

**Happy coding! 🎵✨**
