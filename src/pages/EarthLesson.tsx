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
  Home
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import earth1 from '../../planet background/EARTH 1.jpeg';
import earth2 from '../../planet background/EARTH 2.jpeg';
import { db } from '@/lib/database';
import { analyzeAreasForImprovement, analyzeStrengths, analyzeCommonMistakes } from '@/utils/progressAnalysis';

const EarthLesson: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveProgress, awardXP, saveAchievement, completeLesson } = usePlayer();
  const [currentSection, setCurrentSection] = useState(0);
  const [progress, setProgress] = useState(0);
  const [equationsSolved, setEquationsSolved] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [questionsAnswered, setQuestionsAnswered] = useState<Record<number, {correct: boolean, answer: string, explanation?: string}>>({});
  const [showQuestionFeedback, setShowQuestionFeedback] = useState<Record<number, boolean>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number>(Date.now());
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [skills, setSkills] = useState<Record<string, { correct: number; total: number }>>({
    lcdFinding: { correct: 0, total: 0 },
    solvingProcess: { correct: 0, total: 0 },
    restrictions: { correct: 0, total: 0 },
    extraneousSolutions: { correct: 0, total: 0 },
    factoring: { correct: 0, total: 0 },
    algebra: { correct: 0, total: 0 },
  });

  useEffect(() => { startRef.current = Date.now(); }, []);

  // Initial animation: show background first, then content
  useEffect(() => {
    // Reset states when section changes
    setBackgroundLoaded(false);
    setContentVisible(false);

    // First, show the background image
    const backgroundTimer = setTimeout(() => {
      setBackgroundLoaded(true);
    }, 100);

    // Then, after background is shown, fade in the content
    const contentTimer = setTimeout(() => {
      setContentVisible(true);
    }, 1500);

    return () => {
      clearTimeout(backgroundTimer);
      clearTimeout(contentTimer);
    };
  }, [currentSection]);

  // Save progress whenever currentSection changes - but debounced to avoid excessive saves
  useEffect(() => {
    if (user?.id) {
      const timeoutId = setTimeout(() => {
        const progressPercentage = ((currentSection + 1) / steps.length) * 100;
        saveProgress(user.id, {
          module_id: 'earth',
          section_id: 'section_0',
          slide_index: currentSection,
          progress_pct: progressPercentage,
        });
      }, 1000); // Debounce progress saves by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentSection, user?.id]);

  // Two Earth background images; alternate every slide
  const earthBackgrounds = [
    earth1,
    earth2
  ];

  const saveLessonProgress = async () => {
    try {
      const total = equationsSolved.length + mistakes.length;
      const score = total > 0 ? Math.round((equationsSolved.length / total) * 100) : 0;
      const minutes = Math.max(1, Math.round((Date.now() - startRef.current) / 60000));
      
      // Analyze areas for improvement, strengths, and common mistakes
      const areasForImprovement = analyzeAreasForImprovement(mistakes);
      const strengths = analyzeStrengths(equationsSolved);
      const commonMistakes = analyzeCommonMistakes(mistakes);
      
      await db.saveStudentProgress({
        studentId: user?.id || 'guest',
        moduleId: 'lesson-earth',
        moduleName: 'Earth — Clearing Denominators',
        completedAt: new Date(),
        score,
        timeSpent: minutes,
        equationsSolved,
        mistakes,
        skillBreakdown: skills,
        areasForImprovement: areasForImprovement,
        strengths: strengths,
        commonMistakes: commonMistakes,
      } as any);
      toast({ title: 'Saved', description: 'Your Earth lesson results were saved.' });
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not save progress. Will retry later.', variant: 'destructive' });
    }
  };

  const handleFinishLesson = async () => {
    if (!user?.id) {
      toast({
        title: "Please Log In",
        description: "You need to be logged in to save your progress.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Calculate skill breakdown from quiz answers
      const answers = Object.values(questionsAnswered);
      const totalQuestions = answers.length;
      const correctAnswers = answers.filter(a => a.correct).length;
      
      // Update skills based on quiz performance
      const updatedSkills = {
        solvingProcess: {
          correct: correctAnswers,
          total: totalQuestions
        },
        restrictions: {
          correct: correctAnswers,
          total: totalQuestions
        },
        lcdFinding: {
          correct: correctAnswers,
          total: totalQuestions
        },
        extraneousSolutions: {
          correct: 0,
          total: 0
        },
        factoring: {
          correct: 0,
          total: 0
        },
        algebra: {
          correct: correctAnswers,
          total: totalQuestions
        }
      };
      
      // Use the optimized lesson completion function
      const success = await completeLesson(user.id, {
        lessonId: 'earth-lesson',
        lessonName: 'Earth — Clearing Denominators',
        score: getPerformanceSummary().percentage,
        timeSpent: Math.max(1, Math.round((Date.now() - startRef.current) / 60000)),
        equationsSolved,
        mistakes,
        skillBreakdown: updatedSkills,
        xpEarned: 250,
        planetName: 'Earth',
      });
      
      if (success) {
        toast({
          title: "Lesson Complete! 🎉",
          description: "Your progress has been saved successfully.",
        });
      } else {
        toast({
          title: "Progress Saved",
          description: "Lesson completed, but some data may not have been saved.",
          variant: "default",
        });
      }
      
      // Show completion dialog
      setShowCompletionDialog(true);
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast({
        title: "Lesson Completed",
        description: "Lesson finished, but there was an issue saving progress.",
        variant: "destructive",
      });
      setShowCompletionDialog(true);
    }
  };

  const handleContinueToNext = async () => {
    await saveLessonProgress();
    
    // Save progress for next lesson (Mars) so it shows up in "In Progress"
    if (user?.id) {
      try {
        await saveProgress(user.id, {
          module_id: 'mars',
          section_id: 'section_0',
          slide_index: 0,
          progress_pct: 0, // Starting fresh on next lesson
        });
      } catch (error) {
        console.error('Error saving progress for next lesson:', error);
      }
    }
    
    toast({ title: 'Progress Saved! 🚀', description: 'Continuing to next lesson.' });
    navigate('/mars-lesson');
  };

  const handleQuizAnswer = (questionId: number, selectedAnswer: string, correctAnswer: string, explanation: string) => {
    const isCorrect = selectedAnswer === correctAnswer;
    
    setQuestionsAnswered(prev => ({
      ...prev,
      [questionId]: {
        correct: isCorrect,
        answer: selectedAnswer,
        explanation: isCorrect ? undefined : explanation
      }
    }));

    setShowQuestionFeedback(prev => ({
      ...prev,
      [questionId]: true
    }));

    // Track equationsSolved and mistakes with meaningful descriptions
    if (isCorrect) {
      setEquationsSolved(prev => [...prev, `Clearing Denominators: Question ${questionId} - Correctly cleared denominators`]);
      toast({
        title: "Correct! 🎉",
        description: "Great job! You understand this concept.",
        variant: "default",
      });
    } else {
      const mistakeDescription = `Clearing Denominators: Question ${questionId} - ${explanation || 'Incorrect answer. Need to review denominator clearing steps'}`;
      setMistakes(prev => [...prev, mistakeDescription]);
      toast({
        title: "Not quite right 📚",
        description: "Check the explanation below to learn more.",
        variant: "destructive",
      });
    }

    // Check if quiz is completed
    const totalQuestions = 3;
    const answeredCount = Object.keys(questionsAnswered).length + 1;
    if (answeredCount === totalQuestions) {
      setTimeout(() => setQuizCompleted(true), 1000);
    }
  };

  const getPerformanceSummary = () => {
    const answers = Object.values(questionsAnswered);
    const correct = answers.filter(a => a.correct).length;
    const total = answers.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return { correct, total, percentage };
  };

  const getImprovementAreas = () => {
    const areas: string[] = [];
    
    if (questionsAnswered[1] && !questionsAnswered[1].correct) {
      areas.push("Understanding LCD concept in rational equations");
    }
    if (questionsAnswered[2] && !questionsAnswered[2].correct) {
      areas.push("Applying LCD method to solve equations");
    }
    if (questionsAnswered[3] && !questionsAnswered[3].correct) {
      areas.push("Checking solutions against restrictions");
    }
    
    return areas;
  };

  const steps = [
    {
      id: 1,
      title: 'Definition — Clearing Denominators',
      icon: <Lightbulb className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-white/90">
            Clearing denominators means <strong>removing all fractions</strong> in a rational equation by multiplying
            every term by the <strong>Least Common Denominator (LCD)</strong>. This makes the equation easier to solve
            because you work with whole numbers or polynomials instead of fractions.
          </p>
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              borderColor: 'rgba(59, 130, 246, 0.4)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)',
            }}>
            <p className="text-sm text-white/90">Goal: Turn a rational equation into a standard algebraic equation.</p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Steps to Clear Denominators',
      icon: <Target className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-white/90">
            <li><strong>Identify</strong> all denominators.</li>
            <li><strong>Find</strong> the LCD of all denominators.</li>
            <li><strong>Multiply</strong> every term by the LCD (both sides).</li>
            <li><strong>Simplify</strong> using cancellation.</li>
            <li><strong>Solve</strong> the resulting equation.</li>
            <li><strong>Check restrictions</strong> (values that make any denominator zero).</li>
          </ol>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3), inset 0 0 20px rgba(16, 185, 129, 0.1)',
            }}>
            <p className="text-sm text-white/90">Tip: Write cancellations explicitly to avoid mistakes.</p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Example 1 — Clear Denominators and Solve',
      icon: <Calculator className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <div className="text-center">
              <BlockMath math={'\\frac{1}{x} + \\frac{1}{2} = \\frac{3}{4}'} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">1) Denominators</p>
              <BlockMath math={'x, \\; 2, \\; 4'} />
            </div>
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">2) LCD</p>
              <BlockMath math={'4x'} />
            </div>
          </div>
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm font-semibold mb-2 text-white">3) Multiply through by LCD</p>
            <div className="text-center">
              <BlockMath math={'4x \\cdot \\frac{1}{x} + 4x \\cdot \\frac{1}{2} = 4x \\cdot \\frac{3}{4}'} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">4) Simplify</p>
              <BlockMath math={'4 + 2x = 3x'} />
            </div>
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">5) Solve</p>
              <BlockMath math={'4 = x'} />
            </div>
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(20, 83, 45, 0.75)',
              borderColor: 'rgba(16, 185, 129, 0.5)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.15)',
            }}>
            <p className="text-sm text-white/90"><strong>6) Restriction:</strong> <InlineMath math={'x \\neq 0'} />. Final answer <InlineMath math={'x=4'} /> is valid.</p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Example 2 — Clear Denominators and Solve',
      icon: <Calculator className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <div className="text-center">
              <BlockMath math={'\\frac{1}{x} + \\frac{1}{3} = \\frac{1}{6}'} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">1) Denominators</p>
              <BlockMath math={'x, \\; 3, \\; 6'} />
            </div>
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">2) LCD</p>
              <BlockMath math={'6x'} />
            </div>
          </div>
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm font-semibold mb-2 text-white">3) Multiply through by LCD</p>
            <div className="text-center">
              <BlockMath math={'6x \\cdot \\frac{1}{x} + 6x \\cdot \\frac{1}{3} = 6x \\cdot \\frac{1}{6}'} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">4) Simplify</p>
              <BlockMath math={'6 + 2x = x'} />
            </div>
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">5) Solve</p>
              <BlockMath math={'6 = -x \\;\\Rightarrow\\; x = -6'} />
            </div>
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(20, 83, 45, 0.75)',
              borderColor: 'rgba(16, 185, 129, 0.5)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.15)',
            }}>
            <p className="text-sm text-white/90"><strong>6) Restriction:</strong> <InlineMath math={'x \\neq 0'} />. Final answer <InlineMath math={'x=-6'} /> is valid.</p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: 'Example 3 — Polynomial Denominators',
      icon: <Calculator className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <div className="text-center">
              <BlockMath math={'\\frac{2}{x-2} + \\frac{3}{x+1} = \\frac{5}{x+1}'} />
            </div>
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(30, 58, 138, 0.75)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm text-white/90"><strong>Note:</strong> When denominators are polynomials, factor them first if needed.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">1) Denominators</p>
              <BlockMath math={'(x-2), \\; (x+1)'} />
            </div>
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">2) LCD</p>
              <BlockMath math={'(x-2)(x+1)'} />
            </div>
          </div>
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm font-semibold mb-2 text-white">3) Multiply through by LCD</p>
            <div className="text-center space-y-2">
              <BlockMath math={'(x-2)(x+1) \\cdot \\frac{2}{x-2} + (x-2)(x+1) \\cdot \\frac{3}{x+1} = (x-2)(x+1) \\cdot \\frac{5}{x+1}'} />
            </div>
          </div>
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm font-semibold mb-2 text-white">4) Cancel and Simplify</p>
            <div className="text-center space-y-2">
              <BlockMath math={'2(x+1) + 3(x-2) = 5(x-2)'} />
              <BlockMath math={'2x + 2 + 3x - 6 = 5x - 10'} />
              <BlockMath math={'5x - 4 = 5x - 10'} />
            </div>
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(30, 58, 138, 0.70)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
            }}>
            <p className="text-sm font-semibold mb-1 text-white">5) Solve</p>
            <BlockMath math={'5x - 4 = 5x - 10 \\;\\Rightarrow\\; -4 = -10'} />
            <p className="text-sm mt-2 text-red-300">This is a contradiction! No solution exists.</p>
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(20, 83, 45, 0.75)',
              borderColor: 'rgba(16, 185, 129, 0.5)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.15)',
            }}>
            <p className="text-sm text-white/90"><strong>6) Restrictions:</strong> <InlineMath math={'x \\neq 2'} /> and <InlineMath math={'x \\neq -1'} />.</p>
            <p className="text-sm mt-1 text-white/90">Since there's no solution, restrictions don't apply here.</p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: 'Example 4 — Factoring Required',
      icon: <Calculator className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <div className="text-center">
              <BlockMath math={'\\frac{1}{x^2 - 4} + \\frac{1}{x-2} = \\frac{2}{x+2}'} />
            </div>
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(30, 58, 138, 0.75)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm text-white/90"><strong>Key Step:</strong> Factor <InlineMath math={'x^2 - 4 = (x-2)(x+2)'} /> first!</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">1) Factor denominators</p>
              <BlockMath math={'x^2 - 4 = (x-2)(x+2)'} />
              <p className="text-xs mt-1 text-white/70">Now: <InlineMath math={'(x-2)(x+2), \\; (x-2), \\; (x+2)'} /></p>
            </div>
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">2) LCD</p>
              <BlockMath math={'(x-2)(x+2)'} />
              <p className="text-xs mt-1 text-white/70">Note: All denominators share factors!</p>
            </div>
          </div>
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm font-semibold mb-2 text-white">3) Multiply through by LCD</p>
            <div className="text-center space-y-2">
              <BlockMath math={'(x-2)(x+2) \\cdot \\frac{1}{(x-2)(x+2)} + (x-2)(x+2) \\cdot \\frac{1}{x-2} = (x-2)(x+2) \\cdot \\frac{2}{x+2}'} />
            </div>
          </div>
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm font-semibold mb-2 text-white">4) Cancel and Simplify</p>
            <div className="text-center space-y-2">
              <BlockMath math={'1 + (x+2) = 2(x-2)'} />
              <BlockMath math={'1 + x + 2 = 2x - 4'} />
              <BlockMath math={'x + 3 = 2x - 4'} />
            </div>
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(30, 58, 138, 0.70)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
            }}>
            <p className="text-sm font-semibold mb-1 text-white">5) Solve</p>
            <BlockMath math={'x + 3 = 2x - 4 \\;\\Rightarrow\\; 3 + 4 = 2x - x \\;\\Rightarrow\\; x = 7'} />
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(20, 83, 45, 0.75)',
              borderColor: 'rgba(16, 185, 129, 0.5)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.15)',
            }}>
            <p className="text-sm text-white/90"><strong>6) Restrictions:</strong> <InlineMath math={'x \\neq 2'} /> and <InlineMath math={'x \\neq -2'} />.</p>
            <p className="text-sm mt-1 text-white/90">Final answer <InlineMath math={'x=7'} /> is valid (7 ≠ 2 and 7 ≠ -2).</p>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: 'Example 5 — Multiple Terms',
      icon: <Calculator className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <div className="text-center">
              <BlockMath math={'\\frac{3}{x} + \\frac{2}{x+1} - \\frac{1}{x-1} = \\frac{4}{x^2-1}'} />
            </div>
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(30, 58, 138, 0.75)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm text-white/90"><strong>Strategy:</strong> Factor <InlineMath math={'x^2-1 = (x-1)(x+1)'} /> to find all factors needed for LCD.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">1) Factor all denominators</p>
              <div className="text-xs space-y-1">
                <p>• <InlineMath math={'x'} /> (already factored)</p>
                <p>• <InlineMath math={'x+1'} /> (already factored)</p>
                <p>• <InlineMath math={'x-1'} /> (already factored)</p>
                <p>• <InlineMath math={'x^2-1 = (x-1)(x+1)'} /></p>
              </div>
            </div>
            <div className="rounded-xl p-3 border-2"
              style={{
                background: 'rgba(30, 58, 138, 0.70)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
              }}>
              <p className="text-sm font-semibold mb-1 text-white">2) LCD</p>
              <BlockMath math={'x(x-1)(x+1)'} />
              <p className="text-xs mt-1 text-white/70">All unique factors: x, (x-1), (x+1)</p>
            </div>
          </div>
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm font-semibold mb-2 text-white">3) Multiply through by LCD</p>
            <div className="text-center space-y-2 text-sm">
              <BlockMath math={'x(x-1)(x+1) \\cdot \\frac{3}{x} + x(x-1)(x+1) \\cdot \\frac{2}{x+1} - x(x-1)(x+1) \\cdot \\frac{1}{x-1} = x(x-1)(x+1) \\cdot \\frac{4}{(x-1)(x+1)}'} />
            </div>
          </div>
          <div className="rounded-xl p-4 border-2 backdrop-blur-sm"
            style={{
              background: 'rgba(15, 23, 42, 0.80)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.4), inset 0 0 25px rgba(59, 130, 246, 0.15)',
            }}>
            <p className="text-sm font-semibold mb-2 text-white">4) Cancel and Simplify</p>
            <div className="text-center space-y-2">
              <BlockMath math={'3(x-1)(x+1) + 2x(x-1) - x(x+1) = 4x'} />
              <BlockMath math={'3(x^2-1) + 2x^2 - 2x - x^2 - x = 4x'} />
              <BlockMath math={'3x^2 - 3 + 2x^2 - 2x - x^2 - x = 4x'} />
              <BlockMath math={'4x^2 - 3x - 3 = 4x'} />
            </div>
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(30, 58, 138, 0.70)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
            }}>
            <p className="text-sm font-semibold mb-1 text-white">5) Solve</p>
            <div className="space-y-2">
              <BlockMath math={'4x^2 - 3x - 3 = 4x'} />
              <BlockMath math={'4x^2 - 7x - 3 = 0'} />
              <BlockMath math={'(4x+1)(x-3) = 0'} />
              <BlockMath math={'x = -\\frac{1}{4} \\; \\text{or} \\; x = 3'} />
            </div>
          </div>
          <div className="rounded-xl p-3 border-2"
            style={{
              background: 'rgba(20, 83, 45, 0.75)',
              borderColor: 'rgba(16, 185, 129, 0.5)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.15)',
            }}>
            <p className="text-sm text-white/90"><strong>6) Restrictions:</strong> <InlineMath math={'x \\neq 0'} />, <InlineMath math={'x \\neq 1'} />, and <InlineMath math={'x \\neq -1'} />.</p>
            <p className="text-sm mt-1 text-white/90">Both solutions are valid: <InlineMath math={'-\\frac{1}{4} \\neq 0, 1, -1'} /> and <InlineMath math={'3 \\neq 0, 1, -1'} />.</p>
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: 'Gamified Practice — Clear the Denominators',
      icon: <Trophy className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          {/* Question 1 */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-300/30">
            <h4 className="text-yellow-200 font-semibold mb-3 flex items-center gap-2">
              <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">Q1</span>
              What is the LCD of 1/x and 1/2?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['x', '2', '2x', 'x/2'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[1]?.answer === option ? 
                    (questionsAnswered[1]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    1, 
                    option, 
                    '2x',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[1]}
                  className="hover:shadow-[0_0_20px_rgba(236,72,153,0.35)]"
                >
                  <BlockMath math={option} />
                </Button>
              ))}
            </div>
            {showQuestionFeedback[1] && questionsAnswered[1] && !questionsAnswered[1].correct && (
              <div className="bg-red-500/20 rounded-lg p-4 border border-red-300/30">
                <h5 className="text-red-200 font-semibold mb-3">💡 How to Find LCD Step-by-Step:</h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="rounded p-3 border-2"
                    style={{
                      background: 'rgba(30, 58, 138, 0.70)',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
                    }}>
                    <p className="font-semibold text-yellow-200 mb-1">STEP 1: Identify the denominators</p>
                    <p className="text-white/90">• First fraction: x</p>
                    <p className="text-white/90">• Second fraction: 2</p>
                  </div>
                  <div className="rounded p-3 border-2"
                    style={{
                      background: 'rgba(30, 58, 138, 0.70)',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
                    }}>
                    <p className="font-semibold text-yellow-200 mb-1">STEP 2: Find all unique factors</p>
                    <p className="text-white/90">• From x: factor is x</p>
                    <p className="text-white/90">• From 2: factor is 2</p>
                    <p className="text-white/90">• Unique factors: 2, x</p>
                  </div>
                  <div className="rounded p-3 border-2"
                    style={{
                      background: 'rgba(30, 58, 138, 0.70)',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
                    }}>
                    <p className="font-semibold text-yellow-200 mb-1">STEP 3: Multiply all unique factors</p>
                    <p className="text-white/90">• LCD = 2 × x = 2x</p>
                  </div>
                  <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                    <p className="text-green-200 text-xs">✓ Check: 2x ÷ x = 2 ✓ and 2x ÷ 2 = x ✓</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[1] && questionsAnswered[1] && questionsAnswered[1].correct && (
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30">
                <p className="text-green-200 font-semibold">✅ Excellent! You correctly identified that 2x is the LCD.</p>
              </div>
            )}
          </div>

          {/* Question 2 */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-300/30">
            <h4 className="text-blue-200 font-semibold mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm font-bold">Q2</span>
              Solve: 1/x + 1/2 = 1/4
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['x = 4', 'x = -4', 'x = 2', 'x = -2'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[2]?.answer === option ? 
                    (questionsAnswered[2]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    2, 
                    option, 
                    'x = -4',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[2]}
                  className="hover:shadow-[0_0_20px_rgba(236,72,153,0.35)]"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[2] && questionsAnswered[2] && !questionsAnswered[2].correct && (
              <div className="bg-red-500/20 rounded-lg p-4 border border-red-300/30">
                <h5 className="text-red-200 font-semibold mb-3">💡 How to Solve with LCD Method:</h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="rounded p-3 border-2"
                    style={{
                      background: 'rgba(30, 58, 138, 0.70)',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
                    }}>
                    <p className="font-semibold text-yellow-200 mb-1">STEP 1: Find the LCD</p>
                    <p className="text-white/90">• Denominators: x, 2, 4</p>
                    <p className="text-white/90">• LCD = 4x</p>
                  </div>
                  <div className="rounded p-3 border-2"
                    style={{
                      background: 'rgba(30, 58, 138, 0.70)',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
                    }}>
                    <p className="font-semibold text-yellow-200 mb-1">STEP 2: Multiply by LCD</p>
                    <p className="text-white/90">• 4x × (1/x + 1/2) = 4x × (1/4)</p>
                    <p className="text-white/90">• 4 + 2x = x</p>
                  </div>
                  <div className="rounded p-3 border-2"
                    style={{
                      background: 'rgba(30, 58, 138, 0.70)',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
                    }}>
                    <p className="font-semibold text-yellow-200 mb-1">STEP 3: Solve for x</p>
                    <p className="text-white/90">• 4 + 2x = x</p>
                    <p className="text-white/90">• 4 = -x</p>
                    <p className="text-white/90">• x = -4</p>
                  </div>
                  <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                    <p className="text-green-200 text-xs">✓ Check: x ≠ 0, so x = -4 is valid</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[2] && questionsAnswered[2] && questionsAnswered[2].correct && (
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30">
                <p className="text-green-200 font-semibold">✅ Perfect! You solved it correctly using LCD.</p>
              </div>
            )}
          </div>

          {/* Question 3 */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-300/30">
            <h4 className="text-purple-200 font-semibold mb-3 flex items-center gap-2">
              <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-sm font-bold">Q3</span>
              What restriction applies to x in 1/x + 1/2 = 1/4?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['x ≠ 0', 'x ≠ 2', 'x ≠ 4', 'x ≠ -4'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[3]?.answer === option ? 
                    (questionsAnswered[3]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    3, 
                    option, 
                    'x ≠ 0',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[3]}
                  className="hover:shadow-[0_0_20px_rgba(236,72,153,0.35)]"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[3] && questionsAnswered[3] && !questionsAnswered[3].correct && (
              <div className="bg-red-500/20 rounded-lg p-4 border border-red-300/30">
                <h5 className="text-red-200 font-semibold mb-3">💡 Understanding Restrictions:</h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="rounded p-3 border-2"
                    style={{
                      background: 'rgba(30, 58, 138, 0.70)',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
                    }}>
                    <p className="font-semibold text-yellow-200 mb-1">WHY do we check restrictions?</p>
                    <p className="text-white/90">• Division by zero is undefined</p>
                    <p className="text-white/90">• If x = 0, then 1/x becomes 1/0 (undefined)</p>
                    <p className="text-white/90">• This would make the equation invalid</p>
                  </div>
                  <div className="rounded p-3 border-2"
                    style={{
                      background: 'rgba(30, 58, 138, 0.70)',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
                    }}>
                    <p className="font-semibold text-yellow-200 mb-1">HOW to find restrictions:</p>
                    <p className="text-white/90">• Look at all denominators in the equation</p>
                    <p className="text-white/90">• Set each denominator equal to zero</p>
                    <p className="text-white/90">• Solve for the variable</p>
                  </div>
                  <div className="rounded p-3 border-2"
                    style={{
                      background: 'rgba(30, 58, 138, 0.70)',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 0 15px rgba(59, 130, 246, 0.1)',
                    }}>
                    <p className="font-semibold text-yellow-200 mb-1">In this equation:</p>
                    <p className="text-white/90">• Denominator: x</p>
                    <p className="text-white/90">• Set x = 0</p>
                    <p className="text-white/90">• Restriction: x ≠ 0</p>
                  </div>
                  <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                    <p className="text-green-200 text-xs">✓ Always check restrictions before solving!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[3] && questionsAnswered[3] && questionsAnswered[3].correct && (
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30">
                <p className="text-green-200 font-semibold">✅ Great! You understand restrictions correctly.</p>
              </div>
            )}
          </div>

          {/* Quiz Results */}
          {quizCompleted && (
            <div className="bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-xl p-6 border border-indigo-300/30">
              <h4 className="text-indigo-200 font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Quiz Results
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg p-4 border-2"
                  style={{
                    background: 'rgba(30, 58, 138, 0.75)',
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.15)',
                  }}>
                  <h5 className="text-white font-semibold mb-2">Performance Summary</h5>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-300 mb-1">
                      {getPerformanceSummary().correct}/{getPerformanceSummary().total}
                    </div>
                    <p className="text-white/80 text-sm">Questions Correct</p>
                    <div className="text-xl font-semibold text-cyan-200 mt-2">
                      {getPerformanceSummary().percentage}%
                    </div>
                  </div>
                </div>
                <div className="rounded-lg p-4 border-2"
                  style={{
                    background: 'rgba(30, 58, 138, 0.75)',
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.15)',
                  }}>
                  <h5 className="text-white font-semibold mb-2">Areas to Improve</h5>
                  {getImprovementAreas().length > 0 ? (
                    <ul className="text-sm text-white/90 space-y-1">
                      {getImprovementAreas().map((area, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">•</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-green-300 text-sm">🎉 Excellent! No areas need improvement.</p>
                  )}
                </div>
              </div>
              {getPerformanceSummary().percentage >= 70 ? (
                <div className="bg-green-500/20 rounded-lg p-4 mt-4 border border-green-300/30 text-center">
                  <p className="text-green-200 font-semibold">🎊 Well done! You're ready to continue to the next lesson!</p>
                </div>
              ) : (
                <div className="bg-yellow-500/20 rounded-lg p-4 mt-4 border border-yellow-300/30 text-center">
                  <p className="text-yellow-200 font-semibold">📚 Consider reviewing the concepts above before continuing.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  ];

  const prev = () => {
    if (currentSection > 0) {
      const n = currentSection - 1;
      setCurrentSection(n);
      setProgress((n / (steps.length - 1)) * 100);
    }
  };
  const next = () => {
    if (currentSection < steps.length - 1) {
      const n = currentSection + 1;
      setCurrentSection(n);
      setProgress((n / (steps.length - 1)) * 100);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Earth background - Fixed positioning, fills screen */}
      <motion.img
        src={earthBackgrounds[currentSection % earthBackgrounds.length]}
        alt="Earth Background"
        className="fixed inset-0 w-full h-full object-cover"
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
        }}
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ 
          opacity: backgroundLoaded ? 1 : 0,
          scale: backgroundLoaded ? [1.05, 1.08, 1.05] : 1.1,
        }}
        transition={{ 
          opacity: { duration: 1.2, ease: "easeInOut" },
          scale: { 
            duration: 20, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1.2
          }
        }}
        key={currentSection}
      />
      {/* Vignette/gradient for readability */}
      <motion.div 
        className="fixed inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60"
        style={{ zIndex: 1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: backgroundLoaded ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      />
      <motion.div 
        className="fixed inset-0 pointer-events-none" 
        style={{ boxShadow: 'inset 0 0 180px rgba(0,0,0,0.55)', zIndex: 1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: backgroundLoaded ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      />
      
      {/* Animated glowing particles matching Earth colors */}
      <motion.div 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: backgroundLoaded ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.8 }}
      >
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </motion.div>

      {/* Video game-style title animation for each slide */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: backgroundLoaded && !contentVisible ? 1 : 0,
        }}
        transition={{ 
          duration: 0.5,
          delay: 0.8,
        }}
      >
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ 
            scale: backgroundLoaded && !contentVisible ? 1 : 0.8,
            opacity: backgroundLoaded && !contentVisible ? 1 : 0,
            y: backgroundLoaded && !contentVisible ? 0 : 50,
          }}
          transition={{ 
            duration: 0.8,
            delay: 1.0,
            ease: [0.34, 1.56, 0.64, 1], // Back ease for bouncy effect
          }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-orbitron font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #60a5fa 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(16, 185, 129, 0.6)',
              filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))',
            }}
            animate={{
              textShadow: [
                '0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(16, 185, 129, 0.6)',
                '0 0 60px rgba(59, 130, 246, 1), 0 0 100px rgba(16, 185, 129, 0.8)',
                '0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(16, 185, 129, 0.6)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {steps[currentSection].title}
          </motion.h1>
          <motion.div
            className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-blue-400 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ 
              scaleX: backgroundLoaded && !contentVisible ? 1 : 0,
            }}
            transition={{ 
              duration: 0.6,
              delay: 1.5,
              ease: "easeOut",
            }}
          />
        </motion.div>
      </motion.div>

      <motion.header 
        className="p-6 border-b border-white/10 backdrop-blur-sm relative z-10" 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ 
          opacity: contentVisible ? 1 : 0, 
          y: contentVisible ? 0 : -20 
        }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Calculator className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-orbitron font-bold text-xl bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Earth — Clearing Denominators</h1>
              <p className="text-xs text-white/80">Lesson 3</p>
            </div>
          </div>
          <Badge variant="secondary">{currentSection + 1} / {steps.length}</Badge>
        </div>
      </motion.header>

      <motion.div 
        className="container mx-auto px-6 py-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: contentVisible ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <motion.div
            key={steps[currentSection].id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ 
              opacity: contentVisible ? 1 : 0, 
              y: contentVisible ? 0 : 12 
            }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.01 }}
            className="relative rounded-2xl backdrop-blur-md border-2 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.85) 0%, rgba(15, 23, 42, 0.90) 50%, rgba(20, 83, 45, 0.85) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 0 60px rgba(59, 130, 246, 0.4), 0 0 120px rgba(16, 185, 129, 0.2), inset 0 0 40px rgba(59, 130, 246, 0.1)',
            }}
          >
            {/* Animated glow border */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [
                  '0 0 60px rgba(59, 130, 246, 0.4), 0 0 120px rgba(16, 185, 129, 0.2)',
                  '0 0 80px rgba(59, 130, 246, 0.6), 0 0 140px rgba(16, 185, 129, 0.3)',
                  '0 0 60px rgba(59, 130, 246, 0.4), 0 0 120px rgba(16, 185, 129, 0.2)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div className="p-6">
              <motion.div 
                className="flex items-center gap-3 mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: contentVisible ? 1 : 0,
                  x: contentVisible ? 0 : -20,
                }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <motion.div 
                  className="p-2 rounded-md bg-white/10 shadow-[0_0_18px_rgba(255,255,255,0.15)]"
                  animate={{
                    boxShadow: [
                      '0 0 18px rgba(255,255,255,0.15)',
                      '0 0 25px rgba(59, 130, 246, 0.5)',
                      '0 0 18px rgba(255,255,255,0.15)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {steps[currentSection].icon ?? <Target className="w-5 h-5" />}
                </motion.div>
                <h2 className="font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {steps[currentSection].title}
                </h2>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: contentVisible ? 1 : 0,
                  y: contentVisible ? 0 : 20,
                }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                {steps[currentSection].content}
              </motion.div>
            </div>
          </motion.div>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={prev} disabled={currentSection === 0} className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft size={16} /> Previous
            </Button>
            
            {currentSection === steps.length - 1 ? (
              // Last step: show Finish Lesson and Continue buttons
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleFinishLesson}
                  className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <CheckCircle size={16} /> Finish Lesson
                </Button>
                <Button 
                  onClick={handleContinueToNext}
                  className="flex items-center gap-2 shadow-[0_0_30px_rgba(59,130,246,0.35)]"
                >
                  <ArrowRight size={16} /> Continue to Mars
                </Button>
              </div>
            ) : (
              // Not last step: show Next button
              <Button onClick={next} className="flex items-center gap-2 shadow-[0_0_30px_rgba(59,130,246,0.35)]">
                Next <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Completion Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent className="border-cosmic-purple/20 bg-cosmic-dark/95 backdrop-blur-md">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-2xl font-orbitron text-cosmic-purple">
              🎉 Earth Lesson Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cosmic-text text-center">
              Excellent work! You've mastered clearing denominators in rational equations. 
              <br />
              <strong className="text-cosmic-green">Mars lesson is now unlocked!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 justify-center">
            <AlertDialogCancel 
              onClick={() => {
                setShowCompletionDialog(false);
                navigate('/rpg');
              }}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              <Home size={16} className="mr-2" />
              Back to Solar System
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowCompletionDialog(false);
                handleContinueToNext();
              }}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
            >
              Continue to Mars 🚀
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EarthLesson;


