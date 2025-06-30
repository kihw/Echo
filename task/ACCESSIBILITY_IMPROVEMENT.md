# ♿ ACCESSIBILITÉ - Amélioration de l'Accessibilité

## 📋 Vue d'Ensemble

Améliorer l'accessibilité de Echo Music Player pour respecter les standards WCAG 2.1 AA et offrir une expérience inclusive à tous les utilisateurs, y compris ceux utilisant des technologies d'assistance.

## 🎯 Objectifs d'Accessibilité

- [ ] Conformité WCAG 2.1 AA complète
- [ ] Score Lighthouse Accessibilité > 95
- [ ] Navigation clavier complète
- [ ] Support lecteurs d'écran optimisé
- [ ] Contraste des couleurs conforme
- [ ] Tests avec utilisateurs en situation de handicap

---

## ♿ Priorités d'Accessibilité

### 1. 🎨 Contraste et Couleurs

#### 1.1 Audit de Contraste
**Priorité: CRITIQUE**

- [ ] **Tests de Contraste Automatisés**
  ```typescript
  // utils/accessibility/contrastChecker.ts
  interface ContrastTest {
    element: string;
    background: string;
    foreground: string;
    ratio: number;
    isCompliant: boolean;
    level: 'AA' | 'AAA' | 'FAIL';
  }
  
  const checkContrast = async (): Promise<ContrastTest[]> => {
    const axeResults = await axe.run({
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true }
      }
    });
    
    return axeResults.violations.map(violation => ({
      element: violation.nodes[0].target[0],
      ratio: violation.nodes[0].any[0].data.contrastRatio,
      isCompliant: violation.nodes[0].any[0].data.contrastRatio >= 4.5,
      level: violation.nodes[0].any[0].data.contrastRatio >= 7 ? 'AAA' : 
             violation.nodes[0].any[0].data.contrastRatio >= 4.5 ? 'AA' : 'FAIL'
    }));
  };
  ```

- [ ] **Corrections de Contraste Identifiées**
  - Mode sombre : texte sur fond sombre dans certains composants
  - Boutons secondaires : contraste insuffisant en hover
  - Placeholders : texte trop clair
  - États focus : outline peu visible

#### 1.2 Palette de Couleurs Accessible
- [ ] **Variables CSS Accessibles**
  ```css
  :root {
    /* Texte principal - Contraste 7:1 (AAA) */
    --text-primary: #1a1a1a;
    --text-primary-dark: #ffffff;
    
    /* Texte secondaire - Contraste 4.5:1 minimum */
    --text-secondary: #4a4a4a;
    --text-secondary-dark: #b3b3b3;
    
    /* Liens - Contraste 4.5:1 + underline */
    --link-color: #0066cc;
    --link-color-dark: #4da6ff;
    
    /* États d'erreur - Contraste 4.5:1 */
    --error-color: #d32f2f;
    --error-bg: #ffebee;
    --error-color-dark: #f44336;
    --error-bg-dark: #1a0e0e;
  }
  ```

### 2. ⌨️ Navigation Clavier

#### 2.1 Focus Management
**Priorité: HAUTE**

- [ ] **Focus Visible Amélioré**
  ```css
  /* Focus ring cohérent et visible */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
    /* Force outline pour compatibilité navigateurs */
    outline: 2px solid transparent;
    outline-offset: 2px;
  }
  
  .focus-ring:focus {
    outline: 2px solid rgb(59, 130, 246);
  }
  
  /* Focus dans le mode sombre */
  .dark .focus-ring:focus {
    outline-color: rgb(147, 197, 253);
  }
  ```

- [ ] **Skip Links**
  ```typescript
  const SkipLinks = () => (
    <div className="sr-only focus-within:not-sr-only">
      <a href="#main-content" className="skip-link">
        {t('a11y.skipToContent')}
      </a>
      <a href="#navigation" className="skip-link">
        {t('a11y.skipToNavigation')}
      </a>
      <a href="#player" className="skip-link">
        {t('a11y.skipToPlayer')}
      </a>
    </div>
  );
  ```

