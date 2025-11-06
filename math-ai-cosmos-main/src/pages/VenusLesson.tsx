import React, { useState } from 'react';
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
import { useRef, useEffect } from 'react';
const venusBg = new URL('../../planet background/SATURN.jpeg', import.meta.url).href;

const VenusLesson: React.FC = () => {
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
  const startRef = useRef<number>(Date.now());

  useEffect(() => { startRef.current = Date.now(); }, []);

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
      areas.push("Finding LCD with mixed algebraic and numeric denominators");
    }
    if (questionsAnswered[2] && !questionsAnswered[2].correct) {
      areas.push("Factoring quadratic expressions in denominators");
    }
    if (questionsAnswered[3] && !questionsAnswered[3].correct) {
      areas.push("Working with fractions that have powers in denominators");
    }
    
    return areas;
  };

  const sections = [
    {
      id: 1,
      title: '🚀 Introduction: Why LCD is Important?',
      icon: <Target className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent mb-4">🌌 Finding the LCD in Rational Equations</h3>
            
            <div className="space-y-4">
              <p className="text-white/90 text-lg">
                When solving <strong>rational equations</strong> (equations with fractions), we often see fractions with <strong>different denominators</strong>.
              </p>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-300/30">
                <p className="text-white font-medium">
                  👉 To simplify, we need to make the denominators the same — that's where the <strong>LCD (Least Common Denominator)</strong> comes in.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-pink-200 font-semibold mb-2">The LCD is the <em>smallest expression</em> that all denominators can divide into evenly.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-green-500/20 rounded-xl p-4 border border-green-300/30 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-white">Removes fractions, making equations easier</p>
                </div>
                <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-300/30 text-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-sm text-white">Prevents mistakes when solving</p>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-300/30 text-center">
                  <Brain className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-white">Helps identify restrictions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '🪐 Step 1: How to Find the LCD',
      icon: <Brain className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent mb-4">The LCD Process</h3>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-4 border border-pink-300/30 text-center">
                  <div className="text-2xl mb-2">1️⃣</div>
                  <p className="text-white font-medium">Factor each denominator</p>
                  <p className="text-xs text-white/70 mt-1">(if possible)</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-300/30 text-center">
                  <div className="text-2xl mb-2">2️⃣</div>
                  <p className="text-white font-medium">List each factor</p>
                  <p className="text-xs text-white/70 mt-1">that appears</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl p-4 border border-green-300/30 text-center">
                  <div className="text-2xl mb-2">3️⃣</div>
                  <p className="text-white font-medium">Multiply highest powers</p>
                  <p className="text-xs text-white/70 mt-1">of each unique factor</p>
                </div>
              </div>

              <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-300/30">
                <p className="text-yellow-200 font-semibold text-center">
                  🎯 That's your <strong>LCD</strong>!
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '🌍 Example 1: Simple Numbers',
      icon: <Calculator className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm">
            <h3 className="font-orbitron text-lg bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent mb-4">Let's solve step by step:</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-300/30">
                <div className="text-center">
                  <BlockMath math="\frac{1}{x} + \frac{1}{2} = \frac{1}{4}" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-pink-200 font-semibold mb-2">Step 1: Denominators</p>
                  <BlockMath math="x, \; 2, \; 4" />
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-pink-200 font-semibold mb-2">Step 2: LCD</p>
                  <BlockMath math="4x" />
                </div>
              </div>

              <div className="bg-green-500/20 rounded-xl p-4 border border-green-300/30">
                <p className="text-green-200 font-semibold mb-2">Step 3: Multiply everything by 4x</p>
                <div className="text-center">
                  <BlockMath math="4 + 2x = x" />
                </div>
              </div>

              <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-300/30">
                <p className="text-purple-200 font-semibold mb-2">Step 4: Solve</p>
                <div className="text-center space-y-2">
                  <BlockMath math="4 = -x" />
                  <BlockMath math="x = -4" />
                </div>
                <p className="text-white/90 mt-2">
                  <strong>Restriction:</strong> x ≠ 0. ✅ Answer is valid.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: '🪐 Example 2: Algebraic Denominators',
      icon: <Lightbulb className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm">
            <h3 className="font-orbitron text-lg bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent mb-4">More complex example:</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-300/30">
                <div className="text-center">
                  <BlockMath math="\frac{2}{x} + \frac{3}{x+1} = \frac{5}{x(x+1)}" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-pink-200 font-semibold mb-2">Step 1: Denominators</p>
                  <div className="text-center">
                    <BlockMath math="x, \; x+1, \; x(x+1)" />
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-pink-200 font-semibold mb-2">Step 2: LCD</p>
                  <div className="text-center">
                    <BlockMath math="x(x+1)" />
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-pink-200 font-semibold mb-2">Restrictions</p>
                  <div className="text-center">
                    <BlockMath math="x \neq 0, \; -1" />
                  </div>
                </div>
              </div>

              <div className="bg-green-500/20 rounded-xl p-4 border border-green-300/30">
                <p className="text-green-200 font-semibold mb-2">Step 3: Multiply by x(x+1)</p>
                <div className="text-center space-y-2">
                  <BlockMath math="2(x+1) + 3x = 5" />
                  <BlockMath math="2x + 2 + 3x = 5" />
                  <BlockMath math="5x + 2 = 5" />
                  <BlockMath math="5x = 3 \implies x = \frac{3}{5}" />
                </div>
                <p className="text-white/90 mt-2 text-center">
                  <strong>Check:</strong> x ≠ 0, -1. ✅ Valid solution!
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: '🌌 Interactive Quiz',
      icon: <CheckCircle className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm">
            <h3 className="font-orbitron text-lg bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent mb-4">Test Your Understanding!</h3>
            
            <div className="space-y-8">
              {/* Question 1 */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-300/30">
                <h4 className="text-yellow-200 font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">Q1</span>
                  What is the LCD of the following fractions?
                </h4>
                <div className="text-center mb-4">
                  <BlockMath math="\frac{1}{x} \text{ and } \frac{2}{3x}" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {['x', '3x', '3x²', '6x'].map((option) => (
                    <Button
                      key={option}
                      variant={questionsAnswered[1]?.answer === option ? 
                        (questionsAnswered[1]?.correct ? "default" : "destructive") : "outline"}
                      size="sm"
                      onClick={() => handleQuizAnswer(
                        1, 
                        option, 
                        '3x',
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
                        <p>• Second fraction: 3x</p>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-200 mb-1">STEP 2: Find all unique factors</p>
                        <p>• From x: factor is x</p>
                        <p>• From 3x: factors are 3 and x</p>
                        <p>• Unique factors: 3, x</p>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-200 mb-1">STEP 3: Multiply all unique factors</p>
                        <p>• LCD = 3 × x = 3x</p>
                      </div>
                      <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                        <p className="text-green-200 text-xs">✓ Check: 3x ÷ x = 3 ✓ and 3x ÷ 3x = 1 ✓</p>
                      </div>
                    </div>
                  </div>
                )}
                {showQuestionFeedback[1] && questionsAnswered[1] && questionsAnswered[1].correct && (
                  <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30">
                    <p className="text-green-200 font-semibold">✅ Excellent! You correctly identified that 3x is the LCD.</p>
                  </div>
                )}
              </div>

              {/* Question 2 */}
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-300/30">
                <h4 className="text-blue-200 font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm font-bold">Q2</span>
                  Factor x² + 5x + 6, then find the LCD:
                </h4>
                <div className="text-center mb-4">
                  <BlockMath math="\frac{1}{x^2+5x+6} \text{ and } \frac{2}{x+2}" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {['(x+2)(x+3)', 'x+2', '(x+2)²', 'x²+5x+6'].map((option) => (
                    <Button
                      key={option}
                      variant={questionsAnswered[2]?.answer === option ? 
                        (questionsAnswered[2]?.correct ? "default" : "destructive") : "outline"}
                      size="sm"
                      onClick={() => handleQuizAnswer(
                        2, 
                        option, 
                        '(x+2)(x+3)',
                        "Step-by-step explanation shown below"
                      )}
                      disabled={!!questionsAnswered[2]}
                      className="hover:shadow-[0_0_20px_rgba(236,72,153,0.35)] text-xs"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
                {showQuestionFeedback[2] && questionsAnswered[2] && !questionsAnswered[2].correct && (
                  <div className="bg-red-500/20 rounded-lg p-4 border border-red-300/30">
                    <h5 className="text-red-200 font-semibold mb-3">💡 How to Find LCD with Factoring:</h5>
                    <div className="text-white/90 text-sm space-y-3">
                      <div className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-200 mb-1">STEP 1: Factor the complex denominator</p>
                        <p>• x² + 5x + 6 = ?</p>
                        <p>• Find two numbers that multiply to 6 and add to 5</p>
                        <p>• Those numbers are 2 and 3</p>
                        <p>• So x² + 5x + 6 = (x+2)(x+3)</p>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-200 mb-1">STEP 2: Identify all denominators</p>
                        <p>• First fraction: (x+2)(x+3)</p>
                        <p>• Second fraction: (x+2)</p>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-200 mb-1">STEP 3: Find unique factors</p>
                        <p>• From (x+2)(x+3): factors are (x+2) and (x+3)</p>
                        <p>• From (x+2): factor is (x+2)</p>
                        <p>• Unique factors: (x+2) and (x+3)</p>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-200 mb-1">STEP 4: Multiply unique factors</p>
                        <p>• LCD = (x+2)(x+3)</p>
                      </div>
                      <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                        <p className="text-green-200 text-xs">✓ Both denominators divide evenly into (x+2)(x+3)</p>
                      </div>
                    </div>
                  </div>
                )}
                {showQuestionFeedback[2] && questionsAnswered[2] && questionsAnswered[2].correct && (
                  <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30">
                    <p className="text-green-200 font-semibold">✅ Perfect! You factored correctly and found the LCD.</p>
                  </div>
                )}
              </div>

              {/* Question 3 */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-300/30">
                <h4 className="text-purple-200 font-semibold mb-3 flex items-center gap-2">
                  <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-sm font-bold">Q3</span>
                  What's the LCD when you have powers?
                </h4>
                <div className="text-center mb-4">
                  <BlockMath math="\frac{3}{(x-1)^2} \text{ and } \frac{5}{x-1}" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {['x-1', '(x-1)²', '(x-1)³', '2(x-1)'].map((option) => (
                    <Button
                      key={option}
                      variant={questionsAnswered[3]?.answer === option ? 
                        (questionsAnswered[3]?.correct ? "default" : "destructive") : "outline"}
                      size="sm"
                      onClick={() => handleQuizAnswer(
                        3, 
                        option, 
                        '(x-1)²',
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
                    <h5 className="text-red-200 font-semibold mb-3">💡 How to Find LCD with Powers:</h5>
                    <div className="text-white/90 text-sm space-y-3">
                      <div className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-200 mb-1">STEP 1: Identify the denominators</p>
                        <p>• First fraction: (x-1)²</p>
                        <p>• Second fraction: (x-1)</p>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-200 mb-1">STEP 2: Find the unique factors</p>
                        <p>• Both denominators have the same factor: (x-1)</p>
                        <p>• But they have different powers: ² and ¹</p>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-200 mb-1">STEP 3: Use the highest power rule</p>
                        <p>• When the same factor appears with different powers, take the HIGHEST power</p>
                        <p>• (x-1) appears as power 1 and power 2</p>
                        <p>• Highest power = 2</p>
                      </div>
                      <div className="bg-white/10 rounded p-3">
                        <p className="font-semibold text-yellow-200 mb-1">STEP 4: Build the LCD</p>
                        <p>• LCD = (x-1)²</p>
                      </div>
                      <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                        <p className="text-green-200 text-xs">✓ Check: (x-1)² ÷ (x-1)² = 1 ✓ and (x-1)² ÷ (x-1) = (x-1) ✓</p>
                      </div>
                    </div>
                  </div>
                )}
                {showQuestionFeedback[3] && questionsAnswered[3] && questionsAnswered[3].correct && (
                  <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30">
                    <p className="text-green-200 font-semibold">✅ Great! You understand how powers work in LCDs.</p>
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
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: '🌠 Wrap-Up',
      icon: <Trophy className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm">
            <h3 className="font-orbitron text-xl bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent mb-4">Key Takeaways</h3>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl p-4 border border-green-300/30">
                  <CheckCircle className="w-6 h-6 text-green-400 mb-2" />
                  <p className="text-white font-semibold mb-1">LCD Definition</p>
                  <p className="text-white/80 text-sm">Smallest common multiple of denominators (including algebraic ones)</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-300/30">
                  <Calculator className="w-6 h-6 text-blue-400 mb-2" />
                  <p className="text-white font-semibold mb-1">Solution Process</p>
                  <p className="text-white/80 text-sm">Multiply through by LCD to remove fractions</p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-300/30">
                  <AlertTriangle className="w-6 h-6 text-yellow-400 mb-2" />
                  <p className="text-white font-semibold mb-1">Always Check</p>
                  <p className="text-white/80 text-sm">Identify restrictions (values that make denominator zero)</p>
                </div>
                
                <div className="bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-xl p-4 border border-pink-300/30">
                  <Brain className="w-6 h-6 text-pink-400 mb-2" />
                  <p className="text-white font-semibold mb-1">Benefits</p>
                  <p className="text-white/80 text-sm">Makes solving rational equations simpler and safer</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl p-6 border border-purple-300/40 text-center">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <h4 className="text-xl font-orbitron text-white mb-2">Congratulations!</h4>
                <p className="text-white/90">You've mastered finding the LCD in rational equations!</p>
                <p className="text-purple-200 font-medium mt-2">Ready to continue your cosmic journey? 🚀</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handlePrevSection = async () => {
    if (currentSection > 0) {
      const newSection = currentSection - 1;
      setCurrentSection(newSection);
      const newProgress = ((newSection + 1) / sections.length) * 100;
      setProgress(newProgress);
      
      // Save progress to new tracking system - debounced
      if (user?.id) {
        setTimeout(async () => {
          try {
            await saveProgress(user.id, {
              module_id: 'venus',
              section_id: `section_${newSection}`,
              slide_index: newSection,
              progress_pct: newProgress,
            });
          } catch (error) {
            console.error('Failed to save progress:', error);
          }
        }, 1000); // Debounce by 1 second
      }
    }
  };

  const handleNextSection = async () => {
    if (currentSection < sections.length - 1) {
      const newSection = currentSection + 1;
      setCurrentSection(newSection);
      const newProgress = ((newSection + 1) / sections.length) * 100;
      setProgress(newProgress);
      
      // Save progress to new tracking system - debounced
      if (user?.id) {
        setTimeout(async () => {
          try {
            await saveProgress(user.id, {
              module_id: 'venus',
              section_id: `section_${newSection}`,
              slide_index: newSection,
              progress_pct: newProgress,
            });
          } catch (error) {
            console.error('Failed to save progress:', error);
          }
        }, 1000); // Debounce by 1 second
      }
    }
  };

  const handleFinishLesson = async () => {
    try {
      // Get performance summary with safety checks
      const performance = getPerformanceSummary();
      const score = performance.total > 0 ? performance.percentage : 100; // Default to 100% if no questions
      
      // Use the optimized lesson completion function
      const success = await completeLesson(user.id, {
        lessonId: 'venus-lesson',
        lessonName: 'Venus: Finding LCDs',
        score: score,
        timeSpent: Math.max(1, Math.round((Date.now() - startRef.current) / 60000)),
        equationsSolved,
        mistakes,
        skillBreakdown: {},
        xpEarned: 150,
        planetName: 'Venus',
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

  const handleContinueToNext = () => {
    navigate('/earth-lesson');
  };

  const handleBackToSolarSystem = () => {
    navigate('/rpg');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated cosmic background */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${venusBg})` }}
        initial={{ scale: 1.02, x: 0, y: 0 }}
        animate={{ scale: 1.05, x: 5, y: 3 }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/65" />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 180px rgba(0,0,0,0.55)' }} />

      <motion.header 
        className="p-6 border-b border-white/10 backdrop-blur-sm relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Calculator className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-orbitron font-bold text-xl bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
                Venus — Finding LCDs
              </h1>
              <p className="text-xs text-white/80">Lesson 2</p>
            </div>
          </div>
          <Badge variant="secondary">{currentSection + 1} / {sections.length}</Badge>
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
            key={sections[currentSection].id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.01 }}
            className="bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm shadow-[0_10px_50px_rgba(0,0,0,0.25)]"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-white/10 shadow-[0_0_18px_rgba(255,255,255,0.15)]">{sections[currentSection].icon ?? <Target className="w-5 h-5" />}</div>
                <h2 className="font-semibold bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
                  {sections[currentSection].title}
                </h2>
              </div>
              {sections[currentSection].content}
            </div>
          </motion.div>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={handlePrevSection} disabled={currentSection === 0} className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft size={16} /> Previous
            </Button>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBackToSolarSystem}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <Home size={16} className="mr-2" />
                Solar System
              </Button>
              <Badge variant="outline" className="text-white border-white/20">
                Section {currentSection + 1} of {sections.length}
              </Badge>
              {/* Debug info */}
              <span className="text-xs text-white/50">
                Debug: {currentSection} / {sections.length - 1}
              </span>
            </div>


            
            {currentSection === sections.length - 1 ? (
              <Button
                onClick={handleFinishLesson}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Trophy size={16} className="mr-2" />
                Finish Lesson
              </Button>
            ) : (
              <Button onClick={handleNextSection} className="flex items-center gap-2 hover:shadow-[0_0_30px_rgba(236,72,153,0.35)]">
                Next <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Completion Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent className="border-cosmic-purple/20 bg-cosmic-dark/95 backdrop-blur-md">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-2xl font-orbitron text-cosmic-purple">
              🎉 Venus Lesson Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cosmic-text text-center">
              Excellent work! You've mastered rational equation fundamentals. 
              <br />
              <strong className="text-cosmic-green">Earth lesson is now unlocked!</strong>
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
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
            >
              Continue to Earth 🌍
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VenusLesson;


