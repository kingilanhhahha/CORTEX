import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HolographicCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'quest' | 'achievement' | 'inventory' | 'portal';
  className?: string;
  glowIntensity?: 'low' | 'medium' | 'high';
  animated?: boolean;
  onClick?: () => void;
}

const HolographicCard: React.FC<HolographicCardProps> = ({
  children,
  variant = 'default',
  className = '',
  glowIntensity = 'medium',
  animated = true,
  onClick
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'quest':
        return 'border-cosmic-green/30 shadow-quest';
      case 'achievement':
        return 'border-stellar-gold/30 shadow-[0_0_30px_hsl(var(--stellar-gold)_/_0.4)]';
      case 'inventory':
        return 'border-plasma-blue/30 shadow-[0_0_25px_hsl(var(--plasma-blue)_/_0.3)]';
      case 'portal':
        return 'border-nebula-pink/30 shadow-portal';
      default:
        return 'border-primary/30 shadow-glow';
    }
  };

  const getGlowIntensity = () => {
    switch (glowIntensity) {
      case 'low': return 'opacity-30';
      case 'high': return 'opacity-80';
      default: return 'opacity-50';
    }
  };

  const getHoverEffect = () => {
    if (!animated) return {};
    
    switch (variant) {
      case 'quest':
        return {
          boxShadow: '0 0 40px hsl(var(--cosmic-green) / 0.6)',
          borderColor: 'hsl(var(--cosmic-green) / 0.6)'
        };
      case 'achievement':
        return {
          boxShadow: '0 0 40px hsl(var(--stellar-gold) / 0.6)',
          borderColor: 'hsl(var(--stellar-gold) / 0.6)'
        };
      case 'portal':
        return {
          boxShadow: '0 0 50px hsl(var(--nebula-pink) / 0.8)',
          borderColor: 'hsl(var(--nebula-pink) / 0.6)'
        };
      default:
        return {
          boxShadow: '0 0 30px hsl(var(--primary) / 0.6)',
          borderColor: 'hsl(var(--primary) / 0.6)'
        };
    }
  };

  return (
    <motion.div
      className={cn('relative group', className)}
      whileHover={animated ? { scale: 1.02 } : {}}
      whileTap={onClick && animated ? { scale: 0.98 } : {}}
      onClick={onClick}
    >
      {/* Holographic Background Effect */}
      <div className={cn(
        'absolute inset-0 rounded-lg backdrop-blur-sm',
        'bg-gradient-to-br from-card/50 to-card-glow/30',
        getGlowIntensity()
      )} />
      
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <motion.div
          className={cn(
            'absolute inset-0 rounded-lg border-2',
            getVariantStyles()
          )}
          animate={animated ? getHoverEffect() : {}}
          transition={{ duration: 0.3 }}
        />
        
        {/* Scanning Line Effect */}
        {animated && (
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-lg"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <motion.div
              className={cn(
                'absolute w-full h-0.5 bg-gradient-to-r opacity-70',
                variant === 'quest' ? 'from-transparent via-cosmic-green to-transparent' :
                variant === 'achievement' ? 'from-transparent via-stellar-gold to-transparent' :
                variant === 'portal' ? 'from-transparent via-nebula-pink to-transparent' :
                'from-transparent via-primary to-transparent'
              )}
              animate={{ y: ['-100%', '100%'] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear",
                repeatDelay: 1
              }}
            />
          </motion.div>
        )}
      </div>
      
      {/* Content */}
      <Card className={cn(
        'relative backdrop-blur-lg bg-card/80 border-0',
        onClick && 'cursor-pointer'
      )}>
        {children}
      </Card>
      
      {/* Corner Decorations */}
      {animated && (
        <>
          <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-primary/40" />
          <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-primary/40" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-primary/40" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-primary/40" />
        </>
      )}
    </motion.div>
  );
};

export default HolographicCard;