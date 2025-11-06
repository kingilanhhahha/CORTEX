import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Home, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface LessonHeaderProps {
  planetName: string;
  planetColor: string;
  progress: number;
  userLevel: number;
  userXP: number;
  maxXP: number;
  onBackToSolarSystem: () => void;
  onExitLesson: () => void;
}

export const LessonHeader: React.FC<LessonHeaderProps> = ({
  planetName,
  planetColor,
  progress,
  userLevel,
  userXP,
  maxXP,
  onBackToSolarSystem,
  onExitLesson
}) => {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 z-20 bg-black/30 backdrop-blur-md border-b border-white/10 p-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBackToSolarSystem}
              className="flex items-center gap-2 text-white hover:bg-white/10"
            >
              <ArrowLeft size={16} />
              Back to Solar System
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExitLesson}
              className="text-white border-white/20 hover:bg-white/10"
            >
              <Home size={16} className="mr-1" />
              Exit Lesson
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${planetColor} rounded-lg flex items-center justify-center`}>
              <Star size={24} className="text-white" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white">{planetName} Lesson</h2>
              <p className="text-sm text-white/60">Interactive Learning Experience</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Lesson Progress */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Progress:</span>
            <div className="w-32">
              <Progress 
                value={progress} 
                className="bg-white/20"
              />
            </div>
            <span className="text-sm text-white font-medium">{Math.round(progress)}%</span>
          </div>

          {/* User Stats */}
          <div className="flex items-center gap-2">
            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
              <Star size={16} className="mr-1" />
              Level {userLevel}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">XP:</span>
            <div className="w-24">
              <Progress 
                value={(userXP / maxXP) * 100} 
                className="bg-white/20"
              />
            </div>
            <span className="text-xs text-white/60">{userXP}/{maxXP}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

