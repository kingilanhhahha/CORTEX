import React from 'react';
import { motion } from 'framer-motion';
import { Star, Zap } from 'lucide-react';

interface XPBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
  showLevel?: boolean;
  className?: string;
}

const XPBar: React.FC<XPBarProps> = ({
  currentXP,
  maxXP,
  level,
  showLevel = true,
  className = ''
}) => {
  const xpPercentage = Math.min((currentXP / maxXP) * 100, 100);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLevel && (
        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-primary rounded-full">
          <Star size={16} className="text-primary-foreground" />
          <span className="font-orbitron font-bold text-sm text-primary-foreground">
            {level}
          </span>
        </div>
      )}

      <div className="flex-1 relative">
        {/* Background bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden border border-border">
          {/* XP fill */}
          <motion.div
            className="h-full bg-gradient-xp relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>

        {/* XP text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-card-foreground mix-blend-difference">
            {currentXP} / {maxXP} XP
          </span>
        </div>

        {/* Glow effect for full bar */}
        {xpPercentage === 100 && (
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2 }}
          />
        )}
      </div>

      {/* XP icon */}
      <div className="flex items-center gap-1 text-accent">
        <Zap size={16} />
        <span className="text-xs font-medium">XP</span>
      </div>
    </div>
  );
};

export default XPBar;