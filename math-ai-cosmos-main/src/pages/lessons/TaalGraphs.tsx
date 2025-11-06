import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Star, Zap, Target, BookOpen, Trophy, TrendingUp } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import taalImage from '@/components/other planets/TAAL.png';



const TaalGraphs: React.FC = () => {
  const navigate = useNavigate();
  const { awardXP, saveAchievement } = usePlayer();
  const { user } = useAuth();
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [showLesson, setShowLesson] = useState(false);

  useEffect(() => {
    // Show lesson content after 3 seconds
    const timer = setTimeout(() => {
      setShowLesson(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleFinishLesson = () => {
    if (!lessonCompleted) {
      setLessonCompleted(true);
      awardXP(400, 'taal-graphs');
      
      // Save achievement
      if (user?.id) {
        saveAchievement({
          userId: user.id,
          lessonId: 'taal-graphs',
          lessonName: 'Taal Volcano: Graphs & Asymptotes',
          lessonType: 'philippines-map',
          xpEarned: 400,
          locationName: 'Taal Volcano',
        });
      }
    }
  };

  const handleBackToMap = () => {
    navigate('/philippines-map');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 to-red-900 relative overflow-hidden">

      
      {/* Background Image with Animation */}
      <motion.div
        className="fixed inset-0 z-0"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <img
          src={taalImage}
          alt="Taal Volcano and Lake"
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Failed to load Taal image');
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/60 to-red-900/60" />
      </motion.div>

      {/* Initial Image Reveal Animation */}
      <AnimatePresence>
        {!showLesson && (
          <motion.div
            className="fixed inset-0 z-20 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1 }}
          >
            <div className="text-center text-white">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="mb-8"
              >
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-2xl">
                  <Target size={64} className="text-white" />
                </div>
              </motion.div>
              
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-4xl md:text-6xl font-orbitron font-bold mb-4 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent"
              >
                TAAL VOLCANO
              </motion.h1>
              
              <motion.p
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="text-xl md:text-2xl text-orange-200 font-orbitron"
              >
                Exploring Graphs & Asymptotes
              </motion.p>
              
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="mt-8"
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <p className="text-orange-300 text-sm mt-2">Loading lesson...</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Original Lesson Content */}
      <AnimatePresence>
        {showLesson && (
          <motion.div
            className="relative z-10 min-h-screen"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Header */}
            <motion.header 
              className="p-6 border-b border-white/20 backdrop-blur-sm"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="container mx-auto flex items-center justify-between">
                <Button
                  onClick={handleBackToMap}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 border border-white/20"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Return to Map
                </Button>
                
                <div className="text-center">
                  <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-white">
                    Taal Volcano: Exploring Graphs
                  </h1>
                  <p className="text-orange-200 text-sm">Rational Functions & Asymptotes</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                    <Target size={20} className="text-white" />
                  </div>
                </div>
              </div>
            </motion.header>

            {/* Lesson Content */}
            <motion.div 
              className="container mx-auto px-6 py-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Welcome Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center"
                >
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-8 border border-orange-400/30">
                    <h2 className="text-3xl font-orbitron font-bold text-white mb-4">
                      Welcome to Taal Volcano Mathematics
                    </h2>
                    <p className="text-orange-200 text-lg leading-relaxed">
                      Discover the mathematical beauty of rational functions through the majestic Taal Volcano and its serene lake.
                      The volcano represents the origin (0,0) while the lake boundaries show us where functions become undefined.
                    </p>
                  </div>
                </motion.div>

                {/* Function Definition */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-8 border border-blue-400/30"
                >
                  <h3 className="text-2xl font-orbitron font-bold text-white mb-6 text-center">
                    The Function f(x) = 1/x
                  </h3>
                  <div className="text-center mb-6">
                    <BlockMath math="f(x) = \frac{1}{x}" />
                  </div>
                  <p className="text-blue-200 text-lg leading-relaxed text-center">
                    This is our fundamental rational function. Notice that when x = 0, the function becomes 
                    undefined (division by zero). This creates a vertical asymptote at x = 0, just like 
                    how the volcano creates a natural boundary in the lake.
                  </p>
                </motion.div>

                {/* Table of Values */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-8 border border-green-400/30"
                >
                  <h3 className="text-2xl font-orbitron font-bold text-white mb-6 text-center">
                    Table of Values & Asymptotes
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <div className="text-white font-bold text-lg">x = 1</div>
                      <div className="text-green-300 text-lg">f(1) = 1</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <div className="text-white font-bold text-lg">x = 2</div>
                      <div className="text-green-300 text-lg">f(2) = 1/2</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <div className="text-white font-bold text-lg">x = 3</div>
                      <div className="text-green-300 text-lg">f(3) = 1/3</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <div className="text-white font-bold text-lg">x → 0</div>
                      <div className="text-red-400 text-lg">undefined</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 bg-green-500/20 px-6 py-3 rounded-full border border-green-400/30">
                      <Star size={20} className="text-green-400" />
                      <span className="text-green-200 font-semibold text-lg">✅ The graph approaches the axes (asymptotes)</span>
                    </div>
                  </div>
                </motion.div>



                {/* Mathematical Connection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-8 border border-purple-400/30"
                >
                  <h3 className="text-2xl font-orbitron font-bold text-white mb-6 text-center">
                    Mathematical Connection to Taal
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-orange-500/30 flex items-center justify-center mb-4">
                        <Target size={40} className="text-orange-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg mb-3">Volcano Center (Origin)</h4>
                      <p className="text-purple-200 leading-relaxed">
                        Like the volcano at the center, the origin (0,0) is our reference point for 
                        understanding the function's behavior.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/30 flex items-center justify-center mb-4">
                        <TrendingUp size={40} className="text-blue-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg mb-3">Lake Boundaries (Undefined)</h4>
                      <p className="text-purple-200 leading-relaxed">
                        The lake boundaries represent where x = 0, creating undefined points and 
                        vertical asymptotes in our function.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Complete Lesson Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="text-center"
                >
                  <Button
                    onClick={handleFinishLesson}
                    disabled={lessonCompleted}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-lg px-8 py-4"
                  >
                    {lessonCompleted ? (
                      <>
                        <Trophy size={20} className="mr-2" />
                        Lesson Completed! +400 XP
                      </>
                    ) : (
                      <>
                        <Star size={20} className="mr-2" />
                        Complete Lesson +400 XP
                      </>
                    )}
                  </Button>
                  
                  {/* Continue Button - Only show after completion */}
                  {lessonCompleted && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4"
                    >
                      <Button
                        onClick={() => navigate('/lesson/calaguas-zeros')}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 text-lg font-orbitron rounded-lg border-2 border-blue-400/50"
                      >
                        Continue to Calaguas →
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaalGraphs;
