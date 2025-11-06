import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMusic } from '@/contexts/MusicContext';

// Plays looping background music after login across RPG/lessons/teacher routes
// Low volume so voiceovers remain audible
const BackgroundMusic: React.FC = () => {
  const { user } = useAuth();
  const { currentTrack, isPlaying, volume, isConversationActive } = useMusic();
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create singleton audio element and update source when track changes
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audioRef.current = audio;
    }
    
    // Update audio source when track changes
    if (audioRef.current) {
      audioRef.current.src = currentTrack.path;
    }
    
    return () => {
      // Keep music alive across route changes; only stop if component unmounts (app close)
      // Do not dispose here to keep continuity when remounting Router in HMR
    };
  }, [currentTrack]);

  // Update volume when volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Attempt to play/pause based on route + auth + music state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Play on any route except the login page, and only if logged in and music is enabled
    // BUT NOT during conversations
    const onLoginPage = location.pathname === '/';
    const shouldPlay = !!user && !onLoginPage && isPlaying && !isConversationActive;

    console.log('BackgroundMusic state:', {
      user: !!user,
      onLoginPage,
      isPlaying,
      isConversationActive,
      shouldPlay,
      currentTrack: currentTrack.name
    });

    const tryPlay = async () => {
      try {
        console.log('🎵 Attempting to play background music');
        // Some browsers require user interaction; this may throw until user interacts
        await audio.play();
        console.log('🎵 Background music started');
      } catch {
        console.log('🎵 Background music play failed, waiting for user interaction');
        // Wait for first user gesture to start
        const unlock = async () => {
          try {
            await audio.play();
            console.log('🎵 Background music started after user interaction');
          } catch {}
          document.removeEventListener('click', unlock);
          document.removeEventListener('keydown', unlock);
          document.removeEventListener('touchstart', unlock);
        };
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
      }
    };

    if (shouldPlay) {
      void tryPlay();
    } else {
      console.log('🔇 Pausing background music');
      // Pause on login page, when logged out, or when music is disabled
      audio.pause();
    }
  }, [user, location.pathname, isPlaying, isConversationActive, currentTrack.name]);

  return null;
};

export default BackgroundMusic;