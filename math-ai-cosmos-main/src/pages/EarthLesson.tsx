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
  const [skills, setSkills] = useState<Record<string, { correct: number; total: number }>>({
    lcdFinding: { correct: 0, total: 0 },
    solvingProcess: { correct: 0, total: 0 },
    restrictions: { correct: 0, total: 0 },
    extraneousSolutions: { correct: 0, total: 0 },
    factoring: { correct: 0, total: 0 },
    algebra: { correct: 0, total: 0 },
  });

  useEffect(() => { startRef.current = Date.now(); }, []);

  // Save progress whenever currentSection changes - but debounced to avoid excessive saves
  useEffect(() => {
    if (user?.id) {
      const timeoutId = setTimeout(() => {
        const progressPercentage = ((current + 1) / steps.length) * 100;
        saveProgress(user.id, {
          module_id: 'earth',
          section_id: 'section_0',
          slide_index: current,
          progress_pct: progressPercentage,
        });
      }, 1000); // Debounce progress saves by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [current, user?.id]);

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
      } as any);
      toast({ title: 'Saved', description: 'Your Earth lesson results were saved.' });
    } catch (e) {
      toast({ title: 'Save failed', description: 'Could not save progress. Will retry later.', variant: 'destructive' });
    }
  };

  const handleFinishLesson = async () => {
    try {
      // Use the optimized lesson completion function
      const success = await completeLesson(user.id, {
        lessonId: 'earth-lesson',
        lessonName: 'Earth — Clearing Denominators',
        score: getPerformanceSummary().percentage,
        timeSpent: Math.max(1, Math.round((Date.now() - startRef.current) / 60000)),
        equationsSolved,
        mistakes,
        skillBreakdown: skills,
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
          <p className="text-card-foreground">
            Clearing denominators means <strong>removing all fractions</strong> in a rational equation by multiplying
            every term by the <strong>Least Common Denominator (LCD)</strong>. This makes the equation easier to solve
            because you work with whole numbers or polynomials instead of fractions.
          </p>
          <div className="bg-card/40 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">Goal: Turn a rational equation into a standard algebraic equation.</p>
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
          <ol className="list-decimal list-inside space-y-2 text-card-foreground">
            <li><strong>Identify</strong> all denominators.</li>
            <li><strong>Find</strong> the LCD of all denominators.</li>
            <li><strong>Multiply</strong> every term by the LCD (both sides).</li>
            <li><strong>Simplify</strong> using cancellation.</li>
            <li><strong>Solve</strong> the resulting equation.</li>
            <li><strong>Check restrictions</strong> (values that make any denominator zero).</li>
          </ol>
          <div className="bg-accent/20 rounded-xl p-3 border border-white/10">
            <p className="text-sm">Tip: Write cancellations explicitly to avoid mistakes.</p>
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
          <div className="bg-card/40 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
            <div className="text-center">
              <BlockMath math={'\\frac{1}{x} + \\frac{1}{2} = \\frac{3}{4}'} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
              <p className="text-sm font-semibold mb-1">1) Denominators</p>
              <BlockMath math={'x, \\; 2, \\; 4'} />
            </div>
            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
              <p className="text-sm font-semibold mb-1">2) LCD</p>
              <BlockMath math={'4x'} />
            </div>
          </div>
          <div className="bg-card/40 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
            <p className="text-sm font-semibold mb-2">3) Multiply through by LCD</p>
            <div className="text-center">
              <BlockMath math={'4x \\cdot \\frac{1}{x} + 4x \\cdot \\frac{1}{2} = 4x \\cdot \\frac{3}{4}'} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
              <p className="text-sm font-semibold mb-1">4) Simplify</p>
              <BlockMath math={'4 + 2x = 3x'} />
            </div>
            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
              <p className="text-sm font-semibold mb-1">5) Solve</p>
              <BlockMath math={'4 = x'} />
            </div>
          </div>
          <div className="bg-green-500/15 rounded-xl p-3 border border-green-300/20">
            <p className="text-sm"><strong>6) Restriction:</strong> <InlineMath math={'x \\neq 0'} />. Final answer <InlineMath math={'x=4'} /> is valid.</p>
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
          <div className="bg-card/40 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
            <div className="text-center">
              <BlockMath math={'\\frac{1}{x} + \\frac{1}{3} = \\frac{1}{6}'} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
              <p className="text-sm font-semibold mb-1">1) Denominators</p>
              <BlockMath math={'x, \\; 3, \\; 6'} />
            </div>
            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
              <p className="text-sm font-semibold mb-1">2) LCD</p>
              <BlockMath math={'6x'} />
            </div>
          </div>
          <div className="bg-card/40 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
            <p className="text-sm font-semibold mb-2">3) Multiply through by LCD</p>
            <div className="text-center">
              <BlockMath math={'6x \\cdot \\frac{1}{x} + 6x \\cdot \\frac{1}{3} = 6x \\cdot \\frac{1}{6}'} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
              <p className="text-sm font-semibold mb-1">4) Simplify</p>
              <BlockMath math={'6 + 2x = x'} />
            </div>
            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
              <p className="text-sm font-semibold mb-1">5) Solve</p>
              <BlockMath math={'6 = -x \\;\\Rightarrow\\; x = -6'} />
            </div>
          </div>
          <div className="bg-green-500/15 rounded-xl p-3 border border-green-300/20">
            <p className="text-sm"><strong>6) Restriction:</strong> <InlineMath math={'x \\neq 0'} />. Final answer <InlineMath math={'x=-6'} /> is valid.</p>
          </div>
        </div>
      )
    },
    {
      id: 5,
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
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 1: Identify the denominators</p>
                    <p>• First fraction: x</p>
                    <p>• Second fraction: 2</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 2: Find all unique factors</p>
                    <p>• From x: factor is x</p>
                    <p>• From 2: factor is 2</p>
                    <p>• Unique factors: 2, x</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 3: Multiply all unique factors</p>
                    <p>• LCD = 2 × x = 2x</p>
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
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 1: Find the LCD</p>
                    <p>• Denominators: x, 2, 4</p>
                    <p>• LCD = 4x</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 2: Multiply by LCD</p>
                    <p>• 4x × (1/x + 1/2) = 4x × (1/4)</p>
                    <p>• 4 + 2x = x</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 3: Solve for x</p>
                    <p>• 4 + 2x = x</p>
                    <p>• 4 = -x</p>
                    <p>• x = -4</p>
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
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">WHY do we check restrictions?</p>
                    <p>• Division by zero is undefined</p>
                    <p>• If x = 0, then 1/x becomes 1/0 (undefined)</p>
                    <p>• This would make the equation invalid</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">HOW to find restrictions:</p>
                    <p>• Look at all denominators in the equation</p>
                    <p>• Set each denominator equal to zero</p>
                    <p>• Solve for the variable</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">In this equation:</p>
                    <p>• Denominator: x</p>
                    <p>• Set x = 0</p>
                    <p>• Restriction: x ≠ 0</p>
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
      {/* Animated Earth background drift */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${earthBackgrounds[currentSection % earthBackgrounds.length]})` }}
        initial={{ scale: 1.02, x: 0, y: 0 }}
        animate={{ scale: 1.05, x: 6, y: 4 }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Vignette/gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60" />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 180px rgba(0,0,0,0.55)' }} />

      <motion.header className="p-6 border-b border-white/10 backdrop-blur-sm relative z-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
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

      <div className="container mx-auto px-6 py-6 relative z-10">
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.01 }}
            className="bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-white/10 shadow-[0_0_18px_rgba(255,255,255,0.15)]">{steps[currentSection].icon ?? <Target className="w-5 h-5" />}</div>
                <h2 className="font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {steps[currentSection].title}
                </h2>
              </div>
              {steps[currentSection].content}
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
      </div>

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


