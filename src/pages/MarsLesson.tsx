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
  Zap,
  Shield,
  XCircle,
  Sparkles,
  Flame
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import marsPng from '@/components/other planets/mars.png';
import { db } from '@/lib/database';

const MarsLesson: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { awardXP, saveProgress, saveAchievement, completeLesson } = usePlayer();
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
  const startRef = useRef<number>(0);

  // Save progress whenever currentSection changes - but debounced to avoid excessive saves
  useEffect(() => {
    if (user?.id) {
      const timeoutId = setTimeout(() => {
        const progressPercentage = ((currentSection + 1) / slides.length) * 100;
        saveProgress(user.id, {
          module_id: 'mars',
          section_id: 'section_0',
          slide_index: currentSection,
          progress_pct: progressPercentage,
        });
      }, 1000); // Debounce progress saves by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentSection, user?.id]);

  useEffect(() => { startRef.current = Date.now(); }, []);

  // Prefer WEBP, fallback to bundled PNG if WEBP fails to load or is unsupported
  const [bgSrc, setBgSrc] = useState<string>(new URL('../../planet background/MARS.webp', import.meta.url).href);

  const saveLessonProgress = async () => {
    try {
      const total = equationsSolved.length + mistakes.length;
      const score = total > 0 ? Math.round((equationsSolved.length / total) * 100) : 0;
      const minutes = Math.max(1, Math.round((Date.now() - startRef.current) / 60000));
              await db.saveStudentProgress({
          studentId: user?.id || 'guest',
          moduleId: 'lesson-mars',
          moduleName: 'Mars — Extraneous Solutions',
        completedAt: new Date(),
        score,
        timeSpent: minutes,
        equationsSolved: equationsSolved,
        mistakes: mistakes,
        skillBreakdown: skills,
      } as any);
      toast({ title: 'Saved', description: 'Your Mars lesson results were saved.' });
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not save progress. Will retry later.', variant: 'destructive' });
    }
  };

  const handleFinishLesson = async () => {
    try {
      // Use the optimized lesson completion function
      const success = await completeLesson(user.id, {
        lessonId: 'mars-lesson',
        lessonName: 'Mars: Extraneous Solutions',
        score: getPerformanceSummary().percentage,
        timeSpent: Math.max(1, Math.round((Date.now() - startRef.current) / 60000)),
        equationsSolved,
        mistakes,
        skillBreakdown: skills,
        xpEarned: 300,
        planetName: 'Mars',
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
    
    // Save progress for next lesson (Jupiter) so it shows up in "In Progress"
    if (user?.id) {
      try {
        await saveProgress(user.id, {
          module_id: 'jupiter',
          section_id: 'section_0',
          slide_index: 0,
          progress_pct: 0, // Starting fresh on next lesson
        });
      } catch (error) {
        console.error('Error saving progress for next lesson:', error);
      }
    }
    
    toast({ title: 'Progress Saved! 🚀', description: 'Continuing to next lesson.' });
    navigate('/jupiter-lesson');
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
      areas.push("Understanding what extraneous solutions are");
    }
    if (questionsAnswered[2] && !questionsAnswered[2].correct) {
      areas.push("Identifying extraneous solutions in practice");
    }
    if (questionsAnswered[3] && !questionsAnswered[3].correct) {
      areas.push("Remembering to check solutions against restrictions");
    }
    
    return areas;
  };

  const slides = [
    {
      id: 1,
      title: '🚨 Mission: Identify Extraneous Solutions',
      icon: <Shield className="w-6 h-6 text-red-400" />,
      body: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-500/20 via-orange-500/20 to-red-600/20 rounded-2xl p-6 border-2 border-red-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <Flame className="w-8 h-8 text-orange-400 animate-pulse" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-red-200 via-orange-200 to-red-300 bg-clip-text text-transparent">
                What Are Extraneous Solutions?
              </h3>
            </div>
            <div className="space-y-4 text-white/95">
              <p className="text-lg leading-relaxed">
                <strong className="text-red-300">Extraneous solutions</strong> are <span className="bg-red-500/30 px-2 py-1 rounded">false solutions</span> that appear during solving but are <span className="bg-orange-500/30 px-2 py-1 rounded">NOT valid</span> for the original equation.
              </p>
              <div className="bg-black/30 rounded-xl p-4 border border-red-400/30">
                <p className="font-semibold text-red-200 mb-2">🎯 Key Characteristics:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>They make denominators equal to <strong>zero</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>They violate the <strong>domain restrictions</strong> of the original equation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>They appear when you multiply by expressions that could be zero</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-5 border border-yellow-400/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-300" />
              <p className="font-semibold text-yellow-200">💡 Remember:</p>
            </div>
            <p className="text-white/90 text-sm">
              Always check your solutions against the <strong className="text-yellow-200">original restrictions</strong> before declaring them valid!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '⚡ Why Do Extraneous Solutions Appear?',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      body: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-red-500/20 rounded-2xl p-6 border-2 border-purple-400/40 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-purple-200 mb-4 flex items-center gap-2">
              <Brain className="w-6 h-6" />
              The Root Cause
            </h3>
            <div className="space-y-4 text-white/90">
              <p className="text-lg">
                Extraneous solutions appear when you <strong className="text-purple-300">multiply both sides</strong> of an equation by an expression that <span className="bg-red-500/30 px-2 py-1 rounded font-semibold">can be zero</span>.
              </p>
              
              <div className="bg-black/40 rounded-xl p-5 border border-purple-400/30">
                <p className="font-semibold text-purple-200 mb-3">📋 Step-by-Step Process:</p>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                    <div>
                      <p className="font-semibold mb-1">Start with a rational equation</p>
                      <BlockMath math={'\\frac{x}{x-1} = \\frac{1}{x-1} + 2'} />
                      <p className="text-xs text-white/70 mt-1">Restriction: <InlineMath math={'x \\neq 1'} /></p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                    <div>
                      <p className="font-semibold mb-1">Multiply by LCD (x-1)</p>
                      <BlockMath math={'(x-1) \\cdot \\frac{x}{x-1} = (x-1) \\cdot \\left(\\frac{1}{x-1} + 2\\right)'} />
                      <p className="text-xs text-red-300 mt-1">⚠️ Problem: (x-1) could be zero!</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                    <div>
                      <p className="font-semibold mb-1">After simplifying, you get:</p>
                      <BlockMath math={'x = 1'} />
                      <p className="text-xs text-red-400 font-semibold mt-1">❌ But x = 1 violates the restriction!</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl p-5 border-2 border-red-400/40">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
              <p className="font-bold text-red-200 text-lg">Critical Warning</p>
            </div>
            <p className="text-white/90">
              When you multiply by an expression containing the variable, you're essentially <strong className="text-red-300">creating new potential solutions</strong> that may not satisfy the original equation's restrictions.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '🎯 Example 1: Classic Extraneous Solution',
      icon: <Target className="w-6 h-6 text-red-400" />,
      body: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Solve and Check for Extraneous Solutions
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">📝 Original Equation:</p>
                <div className="text-center bg-white/10 rounded-lg p-4 mb-4">
                  <BlockMath math={'\\frac{x}{x-1} = \\frac{1}{x-1} + 2'} />
                </div>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-1">⚠️ Step 1: Identify Restrictions</p>
                  <p className="text-sm text-white/90">
                    Denominator: <InlineMath math={'x-1'} />. Set equal to zero: <InlineMath math={'x-1 = 0'} /> → <InlineMath math={'x = 1'} />
                  </p>
                  <p className="text-sm font-semibold text-yellow-300 mt-2">Restriction: <InlineMath math={'x \\neq 1'} /></p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">🔧 Step 2: Clear Denominators</p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-white/80">LCD = <InlineMath math={'x-1'} /></p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <BlockMath math={'(x-1) \\cdot \\frac{x}{x-1} = (x-1) \\cdot \\frac{1}{x-1} + (x-1) \\cdot 2'} />
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">✨ Step 3: Simplify</p>
                <div className="space-y-2">
                  <BlockMath math={'x = 1 + 2(x-1)'} />
                  <BlockMath math={'x = 1 + 2x - 2'} />
                  <BlockMath math={'x = 2x - 1'} />
                  <BlockMath math={'-x = -1 \\;\\Rightarrow\\; x = 1'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-xl p-5 border-2 border-red-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <p className="font-bold text-red-200 text-lg">🚨 Step 4: Check Against Restrictions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90">
                    We found: <InlineMath math={'x = 1'} />
                  </p>
                  <p className="text-white/90">
                    But restriction says: <InlineMath math={'x \\neq 1'} />
                  </p>
                  <div className="bg-red-600/40 rounded-lg p-3 border border-red-400 mt-3">
                    <p className="font-bold text-red-200 text-center">
                      ❌ EXTRANEOUS SOLUTION! No valid solution exists.
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
      title: '🔥 Example 2: Multiple Extraneous Solutions',
      icon: <Flame className="w-6 h-6 text-orange-400" />,
      body: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 border-2 border-orange-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <h3 className="text-xl font-bold text-orange-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Quadratic Equation with Extraneous Solutions
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">📝 Original Equation:</p>
                <div className="text-center bg-white/10 rounded-lg p-4 mb-4">
                  <BlockMath math={'\\frac{x+2}{x-3} = \\frac{4}{x-3}'} />
                </div>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-1">⚠️ Step 1: Identify Restrictions</p>
                  <p className="text-sm text-white/90">
                    Denominator: <InlineMath math={'x-3'} />. Set <InlineMath math={'x-3 = 0'} /> → <InlineMath math={'x = 3'} />
                  </p>
                  <p className="text-sm font-semibold text-yellow-300 mt-2">Restriction: <InlineMath math={'x \\neq 3'} /></p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">🔧 Step 2: Clear Denominators</p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-white/80">LCD = <InlineMath math={'x-3'} /></p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <BlockMath math={'(x-3) \\cdot \\frac{x+2}{x-3} = (x-3) \\cdot \\frac{4}{x-3}'} />
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-orange-400/30">
                <p className="font-semibold text-orange-200 mb-3">✨ Step 3: Simplify</p>
                <div className="space-y-2">
                  <BlockMath math={'x+2 = 4'} />
                  <BlockMath math={'x = 2'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Step 4: Check Against Restrictions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90">
                    We found: <InlineMath math={'x = 2'} />
                  </p>
                  <p className="text-white/90">
                    Restriction: <InlineMath math={'x \\neq 3'} />
                  </p>
                  <div className="bg-green-600/40 rounded-lg p-3 border border-green-400 mt-3">
                    <p className="font-bold text-green-200 text-center">
                      ✅ VALID SOLUTION! x = 2 is valid since 2 ≠ 3.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-5 border border-purple-400/40">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-purple-300" />
              <p className="font-semibold text-purple-200">💡 Key Insight:</p>
            </div>
            <p className="text-white/90 text-sm">
              Not all solutions are extraneous! Always verify by checking if the solution satisfies the original restrictions.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: '⚔️ Example 3: Complex Case Study',
      icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
      body: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-6 border-2 border-indigo-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <h3 className="text-xl font-bold text-indigo-200 mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Advanced Example: Multiple Restrictions
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">📝 Original Equation:</p>
                <div className="text-center bg-white/10 rounded-lg p-4 mb-4">
                  <BlockMath math={'\\frac{1}{x-2} + \\frac{1}{x+1} = \\frac{x+3}{(x-2)(x+1)}'} />
                </div>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Step 1: Identify ALL Restrictions</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• <InlineMath math={'x-2 = 0'} /> → <InlineMath math={'x = 2'} /></p>
                    <p>• <InlineMath math={'x+1 = 0'} /> → <InlineMath math={'x = -1'} /></p>
                  </div>
                  <p className="text-sm font-semibold text-yellow-300 mt-2">Restrictions: <InlineMath math={'x \\neq 2'} /> and <InlineMath math={'x \\neq -1'} /></p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">🔧 Step 2: Clear Denominators</p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-white/80">LCD = <InlineMath math={'(x-2)(x+1)'} /></p>
                  <div className="bg-white/10 rounded-lg p-3 text-sm">
                    <BlockMath math={'(x-2)(x+1) \\left(\\frac{1}{x-2} + \\frac{1}{x+1}\\right) = (x-2)(x+1) \\cdot \\frac{x+3}{(x-2)(x+1)}'} />
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">✨ Step 3: Simplify</p>
                <div className="space-y-2">
                  <BlockMath math={'(x+1) + (x-2) = x+3'} />
                  <BlockMath math={'x+1 + x-2 = x+3'} />
                  <BlockMath math={'2x - 1 = x + 3'} />
                  <BlockMath math={'x = 4'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Step 4: Verify Against ALL Restrictions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90">
                    Solution: <InlineMath math={'x = 4'} />
                  </p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Check restrictions:</p>
                    <p className="text-sm">• <InlineMath math={'4 \\neq 2'} /> ✅</p>
                    <p className="text-sm">• <InlineMath math={'4 \\neq -1'} /> ✅</p>
                  </div>
                  <div className="bg-green-600/40 rounded-lg p-3 border border-green-400 mt-3">
                    <p className="font-bold text-green-200 text-center">
                      ✅ VALID SOLUTION! x = 4 satisfies all restrictions.
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
      title: '🛡️ Defense Strategy: How to Avoid Extraneous Solutions',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      body: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-blue-200 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              The 5-Step Defense Protocol
            </h3>
            
            <div className="space-y-4">
              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Identify Restrictions FIRST</p>
                    <p className="text-white/90 text-sm">
                      Before solving, write down all values that make any denominator zero. These are your <strong className="text-blue-300">domain restrictions</strong>.
                    </p>
                    <div className="bg-blue-500/20 rounded-lg p-2 mt-2 border border-blue-400/30">
                      <p className="text-xs text-blue-200">Example: For <InlineMath math={'\\frac{x}{x-2}'} />, restriction is <InlineMath math={'x \\neq 2'} /></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Solve the Equation</p>
                    <p className="text-white/90 text-sm">
                      Use your standard methods (clearing denominators, factoring, etc.) to find potential solutions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Check Each Solution</p>
                    <p className="text-white/90 text-sm mb-2">
                      For every solution you find, verify it doesn't violate any restrictions.
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

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">4</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Verify in Original Equation</p>
                    <p className="text-white/90 text-sm">
                      Substitute each valid solution back into the <strong className="text-blue-300">original equation</strong> to ensure it works.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">5</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Report Final Answer</p>
                    <p className="text-white/90 text-sm">
                      Only include solutions that passed all checks. If all solutions are extraneous, state <strong className="text-blue-300">"No solution"</strong>.
                    </p>
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
              Always write restrictions at the beginning of your solution. This makes it easier to check your final answer!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: '🏆 Final Challenge: Spot the Extraneous Solutions',
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
      body: (
        <div className="space-y-6">
          {/* Question 1 */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border-2 border-yellow-400/40 shadow-[0_0_25px_rgba(234,179,8,0.3)]">
            <h4 className="text-yellow-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-yellow-500 text-black px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q1</span>
              What is an extraneous solution?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['A solution that makes denominators zero', 'A solution that satisfies all restrictions', 'A solution that is always correct', 'A solution that simplifies the equation'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[1]?.answer === option ? 
                    (questionsAnswered[1]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    1, 
                    option, 
                    'A solution that makes denominators zero',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[1]}
                  className="hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[1] && questionsAnswered[1] && !questionsAnswered[1].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Understanding Extraneous Solutions
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-red-200 mb-2">WHAT are extraneous solutions?</p>
                    <ul className="space-y-1">
                      <li className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>False solutions that appear during solving</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>They make denominators equal to <strong>zero</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span>They violate the original equation's domain restrictions</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-red-200 mb-2">EXAMPLE:</p>
                    <p className="text-xs">For <InlineMath math={'\\frac{x}{x-1} = 2'} />, if you get x = 1, it's extraneous because it makes the denominator zero!</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Always check solutions against restrictions!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[1] && questionsAnswered[1] && questionsAnswered[1].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand what extraneous solutions are.
                </p>
              </div>
            )}
          </div>

          {/* Question 2 */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border-2 border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.3)]">
            <h4 className="text-blue-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q2</span>
              Solve: x/(x-2) = 1/(x-2) + 1. Which solution is extraneous?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['x = 2', 'x = 3', 'x = 1', 'No extraneous solutions'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[2]?.answer === option ? 
                    (questionsAnswered[2]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    2, 
                    option, 
                    'x = 2',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[2]}
                  className="hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[2] && questionsAnswered[2] && !questionsAnswered[2].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Step-by-Step Solution
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-blue-200 mb-2">STEP 1: Identify Restrictions</p>
                    <p className="mb-2">Denominator: <InlineMath math={'x-2'} />. Set <InlineMath math={'x-2 = 0'} /> → <InlineMath math={'x = 2'} /></p>
                    <p className="font-semibold text-yellow-300">Restriction: <InlineMath math={'x \\neq 2'} /></p>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-blue-200 mb-2">STEP 2: Clear Denominators</p>
                    <p className="mb-2">LCD = <InlineMath math={'x-2'} /></p>
                    <BlockMath math={'(x-2) \\cdot \\frac{x}{x-2} = (x-2) \\cdot \\frac{1}{x-2} + (x-2) \\cdot 1'} />
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-blue-200 mb-2">STEP 3: Simplify</p>
                    <BlockMath math={'x = 1 + x - 2 \\;\\Rightarrow\\; x = x - 1 \\;\\Rightarrow\\; 0 = -1'} />
                    <p className="text-red-300 font-semibold mt-2">This is a contradiction! No solution exists.</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ If x = 2 appeared, it would be extraneous since it violates the restriction!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[2] && questionsAnswered[2] && questionsAnswered[2].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Excellent! You correctly identified that x = 2 would be extraneous.
                </p>
              </div>
            )}
          </div>

          {/* Question 3 */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border-2 border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            <h4 className="text-purple-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q3</span>
              What is the MOST important step to avoid extraneous solutions?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Check solutions against restrictions', 'Solve quickly', 'Use a calculator', 'Skip restrictions'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[3]?.answer === option ? 
                    (questionsAnswered[3]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    3, 
                    option, 
                    'Check solutions against restrictions',
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
                  The Defense Strategy
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-purple-200 mb-2">WHY check restrictions?</p>
                    <ul className="space-y-1">
                      <li>• Extraneous solutions violate restrictions</li>
                      <li>• Checking catches false solutions immediately</li>
                      <li>• Prevents reporting invalid answers</li>
                    </ul>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-purple-200 mb-2">HOW to check:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Write restrictions at the start</li>
                      <li>After solving, check each solution</li>
                      <li>Reject any that violate restrictions</li>
                      <li>Verify valid solutions in original equation</li>
                    </ol>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Always check restrictions - it's the best defense against extraneous solutions!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[3] && questionsAnswered[3] && questionsAnswered[3].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand the defense strategy against extraneous solutions.
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
      setProgress((n / (slides.length - 1)) * 100);
    }
  };
  const next = () => {
    if (currentSection < slides.length - 1) {
      const n = currentSection + 1;
      setCurrentSection(n);
      setProgress((n / (slides.length - 1)) * 100);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* WebP-first background with PNG fallback - fixed to prevent stretching */}
      <motion.img
        src={bgSrc}
        onError={() => setBgSrc(marsPng)}
        alt="Mars Background"
        className="fixed inset-0 w-full h-full object-cover"
        style={{ 
          objectFit: 'cover',
          objectPosition: 'center',
          width: '100%',
          height: '100%'
        }}
        initial={{ scale: 1.02, x: 0, y: 0 }}
        animate={{ scale: 1.05, x: 5, y: 3 }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-red-900/40 via-black/50 to-black/70" />
      <div className="fixed inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 200px rgba(239,68,68,0.2), inset 0 0 100px rgba(0,0,0,0.6)' }} />
      
      {/* Animated particles/glow effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/20 rounded-full blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl"
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
      </div>

      <motion.header 
        className="p-6 border-b-2 border-red-400/40 backdrop-blur-md bg-gradient-to-r from-red-900/30 via-black/40 to-orange-900/30 relative z-10 shadow-[0_4px_20px_rgba(239,68,68,0.3)]" 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/30 to-orange-500/30 border-2 border-red-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Flame className="text-red-300" size={24} />
            </motion.div>
            <div>
              <h1 className="font-orbitron font-bold text-2xl bg-gradient-to-r from-red-200 via-orange-200 to-yellow-200 bg-clip-text text-transparent drop-shadow-lg">
                🪐 Mars — Extraneous Solutions
              </h1>
              <p className="text-sm text-red-300/80 font-semibold">Mission: Identify False Solutions</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-red-500/30 to-orange-500/30 border-2 border-red-400/50 text-white font-bold px-4 py-2 shadow-lg">
            {currentSection + 1} / {slides.length}
          </Badge>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-red-200 font-semibold mb-2">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Mission Progress
                </span>
                <span className="bg-red-500/30 px-3 py-1 rounded-full border border-red-400/50">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-3 bg-red-900/30" />
                <motion.div
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                  style={{ width: `${progress}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          <motion.div 
            key={slides[currentSection].id} 
            initial={{ opacity: 0, y: 12, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ duration: 0.5, ease: "easeOut" }} 
            whileHover={{ scale: 1.01 }} 
            className="bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-2xl border-2 border-white/30 backdrop-blur-md shadow-[0_20px_60px_rgba(239,68,68,0.3)] hover:shadow-[0_25px_70px_rgba(239,68,68,0.4)] transition-all duration-300"
          >
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/30 to-orange-500/30 border border-red-400/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  {slides[currentSection].icon ?? <AlertTriangle size={24} className="text-red-300" />}
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-200 via-orange-200 to-yellow-200 bg-clip-text text-transparent drop-shadow-lg">
                  {slides[currentSection].title}
                </h2>
              </div>
              {slides[currentSection].body}
            </div>
          </motion.div>

          <div className="flex justify-between items-center mt-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                onClick={prev} 
                disabled={currentSection === 0} 
                className="flex items-center gap-2 bg-gradient-to-r from-red-900/30 to-orange-900/30 border-2 border-red-400/50 text-white hover:bg-red-900/50 hover:border-red-400/70 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
              >
                <ArrowLeft size={18} /> Previous
              </Button>
            </motion.div>
            
            {currentSection === slides.length - 1 ? (
              // Last step: show Finish Lesson and Continue buttons
              <div className="flex gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    onClick={handleFinishLesson}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-400/50 text-white hover:bg-green-900/50 shadow-lg font-semibold"
                  >
                    <CheckCircle size={18} /> Finish Lesson
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={handleContinueToNext}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:shadow-[0_0_40px_rgba(249,115,22,0.7)] font-bold text-lg px-6 py-6"
                  >
                    Continue to Jupiter <ArrowRight size={20} />
                  </Button>
                </motion.div>
              </div>
            ) : (
              // Not last step: show Next button
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={next} 
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] font-bold text-lg px-6 py-6"
                >
                  Next <ArrowRight size={20} />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent className="border-cosmic-purple/20 bg-cosmic-dark/95 backdrop-blur-md">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-2xl font-orbitron text-cosmic-purple">
              🎉 Mars Lesson Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cosmic-text text-center">
              Excellent work! You've mastered identifying extraneous solutions in rational equations. 
              <br />
              <strong className="text-cosmic-green">Jupiter lesson is now unlocked!</strong>
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
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              Continue to Jupiter 🪐
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MarsLesson;