#### 2.2 Keyboard Shortcuts
- [ ] **Raccourcis Globaux**
  ```typescript
  const KEYBOARD_SHORTCUTS = {
    PLAY_PAUSE: 'Space',
    NEXT_TRACK: 'ArrowRight',
    PREVIOUS_TRACK: 'ArrowLeft',
    VOLUME_UP: 'ArrowUp',
    VOLUME_DOWN: 'ArrowDown',
    MUTE: 'KeyM',
    SEARCH: 'KeyS',
    HELP: 'KeyH'
  };
  
  const useGlobalKeyboardShortcuts = () => {
    useKeyboardShortcuts({
      [KEYBOARD_SHORTCUTS.PLAY_PAUSE]: () => player.togglePlay(),
      [KEYBOARD_SHORTCUTS.NEXT_TRACK]: () => player.next(),
      [KEYBOARD_SHORTCUTS.PREVIOUS_TRACK]: () => player.previous(),
      // Avec modificateurs pour éviter les conflits
      'ctrl+k': () => openSearch(),
      'alt+1': () => navigate('/dashboard'),
      'alt+2': () => navigate('/search'),
      'alt+3': () => navigate('/playlists')
    });
  };
  ```

### 3. 🔊 Lecteurs d'Écran

#### 3.1 Sémantique HTML Améliorée
**Priorité: HAUTE**

- [ ] **ARIA Labels et Descriptions**
  ```typescript
  const AudioPlayer = () => {
    const { currentTrack, isPlaying, volume } = usePlayer();
    
    return (
      <section
        aria-label={t('player.nowPlaying')}
        role="region"
        aria-live="polite"
      >
        <div aria-label={t('player.currentTrack')}>
          {currentTrack?.title} - {currentTrack?.artist}
        </div>
        
        <button
          aria-label={
            isPlaying 
              ? t('a11y.pauseMusic') 
              : t('a11y.playMusic')
          }
          aria-pressed={isPlaying}
          onClick={togglePlay}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          aria-label={t('a11y.volumeControl')}
          aria-valuetext={`${Math.round(volume * 100)}%`}
          onChange={setVolume}
        />
      </section>
    );
  };
  ```

- [ ] **Live Regions**
  ```typescript
  const LiveAnnouncements = () => {
    const { currentTrack, isPlaying } = usePlayer();
    const { announce } = useScreenReader();
    
    useEffect(() => {
      if (currentTrack) {
        announce(
          `${t('player.nowPlaying')}: ${currentTrack.title} ${t('common.by')} ${currentTrack.artist}`,
          'polite'
        );
      }
    }, [currentTrack]);
    
    return (
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {/* Annonces dynamiques */}
      </div>
    );
  };
  ```

#### 3.2 Navigation Structurée
- [ ] **Landmarks ARIA**
  ```typescript
  const Layout = ({ children }: { children: ReactNode }) => (
    <div className="app-layout">
      <SkipLinks />
      
      <header role="banner">
        <TopBar />
      </header>
      
      <nav role="navigation" aria-label={t('a11y.navigationMenu')}>
        <Sidebar />
      </nav>
      
      <main role="main" id="main-content" tabIndex={-1}>
        {children}
      </main>
      
      <aside role="complementary" aria-label={t('a11y.playerControls')}>
        <AudioPlayer />
      </aside>
    </div>
  );
  ```

### 4. 📱 Mobile Accessibility

#### 4.1 Touch Targets
- [ ] **Taille Minimale 44px**
  ```css
  .touch-target {
    min-height: 44px;
    min-width: 44px;
    /* Espacement suffisant entre targets */
    margin: 4px;
  }
  
  /* Targets pour mobile spécifiquement */
  @media (pointer: coarse) {
    .touch-target {
      min-height: 48px;
      min-width: 48px;
      padding: 12px;
    }
  }
  ```

- [ ] **Gesture Support**
  ```typescript
  const SwipeableTrackList = ({ tracks }: { tracks: Track[] }) => {
    const { speak } = useScreenReader();
    
    const handleSwipe = (direction: 'left' | 'right', track: Track) => {
      if (direction === 'right') {
        addToQueue(track);
        speak(`${track.title} ${t('player.addedToQueue')}`);
      } else {
        addToFavorites(track);
        speak(`${track.title} ${t('player.addedToFavorites')}`);
      }
    };
    
    return (
      <div role="list" aria-label={t('playlist.trackList')}>
        {tracks.map(track => (
          <SwipeableListItem
            key={track.id}
            onSwipe={(dir) => handleSwipe(dir, track)}
            aria-label={`${track.title} ${t('common.by')} ${track.artist}`}
          >
            <TrackItem track={track} />
          </SwipeableListItem>
        ))}
      </div>
    );
  };
  ```

### 5. 🔧 Composants Accessibles

