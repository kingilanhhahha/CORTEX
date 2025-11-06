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

const neptuneBg = new URL('../../planet background/neptune.jpeg', import.meta.url).href;

const NeptuneLesson: React.FC = () => {
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
        module_id: 'neptune',
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
    // Award XP for completing the Neptune lesson
    awardXP(500, 'neptune-lesson-completed');
    
    // Save achievement
    if (user?.id) {
      saveAchievement({
        userId: user.id,
        lessonId: 'neptune-lesson',
        lessonName: 'Neptune: Grand Master Equations',
        lessonType: 'solar-system',
        xpEarned: 500,
        planetName: 'Neptune',
      });
    }
    
    // Save current lesson (Neptune) as completed
    saveProgress(user.id, { module_id: 'neptune', section_id: 'section_0', slide_index: sections.length - 1, progress_pct: 100 });
    
    // Show completion dialog for final lesson
    setShowCompletionDialog(true);
  };

  const handleBackToSolarSystem = () => {
    navigate('/rpg');
  };

  const sections = [
    {
      id: 1,
      title: '🔵 Introduction: Grand Master Equations',
      icon: <Target className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-4">🌌 Grand Master Equations on Neptune</h3>
            
            <div className="space-y-4">
              <p className="text-white/90 text-lg">
                Welcome to <strong>Neptune</strong>, the final frontier! Here we'll conquer the most challenging rational equation problems.
              </p>
              
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-300/30">
                <p className="text-white font-medium">
                  👉 Neptune represents the <strong>grand master level</strong> - the ultimate test of rational equation mastery.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '🔬 Grand Master Techniques',
      icon: <Brain className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-4">Grand Master Problem Solving</h3>
            
            <div className="space-y-4">
              <p className="text-white/90 text-lg">
                On Neptune, we tackle the ultimate rational equation challenges:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-300/30">
                  <h4 className="text-white font-semibold mb-2">Ultimate Problems:</h4>
                  <p className="text-white/80 text-sm">The most complex and challenging scenarios</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-300/30">
                  <h4 className="text-white font-semibold mb-2">Research Level:</h4>
                  <p className="text-white/80 text-sm">Advanced mathematical research problems</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-300/30">
                  <h4 className="text-white font-semibold mb-2">Innovation:</h4>
                  <p className="text-white/80 text-sm">Creating new solution methods</p>
                </div>
                <div className="bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-xl p-4 border border-pink-300/30">
                  <h4 className="text-white font-semibold mb-2">Mastery:</h4>
                  <p className="text-white/80 text-sm">Complete command of all techniques</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '🎯 Grand Master Challenge',
      icon: <Trophy className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent mb-4">Neptune Grand Master Challenge</h3>
            
            <div className="space-y-4">
              <p className="text-white/90 text-lg">
                Ready to prove you're a grand master of rational equations? Complete this final lesson to achieve ultimate mastery!
              </p>
              
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-300/30">
                <p className="text-white font-medium text-center">
                  🏆 <strong>Neptune Grand Master Badge</strong> awaits! 🏆
                </p>
                <p className="text-white/80 text-center mt-2">
                  You've reached the pinnacle of rational equation mastery!
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
      {/* Animated Neptune background */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${neptuneBg})` }}
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
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <Star size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="font-orbitron font-bold text-xl bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
                    Neptune — Grand Master Equations
                  </h1>
                  <p className="text-xs text-white/60">Grand Master Level</p>
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
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
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
              🎉 Neptune Lesson Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cosmic-text text-center">
              Congratulations! You've achieved <strong>Grand Master</strong> status in rational equations! 
              <br />
              <strong className="text-cosmic-green">You've completed the entire Solar System journey!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 justify-center">
            <AlertDialogAction 
              onClick={handleBackToSolarSystem}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              <Home size={16} className="mr-2" />
              Return to Solar System
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NeptuneLesson;



