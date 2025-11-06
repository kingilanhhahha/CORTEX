import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import CharacterBox from '@/components/character/CharacterBox';
import DialogueBox from '@/components/character/DialogueBox';
import XPBar from '@/components/game/XPBar';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Target, 
  Lightbulb, 
  CheckCircle, 
  ArrowRight, 
  Play,
  Trophy,
  Zap,
  Brain,
  Calculator,
  Globe,
  Rocket,
  ArrowLeft,
  Home,
  AlertTriangle,
  X,
  Plus,
  Minus,
  Divide
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import cosmicBackground from '@/assets/cosmic-background.png';

// Beautiful Solution Display Component
const BeautifulSolutionDisplay: React.FC = () => {
  const solutionSteps = [
    {
      title: "Find and Factor All Denominators",
      teacherVoice: "Let's look carefully at all bottom parts (denominators): 1. There is one fraction with x + 2 at the bottom 2. Since x + 2 is already simple, we don't need to factor it further 3. Any constant terms have an invisible denominator of 1",
      instruction: "First, let's examine all the denominators in our equation - these are the bottom parts of our fractions. We have two simple denominators here that can't be factored further. Remember, we must also identify any x-values that would make these denominators zero, as those would make our equation undefined.",
      mathSteps: [
        "x + 2  # Already in simplest form",
        "x = -2 (because 5/0 is undefined)  # Never allowed",
        "• LCD: x + 2  # This is our magic cleaner for all fractions"
      ],
      explanation: "Values that would break the math."
    },
    {
      title: "Multiply Both Sides by LCD",
      teacherVoice: "We'll multiply EVERY term by x + 2 to clean up: 1. For fractions: The bottom cancels with our LCD 2. For whole numbers: We distribute like multiplication 3. Watch how each part transforms!",
      instruction: "To make this easier to work with, we'll multiply every single term by our least common denominator (LCD). This will clear all the fractions. Watch carefully how each fraction simplifies when we do this multiplication - the denominators will cancel out beautifully!",
      mathSteps: [
        "• Left Side Transformation:",
        "x + 2 * ((x - 3)/(x + 2))",
        "= x + 2 * x - 3 / x + 2",
        "= x - 3  # After cancellation",
        "• Right Side Transformations:",
        "First Term:",
        "x + 2 * 2",
        "= 2*x + 4  # Distribute",
        "• New Clean Equation:",
        "x - 3 = 2*x + 4  # All fractions gone!"
      ]
    },
    {
      title: "Solve the Simplified Equation",
      teacherVoice: "Now we solve like a regular linear algebra problem: 1. Combine like terms on both sides 2. Move variable terms to one side, constants to the other 3. Divide by the coefficient of x",
      instruction: "Now that we've eliminated the fractions, we have a cleaner equation to work with. Let's gather all the x terms on one side and the constant numbers on the other. Remember to perform the same operation on both sides to keep the equation balanced. Our goal is to isolate x to find its value.",
      mathSteps: [
        "• Combine like terms:",
        "x - 3 = 2*x + 4  # We combined x + 3x",
        "• Move terms:",
        "7 = -1*x  # Added 6 to both sides",
        "7 = -1*x",
        "• Divide both sides to isolate x:",
        "7/-1 = -1*x/-1",
        "-7 = x",
        "• Final solution:",
        "x = -7  # Exact form",
        "x ≈ -7.0000000  # Decimal form"
      ]
    },
    {
      title: "Verify the Solution",
      teacherVoice: "Let's test x = -7 in the original equation: 1. Calculate left side by substituting the value 2. Calculate right side by substituting the value 3. Both sides should give the same result",
      instruction: "It's crucial to verify our answer by plugging it back into the original equation. This ensures our solution doesn't make any denominators zero and that both sides of the equation balance correctly. Let's calculate both sides carefully to confirm our answer works.",
      mathSteps: [
        "• Check denominator safety:",
        "x + 2 = -5 ≠ 0  # Good!",
        "• Left Side Calculation:",
        "(x - 3)/(x + 2) = 2  # Exact",
        "2.0000000  # Decimal",
        "• Right Side Calculation:",
        "2 = 2  # Exact",
        "2.0000000  # Decimal",
        "✓ Both sides match perfectly!"
      ]
    },
    {
      title: "Final Verification",
      teacherVoice: "Double-checking our work: 1. Exact fractions confirm precision 2. Decimal form helps visualize 3. Every step maintains equality",
      instruction: "Let's double-check our work by substituting the solution into both sides of the original equation. We'll calculate using exact fractions first for precision, then look at the decimal equivalents. Both sides should give us identical results if we've solved it correctly.",
      mathSteps: [
        "Substitute x = -7:",
        "• Left Side:",
        "(x - 3)/(x + 2) = 2  # Exact",
        "2.0000000  # Decimal",
        "• Right Side:",
        "2 = 2  # Exact",
        "2.0000000  # Decimal",
        "→ Perfect match! (✓ Valid)"
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-orbitron font-bold text-3xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            🎓 Step-by-Step Solution Guide
          </h1>
        </div>
        <Badge variant="secondary" className="text-sm">
          Debug - Raw Solution
        </Badge>
      </motion.div>

      {/* Original Equation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-gray-800">
              **Step-by-Step Solution with Teacher-Level Explanations:**
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  **Raw Equation:**
                </h3>
                <div className="flex justify-center mb-2">
                  <BlockMath math="\\frac{x-3}{x+2} = 2" />
                </div>
                <p className="text-sm text-gray-600 italic">
                  *(We're solving for x in this fraction equation)*
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Solution Steps */}
      <div className="space-y-6">
        {solutionSteps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          >
            <Card className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                    {index === 0 && <Target className="w-5 h-5 text-white" />}
                    {index === 1 && <Calculator className="w-5 h-5 text-white" />}
                    {index === 2 && <Brain className="w-5 h-5 text-white" />}
                    {index === 3 && <CheckCircle className="w-5 h-5 text-white" />}
                    {index === 4 && <Trophy className="w-5 h-5 text-white" />}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">
                    **Step {index + 1}: {step.title}**
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Teacher's Voice */}
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4 border-l-4 border-blue-400">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800 mb-2">
                        **TEACHER'S VOICE:**
                      </h4>
                      <p className="text-blue-700 leading-relaxed">
                        "{step.teacherVoice}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instruction */}
                <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 border-l-4 border-green-400">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500 rounded-full">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800 mb-2">
                        INSTRUCTION:
                      </h4>
                      <p className="text-green-700 leading-relaxed">
                        {step.instruction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Math Steps */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="space-y-3">
                    {step.mathSteps.map((mathStep, mathIndex) => (
                      <div key={mathIndex} className="flex items-center gap-3">
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-gray-700 font-mono text-sm">
                            {mathStep}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                {step.explanation && (
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 border-l-4 border-yellow-400">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-500 rounded-full">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-yellow-800 mb-2">
                          EXPLANATION:
                        </h4>
                        <p className="text-yellow-700 leading-relaxed">
                          {step.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Final Answer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-green-600" />
              <CardTitle className="text-2xl font-bold text-green-800">
                **Final Answer:**
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
              <div className="flex justify-center mb-2">
                <BlockMath math="x = -7" />
              </div>
              <p className="text-sm text-gray-600 italic">
                *(The solution checks out mathematically!)*
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const SolvingRationalEquationsModule: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);
  const [showDialogue, setShowDialogue] = useState(true);
  const [showSectionOverview, setShowSectionOverview] = useState(true);
  const [userLevel] = useState(4);
  const [userXP] = useState(850);
  const [maxXP] = useState(1000);
  const [progress, setProgress] = useState(0);
  
  // Progress tracking state
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [equationsSolved, setEquationsSolved] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Track time spent on module
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isCompleted) {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60)); // Convert to minutes
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isCompleted]);

  // Save progress when module is completed
  const saveProgress = async () => {
    if (!user || user.role !== 'student' || isCompleted) return;

    try {
      await db.saveStudentProgress({
        studentId: user.id,
        moduleId: 'solving-rational-equations',
        moduleName: 'Solving Rational Equations',
        completedAt: new Date(),
        score: Math.round((equationsSolved.length / Math.max(equationsSolved.length + mistakes.length, 1)) * 100),
        timeSpent: timeSpent,
        equationsSolved: equationsSolved,
        mistakes: mistakes
      });

      setIsCompleted(true);
      toast({
        title: "Progress Saved! 🎉",
        description: "Your progress has been recorded in the teacher dashboard.",
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast({
        title: "Progress Save Failed",
        description: "Your progress couldn't be saved, but you can continue learning.",
        variant: "destructive",
      });
    }
  };

  const sections = [
    {
      id: 1,
      title: "Steps to Solve Rational Equations",
      icon: <Target className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <h3 className="font-orbitron text-xl text-primary mb-6">The Complete Solving Process</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-card/30 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-2">Identify Restrictions (Excluded Values)</h4>
                  <p className="text-sm text-card-foreground mb-3">
                    Find values that make any denominator zero (since division by zero is undefined).
                  </p>
                  <div className="bg-card/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      <strong>Important:</strong> These values <strong>cannot</strong> be solutions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card/30 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-2">Eliminate Denominators</h4>
                  <p className="text-sm text-card-foreground mb-3">
                    Find the <strong>Least Common Denominator (LCD)</strong> of all fractions.
                  </p>
                  <div className="bg-card/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      Multiply <strong>every term</strong> on both sides by the LCD to eliminate denominators.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card/30 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-2">Simplify & Solve</h4>
                  <p className="text-sm text-card-foreground mb-3">
                    The equation should now be a polynomial (linear, quadratic, etc.).
                  </p>
                  <div className="bg-card/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      Solve using appropriate methods (e.g., factoring, quadratic formula).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card/30 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-2">Check for Extraneous Solutions</h4>
                  <p className="text-sm text-card-foreground mb-3">
                    Plug solutions back into the original equation to ensure they don't make any denominator zero.
                  </p>
                  <div className="bg-card/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      Discard any solutions that violate restrictions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-accent/20 rounded-lg p-4">
              <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                <AlertTriangle size={16} />
                Key Reminder
              </h4>
              <p className="text-sm text-card-foreground">
                Always check your solutions against the original restrictions. Extraneous solutions are common in rational equations!
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Example 1: Simple Rational Equation",
      icon: <Calculator className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">Linear Denominator</h3>
            
            <div className="bg-card/30 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-card-foreground mb-3">Solve:</h4>
              <div className="flex justify-center mb-4">
                <BlockMath math="\frac{2}{x} = 3" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-success mb-2">Step 1: Identify Restrictions</h5>
                <p className="text-sm text-card-foreground mb-2">
                  Denominator <InlineMath math="x \neq 0" />.
                </p>
                <div className="bg-card/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">
                    <strong>Restriction:</strong> <InlineMath math="x = 0" /> is excluded from solutions.
                  </p>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-primary mb-2">Step 2: Eliminate Denominator</h5>
                <p className="text-sm text-card-foreground mb-2">
                  Multiply both sides by <InlineMath math="x" />:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <BlockMath math="x \cdot \frac{2}{x} = x \cdot 3" />
                  </div>
                  <div className="flex justify-center">
                    <BlockMath math="2 = 3x" />
                  </div>
                </div>
                <div className="bg-card/50 rounded-lg p-2 mt-2">
                  <p className="text-xs text-muted-foreground">
                    <strong>Cancellation:</strong> <InlineMath math="x \cdot \frac{2}{x} = 2" /> (the <InlineMath math="x" /> terms cancel out)
                  </p>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-accent mb-2">Step 3: Solve for x</h5>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <BlockMath math="2 = 3x" />
                  </div>
                  <div className="flex justify-center">
                    <BlockMath math="x = \frac{2}{3}" />
                  </div>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-warning mb-2">Step 4: Check Solution</h5>
                <p className="text-sm text-card-foreground mb-2">
                  <InlineMath math="x = \frac{2}{3}" /> does not make the denominator zero.
                </p>
                <div className="bg-success/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-success">
                    <strong>Solution:</strong> <InlineMath math="\boxed{\dfrac{2}{3}}" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Example 2: Factoring Required",
      icon: <Brain className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">Multiple Denominators with Factoring</h3>
            
            <div className="bg-card/30 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-card-foreground mb-3">Solve:</h4>
              <div className="flex justify-center mb-4">
                <BlockMath math="\frac{1}{x+2} + \frac{3}{x-2} = \frac{4}{x^2 - 4}" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-success mb-2">Step 1: Factor & Identify Restrictions</h5>
                <div className="space-y-2">
                  <p className="text-sm text-card-foreground">Factor denominators:</p>
                  <div className="flex justify-center">
                    <BlockMath math="x^2 - 4 = (x+2)(x-2)" />
                  </div>
                  <p className="text-sm text-card-foreground">Restrictions: <InlineMath math="x \neq 2, -2" />.</p>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-primary mb-2">Step 2: Find LCD & Multiply</h5>
                <div className="space-y-2">
                  <p className="text-sm text-card-foreground">LCD = <InlineMath math="(x+2)(x-2)" />.</p>
                  <p className="text-sm text-card-foreground">Multiply every term by LCD:</p>
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <BlockMath math="(x+2)(x-2) \cdot \frac{1}{x+2} + (x+2)(x-2) \cdot \frac{3}{x-2} = (x+2)(x-2) \cdot \frac{4}{(x+2)(x-2)}" />
                    </div>
                    <div className="flex justify-center">
                      <BlockMath math="1(x-2) + 3(x+2) = 4" />
                    </div>
                  </div>
                  <div className="bg-card/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">
                      <strong>Cancellation:</strong> <InlineMath math="(x+2)" /> cancels in first term, <InlineMath math="(x-2)" /> cancels in second term, and <InlineMath math="(x+2)(x-2)" /> cancels in third term.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-accent mb-2">Step 3: Simplify & Solve</h5>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <BlockMath math="x - 2 + 3x + 6 = 4" />
                  </div>
                  <div className="flex justify-center">
                    <BlockMath math="4x + 4 = 4" />
                  </div>
                  <div className="flex justify-center">
                    <BlockMath math="4x = 0 \implies x = 0" />
                  </div>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-warning mb-2">Step 4: Check Solution</h5>
                <p className="text-sm text-card-foreground mb-2">
                  <InlineMath math="x = 0" /> does not violate restrictions.
                </p>
                <div className="bg-success/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-success">
                    <strong>Solution:</strong> <InlineMath math="\boxed{0}" />
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
      title: "Example 3: Quadratic Result",
      icon: <Zap className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">Leading to Quadratic Equation</h3>
            
            <div className="bg-card/30 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-card-foreground mb-3">Solve:</h4>
              <div className="flex justify-center mb-4">
                <BlockMath math="\frac{x+1}{x-2} = \frac{2x+3}{x^2 - 4}" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-success mb-2">Step 1: Factor & Identify Restrictions</h5>
                <div className="space-y-2">
                  <p className="text-sm text-card-foreground">Factor denominator:</p>
                  <div className="flex justify-center">
                    <BlockMath math="x^2 - 4 = (x+2)(x-2)" />
                  </div>
                  <p className="text-sm text-card-foreground">Restrictions: <InlineMath math="x \neq 2, -2" />.</p>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-primary mb-2">Step 2: Find LCD & Multiply</h5>
                <div className="space-y-2">
                  <p className="text-sm text-card-foreground">LCD = <InlineMath math="(x+2)(x-2)" />.</p>
                  <p className="text-sm text-card-foreground">Multiply both sides:</p>
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <BlockMath math="(x+2)(x-2) \cdot \frac{x+1}{x-2} = (x+2)(x-2) \cdot \frac{2x+3}{(x+2)(x-2)}" />
                    </div>
                    <div className="flex justify-center">
                      <BlockMath math="(x+1)(x+2) = 2x + 3" />
                    </div>
                  </div>
                  <div className="bg-card/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">
                      <strong>Cancellation:</strong> <InlineMath math="(x-2)" /> cancels on left, <InlineMath math="(x+2)(x-2)" /> cancels on right.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-accent mb-2">Step 3: Expand & Solve</h5>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <BlockMath math="x^2 + 3x + 2 = 2x + 3" />
                  </div>
                  <div className="flex justify-center">
                    <BlockMath math="x^2 + x - 1 = 0" />
                  </div>
                  <p className="text-sm text-card-foreground">Use quadratic formula:</p>
                  <div className="flex justify-center">
                    <BlockMath math="x = \frac{-1 \pm \sqrt{1 + 4}}{2} = \frac{-1 \pm \sqrt{5}}{2}" />
                  </div>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-warning mb-2">Step 4: Check Solutions</h5>
                <p className="text-sm text-card-foreground mb-2">
                  Neither solution is <InlineMath math="2" /> or <InlineMath math="-2" />.
                </p>
                <div className="bg-success/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-success">
                    <strong>Solutions:</strong> <InlineMath math="\boxed{\dfrac{-1 + \sqrt{5}}{2}}" />, <InlineMath math="\boxed{\dfrac{-1 - \sqrt{5}}{2}}" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Special Cases: Extraneous Solutions",
      icon: <AlertTriangle className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">When Solutions Must Be Discarded</h3>
            
            <div className="bg-card/30 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-card-foreground mb-3">Example:</h4>
              <div className="flex justify-center mb-4">
                <BlockMath math="\frac{x}{x-1} = \frac{1}{x-1} + 2" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-success mb-2">Step 1: Identify Restrictions</h5>
                <p className="text-sm text-card-foreground">
                  Denominator <InlineMath math="x-1 \neq 0" />, so <InlineMath math="x \neq 1" />.
                </p>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-primary mb-2">Step 2: Eliminate Denominator</h5>
                <div className="space-y-2">
                  <p className="text-sm text-card-foreground">Multiply by <InlineMath math="x-1" />:</p>
                  <div className="flex justify-center">
                    <BlockMath math="(x-1) \cdot \frac{x}{x-1} = (x-1) \cdot \frac{1}{x-1} + (x-1) \cdot 2" />
                  </div>
                  <div className="flex justify-center">
                    <BlockMath math="x = 1 + 2(x-1)" />
                  </div>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-accent mb-2">Step 3: Solve</h5>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <BlockMath math="x = 1 + 2x - 2" />
                  </div>
                  <div className="flex justify-center">
                    <BlockMath math="x = 2x - 1" />
                  </div>
                  <div className="flex justify-center">
                    <BlockMath math="-x = -1 \implies x = 1" />
                  </div>
                </div>
              </div>

              <div className="bg-card/20 rounded-lg p-4">
                <h5 className="font-semibold text-warning mb-2">Step 4: Check Solution</h5>
                <p className="text-sm text-card-foreground mb-2">
                  <InlineMath math="x = 1" /> makes the denominator zero!
                </p>
                <div className="bg-destructive/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-destructive">
                    <strong>Result:</strong> <InlineMath math="\boxed{\text{No solution}}" />
                  </p>
                </div>
                <div className="bg-card/50 rounded-lg p-2 mt-2">
                  <p className="text-xs text-muted-foreground">
                    This is an <strong>extraneous solution</strong> - it appears mathematically but violates the original restrictions.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-accent/20 rounded-lg p-4">
              <h4 className="font-semibold text-accent mb-2">Why Do Extraneous Solutions Occur?</h4>
              <ul className="space-y-2 text-sm text-card-foreground">
                <li>• When we multiply by expressions that could be zero</li>
                <li>• When we square both sides of an equation</li>
                <li>• When we take the reciprocal of both sides</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Beautiful Step-by-Step Solution",
      icon: <BookOpen className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="max-w-4xl mx-auto space-y-8 p-6">
            {/* Header */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h1 className="font-orbitron font-bold text-3xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  🎓 Step-by-Step Solution Guide
                </h1>
              </div>
              <Badge variant="secondary" className="text-sm">
                Debug - Raw Solution
              </Badge>
            </motion.div>

            {/* Original Equation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-gray-800">
                    **Step-by-Step Solution with Teacher-Level Explanations:**
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <h3 className="font-bold text-lg text-gray-800 mb-2">
                        **Raw Equation:**
                      </h3>
                      <div className="flex justify-center mb-2">
                        <BlockMath math="\\frac{x-3}{x+2} = 2" />
                      </div>
                      <p className="text-sm text-gray-600 italic">
                        *(We're solving for x in this fraction equation)*
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Solution Steps */}
            <div className="space-y-6">
              {[
                {
                  title: "Find and Factor All Denominators",
                  teacherVoice: "Let's look carefully at all bottom parts (denominators): 1. There is one fraction with x + 2 at the bottom 2. Since x + 2 is already simple, we don't need to factor it further 3. Any constant terms have an invisible denominator of 1",
                  instruction: "First, let's examine all the denominators in our equation - these are the bottom parts of our fractions. We have two simple denominators here that can't be factored further. Remember, we must also identify any x-values that would make these denominators zero, as those would make our equation undefined.",
                  mathSteps: [
                    "x + 2  # Already in simplest form",
                    "x = -2 (because 5/0 is undefined)  # Never allowed",
                    "• LCD: x + 2  # This is our magic cleaner for all fractions"
                  ],
                  explanation: "Values that would break the math."
                },
                {
                  title: "Multiply Both Sides by LCD",
                  teacherVoice: "We'll multiply EVERY term by x + 2 to clean up: 1. For fractions: The bottom cancels with our LCD 2. For whole numbers: We distribute like multiplication 3. Watch how each part transforms!",
                  instruction: "To make this easier to work with, we'll multiply every single term by our least common denominator (LCD). This will clear all the fractions. Watch carefully how each fraction simplifies when we do this multiplication - the denominators will cancel out beautifully!",
                  mathSteps: [
                    "• Left Side Transformation:",
                    "x + 2 * ((x - 3)/(x + 2))",
                    "= x + 2 * x - 3 / x + 2",
                    "= x - 3  # After cancellation",
                    "• Right Side Transformations:",
                    "First Term:",
                    "x + 2 * 2",
                    "= 2*x + 4  # Distribute",
                    "• New Clean Equation:",
                    "x - 3 = 2*x + 4  # All fractions gone!"
                  ]
                },
                {
                  title: "Solve the Simplified Equation",
                  teacherVoice: "Now we solve like a regular linear algebra problem: 1. Combine like terms on both sides 2. Move variable terms to one side, constants to the other 3. Divide by the coefficient of x",
                  instruction: "Now that we've eliminated the fractions, we have a cleaner equation to work with. Let's gather all the x terms on one side and the constant numbers on the other. Remember to perform the same operation on both sides to keep the equation balanced. Our goal is to isolate x to find its value.",
                  mathSteps: [
                    "• Combine like terms:",
                    "x - 3 = 2*x + 4  # We combined x + 3x",
                    "• Move terms:",
                    "7 = -1*x  # Added 6 to both sides",
                    "7 = -1*x",
                    "• Divide both sides to isolate x:",
                    "7/-1 = -1*x/-1",
                    "-7 = x",
                    "• Final solution:",
                    "x = -7  # Exact form",
                    "x ≈ -7.0000000  # Decimal form"
                  ]
                },
                {
                  title: "Verify the Solution",
                  teacherVoice: "Let's test x = -7 in the original equation: 1. Calculate left side by substituting the value 2. Calculate right side by substituting the value 3. Both sides should give the same result",
                  instruction: "It's crucial to verify our answer by plugging it back into the original equation. This ensures our solution doesn't make any denominators zero and that both sides of the equation balance correctly. Let's calculate both sides carefully to confirm our answer works.",
                  mathSteps: [
                    "• Check denominator safety:",
                    "x + 2 = -5 ≠ 0  # Good!",
                    "• Left Side Calculation:",
                    "(x - 3)/(x + 2) = 2  # Exact",
                    "2.0000000  # Decimal",
                    "• Right Side Calculation:",
                    "2 = 2  # Exact",
                    "2.0000000  # Decimal",
                    "✓ Both sides match perfectly!"
                  ]
                },
                {
                  title: "Final Verification",
                  teacherVoice: "Double-checking our work: 1. Exact fractions confirm precision 2. Decimal form helps visualize 3. Every step maintains equality",
                  instruction: "Let's double-check our work by substituting the solution into both sides of the original equation. We'll calculate using exact fractions first for precision, then look at the decimal equivalents. Both sides should give us identical results if we've solved it correctly.",
                  mathSteps: [
                    "Substitute x = -7:",
                    "• Left Side:",
                    "(x - 3)/(x + 2) = 2  # Exact",
                    "2.0000000  # Decimal",
                    "• Right Side:",
                    "2 = 2  # Exact",
                    "2.0000000  # Decimal",
                    "→ Perfect match! (✓ Valid)"
                  ]
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                          {index === 0 && <Target className="w-5 h-5 text-white" />}
                          {index === 1 && <Calculator className="w-5 h-5 text-white" />}
                          {index === 2 && <Brain className="w-5 h-5 text-white" />}
                          {index === 3 && <CheckCircle className="w-5 h-5 text-white" />}
                          {index === 4 && <Trophy className="w-5 h-5 text-white" />}
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-800">
                          **Step {index + 1}: {step.title}**
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Teacher's Voice */}
                      <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4 border-l-4 border-blue-400">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-500 rounded-full">
                            <Lightbulb className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-blue-800 mb-2">
                              **TEACHER'S VOICE:**
                            </h4>
                            <p className="text-blue-700 leading-relaxed">
                              "{step.teacherVoice}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Instruction */}
                      <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 border-l-4 border-green-400">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-500 rounded-full">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-green-800 mb-2">
                              INSTRUCTION:
                            </h4>
                            <p className="text-green-700 leading-relaxed">
                              {step.instruction}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Math Steps */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="space-y-3">
                          {step.mathSteps.map((mathStep, mathIndex) => (
                            <div key={mathIndex} className="flex items-center gap-3">
                              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-gray-700 font-mono text-sm">
                                  {mathStep}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Explanation */}
                      {step.explanation && (
                        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 border-l-4 border-yellow-400">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-500 rounded-full">
                              <Zap className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-yellow-800 mb-2">
                                EXPLANATION:
                              </h4>
                              <p className="text-yellow-700 leading-relaxed">
                                {step.explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Final Answer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="w-8 h-8 text-green-600" />
                    <CardTitle className="text-2xl font-bold text-green-800">
                      **Final Answer:**
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
                    <div className="flex justify-center mb-2">
                      <BlockMath math="x = -7" />
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      *(The solution checks out mathematically!)*
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "Advanced Assessment",
      icon: <Calculator className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">Advanced Step-by-Step Assessment</h3>
            <p className="text-muted-foreground mb-6">
              This comprehensive assessment evaluates your mastery of solving rational equations. 
              Each question targets specific skills that your teacher will analyze.
            </p>
            
            <div className="space-y-8">
              {/* Assessment 1: Complex Restrictions */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 1: Complex Restrictions</h4>
                <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 1:</h5>
                <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{x+1}{x^2-9} + \frac{2}{x-3} = 1" />
                </div>
                    <p className="text-sm text-muted-foreground mb-3">What values of x are NOT allowed?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['x = 3 and x = -3', 'x = 3 only', 'x = -3 only', 'x = 0 and x = 3'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'x = 3 and x = -3') {
                              setEquationsSolved(prev => [...prev, 'Correctly identified complex restrictions: x ≠ 3, -3']);
                              toast({
                                title: "Excellent! 🎉",
                                description: "You correctly identified both restrictions from x²-9 = (x+3)(x-3).",
                              });
                            } else {
                              const mistake = `Failed to identify complex restrictions for (x+1)/(x²-9) + 2/(x-3) = 1. Selected: ${answer}. Correct: x = 3 and x = -3`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "Factor x²-9 = (x+3)(x-3) to find all restrictions.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-sm"
                        >
                          {answer}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment 2: LCD with Factoring */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 2: LCD with Factoring</h4>
                <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 2:</h5>
                <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{1}{x^2-4} + \frac{3}{x+2} = \frac{2}{x-2}" />
                </div>
                    <p className="text-sm text-muted-foreground mb-3">What is the LCD after factoring?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['(x+2)(x-2)', 'x²-4', '(x+2)²(x-2)', 'x²+4'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === '(x+2)(x-2)') {
                              setEquationsSolved(prev => [...prev, 'Correctly found LCD with factoring: (x+2)(x-2)']);
                              toast({
                                title: "Perfect! 🎉",
                                description: "You correctly factored x²-4 = (x+2)(x-2) for the LCD.",
                              });
                            } else {
                              const mistake = `Failed to find LCD with factoring for 1/(x²-4) + 3/(x+2) = 2/(x-2). Selected: ${answer}. Correct: (x+2)(x-2)`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "Factor x²-4 = (x+2)(x-2) to find the LCD.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-sm"
                        >
                          {answer}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment 3: Multi-step Solving */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 3: Multi-step Solving Process</h4>
                <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 3:</h5>
                <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{x+1}{x-2} = \frac{2x+3}{x^2-4}" />
                </div>
                    <p className="text-sm text-muted-foreground mb-3">After multiplying by LCD, what equation do you get?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['(x+1)(x+2) = 2x+3', '(x+1)(x-2) = 2x+3', 'x+1 = 2x+3', '(x+1)(x+2) = 2x-3'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === '(x+1)(x+2) = 2x+3') {
                              setEquationsSolved(prev => [...prev, 'Correctly simplified after LCD multiplication']);
                              toast({
                                title: "Excellent! 🎉",
                                description: "You correctly simplified after multiplying by the LCD.",
                              });
                            } else {
                              const mistake = `Failed to simplify after LCD multiplication for (x+1)/(x-2) = (2x+3)/(x²-4). Selected: ${answer}. Correct: (x+1)(x+2) = 2x+3`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "Remember to cancel common factors after multiplication.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-sm"
                        >
                          {answer}
                        </Button>
                      ))}
              </div>
            </div>

                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 4:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{2}{x-1} + \frac{1}{x+1} = \frac{3}{x^2-1}" />
              </div>
                    <p className="text-sm text-muted-foreground mb-3">What is the first step in solving this equation?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Factor x²-1 = (x+1)(x-1)', 'Add the fractions', 'Multiply by x', 'Subtract 3 from both sides'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'Factor x²-1 = (x+1)(x-1)') {
                              setEquationsSolved(prev => [...prev, 'Correctly identified first step: factor denominator']);
                              toast({
                                title: "Perfect! 🎉",
                                description: "You correctly identified that factoring is the first step.",
                              });
                            } else {
                              const mistake = `Failed to identify first step for 2/(x-1) + 1/(x+1) = 3/(x²-1). Selected: ${answer}. Correct: Factor x²-1 = (x+1)(x-1)`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "Always factor denominators first to find the LCD.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-sm"
                        >
                          {answer}
                        </Button>
                      ))}
            </div>
          </div>
        </div>
              </div>

              {/* Assessment 4: Quadratic Solutions */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 4: Quadratic Solutions</h4>
              <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 5:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{x+1}{x-2} = \frac{2x+3}{x^2-4}" />
                </div>
                    <p className="text-sm text-muted-foreground mb-3">After expanding (x+1)(x+2) = 2x+3, what quadratic equation do you get?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['x²+3x+2 = 2x+3', 'x²+2x+1 = 2x+3', 'x²+x+2 = 2x+3', 'x²+3x+1 = 2x+3'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'x²+3x+2 = 2x+3') {
                              setEquationsSolved(prev => [...prev, 'Correctly expanded to quadratic: x²+3x+2 = 2x+3']);
                              toast({
                                title: "Excellent! 🎉",
                                description: "You correctly expanded the left side.",
                              });
                            } else {
                              const mistake = `Failed to expand (x+1)(x+2) = 2x+3. Selected: ${answer}. Correct: x²+3x+2 = 2x+3`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "Use FOIL method: (x+1)(x+2) = x²+2x+x+2 = x²+3x+2",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-sm"
                        >
                          {answer}
                        </Button>
                      ))}
                </div>
                  </div>
                </div>
              </div>

              {/* Assessment 5: Final Solutions */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 5: Complete Solutions</h4>
              <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 6:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{x+2}{x-1} = 3" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">What is the final solution?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['x = 2.5', 'x = 5', 'x = 1', 'x = 0.5'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'x = 2.5') {
                              setEquationsSolved(prev => [...prev, 'Correctly solved complete equation: x = 2.5']);
                              toast({
                                title: "Perfect! 🎉",
                                description: "You correctly solved the complete equation!",
                              });
                            } else {
                              const mistake = `Failed to solve (x+2)/(x-1) = 3. Selected: ${answer}. Correct: x = 2.5`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "Check your algebra: x+2 = 3(x-1) → x+2 = 3x-3 → 5 = 2x → x = 2.5",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-sm"
                        >
                          {answer}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                </div>

              {/* Assessment 6: Extraneous Solutions */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 6: Extraneous Solutions</h4>
                <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 7:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{x}{x-1} = \frac{1}{x-1} + 2" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">If you solve this and get x = 1, what should you conclude?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['No solution (extraneous)', 'x = 1 is the solution', 'Check if x = 1 works', 'Try a different method'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'No solution (extraneous)') {
                              setEquationsSolved(prev => [...prev, 'Correctly identified no solution due to extraneous']);
                              toast({
                                title: "Excellent! 🎉",
                                description: "You correctly identified this as having no solution.",
                              });
                            } else {
                              const mistake = `Failed to identify extraneous solution for x/(x-1) = 1/(x-1) + 2. Selected: ${answer}. Correct: No solution (extraneous)`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "x = 1 makes the denominator zero, so it's extraneous.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-sm"
                        >
                          {answer}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                </div>

              {/* Detailed Progress Summary */}
              <div className="bg-primary/10 rounded-lg p-6">
                <h4 className="font-semibold text-primary mb-4">Your Advanced Assessment Results:</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-card-foreground mb-3">Advanced Skills Demonstrated:</h5>
                    <div className="space-y-2">
                      {equationsSolved.map((skill, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle size={16} className="text-success" />
                          <span className="text-success">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-card-foreground mb-3">Specific Areas for Improvement:</h5>
                    <div className="space-y-2">
                      {mistakes.map((mistake, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <AlertTriangle size={16} className="text-destructive" />
                          <span className="text-destructive text-xs">{mistake}</span>
                        </div>
                      ))}
                </div>
              </div>
            </div>

                <div className="mt-4 p-4 bg-card/30 rounded-lg">
                  <h5 className="font-medium text-card-foreground mb-2">Advanced Performance Analysis:</h5>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Advanced Skills</p>
                      <p className="font-semibold text-success">{equationsSolved.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Learning Gaps</p>
                      <p className="font-semibold text-destructive">{mistakes.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mastery Level</p>
                      <p className="font-semibold">
                        {equationsSolved.length + mistakes.length > 0 
                          ? Math.round((equationsSolved.length / (equationsSolved.length + mistakes.length)) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const dialogues = [
    {
      speaker: "AI Tutor Ava",
      text: "Welcome to the Solving Rational Equations module! Let's master the step-by-step process together."
    },
    {
      speaker: "AI Tutor Ava",
      text: "I'll show you detailed examples with cancellation steps to make everything crystal clear!"
    },
    {
      speaker: "AI Tutor Ava",
      text: "Ready to become a rational equation solving expert? Let's dive in!"
    }
  ];

  const handleNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setProgress(((currentSection + 1) / sections.length) * 100);
    }
  };

  const handlePrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setProgress(((currentSection - 1) / sections.length) * 100);
    }
  };

  const handleSectionClick = (sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    setProgress((sectionIndex / sections.length) * 100);
    setShowSectionOverview(false);
  };

  const handleNextDialogue = () => {
    if (showDialogue) {
      setShowDialogue(false);
    }
  };

  const handleGoHome = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cosmic background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${cosmicBackground})` }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          className="p-6 border-b border-border/30 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <Home size={16} />
                Back to Home
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Calculator size={24} className="text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-orbitron font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
                    Solving Rational Equations
                  </h1>
                  <p className="text-xs text-muted-foreground">Module 2</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <XPBar 
                currentXP={userXP} 
                maxXP={maxXP} 
                level={userLevel}
                className="hidden md:flex"
              />
            </div>
          </div>
        </motion.header>

        {/* Progress Section */}
        <motion.section 
          className="container mx-auto px-6 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <Badge variant="secondary" className="text-xs">
              {currentSection + 1} of {sections.length}
            </Badge>
          </div>
        </motion.section>

        {/* Content Section */}
        <motion.section 
          className="container mx-auto px-6 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="max-w-4xl mx-auto">
            {showSectionOverview ? (
              // Section Overview
              <div className="space-y-6">
                <motion.div 
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="font-orbitron font-bold text-3xl text-card-foreground mb-4">
                    Module Overview
                  </h2>
                  <p className="text-muted-foreground">
                    Select a section to learn how to solve rational equations step by step
                  </p>
                </motion.div>

                <div className="grid gap-4">
                  {sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card 
                        className="bg-gradient-card border-primary/30 hover:border-primary/50 cursor-pointer transition-all duration-300 hover:shadow-lg"
                        onClick={() => handleSectionClick(index)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/20 rounded-lg">
                              {section.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-orbitron font-semibold text-xl text-card-foreground">
                                {section.title}
                              </h3>
                              <p className="text-muted-foreground mt-1">
                                Section {index + 1} of {sections.length}
                              </p>
                            </div>
                            <ArrowRight size={20} className="text-primary" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              // Individual Section Content
              <AnimatePresence mode="wait">
                <div key={`section-${currentSection}`}>
                  {/* Section Header */}
                  <motion.div 
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="p-3 bg-primary/20 rounded-lg">
                        {sections[currentSection].icon}
                      </div>
                      <h2 className="font-orbitron font-bold text-3xl text-card-foreground">
                        {sections[currentSection].title}
                      </h2>
                    </div>
                  </motion.div>

                  {/* Section Content */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {sections[currentSection].content}
                  </motion.div>

                  {/* Navigation */}
                  <motion.div 
                    className="flex justify-between items-center mt-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowSectionOverview(true)}
                        className="flex items-center gap-2"
                      >
                        <Home size={16} />
                        Overview
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handlePrevSection}
                        disabled={currentSection === 0}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft size={16} />
                        Previous
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      {sections.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentSection(index);
                            setProgress((index / sections.length) * 100);
                          }}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentSection 
                              ? 'bg-primary' 
                              : 'bg-muted hover:bg-muted-foreground/50'
                          }`}
                        />
                      ))}
                    </div>

                    <Button
                      variant="default"
                      onClick={handleNextSection}
                      disabled={currentSection === sections.length - 1}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ArrowRight size={16} />
                    </Button>
                  </motion.div>

                  {/* Module Completion */}
                  {currentSection === sections.length - 1 && (
                    <motion.div 
                      className="text-center mt-8 p-6 bg-gradient-card border border-primary/30 rounded-lg"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Trophy size={48} className="text-accent mx-auto mb-4" />
                      <h3 className="font-orbitron font-bold text-xl text-card-foreground mb-2">
                        Module Complete! 🎉
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        You've successfully mastered the art of solving rational equations!
                      </p>
                      
                      {/* Progress Summary */}
                      <div className="bg-card/30 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-card-foreground mb-2">Your Progress Summary:</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Time Spent</p>
                            <p className="font-semibold">{timeSpent} minutes</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Equations Solved</p>
                            <p className="font-semibold">{equationsSolved.length}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Mistakes Made</p>
                            <p className="font-semibold">{mistakes.length}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 justify-center">
                        <Button variant="outline" onClick={handleGoHome}>
                          <Home size={16} className="mr-2" />
                          Return to Home
                        </Button>
                        <Button 
                          variant="default" 
                          onClick={saveProgress}
                          disabled={isCompleted}
                        >
                          <Play size={16} className="mr-2" />
                          {isCompleted ? 'Progress Saved' : 'Save Progress & Continue'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </AnimatePresence>
            )}
          </div>
        </motion.section>
      </div>

      {/* Character and dialogue */}
      {showDialogue && (
        <>
          <CharacterBox expression="happy" size="huge" />
          <DialogueBox
            speaker={dialogues[0].speaker}
            text={dialogues[0].text}
            onNext={handleNextDialogue}
            showNext={true}
          />
        </>
      )}
    </div>
  );
};

export default SolvingRationalEquationsModule; 