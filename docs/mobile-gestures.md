# 📱 Guide des Gestes Mobiles - Echo Music Player

## Gestes du Lecteur Plein Écran

### Navigation principale
- **Swipe vers le bas** : Fermer le lecteur plein écran
- **Swipe vers la gauche** : Passer au morceau suivant
- **Swipe vers la droite** : Revenir au morceau précédent
- **Tap sur l'artwork** : Afficher/masquer les informations étendues

### Contrôles audio
- **Tap sur la barre de progression** : Naviguer dans le morceau
- **Long press sur les boutons** : Actions avancées (répétition, favoris)
- **Pinch sur l'artwork** : Zoom/dézoom (à implémenter)

## Navigation générale

### Menu principal
- **Tap sur le burger menu** : Ouvrir/fermer la navigation mobile
- **Swipe depuis le bord gauche** : Ouvrir la navigation mobile
- **Tap en dehors du menu** : Fermer la navigation mobile

### Listes et cartes
- **Tap sur une carte** : Ouvrir le détail
- **Long press sur une carte** : Menu contextuel
- **Pull to refresh** : Actualiser les données (à implémenter)

## Lecteur compact (barre du bas)

### Contrôles rapides
- **Tap sur le bouton play** : Lecture/pause
- **Tap sur les flèches** : Précédent/suivant
- **Tap sur l'icône expand** : Ouvrir le lecteur plein écran
- **Swipe vers le haut sur la barre** : Ouvrir le lecteur plein écran

## Gestes de recherche

### Recherche intelligente
- **Type dans la barre** : Recherche avec debounce automatique
- **Tap sur les filtres** : Filtrage par type (artiste, album, etc.)
- **Scroll infini** : Chargement automatique des résultats

## Playlists mobiles

### Gestion des playlists
- **Tap sur une playlist** : Ouvrir la playlist
- **Long press sur une playlist** : Menu d'actions (modifier, supprimer, partager)
- **Drag & drop** : Réorganiser les morceaux (à implémenter)

## PWA et Offline

### Installation
- **Banner d'installation** : Apparaît automatiquement après 5 secondes
- **Tap "Installer"** : Lance l'installation PWA native
- **Tap "Ignorer"** : Cache le banner (réapparaît après 24h)

### Mode hors ligne
- **Synchronisation automatique** : Quand la connexion revient
- **Cache intelligent** : Les morceaux récents restent disponibles
- **Indicateur de statut** : Affichage de l'état en ligne/hors ligne

## Optimisations tactiles

### Feedback haptique
- **Vibration légère** : Confirmation des actions importantes
- **Vibration double** : Erreurs ou actions impossibles
- **Vibration longue** : Actions critiques (suppression, etc.)

### Zones tactiles
- **Taille minimale** : 44px x 44px pour tous les boutons
- **Espacement** : 8px minimum entre les éléments interactifs
- **Hit areas étendues** : Zone de tap plus large que l'élément visuel

## Accessibilité mobile

### Navigation au clavier
- **Tab** : Navigation entre les éléments
- **Espace/Entrée** : Activation des boutons
- **Flèches** : Navigation dans les listes

### Screen readers
- **Descriptions ARIA** : Tous les éléments interactifs
- **Annonces dynamiques** : Changements d'état du lecteur
- **Landmarks** : Structure sémantique pour la navigation

## Performance mobile

### Optimisations tactiles
- **Debounce** : 300ms pour éviter les double-taps accidentels
- **Throttle** : Limitation des gestes répétitifs
- **Cache des gestes** : Mémorisation des actions fréquentes

### Animations fluides
- **60 FPS** : Toutes les animations à 60 images/seconde
- **Hardware acceleration** : Utilisation du GPU pour les transitions
- **Reduced motion** : Respect des préférences utilisateur

## États d'interaction

### Visual feedback
- **Hover states** : Feedback visuel au survol (desktop)
- **Active states** : Feedback tactile immédiat
- **Loading states** : Indicateurs de chargement appropriés
- **Error states** : Messages d'erreur contextuels

### Micro-interactions
- **Button press** : Légère compression au tap
- **Card selection** : Mise en surbrillance subtile
- **Progress updates** : Animations de progression fluides
- **State transitions** : Transitions douces entre les états

---

Cette documentation des gestes est intégrée dans l'application et peut être consultée depuis les paramètres > Aide > Gestes mobiles.
