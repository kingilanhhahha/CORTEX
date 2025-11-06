import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import bgm from './spacebgm.m4a';

// Plays looping background music after login across RPG/lessons/teacher routes
// Low volume so voiceovers remain audible
const BackgroundMusic: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create singleton audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(bgm);
      audio.loop = true;
      audio.volume = 0.12; // subtle volume under voiceovers
      audioRef.current = audio;
    }
    return () => {
      // Keep music alive across route changes; only stop if component unmounts (app close)
      // Do not dispose here to keep continuity when remounting Router in HMR
    };
  }, []);

  // Attempt to play/pause based on route + auth
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Play on any route except the login page, and only if logged in
    const onLoginPage = location.pathname === '/';
    const shouldPlay = !!user && !onLoginPage;

    const tryPlay = async () => {
      try {
        // Some browsers require user interaction; this may throw until user interacts
        await audio.play();
      } catch {
        // Wait for first user gesture to start
        const unlock = async () => {
          try {
            await audio.play();
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
      // Pause on login page or when logged out
      audio.pause();
    }
  }, [user, location.pathname]);

  return null;
};

export default BackgroundMusic;



