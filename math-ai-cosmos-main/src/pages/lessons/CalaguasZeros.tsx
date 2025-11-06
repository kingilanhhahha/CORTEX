import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Star, Zap, Target, BookOpen, Trophy, TrendingUp, Infinity, CheckCircle } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import calaguasImage from '@/components/other planets/calaguas.jpg';



const CalaguasZeros: React.FC = () => {
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
      awardXP(450, 'calaguas-zeros');
      
      // Save achievement
      if (user?.id) {
        saveAchievement({
          userId: user.id,
          lessonId: 'calaguas-zeros',
          lessonName: 'Calaguas Island: Zeros of Rational Functions',
          lessonType: 'philippines-map',
          xpEarned: 450,
          locationName: 'Calaguas Island',
        });
      }
    }
  };

  const handleBackToMap = () => {
    navigate('/philippines-map');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-cyan-900 relative overflow-hidden">

      
      {/* Background Image with Animation */}
      <motion.div
        className="fixed inset-0 z-0"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <img
          src={calaguasImage}
          alt="Calaguas Island, Camarines Norte"
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Failed to load Calaguas image');
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-cyan-900/60" />
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
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center shadow-2xl">
                  <Target size={64} className="text-white" />
                </div>
              </motion.div>
              
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-4xl md:text-6xl font-orbitron font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
              >
                CALAGUAS ISLAND
              </motion.h1>
              
              <motion.p
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="text-xl md:text-2xl text-blue-200 font-orbitron"
              >
                Zeros of Rational Functions
              </motion.p>
              
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="mt-8"
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <p className="text-blue-300 text-sm mt-2">Loading lesson...</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson Content */}
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
                    Calaguas Island: Zeros of Rational Functions
                  </h1>
                  <p className="text-blue-200 text-sm">Finding Where Functions Cross the X-Axis</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center">
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
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-8 border border-blue-400/30">
                    <h2 className="text-3xl font-orbitron font-bold text-white mb-4">
                      Welcome to Calaguas Island Mathematics
                    </h2>
                    <p className="text-blue-200 text-lg leading-relaxed">
                      Discover the mathematical beauty of finding zeros in rational functions through the serene 
                      Calaguas Island. Like a calm crossing point where boats meet the shore, zeros are where 
                      the graph meets the x-axis.
                    </p>
                  </div>
                </motion.div>

                {/* Background Connection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-xl p-8 border border-teal-400/30"
                >
                  <h3 className="text-2xl font-orbitron font-bold text-white mb-6 text-center">
                    📷 Background: Calaguas Island Connection
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div>
                      <p className="text-teal-200 text-lg leading-relaxed">
                        <strong>Calaguas Island, Camarines Norte</strong> – calm crossing point, like where 
                        the graph meets the x-axis. Just as boats smoothly cross from water to land, rational 
                        functions smoothly cross the x-axis at their zeros.
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto rounded-full bg-teal-500/30 flex items-center justify-center mb-3">
                        <TrendingUp size={48} className="text-teal-400" />
                      </div>
                      <p className="text-teal-200 font-semibold">Smooth Crossing Point</p>
                    </div>
                  </div>
                </motion.div>

                {/* Main Concept */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-8 border border-indigo-400/30"
                >
                  <h3 className="text-2xl font-orbitron font-bold text-white mb-6 text-center">
                    Finding Zeros (Roots)
                  </h3>
                  <p className="text-indigo-200 text-lg leading-relaxed text-center mb-6">
                    Zeros of a rational function are the x-values where the function equals zero. 
                    This happens when the numerator equals zero (and the denominator is not zero).
                  </p>
                  
                  <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <h4 className="text-xl font-orbitron font-bold text-white mb-4 text-center">Example:</h4>
                    <div className="text-center mb-6">
                      <BlockMath math="f(x) = \frac{2x + 3}{x^2 - 4}" />
                    </div>
                  </div>
                </motion.div>

                {/* Step-by-Step Solution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-8 border border-green-400/30"
                >
                  <h3 className="text-2xl font-orbitron font-bold text-white mb-6 text-center">
                    Step-by-Step Solution
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-white/10 rounded-lg p-6 border border-white/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          1
                        </div>
                        <h4 className="text-white font-semibold text-lg">Numerator = 0</h4>
                      </div>
                      <div className="text-center mb-3">
                        <BlockMath math="2x + 3 = 0" />
                      </div>
                      <p className="text-green-200 text-center">
                        Set the numerator equal to zero to find potential zeros.
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-lg p-6 border border-white/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                          2
                        </div>
                        <h4 className="text-white font-semibold text-lg">Solve for x</h4>
                      </div>
                      <div className="text-center mb-3">
                        <BlockMath math="2x + 3 = 0" />
                        <BlockMath math="2x = -3" />
                        <BlockMath math="x = -\frac{3}{2}" />
                      </div>
                      <p className="text-green-200 text-center">
                        Solve the equation to find the x-value.
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-lg p-6 border border-white/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                          3
                        </div>
                        <h4 className="text-white font-semibold text-lg">Check Denominator ≠ 0</h4>
                      </div>
                      <div className="text-center mb-3">
                        <BlockMath math="x^2 - 4 \neq 0" />
                        <BlockMath math="x \neq \pm 2" />
                      </div>
                      <p className="text-green-200 text-center">
                        Verify that the denominator is not zero at x = -3/2.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Final Answer */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-8 border border-yellow-400/30"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/30 flex items-center justify-center mb-4">
                      <CheckCircle size={48} className="text-yellow-400" />
                    </div>
                    <h3 className="text-2xl font-orbitron font-bold text-white mb-4">
                      ✅ Zero at x = -3/2
                    </h3>
                    <p className="text-yellow-200 text-lg leading-relaxed">
                      The rational function f(x) = (2x + 3)/(x² - 4) has a zero at x = -3/2. 
                      This means the graph crosses the x-axis at this point, just like a boat 
                      smoothly crossing from water to the calm shores of Calaguas Island.
                    </p>
                  </div>
                </motion.div>




                {/* Complete Lesson Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 }}
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
                        Lesson Completed! +450 XP
                      </>
                    ) : (
                      <>
                        <Star size={20} className="mr-2" />
                        Complete Lesson +450 XP
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
                        onClick={() => navigate('/rpg')}
                        size="lg"
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 text-lg font-orbitron rounded-lg border-2 border-purple-400/50"
                      >
                        Return to Cosmos →
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

export default CalaguasZeros;
