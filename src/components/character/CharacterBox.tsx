import React from 'react';
import { motion } from 'framer-motion';
import characterImage from '@/assets/ai-tutor-character.png';

export type CharacterExpression = 'idle' | 'happy' | 'thinking' | 'serious' | 'celebrating' | 'encouraging';

interface CharacterBoxProps {
  expression?: CharacterExpression;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  size?: 'small' | 'medium' | 'large';
}

const CharacterBox: React.FC<CharacterBoxProps> = ({ 
  expression = 'idle', 
  position = 'bottom-right',
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32', 
    large: 'w-48 h-48'
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'center': 'mx-auto'
  };

  const getExpressionAnimation = () => {
    switch (expression) {
      case 'idle':
        return { 
          scale: [1, 1.02, 1],
          transition: { duration: 3, repeat: Infinity, repeatType: "reverse" as const }
        };
      case 'happy':
        return { 
          scale: [1, 1.1, 1],
          transition: { duration: 0.5, repeat: 2, repeatType: "reverse" as const }
        };
      case 'thinking':
        return { 
          rotate: [-2, 2, -2],
          transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" as const }
        };
      case 'serious':
        return { 
          scale: 1,
          transition: { duration: 0.3 }
        };
      case 'celebrating':
        return { 
          scale: [1, 1.2, 1.1, 1.2, 1],
          rotate: [0, -5, 5, -5, 0],
          transition: { duration: 1, repeat: 2 }
        };
      case 'encouraging':
        return { 
          y: [0, -8, 0],
          transition: { duration: 1, repeat: Infinity, repeatType: "reverse" as const }
        };
      default:
        return {};
    }
  };

  return (
    <motion.div 
      className={`${positionClasses[position]} ${sizeClasses[size]}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: 1
      }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div 
        className="relative"
        animate={getExpressionAnimation()}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-primary rounded-full blur-lg opacity-30 animate-glow-pulse" />
        
        {/* Character container */}
        <div className="relative bg-card-glow rounded-full p-2 shadow-character border border-primary/20">
          <img 
            src={characterImage}
            alt="AI Tutor"
            className="w-full h-full object-cover rounded-full"
          />
          
          {/* Status indicator */}
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-success rounded-full border-2 border-card animate-pulse" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CharacterBox;