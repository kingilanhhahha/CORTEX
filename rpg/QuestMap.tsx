import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Rocket,
  Crown,
  Star,
  Zap,
  Lock,
  CheckCircle,
  MapPin,
  Sparkles,
  Atom
} from 'lucide-react';

interface QuestNode {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'legendary';
  status: 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered';
  xpReward: number;
  position: { x: number; y: number };
  connections: string[];
  planetType: 'desert' | 'ice' | 'forest' | 'volcanic' | 'crystal' | 'nebula';
}

interface QuestMapProps {
  quests: QuestNode[];
  onQuestSelect: (questId: string) => void;
  className?: string;
}

const QuestMap: React.FC<QuestMapProps> = ({ quests, onQuestSelect, className = '' }) => {
  const [selectedQuest, setSelectedQuest] = useState<QuestNode | null>(null);
  const [hoveredQuest, setHoveredQuest] = useState<string | null>(null);

  const getDifficultyIcon = (difficulty: QuestNode['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return <Star className="w-4 h-4" />;
      case 'intermediate': return <Zap className="w-4 h-4" />;
      case 'advanced': return <Crown className="w-4 h-4" />;
      case 'legendary': return <Atom className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: QuestNode['status']) => {
    switch (status) {
      case 'locked': return <Lock className="w-5 h-5 text-muted-foreground" />;
      case 'available': return <MapPin className="w-5 h-5 text-cosmic-green" />;
      case 'in-progress': return <Rocket className="w-5 h-5 text-warning animate-pulse" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'mastered': return <Sparkles className="w-5 h-5 text-stellar-gold" />;
    }
  };

  const getPlanetGradient = (planetType: QuestNode['planetType']) => {
    switch (planetType) {
      case 'desert': return 'bg-gradient-to-br from-yellow-400 to-orange-600';
      case 'ice': return 'bg-gradient-to-br from-blue-200 to-blue-600';
      case 'forest': return 'bg-gradient-to-br from-green-400 to-green-800';
      case 'volcanic': return 'bg-gradient-to-br from-red-500 to-red-900';
      case 'crystal': return 'bg-gradient-to-br from-purple-400 to-pink-600';
      case 'nebula': return 'bg-gradient-nebula';
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden ${className}`}>
      {/* Galaxy Map Background */}
      <div className="absolute inset-0 cosmic-starfield opacity-30" />

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {quests.map(quest =>
          quest.connections.map(connectionId => {
            const connectedQuest = quests.find(q => q.id === connectionId);
            if (!connectedQuest) return null;

            return (
              <motion.line
                key={`${quest.id}-${connectionId}`}
                x1={`${quest.position.x}%`}
                y1={`${quest.position.y}%`}
                x2={`${connectedQuest.position.x}%`}
                y2={`${connectedQuest.position.y}%`}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeOpacity="0.3"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: Math.random() }}
              />
            );
          })
        )}
      </svg>

      {/* Quest Nodes */}
      {quests.map((quest, index) => (
        <motion.div
          key={quest.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${quest.position.x}%`,
            top: `${quest.position.y}%`,
            zIndex: 10
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            type: "spring",
            stiffness: 100
          }}
          onMouseEnter={() => setHoveredQuest(quest.id)}
          onMouseLeave={() => setHoveredQuest(null)}
        >
          {/* Planet Base */}
          <motion.div
            className={`w-16 h-16 rounded-full cursor-pointer relative ${getPlanetGradient(quest.planetType)}`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setSelectedQuest(quest);
              onQuestSelect(quest.id);
            }}
            animate={quest.status === 'available' ? {
              boxShadow: [
                '0 0 20px hsl(var(--cosmic-green) / 0.5)',
                '0 0 40px hsl(var(--cosmic-green) / 0.8)',
                '0 0 20px hsl(var(--cosmic-green) / 0.5)'
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Status Icon */}
            <div className="absolute -top-2 -right-2 bg-card rounded-full p-1 border border-primary/30">
              {getStatusIcon(quest.status)}
            </div>

            {/* Difficulty Badge */}
            <div className="absolute -bottom-2 -left-2 bg-card rounded-full p-1 border border-primary/30">
              {getDifficultyIcon(quest.difficulty)}
            </div>

            {/* Planet Ring */}
            {quest.status === 'mastered' && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-stellar-gold"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
            )}
          </motion.div>

          {/* Quest Title */}
          <motion.div
            className="absolute top-20 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: hoveredQuest === quest.id ? 1 : 0.7, y: 0 }}
          >
            <div className="bg-card/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-primary/20">
              <p className="text-xs font-orbitron font-semibold text-card-foreground">
                {quest.title}
              </p>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Quest Details Modal */}
      <AnimatePresence>
        {selectedQuest && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
            style={{ zIndex: 50 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedQuest(null)}
          >
            <motion.div
              className="w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="holographic-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full ${getPlanetGradient(selectedQuest.planetType)}`} />
                  <div>
                    <h3 className="font-orbitron font-bold text-lg text-card-foreground">
                      {selectedQuest.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getDifficultyIcon(selectedQuest.difficulty)}
                        {selectedQuest.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-stellar-gold">
                        +{selectedQuest.xpReward} XP
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">
                  {selectedQuest.description}
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedQuest(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  {selectedQuest.status !== 'locked' && (
                    <Button
                      onClick={() => {
                        onQuestSelect(selectedQuest.id);
                        setSelectedQuest(null);
                      }}
                      className="flex-1 bg-gradient-quest"
                      disabled={selectedQuest.status === 'completed' || selectedQuest.status === 'mastered'}
                    >
                      {selectedQuest.status === 'completed' || selectedQuest.status === 'mastered'
                        ? 'Completed'
                        : selectedQuest.status === 'in-progress'
                        ? 'Continue'
                        : 'Start Quest'
                      }
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestMap;