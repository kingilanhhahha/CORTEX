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

const uranusBg = new URL('../../planet background/uranus.webp', import.meta.url).href;

const UranusLesson: React.FC = () => {
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
        module_id: 'uranus',
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
    // Award XP for completing the Uranus lesson
    awardXP(450, 'uranus-lesson-completed');
    
    // Save achievement
    if (user?.id) {
      saveAchievement({
        userId: user.id,
        lessonId: 'uranus-lesson',
        lessonName: 'Uranus: Master Level Equations',
        lessonType: 'solar-system',
        xpEarned: 450,
        planetName: 'Uranus',
      });
    }
    
    // Save current lesson (Uranus) as completed
    saveProgress(user.id, { module_id: 'uranus', section_id: 'section_0', slide_index: sections.length - 1, progress_pct: 100 });
    
    // Also save progress for next planet (Neptune) so it shows up in "In Progress"
    if (user?.id) {
      saveProgress(user.id, {
        module_id: 'neptune',
        section_id: 'section_0',
        slide_index: 0,
        progress_pct: 0, // Starting fresh on next lesson
      });
    }
    
    // Show completion dialog instead of navigating directly
    setShowCompletionDialog(true);
  };

  const handleContinueToNext = () => {
    navigate('/neptune-lesson');
  };

  const handleBackToSolarSystem = () => {
    navigate('/rpg');
  };

  const sections = [
    {
      id: 1,
      title: '🔵 Introduction: Master Level Equations',
      icon: <Target className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">🌌 Master Level Equations on Uranus</h3>
            
            <div className="space-y-4">
              <p className="text-white/90 text-lg">
                Welcome to <strong>Uranus</strong>, the ice giant! Here we'll tackle the most challenging rational equation problems.
              </p>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-300/30">
                <p className="text-white font-medium">
                  👉 Uranus represents the <strong>master level</strong> where we solve the most complex and abstract rational equations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '🔬 Master Techniques',
      icon: <Brain className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">Master Level Problem Solving</h3>
            
            <div className="space-y-4">
              <p className="text-white/90 text-lg">
                On Uranus, we master the most advanced rational equation techniques:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-300/30">
                  <h4 className="text-white font-semibold mb-2">Abstract Problems:</h4>
                  <p className="text-white/80 text-sm">Theoretical and conceptual challenges</p>
                </div>
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-300/30">
                  <h4 className="text-white font-semibold mb-2">Proof Techniques:</h4>
                  <p className="text-white/80 text-sm">Mathematical proofs and derivations</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-300/30">
                  <h4 className="text-white font-semibold mb-2">Advanced Algebra:</h4>
                  <p className="text-white/80 text-sm">Complex algebraic manipulations</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-xl p-4 border border-indigo-300/30">
                  <h4 className="text-white font-semibold mb-2">Creative Solutions:</h4>
                  <p className="text-white/80 text-sm">Innovative problem-solving approaches</p>
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
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">Uranus Master Challenge</h3>
            
            <div className="space-y-4">
              <p className="text-white/90 text-lg">
                Ready to prove you're a master of rational equations? Complete this lesson to unlock Neptune!
              </p>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-300/30">
                <p className="text-white font-medium text-center">
                  🏆 <strong>Uranus Master Badge</strong> awaits! 🏆
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
      {/* Animated Uranus background */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${uranusBg})` }}
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Star size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="font-orbitron font-bold text-xl bg-gradient-to-r from-blue-300 to-cyan-500 bg-clip-text text-transparent">
                    Uranus — Master Level Equations
                  </h1>
                  <p className="text-xs text-white/60">Master Level</p>
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
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
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
              🎉 Uranus Lesson Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cosmic-text text-center">
              Excellent work! You've mastered the most complex equations. 
              <br />
              <strong className="text-cosmic-green">Neptune lesson is now unlocked!</strong>
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
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            >
              Continue to Neptune 🔵
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UranusLesson;



