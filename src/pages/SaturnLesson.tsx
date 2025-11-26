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
  Flame,
  Rocket,
  Puzzle
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { db } from '@/lib/database';
import { analyzeAreasForImprovement, analyzeStrengths, analyzeCommonMistakes } from '@/utils/progressAnalysis';

const saturnBg = new URL('../../planet background/SATURN.jpeg', import.meta.url).href;

const SaturnLesson: React.FC = () => {
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
    wordProblems: { correct: 0, total: 0 },
    complexFractions: { correct: 0, total: 0 },
    realWorld: { correct: 0, total: 0 },
    problemModeling: { correct: 0, total: 0 },
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
          module_id: 'saturn',
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
      
      // Analyze areas for improvement, strengths, and common mistakes
      const areasForImprovement = analyzeAreasForImprovement(mistakes);
      const strengths = analyzeStrengths(equationsSolved);
      const commonMistakes = analyzeCommonMistakes(mistakes);
      
      await db.saveStudentProgress({
        studentId: user?.id || 'guest',
        moduleId: 'lesson-saturn',
        moduleName: 'Saturn — Advanced Problem Solving',
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
      toast({ title: 'Saved', description: 'Your Saturn lesson results were saved.' });
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

    // Track equationsSolved and mistakes with meaningful descriptions
    if (isCorrect) {
      setEquationsSolved(prev => [...prev, `Advanced Problem Solving: Question ${questionId} - Correctly solved`]);
      toast({
        title: "Correct! 🎉",
        description: "Excellent! You understand advanced problem solving.",
        variant: "default",
      });
    } else {
      const mistakeDescription = `Advanced Problem Solving: Question ${questionId} - ${explanation || 'Incorrect answer. Need to review advanced problem solving steps'}`;
      setMistakes(prev => [...prev, mistakeDescription]);
      toast({
        title: "Not quite right 📚",
        description: "Review the explanation to master this concept.",
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
      areas.push("Setting up rational equations from word problems");
    }
    if (questionsAnswered[2] && !questionsAnswered[2].correct) {
      areas.push("Solving complex rational equations with multiple steps");
    }
    if (questionsAnswered[3] && !questionsAnswered[3].correct) {
      areas.push("Interpreting solutions in real-world contexts");
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
        completePipeline: {
          correct: correctAnswers,
          total: totalQuestions
        },
        justification: {
          correct: correctAnswers,
          total: totalQuestions
        },
        verification: {
          correct: correctAnswers,
          total: totalQuestions
        },
        synthesis: {
          correct: correctAnswers,
          total: totalQuestions
        },
        assessment: {
          correct: correctAnswers,
          total: totalQuestions
        },
        algebra: {
          correct: correctAnswers,
          total: totalQuestions
        }
      };
      
      // Use the optimized lesson completion function
      const success = await completeLesson(user.id, {
        lessonId: 'saturn-lesson',
        lessonName: 'Saturn: Advanced Problem Solving',
        score: getPerformanceSummary().percentage,
        timeSpent: Math.max(1, Math.round((Date.now() - startRef.current) / 60000)),
        equationsSolved,
        mistakes,
        skillBreakdown: updatedSkills,
        xpEarned: 400,
        planetName: 'Saturn',
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
    
    // Save progress for next lesson (Uranus) so it shows up in "In Progress"
    if (user?.id) {
      try {
        await saveProgress(user.id, {
          module_id: 'uranus',
          section_id: 'section_0',
          slide_index: 0,
          progress_pct: 0, // Starting fresh on next lesson
        });
      } catch (error) {
        console.error('Error saving progress for next lesson:', error);
      }
    }
    
    toast({ title: 'Progress Saved! 🚀', description: 'Continuing to next lesson.' });
    navigate('/uranus-lesson');
  };

  const handleBackToSolarSystem = () => {
    navigate('/rpg');
  };

  const sections = [
    {
      id: 1,
      title: '🚀 Mission: Advanced Problem Solving',
      icon: <Rocket className="w-6 h-6 text-yellow-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-yellow-600/20 rounded-2xl p-6 border-2 border-yellow-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(234,179,8,0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-8 h-8 text-yellow-400 animate-pulse" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 via-orange-200 to-yellow-300 bg-clip-text text-transparent">
                Welcome to Saturn — Expert Problem Solving
              </h3>
            </div>
            <div className="space-y-4 text-white/95">
              <p className="text-lg leading-relaxed">
                Welcome to <strong className="text-yellow-300">Saturn</strong>, the ringed planet! Here we master <span className="bg-yellow-500/30 px-2 py-1 rounded">advanced problem solving</span> with <span className="bg-orange-500/30 px-2 py-1 rounded">real-world applications</span> of rational equations.
              </p>
              <div className="bg-black/30 rounded-xl p-4 border border-yellow-400/30">
                <p className="font-semibold text-yellow-200 mb-2">🎯 What Makes Saturn Challenges Expert-Level?</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Word problems</strong> that require setting up equations from context</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Complex fractions</strong> with nested operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Real-world applications</strong> like work rates, distance, and mixtures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Multiple step problems</strong> requiring strategic thinking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl p-5 border border-orange-400/40 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-orange-300" />
              <p className="font-semibold text-orange-200">💡 Strategy:</p>
            </div>
            <p className="text-white/90 text-sm">
              Combine problem-solving skills with rational equation techniques to tackle real-world challenges!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '⚡ Word Problem Example: Work Rate',
      icon: <Zap className="w-6 h-6 text-orange-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Real-World Problem: Work Rate
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">📝 Problem:</p>
                <p className="text-white/90 mb-4">
                  Sarah can paint a room in 4 hours. Working together with Mike, they can paint the same room in 2.5 hours. How long would it take Mike to paint the room alone?
                </p>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Step 1: Set Up Variables</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• Let <InlineMath math={'t'} /> = time (in hours) for Mike to paint alone</p>
                    <p>• Sarah's rate: <InlineMath math={'\\frac{1}{4}'} /> room/hour</p>
                    <p>• Mike's rate: <InlineMath math={'\\frac{1}{t}'} /> room/hour</p>
                    <p>• Combined rate: <InlineMath math={'\\frac{1}{4} + \\frac{1}{t}'} /> room/hour</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">🔧 Step 2: Set Up Equation</p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-white/80 mb-2">Combined rate × time = 1 room</p>
                  <div className="bg-white/10 rounded-lg p-3 text-sm">
                    <BlockMath math={'(\\frac{1}{4} + \\frac{1}{t}) \\cdot 2.5 = 1'} />
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">✨ Step 3: Solve</p>
                <div className="space-y-2">
                  <BlockMath math={'2.5(\\frac{1}{4} + \\frac{1}{t}) = 1'} />
                  <BlockMath math={'\\frac{2.5}{4} + \\frac{2.5}{t} = 1'} />
                  <BlockMath math={'\\frac{5}{8} + \\frac{2.5}{t} = 1'} />
                  <BlockMath math={'\\frac{2.5}{t} = 1 - \\frac{5}{8} = \\frac{3}{8}'} />
                  <BlockMath math={'2.5t = 8 \\cdot 2.5 = 20'} />
                  <BlockMath math={'t = \\frac{20}{2.5} = 8'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Answer</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90">
                    Mike can paint the room alone in <strong className="text-green-300">8 hours</strong>.
                  </p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Verification:</p>
                    <p className="text-sm">• Sarah: <InlineMath math={'\\frac{1}{4}'} /> room/hour</p>
                    <p className="text-sm">• Mike: <InlineMath math={'\\frac{1}{8}'} /> room/hour</p>
                    <p className="text-sm">• Combined: <InlineMath math={'\\frac{1}{4} + \\frac{1}{8} = \\frac{3}{8}'} /> room/hour</p>
                    <p className="text-sm">• Time together: <InlineMath math={'1 \\div \\frac{3}{8} = \\frac{8}{3} = 2.67'} /> hours ≈ 2.5 hours ✅</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '🔥 Complex Fraction Example',
      icon: <Flame className="w-6 h-6 text-orange-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 border-2 border-orange-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <h3 className="text-xl font-bold text-orange-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Advanced: Complex Fractions
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">📝 Original Equation:</p>
                <div className="text-center bg-white/10 rounded-lg p-4 mb-4">
                  <BlockMath math={'\\frac{\\frac{1}{x+1} + \\frac{2}{x-1}}{\\frac{3}{x} - \\frac{1}{x+1}} = 2'} />
                </div>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Strategy: Simplify Complex Fractions</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• Find LCD for numerator: <InlineMath math={'(x+1)(x-1)'} /></p>
                    <p>• Find LCD for denominator: <InlineMath math={'x(x+1)'} /></p>
                    <p>• Simplify both numerator and denominator first</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">🔧 Step 1: Simplify Numerator</p>
                <div className="space-y-2">
                  <BlockMath math={'\\frac{1}{x+1} + \\frac{2}{x-1} = \\frac{(x-1) + 2(x+1)}{(x+1)(x-1)}'} />
                  <BlockMath math={'= \\frac{x-1 + 2x + 2}{(x+1)(x-1)} = \\frac{3x+1}{(x+1)(x-1)}'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">🔧 Step 2: Simplify Denominator</p>
                <div className="space-y-2">
                  <BlockMath math={'\\frac{3}{x} - \\frac{1}{x+1} = \\frac{3(x+1) - x}{x(x+1)}'} />
                  <BlockMath math={'= \\frac{3x+3-x}{x(x+1)} = \\frac{2x+3}{x(x+1)}'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">✨ Step 3: Rewrite Original Equation</p>
                <div className="space-y-2">
                  <BlockMath math={'\\frac{\\frac{3x+1}{(x+1)(x-1)}}{\\frac{2x+3}{x(x+1)}} = 2'} />
                  <BlockMath math={'\\frac{3x+1}{(x+1)(x-1)} \\cdot \\frac{x(x+1)}{2x+3} = 2'} />
                  <BlockMath math={'\\frac{x(3x+1)}{(x-1)(2x+3)} = 2'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">🧮 Step 4: Solve</p>
                <div className="space-y-2">
                  <BlockMath math={'x(3x+1) = 2(x-1)(2x+3)'} />
                  <BlockMath math={'3x^2 + x = 2(2x^2 + 3x - 2x - 3)'} />
                  <BlockMath math={'3x^2 + x = 4x^2 + 2x - 6'} />
                  <BlockMath math={'0 = x^2 + x - 6'} />
                  <BlockMath math={'(x+3)(x-2) = 0'} />
                  <BlockMath math={'x = -3 \\; \\text{or} \\; x = 2'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Step 5: Check Restrictions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90 text-sm">
                    Restrictions: <InlineMath math={'x \\neq 0, -1, 1'} /> (from denominators)
                  </p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Verify solutions:</p>
                    <p className="text-sm">• <InlineMath math={'x = -3'} />: <InlineMath math={'-3 \\neq 0, -1, 1'} /> ✅</p>
                    <p className="text-sm">• <InlineMath math={'x = 2'} />: <InlineMath math={'2 \\neq 0, -1, 1'} /> ✅</p>
                  </div>
                  <div className="bg-green-600/40 rounded-lg p-3 border border-green-400 mt-3">
                    <p className="font-bold text-green-200 text-center text-sm">
                      ✅ BOTH SOLUTIONS VALID! <InlineMath math={'x = -3'} /> and <InlineMath math={'x = 2'} />
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
      title: '⚔️ Word Problem: Distance-Rate-Time',
      icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-6 border-2 border-indigo-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <h3 className="text-xl font-bold text-indigo-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Real-World Problem: Distance-Rate-Time
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">📝 Problem:</p>
                <p className="text-white/90 mb-4">
                  A boat travels 30 miles upstream in the same time it takes to travel 50 miles downstream. If the current flows at 5 mph, what is the speed of the boat in still water?
                </p>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Step 1: Set Up Variables</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• Let <InlineMath math={'r'} /> = speed of boat in still water (mph)</p>
                    <p>• Upstream speed: <InlineMath math={'r - 5'} /> mph</p>
                    <p>• Downstream speed: <InlineMath math={'r + 5'} /> mph</p>
                    <p>• Time = Distance ÷ Rate</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">🔧 Step 2: Set Up Equation</p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-white/80 mb-2">Times are equal:</p>
                  <div className="bg-white/10 rounded-lg p-3 text-sm">
                    <BlockMath math={'\\frac{30}{r-5} = \\frac{50}{r+5}'} />
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">✨ Step 3: Solve</p>
                <div className="space-y-2">
                  <BlockMath math={'30(r+5) = 50(r-5)'} />
                  <BlockMath math={'30r + 150 = 50r - 250'} />
                  <BlockMath math={'150 + 250 = 50r - 30r'} />
                  <BlockMath math={'400 = 20r'} />
                  <BlockMath math={'r = 20'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Answer</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90">
                    The boat's speed in still water is <strong className="text-green-300">20 mph</strong>.
                  </p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Verification:</p>
                    <p className="text-sm">• Upstream: <InlineMath math={'30 \\div (20-5) = 30 \\div 15 = 2'} /> hours</p>
                    <p className="text-sm">• Downstream: <InlineMath math={'50 \\div (20+5) = 50 \\div 25 = 2'} /> hours ✅</p>
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
      title: '🛡️ Problem-Solving Strategy',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-blue-200 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              The Saturn Strategy: 5-Step Expert Approach
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Understand the Problem</p>
                    <p className="text-white/90 text-sm">
                      Read carefully. Identify what you're solving for. Look for key words like "rate", "time", "together", "alone", "mixture", etc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Define Variables</p>
                    <p className="text-white/90 text-sm">
                      Assign variables to unknowns. Write down what each variable represents. Set up relationships between variables.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Set Up the Equation</p>
                    <p className="text-white/90 text-sm">
                      Translate the problem into a rational equation. Use formulas like <InlineMath math={'\\text{rate} = \\frac{\\text{work}}{\\text{time}}'} /> or <InlineMath math={'\\text{time} = \\frac{\\text{distance}}{\\text{rate}}'} />.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">4</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Solve the Equation</p>
                    <p className="text-white/90 text-sm">
                      Use all techniques learned: find LCD, clear denominators, solve, and check restrictions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">5</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Verify and Interpret</p>
                    <p className="text-white/90 text-sm mb-2">
                      Check that the solution makes sense in the original problem context. Verify it's not extraneous.
                    </p>
                    <div className="bg-green-500/20 rounded-lg p-2 border border-green-400/30">
                      <p className="text-xs text-green-200">✅ Always verify your answer makes sense in the real world!</p>
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
              For word problems, always check that your answer is reasonable. Negative times or rates usually indicate an error!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: '⚔️ Saturn Expert Challenge Quiz',
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-2xl p-6 border-2 border-yellow-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(234,179,8,0.3)]">
            <h3 className="text-2xl font-bold text-yellow-200 mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400 animate-pulse" />
              🏆 Test Your Expert Problem-Solving Skills 🏆
            </h3>
            
            <p className="text-white/90 text-lg mb-6">
              Answer these expert-level questions to prove you've mastered advanced problem solving with rational equations!
            </p>
          </div>

          {/* Question 1 */}
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border-2 border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.3)]">
            <h4 className="text-blue-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q1</span>
              A pipe can fill a tank in 6 hours. Another pipe can fill it in 9 hours. If both pipes are opened together, how long will it take to fill the tank?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['3.6 hours', '7.5 hours', '15 hours', 'Cannot be determined'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[1]?.answer === option ? 
                    (questionsAnswered[1]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    1, 
                    option, 
                    '3.6 hours',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[1]}
                  className="hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[1] && questionsAnswered[1] && !questionsAnswered[1].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Work Rate Problem
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-blue-200 mb-2">Step 1: Set up rates</p>
                    <ul className="space-y-1">
                      <li>• Pipe 1 rate: <InlineMath math={'\\frac{1}{6}'} /> tank/hour</li>
                      <li>• Pipe 2 rate: <InlineMath math={'\\frac{1}{9}'} /> tank/hour</li>
                      <li>• Combined rate: <InlineMath math={'\\frac{1}{6} + \\frac{1}{9} = \\frac{3+2}{18} = \\frac{5}{18}'} /> tank/hour</li>
                    </ul>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-blue-200 mb-2">Step 2: Find time</p>
                    <p>Time = <InlineMath math={'1 \\div \\frac{5}{18} = \\frac{18}{5} = 3.6'} /> hours</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Always add rates when working together!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[1] && questionsAnswered[1] && questionsAnswered[1].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand work rate problems.
                </p>
              </div>
            )}
          </div>

          {/* Question 2 */}
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border-2 border-orange-400/40 shadow-[0_0_25px_rgba(249,115,22,0.3)]">
            <h4 className="text-orange-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q2</span>
              Solve: <InlineMath math={'\\frac{x+1}{x-2} + \\frac{x-1}{x+2} = \\frac{8}{x^2-4}'} />. What is the LCD?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['x^2-4', '(x-2)(x+2)', 'x-2', 'x+2'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[2]?.answer === option ? 
                    (questionsAnswered[2]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    2, 
                    option, 
                    '(x-2)(x+2)',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[2]}
                  className="hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all"
                >
                  {option === 'x^2-4' ? <InlineMath math={'x^2-4'} /> : option === '(x-2)(x+2)' ? <InlineMath math={'(x-2)(x+2)'} /> : option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[2] && questionsAnswered[2] && !questionsAnswered[2].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Finding LCD
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-orange-200 mb-2">Step 1: Factor denominators</p>
                    <ul className="space-y-1">
                      <li>• <InlineMath math={'x-2'} /> (already factored)</li>
                      <li>• <InlineMath math={'x+2'} /> (already factored)</li>
                      <li>• <InlineMath math={'x^2-4 = (x-2)(x+2)'} /> (difference of squares)</li>
                    </ul>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-orange-200 mb-2">Step 2: Find LCD</p>
                    <p className="text-yellow-300 font-semibold">LCD = <InlineMath math={'(x-2)(x+2)'} /> (which equals <InlineMath math={'x^2-4'} />)</p>
                    <p className="text-xs text-white/70 mt-2">Note: <InlineMath math={'(x-2)(x+2)'} /> is the factored form!</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Always factor first to find LCD correctly!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[2] && questionsAnswered[2] && questionsAnswered[2].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Excellent! You correctly identified the LCD.
                </p>
              </div>
            )}
          </div>

          {/* Question 3 */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border-2 border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            <h4 className="text-purple-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q3</span>
              A car travels 120 miles. If it had gone 10 mph faster, it would have taken 1 hour less. What was the original speed?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['30 mph', '40 mph', '50 mph', '60 mph'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[3]?.answer === option ? 
                    (questionsAnswered[3]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    3, 
                    option, 
                    '30 mph',
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
                  Distance-Rate-Time Problem
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-purple-200 mb-2">Step 1: Set up variables</p>
                    <ul className="space-y-1">
                      <li>• Let <InlineMath math={'r'} /> = original speed</li>
                      <li>• Original time: <InlineMath math={'\\frac{120}{r}'} /> hours</li>
                      <li>• New time: <InlineMath math={'\\frac{120}{r+10}'} /> hours</li>
                    </ul>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-purple-200 mb-2">Step 2: Set up equation</p>
                    <p><InlineMath math={'\\frac{120}{r} - \\frac{120}{r+10} = 1'} /></p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-purple-200 mb-2">Step 3: Solve</p>
                    <p className="text-xs">Solving gives <InlineMath math={'r = 30'} /> mph</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Always verify your answer makes sense in the problem context!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[3] && questionsAnswered[3] && questionsAnswered[3].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand distance-rate-time problems.
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
                  <p className="text-green-200 font-semibold">🎊 Well done! You've mastered Saturn-level advanced problem solving!</p>
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
      {/* Animated Saturn background */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${saturnBg})` }}
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
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-lg flex items-center justify-center">
                  <Star size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="font-orbitron font-bold text-xl bg-gradient-to-r from-yellow-300 to-orange-500 bg-clip-text text-transparent">
                    Saturn — Advanced Problem Solving
                  </h1>
                  <p className="text-xs text-white/60">Expert Level</p>
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
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
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
              🎉 Saturn Lesson Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cosmic-text text-center">
              Excellent work! You've mastered advanced problem solving. 
              <br />
              <strong className="text-cosmic-green">Uranus lesson is now unlocked!</strong>
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
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              Continue to Uranus 🔵
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SaturnLesson;




