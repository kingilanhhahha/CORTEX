import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CheckCircle, Star, Zap, Target, BookOpen, Trophy } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';



const ChocolateHillsRational: React.FC = () => {
  const navigate = useNavigate();
  const { awardXP, saveAchievement } = usePlayer();
  const { user } = useAuth();
  const [lessonCompleted, setLessonCompleted] = useState(false);

  const handleFinishLesson = () => {
    if (!lessonCompleted) {
      setLessonCompleted(true);
      awardXP(250, 'chocolate-hills-rational');
      
      // Save achievement
      if (user?.id) {
        saveAchievement({
          userId: user.id,
          lessonId: 'chocolate-hills',
          lessonName: 'Chocolate Hills: Rational Functions',
          lessonType: 'philippines-map',
          xpEarned: 250,
          locationName: 'Chocolate Hills',
        });
      }
    }
  };

  const handleBackToMap = () => {
    navigate('/philippines-map');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">

      
      {/* Background Image with Animation */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <img
          src="/src/assets/chocolate-hills.jpg"
          alt="Chocolate Hills of Bohol"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.classList.add('bg-gradient-to-br', 'from-amber-900/40', 'to-yellow-900/40');
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 to-yellow-900/40" style={{ display: 'none' }} />
        
        {/* Gaming-style overlay with particles */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Gaming-style Header with HUD elements */}
        <motion.header
          className="p-6 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Back button with gaming style */}
          <motion.div
            className="mb-6"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleBackToMap}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 font-orbitron"
            >
              <ArrowLeft size={16} className="mr-2" />
              ← EXIT MISSION
            </Button>
          </motion.div>
          
          {/* Mission Title with gaming effects */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="inline-block relative">
              {/* Glowing border effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-lg blur opacity-75 animate-pulse" />
              <h1 className="relative bg-black/80 backdrop-blur-sm text-4xl md:text-6xl font-orbitron font-bold text-white px-8 py-4 rounded-lg border border-yellow-400/50">
                🍫 CHOCOLATE HILLS MISSION
              </h1>
            </div>
            
            <motion.div
              className="mt-4 flex items-center justify-center gap-4 text-white/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-400/30">
                <Target className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-orbitron">MISSION: RATIONAL FUNCTIONS</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-400/30">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-orbitron">DIFFICULTY: INTERMEDIATE</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.header>

        {/* Lesson Content with Gaming UI */}
        <motion.div
          className="flex-1 flex items-center justify-center px-6 pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="max-w-5xl w-full">
            {/* Mission Briefing Card */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
            >
              <div className="bg-gradient-to-r from-yellow-900/90 to-amber-800/90 backdrop-blur-md rounded-2xl border-2 border-yellow-400/50 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-8 h-8 text-yellow-400" />
                  <h2 className="text-2xl font-orbitron font-bold text-white">
                    MISSION BRIEFING: RATIONAL FUNCTION DEFINITION
                  </h2>
                </div>
                <p className="text-white/90 text-lg leading-relaxed">
                  Agent, your mission is to understand the structure of rational functions through the unique geological formations of Bohol's Chocolate Hills. 
                  These hills represent the mathematical concept of fractions and ratios - perfect for learning rational functions!
                </p>
              </div>
            </motion.div>

            {/* Mission Objectives Grid */}
            <motion.div
              className="grid md:grid-cols-3 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
            >
              {/* Objective 1: Definition */}
              <motion.div
                className="group"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="bg-gradient-to-br from-amber-600/90 to-yellow-500/90 backdrop-blur-md rounded-xl border-2 border-amber-400/50 p-6 shadow-xl h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-lg">1</span>
                    </div>
                    <h3 className="text-xl font-orbitron font-bold text-white">DEFINITION</h3>
                  </div>
                  <div className="text-center mb-4">
                    <div className="bg-black/40 rounded-lg p-4 border border-yellow-400/30">
                      <BlockMath math="f(x) = \frac{p(x)}{q(x)}, \quad q(x) \neq 0" />
                    </div>
                  </div>
                  <p className="text-white/90 text-center">
                    Where <InlineMath math="p(x)" /> and <InlineMath math="q(x)" /> are polynomials.
                  </p>
                </div>
              </motion.div>

              {/* Objective 2: Examples */}
              <motion.div
                className="group"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="bg-gradient-to-br from-green-600/90 to-emerald-500/90 backdrop-blur-md rounded-xl border-2 border-green-400/50 p-6 shadow-xl h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-lg">2</span>
                    </div>
                    <h3 className="text-xl font-orbitron font-bold text-white">EXAMPLES</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-black/40 rounded-lg p-3 border border-green-400/30">
                      <p className="text-white/80 text-sm mb-2">Simple:</p>
                      <BlockMath math="f(x) = \frac{1}{x}" />
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-green-400/30">
                      <p className="text-white/80 text-sm mb-2">Complex:</p>
                      <BlockMath math="g(x) = \frac{x-4}{x-6}" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Objective 3: Key Points */}
              <motion.div
                className="group"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="bg-gradient-to-br from-blue-600/90 to-cyan-500/90 backdrop-blur-md rounded-xl border-2 border-blue-400/50 p-6 shadow-xl h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-lg">3</span>
                    </div>
                    <h3 className="text-xl font-orbitron font-bold text-white">KEY POINTS</h3>
                  </div>
                  <ul className="space-y-3 text-white/90">
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Denominator <InlineMath math="q(x)" /> ≠ 0</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Both are polynomials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Vertical asymptotes possible</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>



        {/* Gaming-style Action Buttons */}
        <motion.div
          className="flex justify-center gap-6 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0 }}
        >
          {!lessonCompleted ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleFinishLesson}
                size="lg"
                className="relative bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-10 py-4 text-xl font-orbitron font-bold rounded-xl border-2 border-yellow-400/50 shadow-2xl"
              >
                {/* Glowing effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-75 animate-pulse" />
                <div className="relative flex items-center gap-3">
                  <Trophy className="w-6 h-6" />
                  COMPLETE MISSION
                </div>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="bg-gradient-to-r from-green-600/90 to-emerald-500/90 backdrop-blur-md rounded-xl border-2 border-green-400/50 p-6 mb-4 shadow-2xl">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <span className="text-2xl font-orbitron font-bold text-white">MISSION ACCOMPLISHED!</span>
                </div>
                <div className="text-white/90 text-lg mb-4">
                  <span className="text-yellow-400 font-bold">+250 XP</span> earned!
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handleBackToMap}
                    variant="outline"
                    size="lg"
                    className="border-2 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/20 px-8 py-3 text-lg font-orbitron rounded-lg"
                  >
                    ← RETURN TO MAP
                  </Button>
                  <Button
                    onClick={() => navigate('/lesson/cagsawa-domain')}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-3 text-lg font-orbitron rounded-lg border-2 border-orange-400/50"
                  >
                    Continue to Cagsawa Ruins →
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ChocolateHillsRational;
