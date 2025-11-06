import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/contexts/PlayerContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  BookOpen,
  Target,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Brain,
  Calculator,
  AlertTriangle,
  Home,
  Star
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const jupiterBg = new URL('../../planet background/SATURN.jpeg', import.meta.url).href;

const JupiterLesson: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveProgress, awardXP, saveAchievement } = usePlayer();
  const [currentSection, setCurrentSection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const startRef = useRef<number>(Date.now());

  useEffect(() => { startRef.current = Date.now(); }, []);

  // Save progress whenever currentSection changes
  useEffect(() => {
    if (user?.id) {
      const progressPercentage = ((currentSection + 1) / sections.length) * 100;
      saveProgress(user.id, {
        module_id: 'jupiter',
        section_id: 'section_0',
        slide_index: currentSection,
        progress_pct: progressPercentage,
      });
    }
  }, [currentSection, user?.id, saveProgress]);

  const handlePrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setProgress((currentSection / (sections.length - 1)) * 100);
    }
  };

  const handleNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setProgress(((currentSection + 2) / sections.length) * 100);
    }
  };

  const handleFinishLesson = () => {
    // Award XP for completing the Jupiter lesson
    awardXP(350, 'jupiter-lesson-completed');
    
    // Save achievement
    if (user?.id) {
      saveAchievement({
        userId: user.id,
        lessonId: 'jupiter-lesson',
        lessonName: 'Jupiter: Complex Rational Equations',
        lessonType: 'solar-system',
        xpEarned: 350,
        planetName: 'Jupiter',
      });
    }
    
    // Save current lesson (Jupiter) as completed
    saveProgress(user.id, { module_id: 'jupiter', section_id: 'section_0', slide_index: sections.length - 1, progress_pct: 100 });
    
    // Also save progress for next planet (Saturn) so it shows up in "In Progress"
    if (user?.id) {
      saveProgress(user.id, {
        module_id: 'saturn',
        section_id: 'section_0',
        slide_index: 0,
        progress_pct: 0, // Starting fresh on next lesson
      });
    }
    
    // Show completion dialog instead of navigating directly
    setShowCompletionDialog(true);
  };

  const handleContinueToNext = () => {
    navigate('/saturn-lesson');
  };

  const handleBackToSolarSystem = () => {
    navigate('/rpg');
  };

  const sections = [
    {
      id: 1,
      title: '🪐 Introduction: Complex Rational Equations',
      icon: <Target className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent mb-4">🌌 Complex Rational Equations on Jupiter</h3>
            
            <div className="space-y-4">
              <p className="text-white/90 text-lg">
                Welcome to <strong>Jupiter</strong>, the largest planet in our solar system! Here we'll tackle the most complex rational equations.
              </p>
              
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-300/30">
                <p className="text-white font-medium">
                  👉 Jupiter represents the <strong>advanced level</strong> of rational equation solving, where we combine multiple techniques.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '🔬 Advanced Techniques',
      icon: <Brain className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent mb-4">Advanced Problem Solving</h3>
            
            <div className="space-y-4">
              <p className="text-white/90 text-lg">
                On Jupiter, we combine all the techniques we learned on previous planets:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-300/30">
                  <h4 className="text-white font-semibold mb-2">From Mercury:</h4>
                  <p className="text-white/80 text-sm">Basic rational equation concepts</p>
                </div>
                <div className="bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-xl p-4 border border-pink-300/30">
                  <h4 className="text-white font-semibold mb-2">From Venus:</h4>
                  <p className="text-white/80 text-sm">Finding LCDs and clearing denominators</p>
                </div>
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 border border-green-300/30">
                  <h4 className="text-white font-semibold mb-2">From Earth:</h4>
                  <p className="text-white/80 text-sm">Advanced denominator clearing</p>
                </div>
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-4 border border-red-300/30">
                  <h4 className="text-white font-semibold mb-2">From Mars:</h4>
                  <p className="text-white/80 text-sm">Identifying extraneous solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '🎯 Master Challenge',
      icon: <Trophy className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent mb-4">Jupiter's Master Challenge</h3>
            
            <div className="space-y-4">
              <p className="text-white/90 text-lg">
                Ready to prove you're a master of rational equations? Complete this lesson to unlock Saturn!
              </p>
              
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-300/30">
                <p className="text-white font-medium text-center">
                  🏆 <strong>Jupiter Master Badge</strong> awaits! 🏆
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Jupiter background */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${jupiterBg})` }}
        initial={{ scale: 1.02, x: 0, y: 0 }}
        animate={{ scale: 1.05, x: 5, y: 3 }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 180px rgba(0,0,0,0.55)' }} />

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          className="p-6 border-b border-white/10 backdrop-blur-sm"
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
                  onClick={handleBackToSolarSystem}
                  className="flex items-center gap-2 text-white hover:bg-white/10"
                >
                  <ArrowLeft size={16} />
                  Back to Solar System
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBackToSolarSystem}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  <Home size={16} className="mr-1" />
                  Exit Lesson
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center">
                  <Star size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="font-orbitron font-bold text-xl bg-gradient-to-r from-orange-300 to-red-500 bg-clip-text text-transparent">
                    Jupiter — Complex Rational Equations
                  </h1>
                  <p className="text-xs text-white/60">Advanced Level</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleBackToSolarSystem} className="text-white border-white/20 hover:bg-white/10">
                <Home size={16} />
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Lesson Content */}
        <div className="container mx-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-white/80 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>

            {/* Current Section Content */}
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {sections[currentSection].content}
            </motion.div>

            {/* Navigation Buttons */}
            <motion.div
              className="flex justify-between items-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={handlePrevSection}
                disabled={currentSection === 0}
                variant="outline"
                className="text-white border-white/20 hover:bg-white/10 disabled:opacity-50"
              >
                <ArrowLeft size={16} className="mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-white border-white/20">
                  Section {currentSection + 1} of {sections.length}
                </Badge>
              </div>

              {currentSection === sections.length - 1 ? (
                <Button
                  onClick={handleFinishLesson}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                >
                  <Trophy size={16} className="mr-2" />
                  Finish Lesson
                </Button>
              ) : (
                <Button
                  onClick={handleNextSection}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Next
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Lesson Completion Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent className="border-cosmic-purple/20 bg-cosmic-dark/95 backdrop-blur-md">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-2xl font-orbitron text-cosmic-purple">
              🎉 Jupiter Lesson Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cosmic-text text-center">
              Excellent work! You've mastered complex rational equations. 
              <br />
              <strong className="text-cosmic-green">Saturn lesson is now unlocked!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 justify-center">
            <AlertDialogCancel 
              onClick={handleBackToSolarSystem}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              <Home size={16} className="mr-2" />
              Solar System
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleContinueToNext}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              Continue to Saturn 🪐
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JupiterLesson;



