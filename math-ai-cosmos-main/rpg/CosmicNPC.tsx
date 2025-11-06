import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, MessageCircle, X } from 'lucide-react';

export type NPCExpression = 'idle' | 'happy' | 'thinking' | 'excited' | 'concerned' | 'celebrating';
export type NPCType = 'tutor' | 'guide' | 'merchant' | 'guardian' | 'companion';

interface DialogueMessage {
  id: string;
  text: string;
  expression: NPCExpression;
  delay?: number;
  autoNext?: boolean;
}

interface CosmicNPCProps {
  name: string;
  type: NPCType;
  avatar?: string;
  position?: 'bottom-right' | 'bottom-left' | 'floating';
  size?: 'small' | 'medium' | 'large';
  messages?: DialogueMessage[];
  onInteraction?: () => void;
  showDialogue?: boolean;
  className?: string;
}

const CosmicNPC: React.FC<CosmicNPCProps> = ({
  name,
  type,
  avatar,
  position = 'bottom-right',
  size = 'medium',
  messages = [],
  onInteraction,
  showDialogue = false,
  className = ''
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isDialogueOpen, setIsDialogueOpen] = useState(showDialogue);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [currentExpression, setCurrentExpression] = useState<NPCExpression>('idle');

  const currentMessage = messages[currentMessageIndex];

  useEffect(() => {
    if (currentMessage) {
      setCurrentExpression(currentMessage.expression);
      
      if (currentMessage.autoNext && currentMessage.delay) {
        const timer = setTimeout(() => {
          handleNextMessage();
        }, currentMessage.delay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentMessageIndex, currentMessage]);

  const handleNextMessage = () => {
    if (currentMessageIndex < messages.length - 1) {
      setCurrentMessageIndex(currentMessageIndex + 1);
    } else {
      setIsDialogueOpen(false);
      setCurrentMessageIndex(0);
    }
  };

  const handleNPCClick = () => {
    if (messages.length > 0) {
      setIsDialogueOpen(true);
      setCurrentMessageIndex(0);
    }
    onInteraction?.();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'w-16 h-16';
      case 'large': return 'w-24 h-24';
      default: return 'w-20 h-20';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left': return 'fixed bottom-6 left-6 z-40';
      case 'floating': return 'relative mx-auto';
      default: return 'fixed bottom-6 right-6 z-40';
    }
  };

  const getExpressionAnimation = () => {
    switch (currentExpression) {
      case 'idle':
        return { 
          scale: [1, 1.02, 1],
          rotate: [0, 1, -1, 0],
          transition: { duration: 4, repeat: Infinity }
        };
      case 'happy':
        return { 
          scale: [1, 1.1, 1],
          transition: { duration: 0.6, repeat: 3 }
        };
      case 'thinking':
        return { 
          rotate: [-3, 3, -3],
          transition: { duration: 1.5, repeat: Infinity }
        };
      case 'excited':
        return { 
          scale: [1, 1.15, 1.05, 1.15, 1],
          y: [0, -5, 0, -3, 0],
          transition: { duration: 1, repeat: 2 }
        };
      case 'concerned':
        return { 
          scale: [1, 0.95, 1],
          transition: { duration: 2, repeat: Infinity }
        };
      case 'celebrating':
        return { 
          scale: [1, 1.2, 1.1, 1.2, 1],
          rotate: [0, -10, 10, -5, 0],
          transition: { duration: 1.2, repeat: 2 }
        };
      default:
        return {};
    }
  };

  const getTypeGradient = () => {
    switch (type) {
      case 'tutor': return 'bg-gradient-primary';
      case 'guide': return 'bg-gradient-quest';
      case 'merchant': return 'bg-gradient-to-br from-stellar-gold to-warning';
      case 'guardian': return 'bg-gradient-to-br from-nebula-pink to-void-purple';
      case 'companion': return 'bg-gradient-to-br from-cosmic-green to-plasma-blue';
    }
  };

  return (
    <>
      {/* NPC Character */}
      <motion.div
        className={`${getPositionClasses()} ${className}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.div
          className="relative cursor-pointer"
          animate={getExpressionAnimation()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleNPCClick}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-full animate-glow-pulse opacity-60" 
               style={{ 
                 background: type === 'tutor' ? 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' :
                           type === 'guide' ? 'radial-gradient(circle, hsl(var(--cosmic-green)) 0%, transparent 70%)' :
                           'radial-gradient(circle, hsl(var(--stellar-gold)) 0%, transparent 70%)'
               }} />
          
          {/* Character Container */}
          <div className={`relative ${getSizeClasses()} ${getTypeGradient()} rounded-full p-1 shadow-character border-2 border-primary/30`}>
            {avatar ? (
              <img 
                src={avatar}
                alt={name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <MessageCircle className="w-1/2 h-1/2 text-primary" />
              </div>
            )}
            
            {/* Status Indicator */}
            <motion.div 
              className="absolute -top-1 -right-1 w-4 h-4 bg-cosmic-green rounded-full border-2 border-card"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          
          {/* Name Tag */}
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-card/90 backdrop-blur-sm px-2 py-1 rounded border border-primary/20">
              <p className="text-xs font-orbitron font-semibold text-center whitespace-nowrap">
                {name}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Dialogue System */}
      <AnimatePresence>
        {isDialogueOpen && currentMessage && (
          <motion.div
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-50"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="holographic-border p-4 backdrop-blur-lg">
              <div className="flex items-start gap-3">
                {/* Speaker Avatar */}
                <div className={`${getTypeGradient()} w-12 h-12 rounded-full p-1 flex-shrink-0`}>
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </div>
                
                {/* Dialogue Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-orbitron font-semibold text-sm text-card-foreground">
                        {name}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                        className="w-6 h-6 p-0"
                      >
                        {isSoundEnabled ? (
                          <Volume2 size={12} className="text-muted-foreground" />
                        ) : (
                          <VolumeX size={12} className="text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDialogueOpen(false)}
                      className="w-6 h-6 p-0"
                    >
                      <X size={12} className="text-muted-foreground" />
                    </Button>
                  </div>
                  
                  <motion.p 
                    className="text-sm text-muted-foreground mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {currentMessage.text}
                  </motion.p>
                  
                  {/* Navigation */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      {messages.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentMessageIndex ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {!currentMessage.autoNext && (
                      <Button
                        size="sm"
                        onClick={handleNextMessage}
                        className="bg-gradient-primary"
                      >
                        {currentMessageIndex === messages.length - 1 ? 'Close' : 'Next'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CosmicNPC;