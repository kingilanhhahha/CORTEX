import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, ArrowRight, Trophy, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface LessonNavigationProps {
  currentSection: number;
  totalSections: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
  onBackToHome: () => void;
  isLastSection: boolean;
  showCompletionDialog: boolean;
  onCompletionDialogChange: (open: boolean) => void;
  onContinueToNext: () => void;
  currentPlanet: string;
  nextPlanet: string;
  nextPlanetEmoji: string;
}

export const LessonNavigation: React.FC<LessonNavigationProps> = ({
  currentSection,
  totalSections,
  onPrevious,
  onNext,
  onFinish,
  onBackToHome,
  isLastSection,
  showCompletionDialog,
  onCompletionDialogChange,
  onContinueToNext,
  currentPlanet,
  nextPlanet,
  nextPlanetEmoji
}) => {
  return (
    <>
      {/* Navigation Buttons */}
      <motion.div
        className="flex justify-between items-center mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={onPrevious}
          disabled={currentSection === 0}
          variant="outline"
          className="text-white border-white/20 hover:bg-white/10 disabled:opacity-50"
        >
          <ArrowLeft size={16} className="mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-4">
          <Button
            onClick={onBackToHome}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <Home size={16} className="mr-2" />
            Solar System
          </Button>
          <div className="text-center">
            <span className="text-sm text-white/60">Section {currentSection + 1} of {totalSections}</span>
          </div>
        </div>

        {isLastSection ? (
          <Button
            onClick={onFinish}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            <Trophy size={16} className="mr-2" />
            Finish Lesson
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Next
            <ArrowRight size={16} className="ml-2" />
          </Button>
        )}
      </motion.div>

      {/* Lesson Completion Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={onCompletionDialogChange}>
        <AlertDialogContent className="border-cosmic-purple/20 bg-cosmic-dark/95 backdrop-blur-md">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-2xl font-orbitron text-cosmic-purple">
              🎉 {currentPlanet} Lesson Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cosmic-text text-center">
              Excellent work! You've mastered this lesson's concepts. 
              <br />
              <strong className="text-cosmic-green">{nextPlanet} lesson is now unlocked!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 justify-center">
            <AlertDialogCancel 
              onClick={onBackToHome}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              <Home size={16} className="mr-2" />
              Solar System
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onContinueToNext}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              Continue to {nextPlanet} {nextPlanetEmoji}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

