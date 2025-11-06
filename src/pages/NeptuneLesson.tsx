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
  Wand2,
  FileCheck,
  Award
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { db } from '@/lib/database';

const neptuneBg = new URL('../../planet background/neptune.jpeg', import.meta.url).href;

const NeptuneLesson: React.FC = () => {
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
    completePipeline: { correct: 0, total: 0 },
    justification: { correct: 0, total: 0 },
    verification: { correct: 0, total: 0 },
    synthesis: { correct: 0, total: 0 },
    assessment: { correct: 0, total: 0 },
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
          module_id: 'neptune',
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
        moduleId: 'lesson-neptune',
        moduleName: 'Neptune — Final Assessments',
        completedAt: new Date(),
        score,
        timeSpent: minutes,
        equationsSolved,
        mistakes,
        skillBreakdown: skills,
      } as any);
      toast({ title: 'Saved', description: 'Your Neptune lesson results were saved.' });
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
        description: "Excellent! You understand comprehensive problem-solving.",
        variant: "default",
      });
    } else {
      toast({
        title: "Not quite right 📚",
        description: "Review the explanation to master this concept.",
        variant: "destructive",
      });
    }

    // Check if quiz is completed (15 questions for Neptune - comprehensive final assessment)
    const totalQuestions = 15;
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
      areas.push("Complete problem-solving pipeline");
    }
    if (questionsAnswered[2] && !questionsAnswered[2].correct) {
      areas.push("Verifying solutions in original equations");
    }
    if (questionsAnswered[3] && !questionsAnswered[3].correct) {
      areas.push("Justifying each step of the solution");
    }
    if (questionsAnswered[4] && !questionsAnswered[4].correct) {
      areas.push("Combining multiple techniques");
    }
    if (questionsAnswered[5] && !questionsAnswered[5].correct) {
      areas.push("Final verification and proof");
    }
    if (questionsAnswered[6] && !questionsAnswered[6].correct) {
      areas.push("Understanding LCD and factoring");
    }
    if (questionsAnswered[7] && !questionsAnswered[7].correct) {
      areas.push("Handling quadratic equations from rational equations");
    }
    if (questionsAnswered[8] && !questionsAnswered[8].correct) {
      areas.push("Identifying all restrictions");
    }
    if (questionsAnswered[9] && !questionsAnswered[9].correct) {
      areas.push("Word problem setup and solving");
    }
    if (questionsAnswered[10] && !questionsAnswered[10].correct) {
      areas.push("Complex fraction simplification");
    }
    if (questionsAnswered[11] && !questionsAnswered[11].correct) {
      areas.push("Parameterized equation solving");
    }
    if (questionsAnswered[12] && !questionsAnswered[12].correct) {
      areas.push("Creative substitution methods");
    }
    if (questionsAnswered[13] && !questionsAnswered[13].correct) {
      areas.push("Multiple solution verification");
    }
    if (questionsAnswered[14] && !questionsAnswered[14].correct) {
      areas.push("Complete solution justification");
    }
    if (questionsAnswered[15] && !questionsAnswered[15].correct) {
      areas.push("Assessment-level problem solving");
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
        lessonId: 'neptune-lesson',
        lessonName: 'Neptune: Final Assessments',
        score: getPerformanceSummary().percentage,
        timeSpent: Math.max(1, Math.round((Date.now() - startRef.current) / 60000)),
        equationsSolved,
        mistakes,
        skillBreakdown: skills,
        xpEarned: 500,
        planetName: 'Neptune',
      });
      
      if (success) {
        toast({
          title: "Final Assessment Complete! 🎉",
          description: "Congratulations! You've completed the entire Solar System journey!",
        });
      } else {
        toast({
          title: "Assessment Completed",
          description: "Final assessment finished, but some data may not have been saved.",
          variant: "default",
        });
      }
      
      // Show completion dialog
      setShowCompletionDialog(true);
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast({
        title: "Assessment Completed",
        description: "Final assessment finished, but there was an issue saving progress.",
        variant: "destructive",
      });
      setShowCompletionDialog(true);
    }
  };

  const handleBackToSolarSystem = () => {
    navigate('/rpg');
  };


  const sections = [
    {
      id: 1,
      title: '🎯 The Final Trial: Complete Assessment',
      icon: <FileCheck className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="space-y-6">
          <motion.div 
            className="bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-indigo-600/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.5),0_0_60px_rgba(6,182,212,0.3),inset_0_0_20px_rgba(59,130,246,0.1)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(59,130,246,0.7),0_0_80px_rgba(6,182,212,0.4)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-8 h-8 text-blue-400 animate-pulse" />
              <motion.h3 
                className="text-2xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  textShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)',
                  filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                }}
              >
                Welcome to Neptune — Final Assessments
              </motion.h3>
            </div>
            <div className="space-y-4 text-white/95">
              <p className="text-lg leading-relaxed">
                Welcome to <strong className="text-blue-300">Neptune</strong>, the final planet! This is your <span className="bg-blue-500/30 px-2 py-1 rounded">comprehensive assessment</span> where you'll <span className="bg-cyan-500/30 px-2 py-1 rounded">prove your mastery</span> through complete problem-solving.
              </p>
              <div className="bg-black/30 rounded-xl p-4 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-2">🎯 What Makes Neptune Different?</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Complete Pipeline</strong> - Solve problems from start to finish with full justification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Verification Required</strong> - Prove your solutions are correct, not just find them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Comprehensive Assessment</strong> - Test everything you've learned across all planets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCheck className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Justification</strong> - Show why each step is valid and why your answer works</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
          
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-5 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-cyan-300" />
              <p className="font-semibold text-cyan-200">💡 Remember:</p>
            </div>
            <p className="text-white/90 text-sm">
              "Prove it, don't just find it." On Neptune, you must justify every step and verify your final answer!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '⚡ Example 1: Complete Pipeline Problem',
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      content: (
        <div className="space-y-6">
          <motion.div 
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.5),0_0_60px_rgba(6,182,212,0.3),inset_0_0_20px_rgba(59,130,246,0.1)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(59,130,246,0.7),0_0_80px_rgba(6,182,212,0.4)' }}
          >
            <motion.h3 
              className="text-xl font-bold text-blue-200 mb-4 flex items-center gap-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                textShadow: '0 0 15px rgba(59, 130, 246, 0.6), 0 0 30px rgba(6, 182, 212, 0.4)',
                filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.7))'
              }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Calculator className="w-6 h-6" />
              </motion.div>
              Assessment Example: Full Problem-Solving Pipeline
            </motion.h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">📝 Problem (Solve with Full Justification):</p>
                <div className="text-center bg-white/10 rounded-lg p-4 mb-4">
                  <BlockMath math={'\\frac{2x+1}{x^2-9} + \\frac{3}{x-3} = \\frac{4}{x+3}'} />
                </div>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Assessment Checklist:</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>✓ Factor all denominators</p>
                    <p>✓ Find LCD</p>
                    <p>✓ Clear denominators</p>
                    <p>✓ Solve the equation</p>
                    <p>✓ Check restrictions</p>
                    <p>✓ Verify solution in original equation</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">🔧 Step 1: Factor and Identify Restrictions</p>
                <div className="space-y-2 mb-3">
                  <p className="text-sm text-white/80">Factor: <InlineMath math={'x^2-9 = (x-3)(x+3)'} /> (difference of squares)</p>
                  <p className="text-sm font-semibold text-blue-300">LCD = <InlineMath math={'(x-3)(x+3)'} /></p>
                  <p className="text-xs text-white/70 mt-2">Restrictions: <InlineMath math={'x \\neq 3'} /> and <InlineMath math={'x \\neq -3'} /> (from denominators)</p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">✨ Step 2: Clear Denominators</p>
                <div className="space-y-2">
                  <BlockMath math={'(x-3)(x+3) \\left(\\frac{2x+1}{(x-3)(x+3)} + \\frac{3}{x-3}\\right) = (x-3)(x+3) \\cdot \\frac{4}{x+3}'} />
                  <BlockMath math={'(2x+1) + 3(x+3) = 4(x-3)'} />
                  <BlockMath math={'2x+1 + 3x+9 = 4x-12'} />
                  <BlockMath math={'5x+10 = 4x-12'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">🧮 Step 3: Solve</p>
                <div className="space-y-2">
                  <BlockMath math={'5x+10 = 4x-12'} />
                  <BlockMath math={'5x - 4x = -12 - 10'} />
                  <BlockMath math={'x = -22'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-blue-400/30">
                <p className="font-semibold text-blue-200 mb-3">✅ Step 4: Check Restrictions</p>
                <div className="space-y-2">
                  <p className="text-sm text-white/80">Solution: <InlineMath math={'x = -22'} /></p>
                  <p className="text-sm">• <InlineMath math={'x = -22 \\neq 3'} /> ✅</p>
                  <p className="text-sm">• <InlineMath math={'x = -22 \\neq -3'} /> ✅</p>
                  <p className="text-sm text-green-300 font-semibold mt-2">Restrictions satisfied!</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Step 5: Verify in Original Equation</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90 text-sm mb-2">Substitute <InlineMath math={'x = -22'} /> into original:</p>
                  <div className="bg-white/10 rounded-lg p-3 text-sm">
                    <p className="text-white/80 mb-2">Left side:</p>
                    <BlockMath math={'\\frac{2(-22)+1}{(-22)^2-9} + \\frac{3}{-22-3} = \\frac{-44+1}{484-9} + \\frac{3}{-25}'} />
                    <BlockMath math={'= \\frac{-43}{475} - \\frac{3}{25} = \\frac{-43}{475} - \\frac{57}{475} = \\frac{-100}{475} = -\\frac{4}{19}'} />
                    <p className="text-white/80 mt-2 mb-2">Right side:</p>
                    <BlockMath math={'\\frac{4}{-22+3} = \\frac{4}{-19} = -\\frac{4}{19}'} />
                  </div>
                  <div className="bg-green-600/40 rounded-lg p-3 border border-green-400 mt-3">
                    <p className="font-bold text-green-200 text-center text-sm">
                      ✅ VERIFIED! Both sides equal <InlineMath math={'-\\frac{4}{19}'} />. Solution is correct!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      id: 3,
      title: '🔥 Example 2: Justification and Proof',
      icon: <Flame className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="space-y-6">
          <motion.div 
            className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-6 border-2 border-indigo-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(99,102,241,0.5),0_0_60px_rgba(139,92,246,0.3),inset_0_0_20px_rgba(99,102,241,0.1)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(99,102,241,0.7),0_0_80px_rgba(139,92,246,0.4)' }}
          >
            <motion.h3 
              className="text-xl font-bold text-indigo-200 mb-4 flex items-center gap-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                textShadow: '0 0 15px rgba(99, 102, 241, 0.6), 0 0 30px rgba(139, 92, 246, 0.4)',
                filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.7))'
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Shield className="w-6 h-6" />
              </motion.div>
              Assessment Example: Prove Your Solution
            </motion.h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">📝 Problem (Solve and Justify):</p>
                <div className="text-center bg-white/10 rounded-lg p-4 mb-4">
                  <BlockMath math={'\\frac{x}{x-1} - \\frac{2}{x+1} = \\frac{x^2-2}{(x-1)(x+1)}'} />
                </div>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Assessment Focus: Justification</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>• Show why each step is valid</p>
                    <p>• Explain your reasoning</p>
                    <p>• Prove your answer is correct</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">🔧 Step 1: Analysis with Justification</p>
                <div className="space-y-2 mb-3 text-sm">
                  <p className="text-white/80"><strong>Justification:</strong> All denominators are already factored.</p>
                  <p className="text-white/80">LCD = <InlineMath math={'(x-1)(x+1)'} /> (all denominators share this form)</p>
                  <p className="text-white/80">Restrictions: <InlineMath math={'x \\neq 1'} /> and <InlineMath math={'x \\neq -1'} /> (to prevent division by zero)</p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">✨ Step 2: Clear Denominators (Justified)</p>
                <div className="space-y-2">
                  <p className="text-xs text-white/70 mb-2"><strong>Justification:</strong> Multiplying both sides by LCD preserves equality.</p>
                  <BlockMath math={'(x-1)(x+1) \\left(\\frac{x}{x-1} - \\frac{2}{x+1}\\right) = (x-1)(x+1) \\cdot \\frac{x^2-2}{(x-1)(x+1)}'} />
                  <p className="text-xs text-white/70 mt-2"><strong>Justification:</strong> LCD cancels each denominator.</p>
                  <BlockMath math={'x(x+1) - 2(x-1) = x^2-2'} />
                  <BlockMath math={'x^2+x - 2x+2 = x^2-2'} />
                  <BlockMath math={'x^2 - x + 2 = x^2 - 2'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-indigo-400/30">
                <p className="font-semibold text-indigo-200 mb-3">🧮 Step 3: Solve (Justified)</p>
                <div className="space-y-2">
                  <BlockMath math={'x^2 - x + 2 = x^2 - 2'} />
                  <p className="text-xs text-white/70"><strong>Justification:</strong> Subtract <InlineMath math={'x^2'} /> from both sides.</p>
                  <BlockMath math={'-x + 2 = -2'} />
                  <BlockMath math={'-x = -4'} />
                  <BlockMath math={'x = 4'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Step 4: Prove Solution is Correct</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90 text-sm mb-2"><strong>Proof:</strong> Check restrictions and verify in original equation.</p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-white/90 mb-2">Restriction check:</p>
                    <p className="text-sm">• <InlineMath math={'4 \\neq 1'} /> ✅</p>
                    <p className="text-sm">• <InlineMath math={'4 \\neq -1'} /> ✅</p>
                    <p className="text-sm text-white/90 mt-3 mb-2">Verification in original:</p>
                    <p className="text-xs">Left: <InlineMath math={'\\frac{4}{3} - \\frac{2}{5} = \\frac{20-6}{15} = \\frac{14}{15}'} /></p>
                    <p className="text-xs">Right: <InlineMath math={'\\frac{16-2}{15} = \\frac{14}{15}'} /></p>
                  </div>
                  <div className="bg-green-600/40 rounded-lg p-3 border border-green-400 mt-3">
                    <p className="font-bold text-green-200 text-center text-sm">
                      ✅ PROVEN! Solution <InlineMath math={'x = 4'} /> is correct and verified.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      id: 4,
      title: '⚔️ Example 3: Multi-Step Assessment',
      icon: <Sparkles className="w-6 h-6 text-blue-400" />,
      content: (
        <div className="space-y-6">
          <motion.div 
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border-2 border-purple-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(168,85,247,0.5),0_0_60px_rgba(192,132,252,0.3),inset_0_0_20px_rgba(168,85,247,0.1)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(168,85,247,0.7),0_0_80px_rgba(192,132,252,0.4)' }}
          >
            <motion.h3 
              className="text-xl font-bold text-purple-200 mb-4 flex items-center gap-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                textShadow: '0 0 15px rgba(168, 85, 247, 0.6), 0 0 30px rgba(192, 132, 252, 0.4)',
                filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.7))'
              }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              Assessment Example: Complete Multi-Step Problem
            </motion.h3>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-5 border border-purple-400/30">
                <p className="font-semibold text-purple-200 mb-3">📝 Assessment Problem:</p>
                <p className="text-white/90 mb-4">
                  Solve completely and justify: <InlineMath math={'\\frac{1}{x^2-4} + \\frac{x}{x-2} = \\frac{2x+1}{x+2}'} />
                </p>
                
                <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30 mb-4">
                  <p className="text-sm font-semibold text-yellow-200 mb-2">⚠️ Assessment Requirements:</p>
                  <div className="space-y-1 text-sm text-white/90">
                    <p>✓ Show complete solution process</p>
                    <p>✓ Justify each major step</p>
                    <p>✓ Check all restrictions</p>
                    <p>✓ Verify final answer</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-purple-400/30">
                <p className="font-semibold text-purple-200 mb-3">🔧 Step 1: Factor (Justified)</p>
                <div className="space-y-2 mb-3 text-sm">
                  <p className="text-white/80"><strong>Justification:</strong> Factor to find all denominator factors.</p>
                  <p className="text-white/80"><InlineMath math={'x^2-4 = (x-2)(x+2)'} /> (difference of squares)</p>
                  <p className="text-sm font-semibold text-purple-300">LCD = <InlineMath math={'(x-2)(x+2)'} /></p>
                  <p className="text-xs text-white/70 mt-2">Restrictions: <InlineMath math={'x \\neq 2'} /> and <InlineMath math={'x \\neq -2'} /></p>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-purple-400/30">
                <p className="font-semibold text-purple-200 mb-3">✨ Step 2: Clear and Simplify (Justified)</p>
                <div className="space-y-2">
                  <BlockMath math={'(x-2)(x+2) \\left(\\frac{1}{(x-2)(x+2)} + \\frac{x}{x-2}\\right) = (x-2)(x+2) \\cdot \\frac{2x+1}{x+2}'} />
                  <p className="text-xs text-white/70"><strong>Justification:</strong> LCD cancels each denominator.</p>
                  <BlockMath math={'1 + x(x+2) = (2x+1)(x-2)'} />
                  <BlockMath math={'1 + x^2 + 2x = 2x^2 - 4x + x - 2'} />
                  <BlockMath math={'x^2 + 2x + 1 = 2x^2 - 3x - 2'} />
                  <BlockMath math={'0 = x^2 - 5x - 3'} />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-5 border border-purple-400/30">
                <p className="font-semibold text-purple-200 mb-3">🧮 Step 3: Solve Quadratic (Justified)</p>
                <div className="space-y-2 text-sm">
                  <p className="text-white/80 mb-2"><strong>Justification:</strong> Use quadratic formula for <InlineMath math={'x^2 - 5x - 3 = 0'} />.</p>
                  <BlockMath math={'x = \\frac{5 \\pm \\sqrt{25+12}}{2} = \\frac{5 \\pm \\sqrt{37}}{2}'} />
                  <p className="text-white/80 mt-2">Solutions: <InlineMath math={'x = \\frac{5+\\sqrt{37}}{2}'} /> ≈ 5.54 or <InlineMath math={'x = \\frac{5-\\sqrt{37}}{2}'} /> ≈ -0.54</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl p-5 border-2 border-green-400/50">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="font-bold text-green-200 text-lg">✅ Step 4: Verify Both Solutions</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90 text-sm mb-2">Restriction check:</p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm">• <InlineMath math={'5.54 \\neq 2, -2'} /> ✅</p>
                    <p className="text-sm">• <InlineMath math={'-0.54 \\neq 2, -2'} /> ✅</p>
                  </div>
                  <div className="bg-green-600/40 rounded-lg p-3 border border-green-400 mt-3">
                    <p className="font-bold text-green-200 text-center text-sm">
                      ✅ BOTH SOLUTIONS VALID! <InlineMath math={'x = \\frac{5 \\pm \\sqrt{37}}{2}'} />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      id: 5,
      title: '🛡️ Assessment Strategy: Complete Pipeline',
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      content: (
        <div className="space-y-6">
          <motion.div 
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.5),0_0_60px_rgba(6,182,212,0.3),inset_0_0_20px_rgba(59,130,246,0.1)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(59,130,246,0.7),0_0_80px_rgba(6,182,212,0.4)' }}
          >
            <motion.h3 
              className="text-xl font-bold text-blue-200 mb-6 flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                textShadow: '0 0 15px rgba(59, 130, 246, 0.6), 0 0 30px rgba(6, 182, 212, 0.4)',
                filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.7))'
              }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Shield className="w-6 h-6" />
              </motion.div>
              The Neptune Assessment Protocol: 7-Step Complete Pipeline
            </motion.h3>
            
            <div className="space-y-4">
              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Read and Understand</p>
                    <p className="text-white/90 text-sm">
                      Read the problem carefully. Identify what you're solving for. Note any special conditions or constraints.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Factor All Denominators</p>
                    <p className="text-white/90 text-sm">
                      Factor every denominator completely. This is critical for finding the correct LCD and identifying restrictions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Identify Restrictions</p>
                    <p className="text-white/90 text-sm">
                      Write down ALL restrictions before solving. This prevents forgetting to check them later.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">4</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Find LCD and Clear</p>
                    <p className="text-white/90 text-sm">
                      Find the LCD from all factored denominators. Multiply both sides by LCD and cancel carefully.
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
                      Use appropriate methods (linear solving, factoring, quadratic formula). Show your work clearly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">6</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Check Restrictions</p>
                    <p className="text-white/90 text-sm mb-2">
                      Verify each solution against ALL restrictions. Reject any that violate restrictions.
                    </p>
                    <div className="bg-red-500/20 rounded-lg p-2 border border-red-400/30">
                      <p className="text-xs text-red-200">❌ Extraneous: Solution violates a restriction</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-5 border border-blue-400/30">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg flex-shrink-0">7</div>
                  <div className="flex-1">
                    <p className="font-bold text-blue-200 mb-2">Verify in Original Equation</p>
                    <p className="text-white/90 text-sm mb-2">
                      Substitute your solution(s) back into the original equation to prove they work. This is the final proof!
                    </p>
                    <div className="bg-green-500/20 rounded-lg p-2 border border-green-400/30">
                      <p className="text-xs text-green-200">✅ Proven: Solution satisfies original equation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-cyan-500/20 rounded-xl p-5 border-2 border-yellow-400/40">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <p className="font-bold text-yellow-200 text-lg">Assessment Tip</p>
            </div>
            <p className="text-white/90">
              On Neptune, every step must be justified, and every solution must be verified. "Prove it, don't just find it!"
            </p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: '⚔️ Neptune Final Comprehensive Assessment',
      icon: <Award className="w-6 h-6 text-cyan-400" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-indigo-500/20 rounded-2xl p-6 border-2 border-blue-400/40 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <motion.h3 
              className="text-2xl font-bold text-blue-200 mb-6 flex items-center gap-3"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                textShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(6, 182, 212, 0.4), 0 0 60px rgba(139, 92, 246, 0.3)',
                filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <Award className="w-8 h-8 text-blue-400" />
              </motion.div>
              🏆 Final Comprehensive Assessment 🏆
            </motion.h3>
            
            <p className="text-white/90 text-lg mb-6">
              This is your final assessment! Answer all 15 questions to demonstrate your complete mastery of rational equations. Show that you can solve, justify, and verify!
            </p>
          </div>

          {/* Question 1 */}
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border-2 border-blue-400/40 shadow-[0_0_25px_rgba(59,130,246,0.3)]">
            <h4 className="text-blue-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q1</span>
              What is the FIRST step in solving a rational equation with multiple denominators?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Factor all denominators', 'Find the LCD', 'Clear denominators', 'Solve the equation'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[1]?.answer === option ? 
                    (questionsAnswered[1]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    1, 
                    option, 
                    'Factor all denominators',
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
                  Complete Pipeline
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-blue-200 mb-2">Why factor first?</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Factoring reveals all denominator factors</li>
                      <li>• You need factored form to find LCD correctly</li>
                      <li>• Factoring helps identify ALL restrictions</li>
                      <li>• Without factoring, you might miss factors or restrictions</li>
                    </ul>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Always factor denominators first - it's the foundation of the solution!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[1] && questionsAnswered[1] && questionsAnswered[1].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand the complete pipeline starts with factoring.
                </p>
              </div>
            )}
          </div>

          {/* Question 2 */}
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl p-6 border-2 border-indigo-400/40 shadow-[0_0_25px_rgba(99,102,241,0.3)]">
            <h4 className="text-indigo-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-indigo-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q2</span>
              After solving <InlineMath math={'\\frac{x+1}{x-2} = \\frac{3}{x+2}'} /> and getting <InlineMath math={'x = 4'} />, what should you do NEXT?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Check restrictions and verify in original', 'You\'re done, x=4 is the answer', 'Check restrictions only', 'Verify in original only'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[2]?.answer === option ? 
                    (questionsAnswered[2]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    2, 
                    option, 
                    'Check restrictions and verify in original',
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
                  Complete Verification
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-indigo-200 mb-2">Full verification requires BOTH steps:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Check restrictions:</strong> Ensure solution doesn't violate any denominator restrictions</li>
                      <li>• <strong>Verify in original:</strong> Substitute solution back to prove it actually works</li>
                    </ul>
                    <p className="text-xs text-yellow-300 mt-2">On Neptune, you must do BOTH to fully justify your answer!</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Complete verification = restrictions + original equation check!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[2] && questionsAnswered[2] && questionsAnswered[2].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Excellent! You understand complete verification.
                </p>
              </div>
            )}
          </div>

          {/* Question 3 */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border-2 border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            <h4 className="text-purple-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q3</span>
              When solving <InlineMath math={'\\frac{1}{x^2-4} + \\frac{1}{x-2} = \\frac{2}{x+2}'} />, what is the LCD after factoring?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['(x-2)(x+2)', 'x^2-4', 'x-2', 'x+2'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[3]?.answer === option ? 
                    (questionsAnswered[3]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    3, 
                    option, 
                    '(x-2)(x+2)',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[3]}
                  className="hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
                >
                  {option === '(x-2)(x+2)' ? <InlineMath math={'(x-2)(x+2)'} /> : option === 'x^2-4' ? <InlineMath math={'x^2-4'} /> : option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[3] && questionsAnswered[3] && !questionsAnswered[3].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Finding LCD
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-purple-200 mb-2">Step 1: Factor denominators</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <InlineMath math={'x^2-4 = (x-2)(x+2)'} /> (difference of squares)</li>
                      <li>• <InlineMath math={'x-2'} /> (already factored)</li>
                      <li>• <InlineMath math={'x+2'} /> (already factored)</li>
                    </ul>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-purple-200 mb-2">Step 2: Find LCD</p>
                    <p className="text-xs">Unique factors: <InlineMath math={'x-2'} /> and <InlineMath math={'x+2'} /></p>
                    <p className="text-xs text-yellow-300 font-semibold mt-2">LCD = <InlineMath math={'(x-2)(x+2)'} /> (which equals <InlineMath math={'x^2-4'} />)</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Always factor first, then find LCD from factored form!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[3] && questionsAnswered[3] && questionsAnswered[3].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You correctly identified the LCD after factoring.
                </p>
              </div>
            )}
          </div>

          {/* Question 4 */}
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border-2 border-orange-400/40 shadow-[0_0_25px_rgba(249,115,22,0.3)]">
            <h4 className="text-orange-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q4</span>
              If you get <InlineMath math={'x = 2'} /> as a solution but your restrictions are <InlineMath math={'x \\neq 2, -3'} />, what should you do?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Reject it as extraneous', 'Accept it anyway', 'Check again', 'Ignore restrictions'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[4]?.answer === option ? 
                    (questionsAnswered[4]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    4, 
                    option, 
                    'Reject it as extraneous',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[4]}
                  className="hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[4] && questionsAnswered[4] && !questionsAnswered[4].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Extraneous Solutions
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-orange-200 mb-2">Why reject?</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <InlineMath math={'x = 2'} /> violates the restriction <InlineMath math={'x \\neq 2'} /></li>
                      <li>• This would make a denominator zero in the original equation</li>
                      <li>• The solution is extraneous (false solution)</li>
                      <li>• You must reject it and report "no solution" or only valid solutions</li>
                    </ul>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Always check restrictions - extraneous solutions must be rejected!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[4] && questionsAnswered[4] && questionsAnswered[4].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand extraneous solutions.
                </p>
              </div>
            )}
          </div>

          {/* Question 5 */}
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border-2 border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            <h4 className="text-cyan-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-cyan-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q5</span>
              On Neptune, what does "Prove it, don't just find it" mean?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Justify steps and verify solutions', 'Solve quickly', 'Use a calculator', 'Skip verification'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[5]?.answer === option ? 
                    (questionsAnswered[5]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    5, 
                    option, 
                    'Justify steps and verify solutions',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[5]}
                  className="hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[5] && questionsAnswered[5] && !questionsAnswered[5].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Assessment Philosophy
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-cyan-200 mb-2">What "Prove it" means:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Justify steps:</strong> Explain why each step is valid</li>
                      <li>• <strong>Verify solutions:</strong> Substitute back into original equation</li>
                      <li>• <strong>Check restrictions:</strong> Ensure solutions don't violate restrictions</li>
                      <li>• <strong>Show complete work:</strong> Don't skip steps</li>
                    </ul>
                    <p className="text-xs text-yellow-300 mt-2">On Neptune, finding the answer isn't enough - you must prove it's correct!</p>
                  </div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                    <p className="text-green-200 text-xs font-semibold">✓ Assessment requires justification and verification!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[5] && questionsAnswered[5] && questionsAnswered[5].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand the assessment philosophy.
                </p>
              </div>
            )}
          </div>

          {/* Question 6 */}
          <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl p-6 border-2 border-teal-400/40 shadow-[0_0_25px_rgba(20,184,166,0.3)]">
            <h4 className="text-teal-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-teal-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q6</span>
              What is the LCD of <InlineMath math={'\\frac{1}{x^2-1}'} />, <InlineMath math={'\\frac{1}{x-1}'} />, and <InlineMath math={'\\frac{1}{x+1}'} />?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['(x-1)(x+1)', 'x^2-1', 'x-1', 'x+1'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[6]?.answer === option ? 
                    (questionsAnswered[6]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    6, 
                    option, 
                    '(x-1)(x+1)',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[6]}
                  className="hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all"
                >
                  {option === '(x-1)(x+1)' ? <InlineMath math={'(x-1)(x+1)'} /> : option === 'x^2-1' ? <InlineMath math={'x^2-1'} /> : option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[6] && questionsAnswered[6] && !questionsAnswered[6].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  LCD Calculation
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-teal-200 mb-2">Factor first:</p>
                    <p className="text-xs">• <InlineMath math={'x^2-1 = (x-1)(x+1)'} /> (difference of squares)</p>
                    <p className="text-xs mt-2">Unique factors: <InlineMath math={'x-1'} /> and <InlineMath math={'x+1'} /></p>
                    <p className="text-xs text-yellow-300 font-semibold mt-2">LCD = <InlineMath math={'(x-1)(x+1)'} /> = <InlineMath math={'x^2-1'} /></p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[6] && questionsAnswered[6] && questionsAnswered[6].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Correct! LCD is <InlineMath math={'(x-1)(x+1)'} />.
                </p>
              </div>
            )}
          </div>

          {/* Question 7 */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border-2 border-emerald-400/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
            <h4 className="text-emerald-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q7</span>
              After clearing denominators, if you get <InlineMath math={'x^2 - 5x + 6 = 0'} />, what should you do?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Factor or use quadratic formula to solve', 'No solution', 'x = 0', 'x = 5'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[7]?.answer === option ? 
                    (questionsAnswered[7]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    7, 
                    option, 
                    'Factor or use quadratic formula to solve',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[7]}
                  className="hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[7] && questionsAnswered[7] && !questionsAnswered[7].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Solving Quadratic Equations
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-emerald-200 mb-2">Factor: <InlineMath math={'x^2 - 5x + 6 = (x-2)(x-3) = 0'} /></p>
                    <p className="text-xs">Solutions: <InlineMath math={'x = 2'} /> or <InlineMath math={'x = 3'} /></p>
                    <p className="text-xs text-yellow-300 mt-2">Always solve the resulting equation completely before checking restrictions!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[7] && questionsAnswered[7] && questionsAnswered[7].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand solving quadratic equations.
                </p>
              </div>
            )}
          </div>

          {/* Question 8 */}
          <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-xl p-6 border-2 border-violet-400/40 shadow-[0_0_25px_rgba(139,92,246,0.3)]">
            <h4 className="text-violet-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-violet-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q8</span>
              For <InlineMath math={'\\frac{x+1}{(x-2)(x+3)} = \\frac{2}{x-2}'} />, what are ALL restrictions?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['x ≠ 2 and x ≠ -3', 'x ≠ 2', 'x ≠ -3', 'No restrictions'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[8]?.answer === option ? 
                    (questionsAnswered[8]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    8, 
                    option, 
                    'x ≠ 2 and x ≠ -3',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[8]}
                  className="hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[8] && questionsAnswered[8] && !questionsAnswered[8].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Identifying All Restrictions
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-violet-200 mb-2">Find restrictions from ALL denominators:</p>
                    <p className="text-xs">• <InlineMath math={'(x-2)(x+3)'} /> → <InlineMath math={'x \\neq 2'} /> and <InlineMath math={'x \\neq -3'} /></p>
                    <p className="text-xs">• <InlineMath math={'x-2'} /> → <InlineMath math={'x \\neq 2'} /> (already included)</p>
                    <p className="text-xs text-yellow-300 mt-2 font-semibold">All restrictions: <InlineMath math={'x \\neq 2'} /> and <InlineMath math={'x \\neq -3'} /></p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[8] && questionsAnswered[8] && questionsAnswered[8].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Correct! You identified all restrictions.
                </p>
              </div>
            )}
          </div>

          {/* Question 9 */}
          <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-xl p-6 border-2 border-rose-400/40 shadow-[0_0_25px_rgba(244,63,94,0.3)]">
            <h4 className="text-rose-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-rose-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q9</span>
              If it takes 3 hours for one pipe to fill a pool and 2 hours for another, working together they fill it in how long? (Set up equation)
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['1/3 + 1/2 = 1/t', '3 + 2 = t', '1/3 + 1/2 = t', '3t + 2t = 1'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[9]?.answer === option ? 
                    (questionsAnswered[9]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    9, 
                    option, 
                    '1/3 + 1/2 = 1/t',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[9]}
                  className="hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all"
                >
                  {option === '1/3 + 1/2 = 1/t' ? <InlineMath math={'\\frac{1}{3} + \\frac{1}{2} = \\frac{1}{t}'} /> : option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[9] && questionsAnswered[9] && !questionsAnswered[9].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Work Rate Problems
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-rose-200 mb-2">Work rate formula:</p>
                    <p className="text-xs">Rate of pipe 1: <InlineMath math={'\\frac{1}{3}'} /> pool/hour</p>
                    <p className="text-xs">Rate of pipe 2: <InlineMath math={'\\frac{1}{2}'} /> pool/hour</p>
                    <p className="text-xs">Combined rate: <InlineMath math={'\\frac{1}{3} + \\frac{1}{2}'} /></p>
                    <p className="text-xs text-yellow-300 mt-2 font-semibold">Equation: <InlineMath math={'\\frac{1}{3} + \\frac{1}{2} = \\frac{1}{t}'} /> where t = time together</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[9] && questionsAnswered[9] && questionsAnswered[9].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand work rate problems.
                </p>
              </div>
            )}
          </div>

          {/* Question 10 */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-6 border-2 border-amber-400/40 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
            <h4 className="text-amber-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q10</span>
              To simplify the complex fraction <InlineMath math={'\\frac{\\frac{1}{x} + \\frac{1}{y}}{\\frac{1}{x} - \\frac{1}{y}}'} />, what should you do first?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Multiply numerator and denominator by LCD (xy)', 'Add the fractions', 'Subtract the fractions', 'Factor'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[10]?.answer === option ? 
                    (questionsAnswered[10]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    10, 
                    option, 
                    'Multiply numerator and denominator by LCD (xy)',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[10]}
                  className="hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[10] && questionsAnswered[10] && !questionsAnswered[10].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Complex Fractions
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-amber-200 mb-2">Simplify complex fractions:</p>
                    <p className="text-xs">LCD of all fractions in numerator and denominator: <InlineMath math={'xy'} /></p>
                    <p className="text-xs">Multiply top and bottom by LCD:</p>
                    <p className="text-xs"><InlineMath math={'\\frac{xy(\\frac{1}{x} + \\frac{1}{y})}{xy(\\frac{1}{x} - \\frac{1}{y})} = \\frac{y + x}{y - x}'} /></p>
                    <p className="text-xs text-yellow-300 mt-2">Always multiply by LCD to clear nested fractions!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[10] && questionsAnswered[10] && questionsAnswered[10].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Correct! Multiply by LCD to simplify complex fractions.
                </p>
              </div>
            )}
          </div>

          {/* Question 11 */}
          <div className="bg-gradient-to-br from-sky-500/20 to-blue-500/20 rounded-xl p-6 border-2 border-sky-400/40 shadow-[0_0_25px_rgba(14,165,233,0.3)]">
            <h4 className="text-sky-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-sky-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q11</span>
              When solving <InlineMath math={'\\frac{kx+1}{x-2} = \\frac{2x+3}{x+1}'} /> for x in terms of k, what must you check?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Solutions must not violate restrictions (x≠2, x≠-1)', 'k must be positive', 'x must be positive', 'No checks needed'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[11]?.answer === option ? 
                    (questionsAnswered[11]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    11, 
                    option, 
                    'Solutions must not violate restrictions (x≠2, x≠-1)',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[11]}
                  className="hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[11] && questionsAnswered[11] && !questionsAnswered[11].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Parameterized Equations
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-sky-200 mb-2">Restrictions still apply:</p>
                    <p className="text-xs">Even with parameters, restrictions from denominators must be checked:</p>
                    <p className="text-xs">• <InlineMath math={'x \\neq 2'} /> (from <InlineMath math={'x-2'} />)</p>
                    <p className="text-xs">• <InlineMath math={'x \\neq -1'} /> (from <InlineMath math={'x+1'} />)</p>
                    <p className="text-xs text-yellow-300 mt-2">Your solution in terms of k must satisfy these restrictions!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[11] && questionsAnswered[11] && questionsAnswered[11].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! Restrictions apply even with parameters.
                </p>
              </div>
            )}
          </div>

          {/* Question 12 */}
          <div className="bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 rounded-xl p-6 border-2 border-fuchsia-400/40 shadow-[0_0_25px_rgba(217,70,239,0.3)]">
            <h4 className="text-fuchsia-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-fuchsia-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q12</span>
              If <InlineMath math={'\\frac{1}{x} + \\frac{1}{y} = 5'} /> and <InlineMath math={'xy = 2'} />, what substitution helps solve this system?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Let u = 1/x and v = 1/y, then use u+v=5', 'Multiply both equations', 'Add both equations', 'No substitution needed'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[12]?.answer === option ? 
                    (questionsAnswered[12]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    12, 
                    option, 
                    'Let u = 1/x and v = 1/y, then use u+v=5',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[12]}
                  className="hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[12] && questionsAnswered[12] && !questionsAnswered[12].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Puzzle className="w-5 h-5" />
                  Creative Substitution
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-fuchsia-200 mb-2">Substitution method:</p>
                    <p className="text-xs">Let <InlineMath math={'u = \\frac{1}{x}'} /> and <InlineMath math={'v = \\frac{1}{y}'} /></p>
                    <p className="text-xs">Then: <InlineMath math={'u + v = 5'} /> and <InlineMath math={'\\frac{1}{uv} = 2'} /> (since <InlineMath math={'xy = 2'} />)</p>
                    <p className="text-xs text-yellow-300 mt-2">Creative substitution transforms complex systems into simpler ones!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[12] && questionsAnswered[12] && questionsAnswered[12].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Excellent! You understand creative substitution.
                </p>
              </div>
            )}
          </div>

          {/* Question 13 */}
          <div className="bg-gradient-to-br from-lime-500/20 to-green-500/20 rounded-xl p-6 border-2 border-lime-400/40 shadow-[0_0_25px_rgba(132,204,22,0.3)]">
            <h4 className="text-lime-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-lime-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q13</span>
              If solving gives you <InlineMath math={'x = 2'} /> and <InlineMath math={'x = -3'} />, but restrictions are <InlineMath math={'x \\neq 2, -1'} />, what is the final answer?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['x = -3 only (reject x = 2)', 'x = 2 and x = -3', 'No solution', 'x = 2 only'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[13]?.answer === option ? 
                    (questionsAnswered[13]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    13, 
                    option, 
                    'x = -3 only (reject x = 2)',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[13]}
                  className="hover:shadow-[0_0_20px_rgba(132,204,22,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[13] && questionsAnswered[13] && !questionsAnswered[13].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Multiple Solution Verification
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-lime-200 mb-2">Check each solution:</p>
                    <p className="text-xs">• <InlineMath math={'x = 2'} /> violates <InlineMath math={'x \\neq 2'} /> → ❌ Reject</p>
                    <p className="text-xs">• <InlineMath math={'x = -3'} /> satisfies <InlineMath math={'x \\neq 2, -1'} /> → ✅ Accept</p>
                    <p className="text-xs text-yellow-300 mt-2 font-semibold">Final answer: <InlineMath math={'x = -3'} /> only</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[13] && questionsAnswered[13] && questionsAnswered[13].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You verify each solution separately.
                </p>
              </div>
            )}
          </div>

          {/* Question 14 */}
          <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-xl p-6 border-2 border-indigo-400/40 shadow-[0_0_25px_rgba(99,102,241,0.3)]">
            <h4 className="text-indigo-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-indigo-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q14</span>
              What does complete justification require for each step?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Explain why the step is valid mathematically', 'Show the answer', 'Skip steps', 'Use a calculator'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[14]?.answer === option ? 
                    (questionsAnswered[14]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    14, 
                    option, 
                    'Explain why the step is valid mathematically',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[14]}
                  className="hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[14] && questionsAnswered[14] && !questionsAnswered[14].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Complete Justification
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-indigo-200 mb-2">Justification means:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Explain why you can perform each operation</li>
                      <li>• State the mathematical property you're using</li>
                      <li>• Show your reasoning clearly</li>
                      <li>• Don't skip steps - show complete work</li>
                    </ul>
                    <p className="text-xs text-yellow-300 mt-2">Example: "Multiply both sides by LCD because it preserves equality."</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[14] && questionsAnswered[14] && questionsAnswered[14].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand complete justification.
                </p>
              </div>
            )}
          </div>

          {/* Question 15 */}
          <div className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-xl p-6 border-2 border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            <h4 className="text-cyan-200 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="bg-cyan-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">Q15</span>
              The Neptune Final Assessment tests your ability to:
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Solve, justify, and verify complete problems', 'Just find answers quickly', 'Use shortcuts only', 'Skip verification'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[15]?.answer === option ? 
                    (questionsAnswered[15]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    15, 
                    option, 
                    'Solve, justify, and verify complete problems',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[15]}
                  className="hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[15] && questionsAnswered[15] && !questionsAnswered[15].correct && (
              <div className="bg-red-500/20 rounded-lg p-5 border-2 border-red-400/40">
                <h5 className="text-red-200 font-bold mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Final Assessment Philosophy
                </h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-black/40 rounded-lg p-4 border border-red-400/30">
                    <p className="font-semibold text-cyan-200 mb-2">Neptune tests COMPLETE mastery:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Solve:</strong> Work through the entire problem</li>
                      <li>• <strong>Justify:</strong> Explain why each step is valid</li>
                      <li>• <strong>Verify:</strong> Prove your solution is correct</li>
                    </ul>
                    <p className="text-xs text-yellow-300 mt-2">"Prove it, don't just find it!" - This is the Neptune way!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[15] && questionsAnswered[15] && questionsAnswered[15].correct && (
              <div className="bg-green-500/20 rounded-lg p-5 border-2 border-green-400/40">
                <p className="text-green-200 font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Perfect! You understand the Neptune Final Assessment!
                </p>
              </div>
            )}
          </div>

          {/* Quiz Results */}
          {quizCompleted && (
            <div className="bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-xl p-6 border border-indigo-300/30">
              <h4 className="text-indigo-200 font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Final Assessment Results
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
              {getPerformanceSummary().percentage >= 80 ? (
                <div className="bg-green-500/20 rounded-lg p-4 mt-4 border border-green-300/30 text-center">
                  <p className="text-green-200 font-semibold text-lg">🎊 Congratulations! You've passed the Final Assessment!</p>
                  <p className="text-green-300 text-sm mt-2">You've completed the entire Solar System journey with mastery!</p>
                </div>
              ) : getPerformanceSummary().percentage >= 60 ? (
                <div className="bg-yellow-500/20 rounded-lg p-4 mt-4 border border-yellow-300/30 text-center">
                  <p className="text-yellow-200 font-semibold">📚 Good progress! Consider reviewing the examples above to strengthen your skills.</p>
                </div>
              ) : (
                <div className="bg-orange-500/20 rounded-lg p-4 mt-4 border border-orange-300/30 text-center">
                  <p className="text-orange-200 font-semibold">📚 Review the examples and strategies above before retaking the assessment.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Animated Neptune background - fixed to prevent stretching */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${neptuneBg})`,
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <motion.div
        className="fixed inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <div className="fixed inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 180px rgba(0,0,0,0.55)' }} />

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
                  <motion.h1 
                    className="font-orbitron font-bold text-xl bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      textShadow: '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
                      filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))'
                    }}
                  >
                    Neptune — Final Assessments
                  </motion.h1>
                  <p className="text-xs text-white/60">Final Assessment Level</p>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AlertDialogTitle 
                className="text-2xl font-orbitron text-cosmic-purple"
                style={{
                  textShadow: '0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(139, 92, 246, 0.4)',
                  filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.7))'
                }}
              >
                🎉 Final Assessment Complete!
              </AlertDialogTitle>
            </motion.div>
            <AlertDialogDescription className="text-cosmic-text text-center">
              Congratulations! You've passed the <strong>Final Assessment</strong> and completed the entire Solar System journey! 
              <br />
              <strong className="text-cosmic-green">You've mastered rational equations from start to finish!</strong>
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



