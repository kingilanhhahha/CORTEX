import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Resolve in-repo audio asset to a usable URL at build/runtime
const spacebgmUrl = new URL('../components/rpg/spacebgm.m4a', import.meta.url).href;

// Music track definitions
export interface MusicTrack {
  id: string;
  name: string;
  path: string;
  artist?: string;
  genre?: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'spacebgm',
    name: 'Cosmic Journey',
    path: spacebgmUrl,
    artist: 'CORTEX',
    genre: 'Ambient'
  },
  {
    id: 'golden',
    name: 'Golden',
    path: '/sounds/Huntrix - Golden (Lyrics)  K-pop Demon Hunters Soundtrack.mp3',
    artist: 'Huntrix',
    genre: 'K-Pop'
  },
  {
    id: 'takedown',
    name: 'Takedown',
    path: '/sounds/Huntrix - Takedown (Lyrics)  K-Pop Demon Hunters.mp3',
    artist: 'Huntrix',
    genre: 'K-Pop'
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    path: '/sounds/Post Malone, Swae Lee - Sunflower (Spider-Man_ Into the Spider-Verse) (Official Video).mp3',
    artist: 'Post Malone, Swae Lee',
    genre: 'Pop'
  },
  {
    id: 'soda-pop',
    name: 'Soda Pop',
    path: '/sounds/Saja Boys - Soda Pop (Lyrics)  K-Pop Demon Hunters Soundtrack.mp3',
    artist: 'Saja Boys',
    genre: 'K-Pop'
  },
  {
    id: 'tralalero',
    name: 'TRALALERO TRALALA',
    path: '/sounds/TRALALERO TRALALA  (TikTok Budots Viral)  Dj Sandy Remix.mp3',
    artist: 'Dj Sandy',
    genre: 'Budots'
  }
];

interface MusicContextType {
  currentTrack: MusicTrack;
  isPlaying: boolean;
  volume: number;
  setCurrentTrack: (track: MusicTrack) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  togglePlayPause: () => void;
  // Audio ducking for conversations
  duckVolume: () => void;
  restoreVolume: () => void;
  isDucked: boolean;
  // Conversation state
  isConversationActive: boolean;
  setIsConversationActive: (active: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

interface MusicProviderProps {
  children: ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(MUSIC_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.12); // Default volume
  const [isDucked, setIsDucked] = useState(false);
  const [originalVolume, setOriginalVolume] = useState(0.12); // Store original volume
  const [isConversationActive, setIsConversationActive] = useState(false);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Audio ducking functions for conversations
  const duckVolume = () => {
    if (!isDucked) {
      setOriginalVolume(volume);
      setVolume(volume * 0.1); // Reduce to 10% of original volume for better clarity
      setIsDucked(true);
    }
  };

  const restoreVolume = () => {
    if (isDucked) {
      setVolume(originalVolume);
      setIsDucked(false);
    }
  };

  // Load saved preferences from localStorage
  useEffect(() => {
    try {
      const savedTrackId = localStorage.getItem('selectedMusicTrack');
      const savedVolume = localStorage.getItem('musicVolume');
      
      if (savedTrackId) {
        const track = MUSIC_TRACKS.find(t => t.id === savedTrackId);
        if (track) {
          setCurrentTrack(track);
        }
      }
      
      if (savedVolume) {
        const volumeValue = parseFloat(savedVolume);
        if (!isNaN(volumeValue)) {
          setVolume(volumeValue);
        }
      }
    } catch (error) {
      console.warn('Failed to load music preferences:', error);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('selectedMusicTrack', currentTrack.id);
    } catch (error) {
      console.warn('Failed to save music track:', error);
    }
  }, [currentTrack]);

  useEffect(() => {
    try {
      localStorage.setItem('musicVolume', volume.toString());
    } catch (error) {
      console.warn('Failed to save music volume:', error);
    }
  }, [volume]);

  const value: MusicContextType = {
    currentTrack,
    isPlaying,
    volume,
    setCurrentTrack,
    setIsPlaying,
    setVolume,
    togglePlayPause,
    duckVolume,
    restoreVolume,
    isDucked,
    isConversationActive,
    setIsConversationActive,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};