#### 5.1 Modal et Dialog
- [ ] **Focus Trapping**
  ```typescript
  const AccessibleModal = ({ isOpen, onClose, children, title }: ModalProps) => {
    const { trapFocus } = useFocusManagement();
    const modalRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      if (isOpen && modalRef.current) {
        const cleanup = trapFocus(modalRef.current);
        return cleanup;
      }
    }, [isOpen, trapFocus]);
    
    if (!isOpen) return null;
    
    return createPortal(
      <div
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={modalRef}
      >
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2 id="modal-title">{title}</h2>
          {children}
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            data-close
          >
            <XIcon />
          </button>
        </div>
      </div>,
      document.body
    );
  };
  ```

#### 5.2 Form Controls
- [ ] **Labels et Descriptions**
  ```typescript
  const AccessibleInput = ({
    label,
    error,
    description,
    required,
    ...props
  }: InputProps) => {
    const id = useId();
    const errorId = `${id}-error`;
    const descId = `${id}-description`;
    
    return (
      <div className="form-field">
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span aria-label="required"> *</span>}
        </label>
        
        {description && (
          <div id={descId} className="form-description">
            {description}
          </div>
        )}
        
        <input
          {...props}
          id={id}
          aria-invalid={!!error}
          aria-describedby={[description && descId, error && errorId]
            .filter(Boolean)
            .join(' ')}
        />
        
        {error && (
          <div id={errorId} role="alert" className="form-error">
            {error}
          </div>
        )}
      </div>
    );
  };
  ```

---

## 🧪 Tests d'Accessibilité

### 1. Tests Automatisés
```typescript
// tests/accessibility.test.ts
describe('Accessibility Tests', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should support keyboard navigation', async () => {
    render(<Dashboard />);
    
    // Tab navigation
    userEvent.tab();
    expect(screen.getByRole('button', { name: /skip to content/i })).toHaveFocus();
    
    userEvent.tab();
    expect(screen.getByRole('button', { name: /play/i })).toHaveFocus();
  });
  
  it('should announce important changes', async () => {
    const mockSpeak = jest.fn();
    jest.spyOn(speechSynthesis, 'speak').mockImplementation(mockSpeak);
    
    render(<AudioPlayer />);
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    
    expect(mockSpeak).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Now playing')
      })
    );
  });
});
```

### 2. Tests Manuels
- [ ] **Screen Readers**
  - NVDA (Windows)
  - JAWS (Windows)
  - VoiceOver (macOS/iOS)
  - TalkBack (Android)

- [ ] **Navigation Clavier**
  - Tab order logique
  - Tous les éléments interactifs accessibles
  - Raccourcis fonctionnels
  - Focus visible

### 3. Tests Utilisateurs
- [ ] **Sessions avec utilisateurs**
  - Utilisateurs de lecteurs d'écran
  - Navigation clavier uniquement
  - Utilisateurs de loupe d'écran
  - Utilisateurs avec handicap moteur

---

## 📊 Outils et Validation

### Outils de Test
- [ ] **axe-core** - Tests automatisés
- [ ] **Lighthouse** - Audit accessibilité
- [ ] **WAVE** - Extension navigateur
- [ ] **Color Contrast Analyzer** - Tests manuels
- [ ] **Screen Readers** - Tests réels

### Checklist WCAG 2.1 AA
- [ ] **1.1 Alternatives textuelles** - Images avec alt
- [ ] **1.3 Adaptable** - Structure sémantique
- [ ] **1.4 Distinguable** - Contraste, couleurs
- [ ] **2.1 Accessible au clavier** - Navigation complète
- [ ] **2.4 Navigable** - Structure, liens
- [ ] **3.1 Lisible** - Langue, clarté
- [ ] **3.2 Prévisible** - Comportement cohérent
- [ ] **3.3 Assistance à la saisie** - Erreurs, labels
- [ ] **4.1 Compatible** - HTML valide, ARIA

---

## 🎯 Critères de Succès

- ✅ Score Lighthouse Accessibilité > 95
- ✅ Zéro violation axe-core
- ✅ Navigation clavier complète
- ✅ Contraste WCAG AA sur tous les éléments
- ✅ Support complet lecteurs d'écran
- ✅ Tests utilisateurs positifs
- ✅ Certification WCAG 2.1 AA

---

## 📋 Plan d'Implémentation

### Phase 1: Audit et Corrections Critiques
1. Audit automatisé complet (axe-core)
2. Correction des violations de contraste
3. Amélioration du focus management

### Phase 2: Navigation et Sémantique
1. Implémentation des skip links
2. ARIA labels et landmarks
3. Raccourcis clavier

### Phase 3: Mobile et Interactions
1. Touch targets optimisés
2. Gestes accessibles
3. Support lecteurs d'écran mobile

### Phase 4: Tests et Validation
1. Tests automatisés intégrés
2. Tests manuels avec outils
3. Sessions utilisateurs réels

---

*Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}*
