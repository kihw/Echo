import { useContext } from 'react';
import { PlayerContext } from '@/contexts/PlayerContext';

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}

export default usePlayer;
