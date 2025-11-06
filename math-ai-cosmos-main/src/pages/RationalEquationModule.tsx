import React, { useState, useEffect, useRef } from 'react';
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
  Pause,
  Volume2,
  Trophy,
  Zap,
  Brain,
  Calculator,
  Globe,
  Rocket,
  ArrowLeft,
  Home,
  AlertTriangle
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import cosmicBackground from '@/assets/cosmic-background.png';

const Module1: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);
  const [showDialogue, setShowDialogue] = useState(true);
  const [showSectionOverview, setShowSectionOverview] = useState(true);
  const [userLevel] = useState(3);
  const [userXP] = useState(750);
  const [maxXP] = useState(1000);
  const [progress, setProgress] = useState(0);
  
  // Audio state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudioSrc, setCurrentAudioSrc] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Progress tracking state
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [equationsSolved, setEquationsSolved] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // Audio controls
  const toggleAudio = (audioSrc?: string) => {
    if (audioRef.current) {
      // If a new audio source is provided, switch to it
      if (audioSrc && audioSrc !== currentAudioSrc) {
        audioRef.current.src = audioSrc;
        setCurrentAudioSrc(audioSrc);
        audioRef.current.play();
        setIsAudioPlaying(true);
        return;
      }
      
      // Otherwise, toggle current audio
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
  };

  const handleAudioError = () => {
    setIsAudioPlaying(false);
    toast({
      title: "Audio Error",
      description: "Could not play the audio file. Please try again.",
      variant: "destructive",
    });
  };

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
      // Analyze skills and mistakes for detailed breakdown
      const skillBreakdown = analyzeSkills(equationsSolved, mistakes);
      const commonMistakes = analyzeCommonMistakes(mistakes);
      const strengths = analyzeStrengths(equationsSolved);
      const areasForImprovement = analyzeAreasForImprovement(mistakes);

      await db.saveStudentProgress({
        studentId: user.id,
        moduleId: 'rational-equations-intro',
        moduleName: 'Introduction to Rational Equations',
        completedAt: new Date(),
        score: Math.round((equationsSolved.length / Math.max(equationsSolved.length + mistakes.length, 1)) * 100),
        timeSpent: timeSpent,
        equationsSolved: equationsSolved,
        mistakes: mistakes,
        skillBreakdown: skillBreakdown,
        commonMistakes: commonMistakes,
        strengths: strengths,
        areasForImprovement: areasForImprovement,
        difficultyLevel: 'beginner'
      });

      setIsCompleted(true);
      toast({
        title: "Progress Saved! 🎉",
        description: "Your detailed progress has been recorded in the teacher dashboard.",
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

  // Analyze skills based on correct answers and mistakes
  const analyzeSkills = (correct: string[], mistakes: string[]) => {
    const restrictions = { correct: 0, total: 0 };
    const lcdFinding = { correct: 0, total: 0 };
    const solvingProcess = { correct: 0, total: 0 };
    const extraneousSolutions = { correct: 0, total: 0 };
    const factoring = { correct: 0, total: 0 };
    const algebra = { correct: 0, total: 0 };

    // Count correct skills
    correct.forEach(skill => {
      if (skill.includes('restriction')) restrictions.correct++;
      if (skill.includes('LCD')) lcdFinding.correct++;
      if (skill.includes('step') || skill.includes('simplified')) solvingProcess.correct++;
      if (skill.includes('extraneous')) extraneousSolutions.correct++;
      if (skill.includes('factor')) factoring.correct++;
      if (skill.includes('solved')) algebra.correct++;
    });

    // Count total attempts
    [...correct, ...mistakes].forEach(item => {
      if (item.includes('restriction')) restrictions.total++;
      if (item.includes('LCD')) lcdFinding.total++;
      if (item.includes('step') || item.includes('simplified')) solvingProcess.total++;
      if (item.includes('extraneous')) extraneousSolutions.total++;
      if (item.includes('factor')) factoring.total++;
      if (item.includes('solved')) algebra.total++;
    });

    return { restrictions, lcdFinding, solvingProcess, extraneousSolutions, factoring, algebra };
  };

  // Analyze common mistake patterns
  const analyzeCommonMistakes = (mistakes: string[]) => {
    const patterns = {
      'restriction_errors': mistakes.filter(m => m.includes('restriction')).length,
      'lcd_errors': mistakes.filter(m => m.includes('LCD')).length,
      'algebra_errors': mistakes.filter(m => m.includes('solve') || m.includes('algebra')).length,
      'factoring_errors': mistakes.filter(m => m.includes('factor')).length,
      'extraneous_errors': mistakes.filter(m => m.includes('extraneous')).length
    };

    return Object.entries(patterns)
      .filter(([_, count]) => count > 0)
      .map(([pattern, count]) => `${pattern}: ${count} errors`);
  };

  // Analyze student strengths
  const analyzeStrengths = (correct: string[]) => {
    const strengths = [];
    if (correct.filter(s => s.includes('restriction')).length > 0) strengths.push('Identifying restrictions');
    if (correct.filter(s => s.includes('LCD')).length > 0) strengths.push('Finding LCD');
    if (correct.filter(s => s.includes('step')).length > 0) strengths.push('Step-by-step solving');
    if (correct.filter(s => s.includes('extraneous')).length > 0) strengths.push('Checking for extraneous solutions');
    if (correct.filter(s => s.includes('solved')).length > 0) strengths.push('Algebraic manipulation');
    return strengths;
  };

  // Analyze areas for improvement
  const analyzeAreasForImprovement = (mistakes: string[]) => {
    const areas = [];
    if (mistakes.filter(m => m.includes('restriction')).length > 0) areas.push('Identifying restrictions');
    if (mistakes.filter(m => m.includes('LCD')).length > 0) areas.push('Finding LCD');
    if (mistakes.filter(m => m.includes('step')).length > 0) areas.push('Step-by-step solving');
    if (mistakes.filter(m => m.includes('extraneous')).length > 0) areas.push('Checking for extraneous solutions');
    if (mistakes.filter(m => m.includes('solve')).length > 0) areas.push('Algebraic manipulation');
    return areas;
  };

  const sections = [
    {
      id: 1,
      title: "What is a Rational Equation?",
      icon: <Calculator className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          {/* Audio Player */}
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-xl text-primary">Definition</h3>
              <Button
                onClick={() => toggleAudio('/sounds/WHATISARATIONALEQUATION 2.mp3')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isAudioPlaying && currentAudioSrc === '/sounds/WHATISARATIONALEQUATION 2.mp3' ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isAudioPlaying && currentAudioSrc === '/sounds/WHATISARATIONALEQUATION 2.mp3' ? 'Pause' : 'Listen'}
              </Button>
            </div>
            
            {/* Hidden audio element */}
            <audio
              ref={audioRef}
              src="/sounds/WHATISARATIONALEQUATION 2.mp3"
              onEnded={handleAudioEnded}
              onError={handleAudioError}
              preload="metadata"
            />
            
            <p className="text-card-foreground leading-relaxed mb-4">
              A <strong>rational equation</strong> is an equation that contains <strong>at least one rational expression</strong>, 
              which is a fraction where both the numerator and denominator are polynomials.
            </p>
            
            <div className="bg-card/50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-card-foreground mb-2">General Form:</h4>
              <div className="flex justify-center mb-4">
                <BlockMath math="\frac{P(x)}{Q(x)} = \frac{R(x)}{S(x)}" />
              </div>
              <p className="text-sm text-muted-foreground">
                where <InlineMath math="P(x), Q(x), R(x), S(x)" /> are polynomials and 
                <InlineMath math="Q(x) \neq 0" /> and <InlineMath math="S(x) \neq 0" /> (denominators cannot be zero).
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card/30 rounded-lg p-4">
                <h4 className="font-semibold text-success mb-2">Simple Example:</h4>
                <div className="flex justify-center">
                  <InlineMath math="\frac{2}{x} = 5" />
                </div>
              </div>
              <div className="bg-card/30 rounded-lg p-4">
                <h4 className="font-semibold text-primary mb-2">Complex Example:</h4>
                <div className="flex justify-center">
                  <InlineMath math="\frac{x+1}{x-3} = \frac{2x}{x^2 - 9}" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Key Components of Rational Equations",
      icon: <Target className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          {/* Audio Player */}
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-xl text-primary">Key Components</h3>
              <Button
                onClick={() => toggleAudio('/sounds/Key Components of Rational Equations 2.mp3')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isAudioPlaying && currentAudioSrc === '/sounds/Key Components of Rational Equations 2.mp3' ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isAudioPlaying && currentAudioSrc === '/sounds/Key Components of Rational Equations 2.mp3' ? 'Pause' : 'Listen'}
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-card border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Brain className="w-5 h-5" />
                  Numerator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-card-foreground">
                  The top part of the fraction (a polynomial).
                </p>
                <div className="mt-3 flex justify-center">
                  <InlineMath math="\frac{\text{Numerator}}{\text{Denominator}}" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Target className="w-5 h-5" />
                  Denominator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-card-foreground">
                  The bottom part of the fraction (must be non-zero).
                </p>
                <div className="mt-3 flex justify-center">
                  <InlineMath math="\text{Denominator} \neq 0" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Zap className="w-5 h-5" />
                  Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-card-foreground">
                  Values that make the denominator zero (excluded from solutions).
                </p>
                <div className="mt-3 text-sm text-muted-foreground">
                  Example: If <InlineMath math="x-3 = 0" />, then <InlineMath math="x = 3" /> is excluded.
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Calculator className="w-5 h-5" />
                  LCD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-card-foreground">
                  Least Common Denominator - Used to eliminate fractions.
                </p>
                <div className="mt-3 text-sm text-muted-foreground">
                  Essential for solving rational equations.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Why Study Rational Equations?",
      icon: <Lightbulb className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-card border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BookOpen className="w-5 h-5" />
                  Academic Foundation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-card-foreground">
                  <li>• Essential in <strong>algebra</strong></li>
                  <li>• Required for <strong>calculus</strong></li>
                  <li>• Important in <strong>engineering</strong></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Globe className="w-5 h-5" />
                  Real-World Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-card-foreground">
                  <li>• Solve <strong>rate problems</strong></li>
                  <li>• Calculate <strong>work problems</strong></li>
                  <li>• Determine <strong>concentrations</strong></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Rocket className="w-5 h-5" />
                  Advanced Concepts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-card-foreground">
                  <li>• Understand <strong>asymptotes</strong></li>
                  <li>• Study <strong>discontinuities</strong></li>
                  <li>• Analyze <strong>function behavior</strong></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Common Applications",
      icon: <Globe className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="bg-gradient-card border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    ⚡ Physics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-card-foreground">
                    <li>• Calculating rates and velocities</li>
                    <li>• Resistances in electrical circuits</li>
                    <li>• Force and motion problems</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    🧪 Chemistry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-card-foreground">
                    <li>• Mixing solutions with different concentrations</li>
                    <li>• Reaction rate calculations</li>
                    <li>• Equilibrium constant problems</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-gradient-card border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    💰 Economics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-card-foreground">
                    <li>• Cost and revenue optimization</li>
                    <li>• Supply and demand analysis</li>
                    <li>• Profit maximization</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    🔧 Engineering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-card-foreground">
                    <li>• Signal processing</li>
                    <li>• Control systems design</li>
                    <li>• Circuit analysis</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Basic Concepts to Review",
      icon: <CheckCircle className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">Prerequisites</h3>
            <p className="text-card-foreground mb-6">
              Before tackling rational equations, ensure you understand these fundamental concepts:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-card/30 rounded-lg p-4">
                  <h4 className="font-semibold text-success mb-2">✅ Polynomials</h4>
                  <p className="text-sm text-card-foreground mb-2">Example:</p>
                  <div className="flex justify-center">
                    <InlineMath math="x^2 - 4" />
                  </div>
                </div>

                <div className="bg-card/30 rounded-lg p-4">
                  <h4 className="font-semibold text-primary mb-2">✅ Factoring</h4>
                  <p className="text-sm text-card-foreground mb-2">Example (difference of squares):</p>
                  <div className="flex justify-center">
                    <InlineMath math="x^2 - 9 = (x+3)(x-3)" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-card/30 rounded-lg p-4">
                  <h4 className="font-semibold text-accent mb-2">✅ LCD (Least Common Denominator)</h4>
                  <p className="text-sm text-card-foreground">
                    Used to combine fractions and eliminate denominators.
                  </p>
                </div>

                <div className="bg-card/30 rounded-lg p-4">
                  <h4 className="font-semibold text-warning mb-2">✅ Linear & Quadratic Equations</h4>
                  <p className="text-sm text-card-foreground">
                    Since rational equations often simplify to these forms.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-card/20 rounded-lg p-4">
              <h4 className="font-semibold text-primary mb-2">🎯 Quick Check</h4>
              <p className="text-sm text-card-foreground">
                Can you factor <InlineMath math="x^2 - 16" />? If yes, you're ready to proceed!
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                Answer: <InlineMath math="(x+4)(x-4)" />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Solving Strategy Overview",
      icon: <Target className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">Step-by-Step Approach</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card/30 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-2">Identify Restrictions</h4>
                  <p className="text-sm text-card-foreground">
                    Find values that make any denominator zero. These are excluded from solutions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card/30 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-2">Find LCD</h4>
                  <p className="text-sm text-card-foreground">
                    Determine the Least Common Denominator of all fractions in the equation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card/30 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-2">Multiply by LCD</h4>
                  <p className="text-sm text-card-foreground">
                    Multiply both sides by the LCD to eliminate all denominators.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card/30 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-2">Solve Resulting Equation</h4>
                  <p className="text-sm text-card-foreground">
                    Solve the polynomial equation that results from step 3.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card/30 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground mb-2">Check Solutions</h4>
                  <p className="text-sm text-card-foreground">
                    Verify that solutions don't violate the restrictions from step 1.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "Comprehensive Assessment",
      icon: <Calculator className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card border border-primary/30 rounded-lg p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">Step-by-Step Assessment</h3>
            <p className="text-muted-foreground mb-6">
              This assessment will help identify your understanding of each step in solving rational equations. 
              Answer each question carefully - your teacher will see detailed results.
            </p>
            
            <div className="space-y-8">
              {/* Assessment 1: Understanding Restrictions */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 1: Identifying Restrictions</h4>
                <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 1:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{2}{x-3} = 5" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">What values of x are NOT allowed in this equation?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['x = 3', 'x = 0', 'x = -3', 'x = 5'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'x = 3') {
                              setEquationsSolved(prev => [...prev, 'Correctly identified restriction: x ≠ 3']);
                              toast({
                                title: "Excellent! 🎉",
                                description: "You correctly identified that x = 3 makes the denominator zero.",
                              });
                            } else {
                              const mistake = `Failed to identify restriction for 2/(x-3) = 5. Selected: ${answer}. Correct: x = 3`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "Remember: find values that make the denominator zero.",
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
                    <h5 className="font-medium text-card-foreground mb-3">Question 2:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{x+1}{x^2-4} = 2" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">What values of x are NOT allowed? (Select all that apply)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['x = 2', 'x = -2', 'x = 1', 'x = 0'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'x = 2' || answer === 'x = -2') {
                              setEquationsSolved(prev => [...prev, `Correctly identified restriction: ${answer}`]);
                              toast({
                                title: "Correct! 🎉",
                                description: `You correctly identified that ${answer} makes the denominator zero.`,
                              });
                            } else {
                              const mistake = `Failed to identify restriction for (x+1)/(x²-4) = 2. Selected: ${answer}. Correct: x = 2 or x = -2`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "Factor x²-4 = (x+2)(x-2) to find restrictions.",
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

              {/* Assessment 2: LCD Understanding */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 2: Finding LCD</h4>
                <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 3:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{1}{x} + \frac{2}{x+1} = 3" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">What is the Least Common Denominator?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['x(x+1)', 'x + (x+1)', 'x² + x', '2x + 1'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'x(x+1)') {
                              setEquationsSolved(prev => [...prev, 'Correctly found LCD: x(x+1)']);
                              toast({
                                title: "Perfect! 🎉",
                                description: "You correctly identified the LCD as x(x+1).",
                              });
                            } else {
                              const mistake = `Failed to find LCD for 1/x + 2/(x+1) = 3. Selected: ${answer}. Correct: x(x+1)`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "LCD is the product of all unique factors.",
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

              {/* Assessment 3: Solving Process */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 3: Step-by-Step Solving</h4>
                <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 4:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{3}{x} = 6" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">What is the first step to solve this equation?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Multiply both sides by x', 'Subtract 3 from both sides', 'Divide both sides by 3', 'Add x to both sides'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'Multiply both sides by x') {
                              setEquationsSolved(prev => [...prev, 'Correctly identified first step: multiply by x']);
                              toast({
                                title: "Excellent! 🎉",
                                description: "You correctly identified the first step.",
                              });
                            } else {
                              const mistake = `Failed to identify first step for 3/x = 6. Selected: ${answer}. Correct: Multiply both sides by x`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "To eliminate denominator, multiply by the denominator.",
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
                    <h5 className="font-medium text-card-foreground mb-3">Question 5:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{2}{x-1} = 4" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">After multiplying both sides by (x-1), what equation do you get?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['2 = 4(x-1)', '2(x-1) = 4', '2 = 4x - 4', '2x - 2 = 4'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === '2 = 4(x-1)') {
                              setEquationsSolved(prev => [...prev, 'Correctly simplified: 2 = 4(x-1)']);
                              toast({
                                title: "Correct! 🎉",
                                description: "You correctly simplified the equation.",
                              });
                            } else {
                              const mistake = `Failed to simplify 2/(x-1) = 4 after multiplication. Selected: ${answer}. Correct: 2 = 4(x-1)`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "Remember to distribute the multiplication correctly.",
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

              {/* Assessment 4: Final Answer */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 4: Complete Solution</h4>
                <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 6:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{x+2}{x-1} = 3" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">What is the final solution for x?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['x = 2.5', 'x = 5', 'x = 1', 'x = 0.5'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'x = 2.5') {
                              setEquationsSolved(prev => [...prev, 'Correctly solved: x = 2.5']);
                              toast({
                                title: "Perfect! 🎉",
                                description: "You correctly solved the complete equation!",
                              });
                            } else {
                              const mistake = `Failed to solve (x+2)/(x-1) = 3. Selected: ${answer}. Correct: x = 2.5`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "Check your algebra steps carefully.",
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

              {/* Assessment 5: Extraneous Solutions */}
              <div className="bg-card/30 rounded-lg p-6">
                <h4 className="font-semibold text-card-foreground mb-4">Assessment 5: Checking Solutions</h4>
                <div className="space-y-4">
                  <div className="bg-card/20 rounded-lg p-4">
                    <h5 className="font-medium text-card-foreground mb-3">Question 7:</h5>
                    <div className="flex justify-center mb-4">
                      <InlineMath math="\frac{x}{x-2} = \frac{1}{x-2} + 1" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">If you solve this and get x = 2, what should you do?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Accept x = 2 as the solution', 'Reject x = 2 as extraneous', 'Check if x = 2 works', 'Try a different method'].map((answer, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (answer === 'Reject x = 2 as extraneous') {
                              setEquationsSolved(prev => [...prev, 'Correctly identified extraneous solution']);
                              toast({
                                title: "Excellent! 🎉",
                                description: "You correctly identified this as an extraneous solution.",
                              });
                            } else {
                              const mistake = `Failed to identify extraneous solution for x/(x-2) = 1/(x-2) + 1. Selected: ${answer}. Correct: Reject x = 2`;
                              setMistakes(prev => [...prev, mistake]);
                              toast({
                                title: "Incorrect",
                                description: "x = 2 makes the denominator zero, so it's extraneous.",
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
                <h4 className="font-semibold text-primary mb-4">Your Detailed Assessment Results:</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-card-foreground mb-3">Skills Mastered:</h5>
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
                    <h5 className="font-medium text-card-foreground mb-3">Areas for Improvement:</h5>
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
                  <h5 className="font-medium text-card-foreground mb-2">Overall Performance:</h5>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Skills Demonstrated</p>
                      <p className="font-semibold text-success">{equationsSolved.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Areas of Weakness</p>
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
      text: "Welcome to the Introduction to Rational Equations module! Let's explore the fascinating world of rational expressions together."
    },
    {
      speaker: "AI Tutor Ava",
      text: "Rational equations are powerful tools that appear in many real-world applications. Understanding them will unlock new mathematical possibilities!"
    },
    {
      speaker: "AI Tutor Ava",
      text: "Ready to dive in? Let's start with the fundamentals and build your understanding step by step."
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
                    Introduction to Rational Equations
                  </h1>
                  <p className="text-xs text-muted-foreground">Module 1</p>
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
                    Select a section to begin learning about rational equations
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
                        You've successfully completed the Introduction to Rational Equations module.
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

export default Module1; 