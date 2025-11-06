import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Star, X, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Achievement, AchievementStats } from '@/lib/database';
import SolutionChecker from './SolutionChecker';

interface AchievementDisplayProps {
  variant?: 'compact' | 'full';
}

const AchievementDisplay: React.FC<AchievementDisplayProps> = ({ variant = 'compact' }) => {
  const { getAchievementStats } = usePlayer();
  const { user } = useAuth();
  const [achievementStats, setAchievementStats] = useState<AchievementStats | null>(null);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSolutionChecker, setShowSolutionChecker] = useState(false);

  console.log('AchievementDisplay: Component rendered, loading:', loading, 'user:', user?.id);

  useEffect(() => {
    if (user?.id) {
      console.log('AchievementDisplay: User ID detected, loading achievements...');
      loadAchievements();
    } else {
      console.log('AchievementDisplay: No user ID, skipping achievement load');
    }
  }, [user?.id]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      console.log('Loading achievements for user:', user?.id);
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Achievement loading timeout')), 5000)
      );
      
      const statsPromise = getAchievementStats();
      const stats = await Promise.race([statsPromise, timeoutPromise]);
      
      console.log('Achievements loaded successfully:', stats);
      setAchievementStats(stats);
    } catch (error) {
      console.error('Failed to load achievements:', error);
      // Set empty stats to prevent infinite loading
      setAchievementStats({
        totalXP: 0,
        lessonsCompleted: 0,
        solarSystemLessons: 0,
        philippinesMapLessons: 0,
        achievements: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getLatestAchievement = () => {
    if (!achievementStats?.achievements.length) return null;
    return achievementStats.achievements[0];
  };

  const getAchievementIcon = (lessonType: string) => {
    switch (lessonType) {
      case 'solar-system':
        return '🌍';
      case 'philippines-map':
        return '🏝️';
      default:
        return '📚';
    }
  };

  const getAchievementColor = (lessonType: string) => {
    switch (lessonType) {
      case 'solar-system':
        return 'from-blue-500 to-purple-600';
      case 'philippines-map':
        return 'from-green-500 to-emerald-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-gray-800/90 to-slate-700/90 backdrop-blur-md border-2 border-gray-400/50">
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading Achievements...</h3>
          <p className="text-gray-400 text-sm">Please wait while we fetch your achievements</p>
          <Button 
            onClick={loadAchievements} 
            variant="outline" 
            size="sm" 
            className="mt-3 border-gray-400/50 text-gray-300 hover:bg-gray-700/50"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!achievementStats || achievementStats.achievements.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-gray-800/90 to-slate-700/90 backdrop-blur-md border-2 border-gray-400/50">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Achievements Yet</h3>
          <p className="text-gray-400 text-sm">Complete lessons to earn your first achievement!</p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    const latestAchievement = getLatestAchievement();
    if (!latestAchievement) return null;

    return (
      <>
        <Card className="bg-gradient-to-r from-gray-800/90 to-slate-700/90 backdrop-blur-md border-2 border-gray-400/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${getAchievementColor(latestAchievement.lessonType)} rounded-full flex items-center justify-center text-2xl`}>
                {getAchievementIcon(latestAchievement.lessonType)}
              </div>
              <div>
                <h4 className="font-semibold text-white">Latest Achievement</h4>
                <p className="text-sm text-gray-400">{latestAchievement.lessonName}</p>
              </div>
            </div>
            <h5 className="font-semibold mb-2 text-white">{latestAchievement.lessonName}</h5>
            <p className="text-sm text-gray-400 mb-4">
              {latestAchievement.lessonType === 'solar-system' 
                ? `Completed ${latestAchievement.planetName} lesson`
                : `Completed ${latestAchievement.locationName} lesson`
              }
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-yellow-400 font-semibold">+{latestAchievement.xpEarned} XP Earned</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowSolutionChecker(true)}
                  className="border-blue-400/50 text-blue-300 hover:bg-blue-700/50"
                >
                  <Calculator size={14} className="mr-1" />
                  Practice
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowAllAchievements(true)}
                  className="border-gray-400/50 text-gray-300 hover:bg-gray-700/50"
                >
                  View All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full achievement view modal - always render when showAllAchievements is true */}
        <AnimatePresence>
          {showAllAchievements ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-r from-gray-900/95 to-slate-800/95 backdrop-blur-md border-2 border-gray-400/50">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-600/50 bg-gradient-to-r from-gray-800/50 to-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-400" />
                        <div>
                          <h2 className="text-2xl font-bold text-white">Achievements</h2>
                          <p className="text-gray-400">
                            {achievementStats.lessonsCompleted} lessons completed • {achievementStats.totalXP} total XP
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllAchievements(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={20} />
                      </Button>
                    </div>
                  </div>

                  {/* Achievement Content */}
                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {achievementStats.achievements.length > 0 && (
                      <div className="space-y-4">
                        {achievementStats.achievements.map((achievement, index) => (
                          <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-r from-gray-800/50 to-slate-700/50 rounded-xl border border-gray-600/50 p-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 bg-gradient-to-br ${getAchievementColor(achievement.lessonType)} rounded-full flex items-center justify-center text-3xl`}>
                                {getAchievementIcon(achievement.lessonType)}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-white text-lg mb-1">
                                  {achievement.lessonName}
                                </h3>
                                <p className="text-gray-400 text-sm mb-2">
                                  {achievement.lessonType === 'solar-system' 
                                    ? `Planet: ${achievement.planetName}`
                                    : `Location: ${achievement.locationName}`
                                  }
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-yellow-400 font-semibold">+{achievement.xpEarned} XP</span>
                                  <span className="text-gray-500">
                                    {new Date(achievement.completedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-gray-600/50 bg-gradient-to-r from-gray-800/50 to-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Showing {achievementStats.achievements.length} achievements
                      </div>
                      <Button
                        onClick={() => setShowAllAchievements(false)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Solution Checker Modal */}
        <AnimatePresence>
          {showSolutionChecker ? (
            <SolutionChecker onClose={() => setShowSolutionChecker(false)} />
          ) : null}
        </AnimatePresence>
      </>
    );
  }

  // Full achievement view is now handled inline with compact view
  return null;
};

export default AchievementDisplay;
