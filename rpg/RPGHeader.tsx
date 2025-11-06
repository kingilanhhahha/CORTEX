import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import XPBar from '@/components/game/XPBar';
import { 
  User, 
  Settings, 
  Map, 
  Package, 
  Trophy, 
  Zap,
  Coins,
  Shield
} from 'lucide-react';

interface RPGHeaderProps {
  playerName?: string;
  level: number;
  currentXP: number;
  maxXP: number;
  stardust: number;
  relics: number;
  currentPlanet?: string;
  onNavigate?: (section: string) => void;
}

const RPGHeader: React.FC<RPGHeaderProps> = ({
  playerName = "Space Cadet",
  level,
  currentXP,
  maxXP,
  stardust,
  relics,
  currentPlanet = "Training Station Alpha",
  onNavigate
}) => {
  return (
    <motion.header 
      className="relative p-4 border-b border-primary/20 backdrop-blur-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-card/50 to-transparent" />
      
      <div className="relative container mx-auto flex items-center justify-between">
        {/* Left: Game Title & Location */}
        <div className="flex items-center gap-4">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center portal-effect">
              <Zap size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-orbitron font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
                MathVerse
              </h1>
              <div className="flex items-center gap-2">
                <Map size={12} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-orbitron">
                  {currentPlanet}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Center: Player Stats */}
        <div className="flex items-center gap-6">
          {/* XP Bar */}
          <div className="hidden lg:flex flex-col items-center gap-1">
            <XPBar 
              currentXP={currentXP} 
              maxXP={maxXP} 
              level={level}
              className="w-48"
            />
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Coins size={12} className="text-stellar-gold" />
                <span className="text-stellar-gold font-orbitron font-semibold">
                  {stardust.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy size={12} className="text-nebula-pink" />
                <span className="text-nebula-pink font-orbitron font-semibold">
                  {relics}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Player Profile & Actions */}
        <div className="flex items-center gap-3">
          {/* Player Stats - Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <Badge variant="outline" className="holographic-border">
              <Shield size={12} className="mr-1" />
              {level}
            </Badge>
            <Badge variant="outline" className="holographic-border">
              <Coins size={12} className="mr-1 text-stellar-gold" />
              {stardust}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="holographic-border"
              onClick={() => onNavigate?.('inventory')}
            >
              <Package size={16} />
              <span className="hidden sm:inline ml-2">Inventory</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="holographic-border"
              onClick={() => onNavigate?.('map')}
            >
              <Map size={16} />
              <span className="hidden sm:inline ml-2">Galaxy Map</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="holographic-border"
              onClick={() => onNavigate?.('profile')}
            >
              <User size={16} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="holographic-border"
              onClick={() => onNavigate?.('settings')}
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile XP Bar */}
      <motion.div 
        className="lg:hidden mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <XPBar currentXP={currentXP} maxXP={maxXP} level={level} />
      </motion.div>
    </motion.header>
  );
};

export default RPGHeader;