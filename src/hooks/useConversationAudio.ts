import { useRef, useEffect } from 'react';
import { useMusic } from '@/contexts/MusicContext';

interface UseConversationAudioOptions {
  autoDuck?: boolean;
  duckDelay?: number;
  restoreDelay?: number;
}

export const useConversationAudio = (options: UseConversationAudioOptions = {}) => {
  const { autoDuck = true, duckDelay = 100, restoreDelay = 500 } = options;
  const { setIsPlaying, setIsConversationActive } = useMusic();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const duckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasPlayingRef = useRef<boolean>(false);

  const playAudio = (src: string, volume = 0.95) => {
    try {
      // Clear any existing timeouts
      if (duckTimeoutRef.current) clearTimeout(duckTimeoutRef.current);
      if (restoreTimeoutRef.current) clearTimeout(restoreTimeoutRef.current);

      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // COMPLETELY PAUSE background music during conversation
      if (autoDuck) {
        console.log('🎤 Setting conversation as active - pausing background music');
        // Set conversation as active - this will pause background music
        setIsConversationActive(true);
      }

      // Create and play new audio
      const audio = new Audio(src);
      audio.volume = volume;
      audioRef.current = audio;

      // Set up event listeners
      audio.addEventListener('ended', handleAudioEnded);
      audio.addEventListener('error', handleAudioError);
      audio.addEventListener('pause', handleAudioPaused);

      // Ensure audio plays
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio play failed:', error);
          // Clear conversation state if conversation audio fails
          if (autoDuck) {
            setIsConversationActive(false);
          }
        });
      }
    } catch (e) {
      console.error('Error playing conversation audio:', e);
      // Clear conversation state on error
      if (autoDuck) {
        setIsConversationActive(false);
      }
    }
  };

  const handleAudioEnded = () => {
    // Clear conversation state after conversation ends
    if (autoDuck) {
      console.log('🎤 Conversation ended - clearing conversation state');
      restoreTimeoutRef.current = setTimeout(() => {
        console.log('🎤 Resuming background music');
        setIsConversationActive(false); // Clear conversation state
      }, restoreDelay);
    }
    
    // Clean up
    if (audioRef.current) {
      audioRef.current.removeEventListener('ended', handleAudioEnded);
      audioRef.current.removeEventListener('error', handleAudioError);
      audioRef.current.removeEventListener('pause', handleAudioPaused);
      audioRef.current = null;
    }
  };

  const handleAudioError = () => {
    // Clear conversation state even on error
    if (autoDuck) {
      restoreTimeoutRef.current = setTimeout(() => {
        setIsConversationActive(false);
      }, restoreDelay);
    }
  };

  const handleAudioPaused = () => {
    // Clear conversation state when audio is paused
    if (autoDuck) {
      restoreTimeoutRef.current = setTimeout(() => {
        setIsConversationActive(false);
      }, restoreDelay);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Clear timeouts
    if (duckTimeoutRef.current) clearTimeout(duckTimeoutRef.current);
    if (restoreTimeoutRef.current) clearTimeout(restoreTimeoutRef.current);
    
    // Clear conversation state immediately
    if (autoDuck) {
      setIsConversationActive(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (duckTimeoutRef.current) clearTimeout(duckTimeoutRef.current);
      if (restoreTimeoutRef.current) clearTimeout(restoreTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (autoDuck) {
        setIsConversationActive(false); // Clear conversation state on cleanup
      }
    };
  }, [autoDuck, setIsConversationActive]);

  return {
    playAudio,
    stopAudio,
    isPlaying: audioRef.current && !audioRef.current.paused,
  };
};
