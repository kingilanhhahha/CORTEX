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
  Star,
  Zap,
  Shield,
  XCircle,
  Sparkles,
  Flame
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { db } from '@/lib/database';

const jupiterBg = new URL('../../planet background/SATURN.jpeg', import.meta.url).href;

const JupiterLesson: React.FC = () => {
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
  const [skills, setSkills] = useState<Record<string, { correct: number; total: number }>>({
    solvingProcess: { correct: 0, total: 0 },
    quadraticEquations: { correct: 0, total: 0 },
    restrictions: { correct: 0, total: 0 },
    lcdApplication: { correct: 0, total: 0 },
    factoring: { correct: 0, total: 0 },
    algebra: { correct: 0, total: 0 },
  });
  const startRef = useRef<number>(Date.now());

  useEffect(() => { startRef.current = Date.now(); }, []);

  // Save progress whenever currentSection changes - but debounced to avoid excessive saves
  useEffect(() => {
    if (user?.id) {
      const timeoutId = setTimeout(() => {
        const progressPercentage = ((currentSection + 1) / sections.length) * 100;
        saveProgress(user.id, {
          module_id: 'jupiter',
          section_id: 'section_0',
          slide_index: currentSection,
          progress_pct: progressPercentage,
        });
      }, 1000); // Debounce progress saves by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentSection, user?.id, saveProgress]);

  const saveLessonProgress = async () => {
    try {
      const total = equationsSolved.length + mistakes.length;
      const score = total > 0 ? Math.round((equationsSolved.length / total) * 100) : 0;
      const minutes = Math.max(1, Math.round((Date.now() - startRef.current) / 60000));
      await db.saveStudentProgress({
        studentId: user?.id || 'guest',
        moduleId: 'lesson-jupiter',
        moduleName: 'Jupiter — Complex Rational Equations',
        completedAt: new Date(),
        score,
        timeSpent: minutes,
        equationsSolved,
        mistakes,
        skillBreakdown: skills,
      } as any);
      toast({ title: 'Saved', description: 'Your Jupiter lesson results were saved.' });
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not save progress. Will retry later.', variant: 'destructive' });
    }
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

    if (isCorrect) {
      toast({
        title: "Correct! 🎉",
        description: "Great job! You understand this concept.",
        variant: "default",
      });
    } else {
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
      areas.push("Finding LCD for complex rational equations");
    }
    if (questionsAnswered[2] && !questionsAnswered[2].correct) {
      areas.push("Solving quadratic equations from rational equations");
    }
    if (questionsAnswered[3] && !questionsAnswered[3].correct) {
      areas.push("Identifying and checking multiple restrictions");
    }
    
    return areas;
  };

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

  const handleFinishLesson = async () => {
    try {
      // Use the optimized lesson completion function
      const success = await completeLesson(user.id, {
        lessonId: 'jupiter-lesson',
        lessonName: 'Jupiter: Complex Rational Equations',
        score: getPerformanceSummary().percentage,
        timeSpent: Math.max(1, Math.round((Date.now() - startRef.current) / 60000)),
        equationsSolved,
        mistakes,
        skillBreakdown: skills,
        xpEarned: 350,
        planetName: 'Jupiter',
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
    
    // Save progress for next lesson (Saturn) so it shows up in "In Progress"
    if (user?.id) {
      try {
        await saveProgress(user.id, {
          module_id: 'saturn',
          section_id: 'section_0',
          slide_index: 0,
          progress_pct: 0, // Starting fresh on next lesson
        });
      } catch (error) {
        console.error('Error saving progress for next lesson:', error);
      }
    }
    
    toast({ title: 'Progress Saved! 🚀', description: 'Continuing to next lesson.' });
    navigate('/saturn-lesson');
  };

  const handleBackToSolarSystem = () => {
    navigate('/rpg');
  };

  const sections = [
    {
      id: 1,
      title: '🚀 Mission: Complex Rational Equations',
      icon: <Star className="w-6 h-6 text-orange-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500/20 via-red-500/20 to-orange-600/20 rounded-2xl p-6 border-2 border-orange-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-8 h-8 text-orange-400 animate-pulse" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-200 via-yellow-200 to-orange-300 bg-clip-text text-transparent">
                Welcome to Jupiter — Advanced Problem Types
              </h3>
            </div>
            <div className="space-y-4 text-white/95">
              <p className="text-lg leading-relaxed">
                Welcome to <strong className="text-orange-300">Jupiter</strong>, the largest planet! Here we tackle <span className="bg-orange-500/30 px-2 py-1 rounded">complex rational equations</span> that require <span className="bg-red-500/30 px-2 py-1 rounded">combining all techniques</span> you've learned.
              </p>
              <div className="bg-black/30 rounded-xl p-4 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-2">🎯 What Makes Jupiter Challenges Complex?</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Multiple fractions</strong> on both sides of the equation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Factoring required</strong> before finding LCD</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Quadratic equations</strong> result from clearing denominators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Multiple restrictions</strong> to check</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-5 border border-yellow-400/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-300" />
              <p className="font-semibold text-yellow-200">💡 Strategy:</p>
            </div>
            <p className="text-white/90 text-sm">
              Combine techniques from <strong className="text-yellow-200">Mercury, Venus, Earth, and Mars</strong> to solve these advanced problems!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '⚡ Combining All Techniques',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 rounded-2xl p-6 border-2 border-purple-400/40 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-purple-200 mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6" />
              The Complete Problem-Solving Arsenal
            </h3>
            <div className="space-y-4 text-white/90">
              <p className="text-lg">
                Jupiter challenges require you to <strong className="text-purple-300">masterfully combine</strong> all previous techniques:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">M</div>
                    <p className="font-bold text-blue-200">From Mercury:</p>
                  </div>
                  <ul className="text-sm space-y-1 text-white/90">
                    <li>• Understanding rational equations</li>
                    <li>• Basic concepts and terminology</li>
                    <li>• Domain restrictions</li>
                  </ul>
                </div>

                <div className="bg-black/40 rounded-xl p-5 border border-pink-400/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">V</div>
                    <p className="font-bold text-pink-200">From Venus:</p>
                  </div>
                  <ul className="text-sm space-y-1 text-white/90">
                    <li>• Finding LCD systematically</li>
                    <li>• Factoring denominators</li>
                    <li>• Identifying unique factors</li>
                  </ul>
                </div>

                <div className="bg-black/40 rounded-xl p-5 border border-green-400/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">E</div>
                    <p className="font-bold text-green-200">From Earth:</p>
                  </div>
                  <ul className="text-sm space-y-1 text-white/90">
                    <li>• Clearing denominators</li>
                    <li>• Advanced cancellation</li>
                    <li>• Simplifying complex fractions</li>
                  </ul>
                </div>

                <div className="bg-black/40 rounded-xl p-5 border border-red-400/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">M</div>
                    <p className="font-bold text-red-200">From Mars:</p>
                  </div>
                  <ul className="text-sm space-y-1 text-white/90">
                    <li>• Checking for extraneous solutions</li>
                    <li>• Verifying restrictions</li>
                    <li>• Validating final answers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-5 border-2 border-orange-400/40">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-6 h-6 text-orange-400 animate-pulse" />
              <p className="font-bold text-orange-200 text-lg">Key Difference</p>
            </div>
            <p className="text-white/90">
              Jupiter problems often result in <strong className="text-orange-300">quadratic equations</strong> after clearing denominators, requiring factoring or the quadratic formula!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '🎯 Example 1: Multiple Fractions with Factoring',
      icon: <Target className="w-6 h-6 text-orange-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Complex Example: Factor First, Then Clear
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">📝 Original Equation:</p>
                <div className="text-center bg-white/10 rounded-lg p-4 mb-4">
                  <BlockMath math={'\\frac{1}{x^2-4} + \\frac{1}{x-2} = \\frac{2}{x+2}'} />
                </div>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Step 1: Factor Denominators FIRST</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• <InlineMath math={'x^2-4 = (x-2)(x+2)'} /> (difference of squares)</p>
                    <p>• <InlineMath math={'x-2'} /> (already factored)</p>
                    <p>• <InlineMath math={'x+2'} /> (already factored)</p>
                  </div>
                  <p className="text-sm font-semibold text-yellow-300 mt-2">All denominators: <InlineMath math={'(x-2)(x+2), \\; (x-2), \\; (x+2)'} /></p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">🔧 Step 2: Find LCD</p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-white/80">Unique factors: <InlineMath math={'x-2'} /> and <InlineMath math={'x+2'} /></p>
                  <p className="text-sm font-semibold text-blue-300">LCD = <InlineMath math={'(x-2)(x+2)'} /></p>
                  <p className="text-xs text-white/70 mt-2">Restrictions: <InlineMath math={'x \\neq 2'} /> and <InlineMath math={'x \\neq -2'} /></p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">✨ Step 3: Clear Denominators</p>
                <div className="space-y-2">
                  <BlockMath math={'(x-2)(x+2) \\cdot \\frac{1}{(x-2)(x+2)} + (x-2)(x+2) \\cdot \\frac{1}{x-2} = (x-2)(x+2) \\cdot \\frac{2}{x+2}'} />
                  <BlockMath math={'1 + (x+2) = 2(x-2)'} />
                  <BlockMath math={'1 + x + 2 = 2x - 4'} />
                  <BlockMath math={'x + 3 = 2x - 4'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">🧮 Step 4: Solve</p>
                <div className="space-y-2">
                  <BlockMath math={'x + 3 = 2x - 4'} />
                  <BlockMath math={'3 + 4 = 2x - x'} />
                  <BlockMath math={'x = 7'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Step 5: Check Restrictions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90">
                    Solution: <InlineMath math={'x = 7'} />
                  </p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Verify:</p>
                    <p className="text-sm">• <InlineMath math={'7 \\neq 2'} /> ✅</p>
                    <p className="text-sm">• <InlineMath math={'7 \\neq -2'} /> ✅</p>
                  </div>
                  <div className="bg-green-600/40 rounded-lg p-3 border border-green-400 mt-3">
                    <p className="font-bold text-green-200 text-center">
                      ✅ VALID SOLUTION! x = 7 satisfies all restrictions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: '🔥 Example 2: Results in Quadratic Equation',
      icon: <Flame className="w-6 h-6 text-orange-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 border-2 border-orange-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <h3 className="text-xl font-bold text-orange-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Advanced: Quadratic Result
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">📝 Original Equation:</p>
                <div className="text-center bg-white/10 rounded-lg p-4 mb-4">
                  <BlockMath math={'\\frac{3}{x} + \\frac{2}{x+1} - \\frac{1}{x-1} = \\frac{4}{x^2-1}'} />
                </div>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Step 1: Factor ALL Denominators</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• <InlineMath math={'x'} /> (already factored)</p>
                    <p>• <InlineMath math={'x+1'} /> (already factored)</p>
                    <p>• <InlineMath math={'x-1'} /> (already factored)</p>
                    <p>• <InlineMath math={'x^2-1 = (x-1)(x+1)'} /> (difference of squares)</p>
                  </div>
                  <p className="text-sm font-semibold text-yellow-300 mt-2">LCD = <InlineMath math={'x(x-1)(x+1)'} /> | Restrictions: <InlineMath math={'x \\neq 0, 1, -1'} /></p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">🔧 Step 2: Clear Denominators</p>
                <div className="bg-white/10 rounded-lg p-3 text-sm">
                  <BlockMath math={'x(x-1)(x+1) \\left(\\frac{3}{x} + \\frac{2}{x+1} - \\frac{1}{x-1}\\right) = x(x-1)(x+1) \\cdot \\frac{4}{(x-1)(x+1)}'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">✨ Step 3: Simplify</p>
                <div className="space-y-2">
                  <BlockMath math={'3(x-1)(x+1) + 2x(x-1) - x(x+1) = 4x'} />
                  <BlockMath math={'3(x^2-1) + 2x^2 - 2x - x^2 - x = 4x'} />
                  <BlockMath math={'3x^2 - 3 + 2x^2 - 2x - x^2 - x = 4x'} />
                  <BlockMath math={'4x^2 - 3x - 3 = 4x'} />
                  <BlockMath math={'4x^2 - 7x - 3 = 0'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">🧮 Step 4: Solve Quadratic</p>
                <div className="space-y-2">
                  <p className="text-sm text-white/80 mb-2">Factor: <InlineMath math={'4x^2 - 7x - 3 = 0'} /></p>
                  <BlockMath math={'(4x+1)(x-3) = 0'} />
                  <BlockMath math={'x = -\\frac{1}{4} \\; \\text{or} \\; x = 3'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Step 5: Verify Both Solutions</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Check <InlineMath math={'x = -\\frac{1}{4}'} />:</p>
                    <p className="text-sm">• <InlineMath math={'-\\frac{1}{4} \\neq 0, 1, -1'} /> ✅</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Check <InlineMath math={'x = 3'} />:</p>
                    <p className="text-sm">• <InlineMath math={'3 \\neq 0, 1, -1'} /> ✅</p>
                  </div>
                  <div className="bg-green-600/40 rounded-lg p-3 border border-green-400 mt-3">
                    <p className="font-bold text-green-200 text-center">
                      ✅ BOTH SOLUTIONS VALID! <InlineMath math={'x = -\\frac{1}{4}'} /> and <InlineMath math={'x = 3'} />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: '⚔️ Example 3: Multiple Restrictions & Extraneous',
      icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-6 border-2 border-indigo-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <h3 className="text-xl font-bold text-indigo-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Master Challenge: Multiple Restrictions
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">📝 Original Equation:</p>
                <div className="text-center bg-white/10 rounded-lg p-4 mb-4">
                  <BlockMath math={'\\frac{x+1}{x-3} + \\frac{2}{x+2} = \\frac{x+5}{(x-3)(x+2)}'} />
                </div>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Step 1: Identify ALL Restrictions</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• <InlineMath math={'x-3 = 0'} /> → <InlineMath math={'x = 3'} /></p>
                    <p>• <InlineMath math={'x+2 = 0'} /> → <InlineMath math={'x = -2'} /></p>
                  </div>
                  <p className="text-sm font-semibold text-yellow-300 mt-2">Restrictions: <InlineMath math={'x \\neq 3'} /> and <InlineMath math={'x \\neq -2'} /></p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">🔧 Step 2: Find LCD and Clear</p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-white/80">LCD = <InlineMath math={'(x-3)(x+2)'} /></p>
                  <div className="bg-white/10 rounded-lg p-3 text-sm">
                    <BlockMath math={'(x-3)(x+2) \\left(\\frac{x+1}{x-3} + \\frac{2}{x+2}\\right) = (x-3)(x+2) \\cdot \\frac{x+5}{(x-3)(x+2)}'} />
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">✨ Step 3: Simplify</p>
                <div className="space-y-2">
                  <BlockMath math={'(x+1)(x+2) + 2(x-3) = x+5'} />
                  <BlockMath math={'x^2 + 3x + 2 + 2x - 6 = x + 5'} />
                  <BlockMath math={'x^2 + 5x - 4 = x + 5'} />
                  <BlockMath math={'x^2 + 4x - 9 = 0'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">🧮 Step 4: Solve Quadratic (Use Formula)</p>
                <div className="space-y-2 text-sm">
                  <p className="text-white/80 mb-2">For <InlineMath math={'x^2 + 4x - 9 = 0'} />, use quadratic formula:</p>
                  <BlockMath math={'x = \\frac{-4 \\pm \\sqrt{16 + 36}}{2} = \\frac{-4 \\pm \\sqrt{52}}{2} = \\frac{-4 \\pm 2\\sqrt{13}}{2}'} />
                  <BlockMath math={'x = -2 \\pm \\sqrt{13}'} />
                  <p className="text-white/80 mt-2">Solutions: <InlineMath math={'x = -2 + \\sqrt{13}'} /> or <InlineMath math={'x = -2 - \\sqrt{13}'} /></p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Step 5: Verify Against Restrictions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90 text-sm">
                    Approximations: <InlineMath math={'x \\approx 1.61'} /> and <InlineMath math={'x \\approx -5.61'} />
                  </p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Check restrictions:</p>
                    <p className="text-sm">• <InlineMath math={'1.61 \\neq 3, -2'} /> ✅</p>
                    <p className="text-sm">• <InlineMath math={'-5.61 \\neq 3, -2'} /> ✅</p>
                  </div>
                  <div className="bg-green-600/40 rounded-lg p-3 border border-green-400 mt-3">
                    <p className="font-bold text-green-200 text-center text-sm">
                      ✅ BOTH SOLUTIONS VALID! <InlineMath math={'x = -2 \\pm \\sqrt{13}'} />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: '🛡️ Problem-Solving Strategy for Complex Equations',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-blue-200 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              The Jupiter Protocol: 6-Step Master Strategy
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Factor ALL Denominators</p>
                    <p className="text-white/90 text-sm">
                      Look for difference of squares, common factors, and factorable quadratics. This is <strong className="text-blue-300">critical</strong> for finding the correct LCD.
                    </p>
                    <div className="bg-blue-500/20 rounded-lg p-2 mt-2 border border-blue-400/30">
                      <p className="text-xs text-blue-200">Example: <InlineMath math={'x^2-9 = (x-3)(x+3)'} />, <InlineMath math={'x^2-4 = (x-2)(x+2)'} /></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Identify ALL Restrictions</p>
                    <p className="text-white/90 text-sm">
                      Set each denominator factor equal to zero. Write down <strong className="text-blue-300">every restriction</strong> before solving.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Find the LCD</p>
                    <p className="text-white/90 text-sm">
                      From all factored denominators, collect unique factors. Multiply them together to get LCD.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">4</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Clear Denominators</p>
                    <p className="text-white/90 text-sm">
                      Multiply every term by the LCD. Cancel carefully. You may get a linear or <strong className="text-blue-300">quadratic equation</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">5</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Solve the Resulting Equation</p>
                    <p className="text-white/90 text-sm">
                      Use appropriate methods: linear solving, factoring, or quadratic formula. You may get <strong className="text-blue-300">multiple solutions</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">6</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Verify EACH Solution</p>
                    <p className="text-white/90 text-sm mb-2">
                      Check every solution against <strong className="text-blue-300">all restrictions</strong>. Reject extraneous solutions.
                    </p>
                    <div className="bg-green-500/20 rounded-lg p-2 border border-green-400/30">
                      <p className="text-xs text-green-200">✅ Valid: Solution satisfies all restrictions</p>
                    </div>
                    <div className="bg-red-500/20 rounded-lg p-2 border border-red-400/30 mt-2">
                      <p className="text-xs text-red-200">❌ Extraneous: Solution violates a restriction</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-5 border-2 border-yellow-400/40">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <p className="font-bold text-yellow-200 text-lg">Pro Tip</p>
            </div>
            <p className="text-white/90">
              Always factor first! This makes finding the LCD much easier and prevents mistakes.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: '⚔️ Jupiter Master Challenge Quiz',
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-2xl p-6 border-2 border-yellow-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(234,179,8,0.3)]">
            <h3 className="text-2xl font-bold text-yellow-200 mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400 animate-pulse" />
              🏆 Test Your Mastery of Complex Rational Equations 🏆
            </h3>
            
            <p className="text-white/90 text-lg mb-6">
              Answer these questions to prove you've mastered Jupiter-level complex rational equations!
            </p>
          </div>

          {/* Question 1 */}
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border-2 border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.3)]">
            <h4 className="text-blue-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q1</span>
              For the equation <InlineMath math={'\\frac{1}{x^2-4} + \\frac{1}{x-2} = \\frac{2}{x+2}'} />, what is the LCD after factoring?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['(x-2)(x+2)', 'x^2-4', 'x-2', 'x+2'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[1]?.answer === option ? 
                    (questionsAnswered[1]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    1, 
                    option, 
                    '(x-2)(x+2)',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[1]}
                  className="hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
                >
                  <InlineMath math={option === '(x-2)(x+2)' ? '(x-2)(x+2)' : option === 'x^2-4' ? 'x^2-4' : option} />
                </Button>
              ))}
            </div>
            {showQuestionFeedback[1] && questionsAnswered[1] && !questionsAnswered[1].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Factor First!
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-blue-200 mb-2">Step 1: Factor all denominators</p>
                    <ul className="space-y-1">
                      <li>• <InlineMath math={'x^2-4 = (x-2)(x+2)'} /> (difference of squares)</li>
                      <li>• <InlineMath math={'x-2'} /> (already factored)</li>
                      <li>• <InlineMath math={'x+2'} /> (already factored)</li>
                    </ul>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-blue-200 mb-2">Step 2: Find LCD</p>
                    <p>Unique factors: <InlineMath math={'x-2'} /> and <InlineMath math={'x+2'} /></p>
                    <p className="text-yellow-300 font-semibold mt-2">LCD = <InlineMath math={'(x-2)(x+2)'} /></p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Always factor first before finding LCD!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[1] && questionsAnswered[1] && questionsAnswered[1].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You correctly identified the LCD after factoring.
                </p>
              </div>
            )}
          </div>

          {/* Question 2 */}
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border-2 border-orange-400/40 shadow-[0_0_25px_rgba(249,115,22,0.3)]">
            <h4 className="text-orange-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q2</span>
              After clearing denominators, if you get <InlineMath math={'4x^2 - 7x - 3 = 0'} />, what should you do next?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Factor or use quadratic formula', 'Divide by 4', 'Add 3 to both sides', 'Take square root'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[2]?.answer === option ? 
                    (questionsAnswered[2]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    2, 
                    option, 
                    'Factor or use quadratic formula',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[2]}
                  className="hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[2] && questionsAnswered[2] && !questionsAnswered[2].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Solving Quadratic Equations
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-orange-200 mb-2">This is a QUADRATIC equation!</p>
                    <p className="mb-2">For <InlineMath math={'4x^2 - 7x - 3 = 0'} />:</p>
                    <ul className="space-y-1">
                      <li>• Try factoring first: <InlineMath math={'(4x+1)(x-3) = 0'} /></li>
                      <li>• If factoring fails, use quadratic formula</li>
                      <li>• You may get 0, 1, or 2 solutions</li>
                    </ul>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-orange-200 mb-2">After solving:</p>
                    <p>Always check solutions against restrictions!</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Complex rational equations often result in quadratic equations!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[2] && questionsAnswered[2] && questionsAnswered[2].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Excellent! You understand how to handle quadratic equations from rational equations.
                </p>
              </div>
            )}
          </div>

          {/* Question 3 */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border-2 border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            <h4 className="text-purple-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q3</span>
              For <InlineMath math={'\\frac{3}{x} + \\frac{2}{x+1} - \\frac{1}{x-1} = \\frac{4}{x^2-1}'} />, what are ALL the restrictions?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['x ≠ 0, 1, -1', 'x ≠ 0', 'x ≠ 1', 'No restrictions'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[3]?.answer === option ? 
                    (questionsAnswered[3]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    3, 
                    option, 
                    'x ≠ 0, 1, -1',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[3]}
                  className="hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[3] && questionsAnswered[3] && !questionsAnswered[3].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Finding ALL Restrictions
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-purple-200 mb-2">Step 1: Factor denominators</p>
                    <ul className="space-y-1">
                      <li>• <InlineMath math={'x'} /> → <InlineMath math={'x = 0'} /> restriction</li>
                      <li>• <InlineMath math={'x+1'} /> → <InlineMath math={'x = -1'} /> restriction</li>
                      <li>• <InlineMath math={'x-1'} /> → <InlineMath math={'x = 1'} /> restriction</li>
                      <li>• <InlineMath math={'x^2-1 = (x-1)(x+1)'} /> → same restrictions</li>
                    </ul>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-purple-200 mb-2">Step 2: List ALL unique restrictions</p>
                    <p className="text-yellow-300 font-semibold">Restrictions: <InlineMath math={'x \\neq 0'} />, <InlineMath math={'x \\neq 1'} />, and <InlineMath math={'x \\neq -1'} /></p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Always check ALL denominators for restrictions!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[3] && questionsAnswered[3] && questionsAnswered[3].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You correctly identified all restrictions.
                </p>
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
                <div className="bg-white/10 rounded-lg p-4">
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
                <div className="bg-white/10 rounded-lg p-4">
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
                  <p className="text-green-200 font-semibold">🎊 Well done! You've mastered Jupiter-level complex rational equations!</p>
                </div>
              ) : (
                <div className="bg-yellow-500/20 rounded-lg p-4 mt-4 border border-yellow-300/30 text-center">
                  <p className="text-yellow-200 font-semibold">📚 Consider reviewing the examples above before continuing.</p>
                </div>
              )}
            </div>
          )}
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
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)]"
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




