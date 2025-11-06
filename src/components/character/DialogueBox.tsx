import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Volume2, FastForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMusic } from '@/contexts/MusicContext';

interface DialogueBoxProps {
  speaker: string;
  text: string;
  onNext?: () => void;
  onClose?: () => void;
  onSkipAll?: () => void;
  showNext?: boolean;
  autoPlay?: boolean;
  speed?: number;
  variant?: 'fixed' | 'inline';
  canSkipAll?: boolean;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({
  speaker,
  text,
  onNext,
  onClose,
  onSkipAll,
  showNext = true,
  autoPlay = true,
  speed = 50,
  variant = 'fixed',
  canSkipAll = true
}) => {
  const { setIsConversationActive } = useMusic();
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Set conversation as active when dialogue box is shown (pauses background music)
  useEffect(() => {
    console.log('💬 DialogueBox mounted - pausing background music');
    setIsConversationActive(true);
    
    return () => {
      console.log('💬 DialogueBox unmounted - resuming background music');
      setIsConversationActive(false);
    };
  }, [setIsConversationActive]);

  useEffect(() => {
    if (!autoPlay) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        setDisplayedText(text.slice(0, next));
        
        if (next >= text.length) {
          setIsComplete(true);
          clearInterval(timer);
        }
        
        return next;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [text, autoPlay, speed]);

  const handleSkip = () => {
    setDisplayedText(text);
    setIsComplete(true);
    setCurrentIndex(text.length);
  };

  const containerClass =
    variant === 'fixed'
      ? 'fixed bottom-20 left-4 right-4 md:left-auto md:right-20 md:w-96 z-40'
      : 'relative z-40 max-w-full';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className={containerClass}
      >
        <div className="bg-gradient-card border border-primary/30 rounded-lg p-4 shadow-card backdrop-blur-sm">
          {/* Speaker name */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="font-orbitron font-semibold text-primary text-sm">
              {speaker}
            </span>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary/20"
              >
                <Volume2 size={14} />
              </Button>
            </div>
          </div>

          {/* Dialogue text */}
          <div className="mb-4">
            <p className="text-card-foreground leading-relaxed">
              {displayedText}
              {!isComplete && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-primary ml-1"
                />
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {!isComplete && autoPlay && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-card-foreground"
                >
                  Skip
                </Button>
              )}
              {canSkipAll && onSkipAll && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSkipAll}
                    className="text-xs font-orbitron bg-transparent border-primary/50 text-primary hover:bg-primary/10 hover:border-primary/80 hover:text-primary transition-all duration-200 relative overflow-hidden group"
                  >
                    <FastForward size={12} className="mr-1.5 group-hover:translate-x-0.5 transition-transform" />
                    <span>Skip All</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                  </Button>
                </motion.div>
              )}
            </div>

            <div className="flex gap-2">
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-xs"
                >
                  Close
                </Button>
              )}
              
              {showNext && onNext && isComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onNext}
                    className="bg-gradient-primary hover:opacity-90 transition-opacity"
                  >
                    Next
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DialogueBox;