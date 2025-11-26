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
  Puzzle,
  Wand2
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { db } from '@/lib/database';
import { analyzeAreasForImprovement, analyzeStrengths, analyzeCommonMistakes } from '@/utils/progressAnalysis';

const uranusBg = new URL('../../planet background/uranus.webp', import.meta.url).href;

const UranusLesson: React.FC = () => {
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
    abstractProblems: { correct: 0, total: 0 },
    creativeApplications: { correct: 0, total: 0 },
    advancedAlgebra: { correct: 0, total: 0 },
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
          module_id: 'uranus',
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
        moduleId: 'lesson-uranus',
        moduleName: 'Uranus — Creative Applications',
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
      toast({ title: 'Saved', description: 'Your Uranus lesson results were saved.' });
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
      setEquationsSolved(prev => [...prev, `Creative Applications: Question ${questionId} - Correctly solved`]);
      toast({
        title: "Correct! 🎉",
        description: "Brilliant! You understand creative applications.",
        variant: "default",
      });
    } else {
      const mistakeDescription = `Creative Applications: Question ${questionId} - ${explanation || 'Incorrect answer. Need to review creative application steps'}`;
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
      areas.push("Solving equations with parameterized variables");
    }
    if (questionsAnswered[2] && !questionsAnswered[2].correct) {
      areas.push("Handling rational equations with multiple variables");
    }
    if (questionsAnswered[3] && !questionsAnswered[3].correct) {
      areas.push("Creative problem-solving approaches");
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
        creativeApplications: {
          correct: correctAnswers,
          total: totalQuestions
        },
        problemSolving: {
          correct: correctAnswers,
          total: totalQuestions
        },
        restrictions: {
          correct: 0,
          total: 0
        },
        lcdFinding: {
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
        lessonId: 'uranus-lesson',
        lessonName: 'Uranus: Creative Applications',
        score: getPerformanceSummary().percentage,
        timeSpent: Math.max(1, Math.round((Date.now() - startRef.current) / 60000)),
        equationsSolved,
        mistakes,
        skillBreakdown: updatedSkills,
        xpEarned: 450,
        planetName: 'Uranus',
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
    
    // Save progress for next lesson (Neptune) so it shows up in "In Progress"
    if (user?.id) {
      try {
        await saveProgress(user.id, {
          module_id: 'neptune',
          section_id: 'section_0',
          slide_index: 0,
          progress_pct: 0, // Starting fresh on next lesson
        });
      } catch (error) {
        console.error('Error saving progress for next lesson:', error);
      }
    }
    
    toast({ title: 'Progress Saved! 🚀', description: 'Continuing to next lesson.' });
    navigate('/neptune-lesson');
  };

  const handleBackToSolarSystem = () => {
    navigate('/rpg');
  };

  const sections = [
    {
      id: 1,
      title: '🚀 Mission: Creative Applications',
      icon: <Wand2 className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-600/20 rounded-2xl p-6 border-2 border-cyan-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-8 h-8 text-cyan-400 animate-pulse" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-200 via-blue-200 to-cyan-300 bg-clip-text text-transparent">
                Welcome to Uranus — Creative Applications
              </h3>
            </div>
            <div className="space-y-4 text-white/95">
              <p className="text-lg leading-relaxed">
                Welcome to <strong className="text-cyan-300">Uranus</strong>, the ice giant! Here we explore <span className="bg-cyan-500/30 px-2 py-1 rounded">creative applications</span> and <span className="bg-blue-500/30 px-2 py-1 rounded">abstract problem-solving</span> with rational equations.
              </p>
              <div className="bg-black/30 rounded-xl p-4 border border-cyan-400/30">
                <p className="font-semibold text-cyan-200 mb-2">🎯 What Makes Uranus Challenges Creative?</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Parameterized problems</strong> with variables as parameters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Abstract equations</strong> requiring creative thinking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Multiple variable systems</strong> with rational components</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Innovative approaches</strong> to complex problems</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-5 border border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-300" />
              <p className="font-semibold text-blue-200">💡 Strategy:</p>
            </div>
            <p className="text-white/90 text-sm">
              Think creatively and apply rational equations to abstract and theoretical problems!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '⚡ Example 1: Parameterized Equation',
      icon: <Zap className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Creative Application: Parameterized Variables
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">📝 Problem:</p>
                <p className="text-white/90 mb-4">
                  Solve for <InlineMath math={'x'} /> in terms of <InlineMath math={'a'} /> and <InlineMath math={'b'} />: <InlineMath math={'\\frac{a}{x-1} + \\frac{b}{x+1} = \\frac{a+b}{x^2-1}'} />
                </p>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Creative Approach: Treat Parameters as Constants</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• <InlineMath math={'a'} /> and <InlineMath math={'b'} /> are parameters, not unknowns</p>
                    <p>• Factor <InlineMath math={'x^2-1 = (x-1)(x+1)'} /> first</p>
                    <p>• Solve for <InlineMath math={'x'} /> in terms of the parameters</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">🔧 Step 1: Factor and Find LCD</p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-white/80">Denominators: <InlineMath math={'x-1, \\; x+1, \\; (x-1)(x+1)'} /></p>
                  <p className="text-sm font-semibold text-blue-300">LCD = <InlineMath math={'(x-1)(x+1)'} /></p>
                  <p className="text-xs text-white/70 mt-2">Restrictions: <InlineMath math={'x \\neq 1'} /> and <InlineMath math={'x \\neq -1'} /></p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">✨ Step 2: Clear Denominators</p>
                <div className="space-y-2">
                  <BlockMath math={'(x-1)(x+1) \\left(\\frac{a}{x-1} + \\frac{b}{x+1}\\right) = (x-1)(x+1) \\cdot \\frac{a+b}{(x-1)(x+1)}'} />
                  <BlockMath math={'a(x+1) + b(x-1) = a+b'} />
                  <BlockMath math={'ax + a + bx - b = a + b'} />
                  <BlockMath math={'ax + bx = a + b - a + b'} />
                  <BlockMath math={'x(a+b) = 2b'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">🧮 Step 3: Solve for x</p>
                <div className="space-y-2">
                  <BlockMath math={'x = \\frac{2b}{a+b}'} />
                  <p className="text-sm text-white/80 mt-2">Note: This assumes <InlineMath math={'a+b \\neq 0'} /> (otherwise no solution)</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Answer</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90">
                    Solution: <InlineMath math={'x = \\frac{2b}{a+b}'} />, provided <InlineMath math={'a+b \\neq 0'} /> and <InlineMath math={'x \\neq \\pm 1'} />
                  </p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Creative Insight:</p>
                    <p className="text-sm">This shows how rational equations can be solved with parameters, demonstrating the power of abstract thinking!</p>
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
      title: '🔥 Example 2: Abstract Problem',
      icon: <Flame className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-6 border-2 border-indigo-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <h3 className="text-xl font-bold text-indigo-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Creative Application: Abstract Rational Equation
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">📝 Problem:</p>
                <p className="text-white/90 mb-4">
                  Find all values of <InlineMath math={'k'} /> for which the equation <InlineMath math={'\\frac{kx+1}{x-2} = \\frac{2x+3}{x+1}'} /> has no solution.
                </p>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Creative Strategy: Analyze When No Solution Exists</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• A rational equation has no solution if the result is a contradiction</p>
                    <p>• Or if the only solution violates restrictions</p>
                    <p>• Think about when the equation becomes impossible</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">🔧 Step 1: Cross Multiply and Solve</p>
                <div className="space-y-2">
                  <BlockMath math={'(kx+1)(x+1) = (2x+3)(x-2)'} />
                  <BlockMath math={'kx^2 + kx + x + 1 = 2x^2 - 4x + 3x - 6'} />
                  <BlockMath math={'kx^2 + (k+1)x + 1 = 2x^2 - x - 6'} />
                  <BlockMath math={'(k-2)x^2 + (k+2)x + 7 = 0'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">✨ Step 2: Analyze Cases</p>
                <div className="space-y-2 text-sm">
                  <p className="text-white/80 mb-2">For no solution, we need contradictions or impossible restrictions:</p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="mb-2"><strong>Case 1:</strong> If <InlineMath math={'k = 2'} />, the equation becomes linear:</p>
                    <BlockMath math={'(2+2)x + 7 = 0 \\;\\Rightarrow\\; 4x = -7 \\;\\Rightarrow\\; x = -\\frac{7}{4}'} />
                    <p className="mt-2">Check restrictions: <InlineMath math={'x \\neq 2, -1'} />. Solution <InlineMath math={'x = -\\frac{7}{4}'} /> is valid, so <InlineMath math={'k = 2'} /> does have a solution.</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 mt-2">
                    <p className="mb-2"><strong>Case 2:</strong> If the quadratic has no real roots (discriminant &lt; 0) and no valid solutions exist, or if all solutions violate restrictions.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Creative Insight</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90 text-sm">
                    This problem demonstrates <strong className="text-green-300">creative problem-solving</strong> by analyzing parameter values that lead to no solution—a key skill in advanced mathematics!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: '⚔️ Example 3: System with Rational Components',
      icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border-2 border-purple-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            <h3 className="text-xl font-bold text-purple-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Creative Application: System of Equations
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-purple-400/30">
                <p className="font-semibold text-purple-200 mb-3">📝 Problem:</p>
                <p className="text-white/90 mb-4">
                  Solve the system: <InlineMath math={'\\frac{1}{x} + \\frac{1}{y} = 5'} /> and <InlineMath math={'\\frac{1}{x} - \\frac{1}{y} = 1'} />
                </p>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Creative Approach: Substitution Method</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• Let <InlineMath math={'u = \\frac{1}{x}'} /> and <InlineMath math={'v = \\frac{1}{y}'} /></p>
                    <p>• This transforms the system into a linear one</p>
                    <p>• Solve for <InlineMath math={'u'} /> and <InlineMath math={'v'} />, then find <InlineMath math={'x'} /> and <InlineMath math={'y'} /></p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-purple-400/30">
                <p className="font-semibold text-purple-200 mb-3">🔧 Step 1: Substitute</p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-white/80">Let <InlineMath math={'u = \\frac{1}{x}'} /> and <InlineMath math={'v = \\frac{1}{y}'} /></p>
                  <div className="bg-white/10 rounded-lg p-3 text-sm">
                    <BlockMath math={'u + v = 5'} />
                    <BlockMath math={'u - v = 1'} />
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-purple-400/30">
                <p className="font-semibold text-purple-200 mb-3">✨ Step 2: Solve Linear System</p>
                <div className="space-y-2">
                  <BlockMath math={'u + v = 5'} />
                  <BlockMath math={'u - v = 1'} />
                  <BlockMath math={'2u = 6 \\;\\Rightarrow\\; u = 3'} />
                  <BlockMath math={'3 + v = 5 \\;\\Rightarrow\\; v = 2'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-purple-400/30">
                <p className="font-semibold text-purple-200 mb-3">🧮 Step 3: Find x and y</p>
                <div className="space-y-2">
                  <BlockMath math={'u = 3 = \\frac{1}{x} \\;\\Rightarrow\\; x = \\frac{1}{3}'} />
                  <BlockMath math={'v = 2 = \\frac{1}{y} \\;\\Rightarrow\\; y = \\frac{1}{2}'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Answer</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90">
                    Solution: <InlineMath math={'x = \\frac{1}{3}'} /> and <InlineMath math={'y = \\frac{1}{2}'} />
                  </p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Verification:</p>
                    <p className="text-sm">• <InlineMath math={'\\frac{1}{1/3} + \\frac{1}{1/2} = 3 + 2 = 5'} /> ✅</p>
                    <p className="text-sm">• <InlineMath math={'\\frac{1}{1/3} - \\frac{1}{1/2} = 3 - 2 = 1'} /> ✅</p>
                  </div>
                  <div className="bg-green-600/40 rounded-lg p-3 border border-green-400 mt-3">
                    <p className="font-bold text-green-200 text-center text-sm">
                      ✅ Creative substitution transforms a complex system into a simple linear one!
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
      title: '🛡️ Creative Problem-Solving Strategy',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl p-6 border-2 border-cyan-400/40 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-cyan-200 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              The Uranus Method: Creative Approaches
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/40 rounded-xl p-5 border border-cyan-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-bold text-cyan-200 mb-2">Think Abstractly</p>
                    <p className="text-white/90 text-sm">
                      Look beyond the numbers. Consider parameters, variables, and abstract relationships. Sometimes the solution involves thinking about what the equation represents conceptually.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-cyan-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-bold text-cyan-200 mb-2">Use Creative Substitutions</p>
                    <p className="text-white/90 text-sm">
                      Transform complex problems with substitutions like <InlineMath math={'u = \\frac{1}{x}'} /> or parameter analysis. This can reveal hidden structure.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-cyan-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-bold text-cyan-200 mb-2">Analyze Special Cases</p>
                    <p className="text-white/90 text-sm">
                      Consider edge cases, parameter values, and when solutions might not exist. This creative analysis deepens understanding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-cyan-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">4</div>
                  <div className="flex-1">
                    <p className="font-bold text-cyan-200 mb-2">Combine Techniques</p>
                    <p className="text-white/90 text-sm">
                      Master-level problems often require combining multiple techniques: substitution, parameter analysis, and creative algebraic manipulation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-cyan-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">5</div>
                  <div className="flex-1">
                    <p className="font-bold text-cyan-200 mb-2">Think Outside the Box</p>
                    <p className="text-white/90 text-sm mb-2">
                      Don't be limited by standard approaches. Creative applications often require innovative thinking and seeing problems from new angles.
                    </p>
                    <div className="bg-green-500/20 rounded-lg p-2 border border-green-400/30">
                      <p className="text-xs text-green-200">✅ Creativity in problem-solving is what separates masters from experts!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-cyan-500/20 rounded-xl p-5 border-2 border-yellow-400/40">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <p className="font-bold text-yellow-200 text-lg">Pro Tip</p>
            </div>
            <p className="text-white/90">
              When solving abstract problems, always ask: "What if I look at this differently?" Creative insights often come from perspective shifts.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: '⚔️ Uranus Master Challenge Quiz',
      icon: <Trophy className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-2xl p-6 border-2 border-cyan-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <h3 className="text-2xl font-bold text-cyan-200 mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-cyan-400 animate-pulse" />
              🏆 Test Your Creative Problem-Solving Skills 🏆
            </h3>
            
            <p className="text-white/90 text-lg mb-6">
              Answer these master-level questions to prove you've mastered creative applications of rational equations!
            </p>
          </div>

          {/* Question 1 */}
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border-2 border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.3)]">
            <h4 className="text-blue-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q1</span>
              For what value of <InlineMath math={'k'} /> does the equation <InlineMath math={'\\frac{k}{x-1} + \\frac{1}{x+1} = \\frac{2}{x^2-1}'} /> have exactly one solution?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['k = 1', 'k = 2', 'k = 0', 'No such k exists'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[1]?.answer === option ? 
                    (questionsAnswered[1]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    1, 
                    option, 
                    'k = 1',
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
                  Parameter Analysis
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-blue-200 mb-2">Step 1: Clear denominators</p>
                    <p className="text-xs">LCD = <InlineMath math={'(x-1)(x+1)'} />. After clearing and simplifying, you get a linear equation.</p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-blue-200 mb-2">Step 2: Analyze solutions</p>
                    <p className="text-xs">For exactly one solution, the equation must be linear (not a contradiction) and that solution must satisfy all restrictions.</p>
                    <p className="text-xs text-yellow-300 mt-2">Answer: <InlineMath math={'k = 1'} /> gives exactly one valid solution.</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Analyzing parameters requires creative thinking!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[1] && questionsAnswered[1] && questionsAnswered[1].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand parameterized equations.
                </p>
              </div>
            )}
          </div>

          {/* Question 2 */}
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-6 border-2 border-indigo-400/40 shadow-[0_0_25px_rgba(99,102,241,0.3)]">
            <h4 className="text-indigo-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-indigo-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q2</span>
              What is a creative substitution to solve <InlineMath math={'\\frac{1}{x} + \\frac{1}{y} = 5'} /> and <InlineMath math={'\\frac{1}{x} - \\frac{1}{y} = 3'} />?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['u = 1/x, v = 1/y', 'x = 1/u, y = 1/v', 'u = x, v = y', 'No substitution needed'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[2]?.answer === option ? 
                    (questionsAnswered[2]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    2, 
                    option, 
                    'u = 1/x, v = 1/y',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[2]}
                  className="hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[2] && questionsAnswered[2] && !questionsAnswered[2].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Creative Substitution
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-indigo-200 mb-2">The key insight:</p>
                    <p className="text-xs">Let <InlineMath math={'u = \\frac{1}{x}'} /> and <InlineMath math={'v = \\frac{1}{y}'} />. This transforms the system into:</p>
                    <p className="text-xs mt-2"><InlineMath math={'u + v = 5'} /> and <InlineMath math={'u - v = 3'} /></p>
                    <p className="text-xs mt-2">This is now a simple linear system that's easy to solve!</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Creative substitutions simplify complex problems!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[2] && questionsAnswered[2] && questionsAnswered[2].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Excellent! You understand creative substitutions.
                </p>
              </div>
            )}
          </div>

          {/* Question 3 */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border-2 border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            <h4 className="text-purple-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q3</span>
              In creative problem-solving, what is the MOST important step when dealing with parameterized equations?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Analyze parameter values and special cases', 'Solve quickly', 'Use a calculator', 'Skip restrictions'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[3]?.answer === option ? 
                    (questionsAnswered[3]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    3, 
                    option, 
                    'Analyze parameter values and special cases',
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
                  Creative Problem-Solving
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-purple-200 mb-2">Why analyze parameters?</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Different parameter values can lead to different solution sets</li>
                      <li>• Some values may cause no solution or infinite solutions</li>
                      <li>• Special cases reveal important mathematical insights</li>
                      <li>• This analysis is key to creative problem-solving</li>
                    </ul>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Parameter analysis is the hallmark of master-level thinking!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[3] && questionsAnswered[3] && questionsAnswered[3].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand creative problem-solving approaches.
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
                  <p className="text-green-200 font-semibold">🎊 Well done! You've mastered Uranus-level creative applications!</p>
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



