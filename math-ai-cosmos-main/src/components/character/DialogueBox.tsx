import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DialogueBoxProps {
  speaker: string;
  text: string;
  onNext?: () => void;
  onClose?: () => void;
  showNext?: boolean;
  autoPlay?: boolean;
  speed?: number;
  variant?: 'fixed' | 'inline';
}

const DialogueBox: React.FC<DialogueBoxProps> = ({
  speaker,
  text,
  onNext,
  onClose,
  showNext = true,
  autoPlay = true,
  speed = 50,
  variant = 'fixed'
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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
            <div>
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