import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CheckCircle, Star, Zap, Target, BookOpen, Trophy, AlertTriangle, Shield, Lock, XCircle } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const PalawanRestrictions: React.FC = () => {
  const navigate = useNavigate();
  const { awardXP, saveAchievement } = usePlayer();
  const { user } = useAuth();
  const [lessonCompleted, setLessonCompleted] = useState(false);

  const handleFinishLesson = () => {
    if (!lessonCompleted) {
      setLessonCompleted(true);
      awardXP(350, 'palawan-restrictions');
      
      // Save achievement
      if (user?.id) {
        saveAchievement({
          userId: user.id,
          lessonId: 'palawan-restrictions',
          lessonName: 'Palawan Underground: Mathematical Restrictions',
          lessonType: 'philippines-map',
          xpEarned: 350,
          locationName: 'Palawan Underground',
        });
      }
    }
  };

  const handleBackToMap = () => {
    navigate('/philippines-map');
  };

  return (
         <div className="min-h-screen relative overflow-hidden bg-transparent">
             {/* Background Image with Animation - Fixed */}
       <motion.div
         className="fixed inset-0 z-0"
         initial={{ scale: 1.1, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         transition={{ duration: 1.5, ease: "easeOut" }}
       >
        <img
          src="/src/assets/palawan-underground.jpg"
          alt="Palawan Underground River"
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.classList.add('bg-gradient-to-br', 'from-blue-900/40', 'to-teal-900/40');
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-teal-900/40" style={{ display: 'none' }} />
        
        {/* Gaming-style overlay with particles - more transparent */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
        
        {/* Floating particles effect - water droplets style */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.1, 0.9, 0.1],
                scale: [0.2, 1.2, 0.2],
                x: [0, Math.random() * 15 - 7.5, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 4,
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
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-teal-500 to-cyan-600 rounded-lg blur opacity-75 animate-pulse" />
              <h1 className="relative bg-black/80 backdrop-blur-sm text-4xl md:text-6xl font-orbitron font-bold text-white px-8 py-4 rounded-lg border border-blue-400/50">
                🏞️ PALAWAN UNDERGROUND MISSION
              </h1>
            </div>
            
            <motion.div
              className="mt-4 flex items-center justify-center gap-4 text-white/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-400/30">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-orbitron">MISSION: MATHEMATICAL RESTRICTIONS</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-400/30">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-orbitron">DIFFICULTY: EXPERT</span>
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
          <div className="max-w-6xl w-full">
            {/* Mission Briefing Card */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
            >
                             <div className="bg-gradient-to-r from-blue-900/60 to-teal-800/60 backdrop-blur-md rounded-2xl border-2 border-blue-400/50 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-8 h-8 text-blue-400" />
                  <h2 className="text-2xl font-orbitron font-bold text-white">
                    MISSION BRIEFING: MATHEMATICAL RESTRICTIONS
                  </h2>
                </div>
                <p className="text-white/90 text-lg leading-relaxed">
                  Agent, your mission is to navigate through mathematical restrictions like the narrow passages of Palawan's Underground River. 
                  Just as the river has specific rules for safe passage, mathematical functions have restrictions that must be followed!
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
              {/* Objective 1: Domain Definition */}
              <motion.div
                className="group"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                                 <div className="bg-gradient-to-br from-blue-600/60 to-cyan-500/60 backdrop-blur-md rounded-xl border-2 border-blue-400/50 p-6 shadow-xl h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-lg">1</span>
                    </div>
                    <h3 className="text-xl font-orbitron font-bold text-white">DOMAIN DEFINITION</h3>
                  </div>
                  <div className="text-center mb-4">
                    <div className="bg-black/40 rounded-lg p-4 border border-blue-400/30">
                      <p className="text-white/90 mb-3">The domain includes all real numbers except where the denominator = 0</p>
                      <BlockMath math="f(x) = \frac{2x + 3}{x^2 - 4}" />
                      <p className="text-white/90 mt-3">Domain: <InlineMath math="x \in \mathbb{R} \setminus \{-2, 2\}" /></p>
                    </div>
                  </div>
                  <p className="text-white/90 text-center text-sm">
                    Values -2 and 2 make the denominator zero, so they're excluded from the domain
                  </p>
                </div>
              </motion.div>

              {/* Objective 2: Core Restrictions */}
              <motion.div
                className="group"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                                 <div className="bg-gradient-to-br from-teal-600/60 to-green-500/60 backdrop-blur-md rounded-xl border-2 border-teal-400/50 p-6 shadow-xl h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-400 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-lg">2</span>
                    </div>
                    <h3 className="text-xl font-orbitron font-bold text-white">CORE RESTRICTIONS</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-black/40 rounded-lg p-3 border border-teal-400/30">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-white/80 text-sm font-semibold">Fractions:</span>
                      </div>
                      <p className="text-white/90 text-sm">Denominators must ≠ 0</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-teal-400/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-white/80 text-sm font-semibold">Radicals (even index):</span>
                      </div>
                      <p className="text-white/90 text-sm">Radicand ≥ 0</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-teal-400/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-yellow-400" />
                        <span className="text-white/80 text-sm font-semibold">Radicals in denominators:</span>
                      </div>
                      <p className="text-white/90 text-sm">Must be &gt; 0</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Objective 3: Visual Representation */}
              <motion.div
                className="group"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                 <div className="bg-gradient-to-br from-cyan-600/60 to-blue-500/60 backdrop-blur-md rounded-xl border-2 border-cyan-400/50 p-6 shadow-xl h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cyan-400 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-lg">3</span>
                    </div>
                    <h3 className="text-xl font-orbitron font-bold text-white">PALAWAN ANALOGY</h3>
                  </div>
                  <div className="space-y-3 text-white/90">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-sm">Narrow passages = Restricted values</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-sm">Open chambers = Allowed domain</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-sm">Water flow = Function behavior</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Advanced Mission Section */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1 }}
            >
               <div className="bg-gradient-to-r from-slate-800/60 to-gray-700/60 backdrop-blur-md rounded-2xl border-2 border-gray-400/50 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                  <h3 className="text-xl font-orbitron font-bold text-white">MISSION ANALYSIS: RESTRICTION TYPES</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-semibold mb-3">Fraction Restrictions:</h4>
                    <div className="bg-black/40 rounded-lg p-4 border border-gray-400/30">
                      <p className="text-white/80 text-sm mb-2">Example: <InlineMath math="f(x) = \frac{1}{x-3}" /></p>
                      <p className="text-white/90 text-sm">Restriction: <InlineMath math="x \neq 3" /></p>
                      <p className="text-white/70 text-xs mt-2">Why? Division by zero is undefined</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-3">Radical Restrictions:</h4>
                    <div className="bg-black/40 rounded-lg p-4 border border-gray-400/30">
                      <p className="text-white/80 text-sm mb-2">Example: <InlineMath math="f(x) = \sqrt{x+2}" /></p>
                      <p className="text-white/90 text-sm">Restriction: <InlineMath math="x \geq -2" /></p>
                      <p className="text-white/70 text-xs mt-2">Why? Square root of negative is not real</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Practice Section */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4 }}
            >
               <div className="bg-gradient-to-r from-indigo-800/60 to-purple-700/60 backdrop-blur-md rounded-2xl border-2 border-indigo-400/50 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-8 h-8 text-yellow-400" />
                  <h3 className="text-xl font-orbitron font-bold text-white">PRACTICE CHALLENGE</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-semibold mb-3">Find Domain:</h4>
                    <div className="bg-black/40 rounded-lg p-4 border border-indigo-400/30">
                      <BlockMath math="f(x) = \frac{x+1}{\sqrt{x-4}}" />
                      <p className="text-white/90 text-sm mt-3">Think about both restrictions:</p>
                      <ul className="text-white/70 text-sm mt-2 space-y-1">
                        <li>• Denominator ≠ 0</li>
                        <li>• Radicand ≥ 0</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-3">Solution:</h4>
                    <div className="bg-black/40 rounded-lg p-4 border border-indigo-400/30">
                      <p className="text-white/80 text-sm mb-2">For <InlineMath math="\sqrt{x-4}" />:</p>
                      <p className="text-white/90 text-sm"><InlineMath math="x-4 \geq 0" /></p>
                      <p className="text-white/90 text-sm"><InlineMath math="x \geq 4" /></p>
                      <p className="text-white/80 text-sm mt-3">Domain: <InlineMath math="x \in [4, \infty)" /></p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Gaming-style Action Buttons */}
        <motion.div
          className="flex justify-center gap-6 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.7 }}
        >
          {!lessonCompleted ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleFinishLesson}
                size="lg"
                className="relative bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white px-10 py-4 text-xl font-orbitron font-bold rounded-xl border-2 border-blue-400/50 shadow-2xl"
              >
                {/* Glowing effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-teal-500 rounded-xl blur opacity-75 animate-pulse" />
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
                  <span className="text-yellow-400 font-bold">+350 XP</span> earned!
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handleBackToMap}
                    variant="outline"
                    size="lg"
                    className="border-2 border-blue-400/50 text-blue-400 hover:bg-blue-400/20 px-8 py-3 text-lg font-orbitron rounded-lg"
                  >
                    ← RETURN TO MAP
                  </Button>
                  <Button
                    onClick={() => navigate('/lesson/taal-graphs')}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-3 text-lg font-orbitron rounded-lg border-2 border-orange-400/50"
                  >
                    Continue to Taal Volcano →
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

export default PalawanRestrictions;
