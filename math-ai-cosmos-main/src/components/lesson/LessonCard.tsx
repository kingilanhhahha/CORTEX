import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Lock, CheckCircle, Star, Trophy, Sparkles, Zap, Crown, Atom } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import HolographicCard from '@/components/rpg/HolographicCard';

export type LessonStatus = 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered';
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'legendary';

interface LessonCardProps {
  title: string;
  description: string;
  difficulty: LessonDifficulty;
  status: LessonStatus;
  xpReward: number;
  estimatedTime: string;
  completionRate?: number;
  onClick?: () => void;
  className?: string;
}

const LessonCard: React.FC<LessonCardProps> = ({
  title,
  description,
  difficulty,
  status,
  xpReward,
  estimatedTime,
  completionRate = 0,
  onClick,
  className = ''
}) => {
  const isInteractive = status !== 'locked';

  const getDifficultyVariant = () => {
    switch (difficulty) {
      case 'beginner': return 'quest';
      case 'intermediate': return 'achievement';
      case 'advanced': return 'portal';
      case 'legendary': return 'portal';
      default: return 'default';
    }
  };

  const getDifficultyIcon = () => {
    switch (difficulty) {
      case 'beginner': return <Star className="w-4 h-4" />;
      case 'intermediate': return <Zap className="w-4 h-4" />;
      case 'advanced': return <Crown className="w-4 h-4" />;
      case 'legendary': return <Atom className="w-4 h-4" />;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'locked': return <Lock className="w-5 h-5 text-muted-foreground" />;
      case 'available': return <BookOpen className="w-5 h-5 text-cosmic-green" />;
      case 'in-progress': return <BookOpen className="w-5 h-5 text-warning animate-pulse" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'mastered': return <Sparkles className="w-5 h-5 text-stellar-gold" />;
    }
  };

  const getDifficultyBadge = () => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-cosmic-green/20 text-cosmic-green border-cosmic-green/30';
      case 'intermediate':
        return 'bg-stellar-gold/20 text-stellar-gold border-stellar-gold/30';
      case 'advanced':
        return 'bg-nebula-pink/20 text-nebula-pink border-nebula-pink/30';
      case 'legendary':
        return 'bg-gradient-to-r from-void-purple/30 to-nebula-pink/30 text-quantum-white border-void-purple/50';
    }
  };

  return (
    <motion.div
      whileHover={isInteractive ? { y: -4, scale: 1.02 } : {}}
      whileTap={isInteractive ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn('relative group', className)}
    >
      <HolographicCard
        variant={getDifficultyVariant()}
        className={cn(
          status === 'locked' && 'opacity-50',
          !isInteractive && 'cursor-not-allowed'
        )}
        onClick={isInteractive ? onClick : undefined}
        animated={isInteractive}
      >
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={status === 'mastered' ? { 
                  rotate: [0, 10, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {getStatusIcon()}
              </motion.div>
              <div>
                <h3 className="font-orbitron font-semibold text-lg text-card-foreground">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              </div>
            </div>
            
            {status === 'mastered' && (
              <motion.div
                animate={{ 
                  rotate: [0, 10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Trophy size={24} className="text-accent fill-accent" />
              </motion.div>
            )}
          </div>

          {/* Meta information */}
          <div className="flex items-center gap-2 mb-4">
            <Badge 
              variant="secondary" 
              className={cn('text-xs border flex items-center gap-1', getDifficultyBadge())}
            >
              {getDifficultyIcon()}
              {difficulty}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {estimatedTime}
            </span>
            <div className="ml-auto flex items-center gap-1 text-accent">
              <motion.span 
                className="text-sm font-medium"
                animate={isInteractive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                +{xpReward}
              </motion.span>
              <span className="text-xs">XP</span>
            </div>
          </div>

          {/* Progress bar (for in-progress lessons) */}
          {status === 'in-progress' && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(completionRate)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-stellar-gold to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Action hint */}
          {isInteractive && (
            <motion.div 
              className="text-xs text-primary/70 text-center pt-2 border-t border-border/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {status === 'available' && 'Click to start lesson'}
              {status === 'in-progress' && 'Click to continue'}
              {status === 'completed' && 'Click to review'}
              {status === 'mastered' && 'Perfect mastery achieved!'}
            </motion.div>
          )}
        </div>
      </HolographicCard>
    </motion.div>
  );
};

export default LessonCard;