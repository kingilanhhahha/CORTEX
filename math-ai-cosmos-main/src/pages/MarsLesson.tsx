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
      areas.push("Understanding factoring in rational equations");
    }
    if (questionsAnswered[2] && !questionsAnswered[2].correct) {
      areas.push("Applying factoring to solve equations");
    }
    if (questionsAnswered[3] && !questionsAnswered[3].correct) {
      areas.push("Checking solutions against restrictions");
    }
    
    return areas;
  };

  const slides = [
    {
      id: 1,
      title: 'Why Extraneous Solutions Appear',
      icon: <Target className="w-5 h-5" />,
      body: (
        <div className="space-y-3">
          <p className="text-white/90">When you multiply both sides by an expression that can be <strong>zero</strong>, you may create solutions that weren’t allowed originally.</p>
          <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <InlineMath math={'x \\neq 1 \\text{ for } \\dfrac{x}{x-1}'} />
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Worked Example — Check for Extraneous',
      icon: <AlertTriangle className="w-5 h-5" />,
      body: (
        <div className="space-y-3">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <BlockMath math={'\\frac{x}{x-1} = \\frac{1}{x-1} + 2'} />
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <p className="text-sm text-white/90 mb-2">Multiply by <InlineMath math={'x-1'} /> and simplify:</p>
            <BlockMath math={'x = 1 + 2(x-1)'} />
            <BlockMath math={'x = 2x - 1 \\;\\Rightarrow\\; -x = -1 \\;\\Rightarrow\\; x = 1'} />
            <p className="text-sm text-white/80 mt-2">But <InlineMath math={'x=1'} /> is <strong>forbidden</strong> (denominator zero) → extraneous → <strong>No solution</strong>.</p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Mini Assessment — Spot the Extraneous',
      icon: <Trophy className="w-5 h-5" />,
      body: (
        <div className="space-y-6">
          {/* Question 1 */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-300/30">
            <h4 className="text-yellow-200 font-semibold mb-3 flex items-center gap-2">
              <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">Q1</span>
              What is factoring used for in rational equations?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['To make equations longer', 'To simplify and solve equations', 'To add more variables', 'To make fractions'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[1]?.answer === option ? 
                    (questionsAnswered[1]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    1, 
                    option, 
                    'To simplify and solve equations',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[1]}
                  className="hover:shadow-[0_0_20px_rgba(236,72,153,0.35)]"
                >
                  {option}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[1] && questionsAnswered[1] && !questionsAnswered[1].correct && (
              <div className="bg-red-500/20 rounded-lg p-4 border border-red-300/30">
                <h5 className="text-red-200 font-semibold mb-3">💡 Understanding Factoring in Rational Equations:</h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">WHY do we factor?</p>
                    <p>• Factoring breaks down complex expressions</p>
                    <p>• Makes equations easier to solve</p>
                    <p>• Helps identify restrictions</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">HOW factoring helps:</p>
                    <p>• x² - 4 becomes (x+2)(x-2)</p>
                    <p>• Easier to find LCD</p>
                    <p>• Easier to identify restrictions</p>
                  </div>
                  <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                    <p className="text-green-200 text-xs">✓ Factoring is a key tool for solving rational equations!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[1] && questionsAnswered[1] && questionsAnswered[1].correct && (
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30">
                <p className="text-green-200 font-semibold">✅ Excellent! You understand the purpose of factoring.</p>
              </div>
            )}
          </div>

          {/* Question 2 */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-300/30">
            <h4 className="text-blue-200 font-semibold mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm font-bold">Q2</span>
              Factor x² - 9 and find restrictions
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['(x+3)(x-3), x≠±3', '(x+3)(x-3), x≠3', '(x+3)(x-3), x≠-3', '(x+3)(x-3), no restrictions'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[2]?.answer === option ? 
                    (questionsAnswered[2]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    2, 
                    option, 
                    '(x+3)(x-3), x≠±3',
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
                <h5 className="text-red-200 font-semibold mb-3">💡 Factoring and Finding Restrictions:</h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 1: Factor the expression</p>
                    <p>• x² - 9 is a difference of squares</p>
                    <p>• Formula: a² - b² = (a+b)(a-b)</p>
                    <p>• So x² - 9 = (x+3)(x-3)</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 2: Find restrictions</p>
                    <p>• Set each factor equal to zero</p>
                    <p>• x + 3 = 0 → x = -3</p>
                    <p>• x - 3 = 0 → x = 3</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 3: Write restrictions</p>
                    <p>• x ≠ -3 and x ≠ 3</p>
                    <p>• Shorthand: x ≠ ±3</p>
                  </div>
                  <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                    <p className="text-green-200 text-xs">✓ Always check both factors for restrictions!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[2] && questionsAnswered[2] && questionsAnswered[2].correct && (
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30">
                <p className="text-green-200 font-semibold">✅ Perfect! You factored correctly and found all restrictions.</p>
              </div>
            )}
          </div>

          {/* Question 3 */}
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-300/30">
            <h4 className="text-purple-200 font-semibold mb-3 flex items-center gap-2">
              <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-sm font-bold">Q3</span>
              What happens if you forget to check restrictions?
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Nothing', 'You might get extraneous solutions', 'The equation becomes easier', 'You get bonus points'].map((option) => (
                <Button
                  key={option}
                  variant={questionsAnswered[3]?.answer === option ? 
                    (questionsAnswered[3]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    3, 
                    option, 
                    'You might get extraneous solutions',
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
                <h5 className="text-red-200 font-semibold mb-3">💡 Why Checking Restrictions is Crucial:</h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">WHAT are extraneous solutions?</p>
                    <p>• Solutions that seem correct but aren't valid</p>
                    <p>• They make denominators zero</p>
                    <p>• They violate the original equation's domain</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">EXAMPLE of the problem:</p>
                    <p>• Solve: 1/(x-2) = 2/(x-2)</p>
                    <p>• If you forget x ≠ 2</p>
                    <p>• You might think x = 2 is a solution</p>
                    <p>• But 1/0 = 2/0 is undefined!</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">HOW to avoid this:</p>
                    <p>• Always check restrictions first</p>
                    <p>• Write them down: x ≠ 2</p>
                    <p>• Verify solutions don't violate restrictions</p>
                  </div>
                  <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                    <p className="text-green-200 text-xs">✓ Checking restrictions prevents invalid solutions!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[3] && questionsAnswered[3] && questionsAnswered[3].correct && (
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30">
                <p className="text-green-200 font-semibold">✅ Great! You understand the importance of checking restrictions.</p>
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
    <div className="min-h-screen relative overflow-hidden">
      {/* WebP-first background with PNG fallback */}
      <motion.img
        src={bgSrc}
        onError={() => setBgSrc(marsPng)}
        alt="Mars Background"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.02, x: 0, y: 0 }}
        animate={{ scale: 1.05, x: 5, y: 3 }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 180px rgba(0,0,0,0.55)' }} />

      <motion.header className="p-6 border-b border-white/10 backdrop-blur-sm relative z-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Calculator className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-orbitron font-bold text-xl bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">Mars — Extraneous Solutions</h1>
              <p className="text-xs text-white/80">Lesson 4</p>
            </div>
          </div>
          <Badge variant="secondary">{currentSection + 1} / {slides.length}</Badge>
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

          <motion.div key={slides[currentSection].id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} whileHover={{ scale: 1.01 }} className="bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]">
            <div className="p-6">
              <div className="flex items=center gap-2 mb-3">
                {slides[currentSection].icon ?? <AlertTriangle size={16} className="text-warning" />}
                <h2 className="font-semibold bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">{slides[currentSection].title}</h2>
              </div>
              {slides[currentSection].body}
            </div>
          </motion.div>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={prev} disabled={currentSection === 0} className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft size={16} /> Previous
            </Button>
            
            {currentSection === slides.length - 1 ? (
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
                  className="flex items-center gap-2 hover:shadow-[0_0_30px_rgba(244,63,94,0.35)]"
                >
                  <ArrowRight size={16} /> Continue to Jupiter
                </Button>
              </div>
            ) : (
              // Not last step: show Next button
              <Button onClick={next} className="flex items-center gap-2 hover:shadow-[0_0_30px_rgba(244,63,94,0.35)]">
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


