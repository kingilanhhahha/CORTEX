import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '@/contexts/PlayerContext';
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
  AlertTriangle,
  Star,
  HelpCircle,
  Award,
  Clock,
  Users
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const mercuryBg = new URL('../../planet background/mercury.webp', import.meta.url).href;

const MercuryLesson: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveProgress, awardXP, saveAchievement } = usePlayer();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);
  const [showDialogue, setShowDialogue] = useState(true);
  const [userLevel] = useState(3);
  const [userXP] = useState(750);
  const [maxXP] = useState(1000);
  const [progress, setProgress] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  // Save initial progress when lesson starts
  React.useEffect(() => {
    if (user?.id) {
      saveProgress(user.id, {
        module_id: 'mercury',
        section_id: 'section_0',
        slide_index: 0,
        progress_pct: ((currentSection + 1) / sections.length) * 100,
      });
    }
  }, [user?.id]);

  // Save progress whenever currentSection changes
  React.useEffect(() => {
    if (user?.id) {
      const progressPercentage = ((currentSection + 1) / sections.length) * 100;
      saveProgress(user.id, {
        module_id: 'mercury',
        section_id: 'section_0',
        slide_index: currentSection,
        progress_pct: progressPercentage,
      });
    }
  }, [currentSection, user?.id, saveProgress]);

  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: string}>({});
  const [quizResults, setQuizResults] = useState<{[key: string]: boolean}>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [equationsSolved, setEquationsSolved] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  
  // Audio state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [currentAudioSrc, setCurrentAudioSrc] = useState<string>('');
  const [questionsAnswered, setQuestionsAnswered] = useState<Record<number, {correct: boolean, answer: string, explanation?: string}>>({});
  const [showQuestionFeedback, setShowQuestionFeedback] = useState<Record<number, boolean>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Ensure audio element is ready
  React.useEffect(() => {
    if (audioRef.current) {
      console.log('Audio element initialized:', audioRef.current);
      
      // Add event listeners for debugging
      audioRef.current.addEventListener('loadstart', () => console.log('Audio loadstart'));
      audioRef.current.addEventListener('canplay', () => console.log('Audio canplay'));
      audioRef.current.addEventListener('error', (e) => console.error('Audio error event:', e));
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadstart', () => {});
          audioRef.current.removeEventListener('canplay', () => {});
          audioRef.current.removeEventListener('error', () => {});
        }
      };
    }
  }, []);

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
      areas.push("Understanding rational equation structure");
    }
    if (questionsAnswered[2] && !questionsAnswered[2].correct) {
      areas.push("Identifying restrictions in rational equations");
    }
    if (questionsAnswered[3] && !questionsAnswered[3].correct) {
      areas.push("Applying LCD method to solve rational equations");
    }
    
    return areas;
  };

  // Audio files sequence - simplified to only one file per section
  const audioSequence = [
    '/sounds/mercury/WHATISARATIONALEQUATION 1.mp3'
  ];

  // Key Components audio sequence - simplified to only one file
  const keyComponentsAudioSequence = [
    '/sounds/mercury/Key Components of Rational Equations 1.mp3'
  ];

  // Why Study Rational Equations audio sequence - simplified to only one file
  const whyStudyAudioSequence = [
    '/sounds/mercury/Why Study Rational Equations 1.mp3'
  ];

  // Basic Concepts to Review audio (single file)
  const basicConceptsAudio = [
    '/sounds/mercury/Basic Concepts to Review.mp3'
  ];

  // Steps to Solve Rational Equations audio (single file)
  const stepsToSolveAudio = [
    '/sounds/mercury/Steps To Solve Rational Equations.mp3'
  ];

  // Audio controls - simplified for single file playback
  const toggleAudio = (audioSrc?: string) => {
    console.log('toggleAudio called with:', audioSrc);
    console.log('Current audio state:', { isAudioPlaying, currentAudioSrc });
    
    if (audioRef.current) {
      // If a new audio source is provided, switch to it
      if (audioSrc && audioSrc !== currentAudioSrc) {
        console.log('Setting new audio source:', audioSrc);
        audioRef.current.src = audioSrc;
        setCurrentAudioSrc(audioSrc);
        setCurrentAudioIndex(0); // Always start from index 0 for single files
        
        audioRef.current.play().then(() => {
          console.log('Audio started playing successfully');
          setIsAudioPlaying(true);
        }).catch((error) => {
          console.error('Error playing audio:', error);
          setIsAudioPlaying(false);
        });
        return;
      }
      
      // Otherwise, toggle current audio
      if (isAudioPlaying) {
        console.log('Pausing audio');
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        console.log('Resuming audio');
        audioRef.current.play().then(() => {
          console.log('Audio resumed successfully');
          setIsAudioPlaying(true);
        }).catch((error) => {
          console.error('Error resuming audio:', error);
          setIsAudioPlaying(false);
        });
      }
    } else {
      console.error('Audio ref is null');
    }
  };

  const handleAudioEnded = () => {
    console.log('Audio ended, current source:', currentAudioSrc);
    
    // Since we're only playing single files, just stop playing
    console.log('Audio finished, stopping playback');
    setIsAudioPlaying(false);
    setCurrentAudioIndex(0);
  };

  const handleAudioError = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio playback error occurred:', event);
    
    // Get more details about the error
    const audioElement = event.currentTarget;
    if (audioElement) {
      console.error('Audio error details:', {
        src: audioElement.src,
        networkState: audioElement.networkState,
        readyState: audioElement.readyState,
        error: audioElement.error
      });
    }
    
    setIsAudioPlaying(false);
    toast({
      title: "Audio Error 🎵",
      description: "There was an issue playing the audio. Check console for details.",
      variant: "destructive",
    });
  };

  // Test if audio file is accessible
  const testAudioFile = async (audioSrc: string): Promise<boolean> => {
    try {
      const response = await fetch(audioSrc, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error testing audio file:', audioSrc, error);
      return false;
    }
  };

  // Play single audio file function - simplified
  const playCompleteSequence = (sequenceType: 'whatis' | 'keycomponents' | 'whystudy') => {
    console.log('Play audio called:', sequenceType);
    console.log('Current audio state:', { isAudioPlaying, currentAudioSrc });
    
    // If already playing this audio, pause it
    if (isAudioPlaying && currentAudioSrc.includes(sequenceType === 'whatis' ? 'WHATISARATIONALEQUATION' : 
                                                   sequenceType === 'keycomponents' ? 'Key Components' : 'Why Study')) {
      console.log('Pausing current audio');
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsAudioPlaying(false);
      return;
    }
    
    // If playing something else, stop it first
    if (isAudioPlaying) {
      console.log('Stopping other audio');
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsAudioPlaying(false);
    }
    
    let audioSrc: string;
    
    switch (sequenceType) {
      case 'whatis':
        audioSrc = audioSequence[0];
        break;
      case 'keycomponents':
        audioSrc = keyComponentsAudioSequence[0];
        break;
      case 'whystudy':
        audioSrc = whyStudyAudioSequence[0];
        break;
      default:
        return;
    }
    
    console.log('Selected audio:', audioSrc);
    
    // Set the audio source
    setCurrentAudioIndex(0);
    setCurrentAudioSrc(audioSrc);
    
    console.log('Setting audio source to:', audioSrc);
    
    if (audioRef.current) {
      audioRef.current.src = audioSrc;
      console.log('Audio element src set to:', audioRef.current.src);
      
      audioRef.current.play().then(() => {
        console.log('Audio started playing successfully');
        setIsAudioPlaying(true);
      }).catch((error) => {
        console.error('Error starting audio:', error);
        setIsAudioPlaying(false);
        toast({
          title: "Audio Error 🎵",
          description: "Could not play audio. Please check if the file exists.",
          variant: "destructive",
        });
      });
    } else {
      console.error('Audio ref is null!');
    }
  };

  const sections = [
    {
      id: 1,
      title: "What is a Rational Equation?",
      icon: <Calculator className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card/70 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-xl text-primary">What is a Rational Equation?</h3>
              <div className="flex flex-col items-end gap-1">
                <Button
                  onClick={() => playCompleteSequence('whatis')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {isAudioPlaying && currentAudioSrc.includes('WHATISARATIONALEQUATION') ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isAudioPlaying && currentAudioSrc.includes('WHATISARATIONALEQUATION') ? 'Pause' : 'Listen'}
                </Button>
                <span className="text-xs text-white/60">Plays the audio lesson (single file)</span>
              </div>
            </div>
            
            <p className="text-white/90 leading-relaxed mb-4">
              A rational equation is an equation that contains at least one rational expression, which is a fraction where both the numerator and denominator are polynomials.
            </p>
            
            <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
              <h4 className="font-orbitron text-sm text-primary mb-2">General Form:</h4>
              <div className="text-center mb-4">
                <BlockMath math="\frac{p(x)}{q(x)} = \frac{r(x)}{q(x)}" />
              </div>
              <p className="text-white/80 text-sm">
                where P(x) Q(x) R(x) S(x) are polynomials and Q(x) ≠ 0 and S(x) ≠ 0 and s(x) ≠ 0 (denominators cannot be zero).
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="font-orbitron text-sm text-success mb-2">Simple Example:</h4>
              <div className="text-center">
                <BlockMath math="\frac{x+1}{x-3} = \frac{2x}{x^2}" />
              </div>
            </div>
            
            {/* Simple Status Indicator */}
            {isAudioPlaying && currentAudioSrc.includes('WHATISARATIONALEQUATION') && (
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Playing: Part 1 of 1</span>
                </div>
              </div>
            )}
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
          <div className="bg-gradient-card/70 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-xl text-primary">Key Components of Rational Equations</h3>
              <Button
                onClick={() => playCompleteSequence('keycomponents')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {isAudioPlaying && currentAudioSrc.includes('Key Components') ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isAudioPlaying && currentAudioSrc.includes('Key Components') ? 'Pause' : 'Listen'}
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-success mb-3">Numerator</h4>
                <p className="text-white/80 text-sm mb-2">
                  The top part of the fraction (a polynomial).
                </p>
                <div className="text-center">
                  <BlockMath math="\text{Numerator/Denominator}" />
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-warning mb-3">Denominator</h4>
                <p className="text-white/80 text-sm mb-2">
                  The bottom part of the fraction (must be non-zero).
                </p>
                <div className="text-center">
                  <BlockMath math="\text{Denominator} \neq 0" />
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-info mb-3">Restrictions</h4>
                <p className="text-white/80 text-sm mb-2">
                  Values that make the denominator zero (excluded from solutions).
                </p>
                <p className="text-white/80 text-sm">
                  <span className="text-info font-semibold">Example: if x-3 = 0, then x=3 is excluded.</span>
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-purple-400 mb-3">LCD</h4>
                <p className="text-white/80 text-sm mb-2">
                  Least Common Denominator - Used to combine fractions and eliminate denominators.
                </p>
                <p className="text-white/80 text-sm">
                  Essential for solving rational equations.
                </p>
              </div>
            </div>
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
          <div className="bg-gradient-card/70 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-xl text-primary">Why Study Rational Equations?</h3>
              <Button
                onClick={() => playCompleteSequence('whystudy')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {isAudioPlaying && currentAudioSrc.includes('Why Study') ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isAudioPlaying && currentAudioSrc.includes('Why Study') ? 'Pause' : 'Listen'}
              </Button>
            </div>
            
            <div className="grid md:grid-cols-1 gap-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-success mb-3">Academic Foundation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-white/80">Essential in algebra</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-white/80">Required for calculus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-white/80">Important in engineering</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-warning mb-3">Real-World Applications</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="text-white/80">Solve rate problems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="text-white/80">Calculate work problems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="text-white/80">Determine concentrations</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-info mb-3">Advanced Concepts</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-info rounded-full"></div>
                    <span className="text-info font-semibold">Understand asymptotes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-info rounded-full"></div>
                    <span className="text-info font-semibold">Study discontinuities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-info rounded-full"></div>
                    <span className="text-info font-semibold">Analyze function behavior</span>
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
      title: "Common Applications",
      icon: <Globe className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card/70 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <h3 className="font-orbitron text-xl text-primary mb-4">Common Applications</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-success mb-3">Physics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-white/80">Calculating rates and velocities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-white/80">Resistances in electrical circuits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-white/80">Force and motion problems</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-warning mb-3">Economics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="text-white/80">Cost and revenue optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="text-white/80">Supply and demand analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="text-white/80">Profit maximization</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-info mb-3">Chemistry</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-info rounded-full"></div>
                    <span className="text-info font-semibold">Mixing solutions with different concentrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-info rounded-full"></div>
                    <span className="text-info font-semibold">Reaction rate calculations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-info rounded-full"></div>
                    <span className="text-info font-semibold">Equilibrium constant problems</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-purple-400 mb-3">Engineering</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-white/80">Signal processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-white/80">Control systems design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-white/80">Circuit analysis</span>
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
      title: "Basic Concepts to Review",
      icon: <BookOpen className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card/70 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-xl text-primary">Basic Concepts to Review</h3>
              <Button
                onClick={() => toggleAudio('/sounds/mercury/Basic Concepts to Review.mp3')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {isAudioPlaying && currentAudioSrc.includes('Basic Concepts') ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isAudioPlaying && currentAudioSrc.includes('Basic Concepts') ? 'Pause' : 'Listen'}
              </Button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
              <h4 className="font-orbitron text-sm text-success mb-3">Prerequisites</h4>
              <p className="text-white/80 text-sm mb-4">
                Before tackling rational equations, ensure you understand these fundamental concepts:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-success mb-3">Polynomials</h4>
                <p className="text-white/80 text-sm mb-2">Example: x² - 4</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-warning mb-3">LCD (Least Common Denominator)</h4>
                <p className="text-white/80 text-sm">Used to combine fractions and eliminate denominators.</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-info mb-3">Linear & Quadratic Equations</h4>
                <p className="text-info font-semibold text-sm">Since rational equations often simplify to these forms.</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-purple-400 mb-3">Factoring</h4>
                <p className="text-white/80 text-sm mb-2">Example (difference of squares):</p>
                <div className="text-center">
                  <BlockMath math="x^2 - 9 = (x + 3)(x - 3)" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 mt-6 border border-white/10">
              <h4 className="font-orbitron text-sm text-success mb-3">Quick Check</h4>
              <p className="text-white/80 text-sm mb-2">
                Can you factor x² - 16? If yes, you're ready to proceed!
              </p>
              <p className="text-white/80 text-sm">
                Answer: (x + 4)(x - 4)
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Steps to Solve Rational Equations",
      icon: <Zap className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-card/70 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-orbitron text-xl text-primary">Steps to Solve Rational Equations</h3>
              <Button
                onClick={() => toggleAudio('/sounds/mercury/Steps To Solve Rational Equations.mp3')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {isAudioPlaying && currentAudioSrc.includes('Steps To Solve') ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isAudioPlaying && currentAudioSrc.includes('Steps To Solve') ? 'Pause' : 'Listen'}
              </Button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
              <h4 className="font-orbitron text-sm text-success mb-3">Step-by-Step Approach</h4>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-success mb-3">1. Identify Restrictions</h4>
                <p className="text-white/80 text-sm">
                  Find values that make any denominator zero. These are excluded from solutions.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-warning mb-3">2. Find LCD</h4>
                <p className="text-white/80 text-sm">
                  Determine the Least Common Denominator of all fractions in the equation.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-info mb-3">3. Multiply by LCD</h4>
                <p className="text-info font-semibold text-sm">
                  Multiply both sides by the LCD to eliminate all denominators.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-purple-400 mb-3">4. Solve Resulting Equation</h4>
                <p className="text-white/80 text-sm">
                  Solve the polynomial equation that results from step 3.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-orbitron text-sm text-success mb-3">5. Check Solutions</h4>
                <p className="text-white/80 text-sm">
                  Verify that solutions don't violate the restrictions from step 1.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "Assessment",
      icon: <Brain className="w-6 h-6" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <h4 className="font-semibold text-white mb-3 text-lg">Q1</h4>
            <p className="text-white/90 mb-3 text-base">What is a rational equation?</p>
            <div className="grid grid-cols-2 gap-2">
              {['An equation with fractions', 'An equation with variables', 'An equation with polynomials', 'An equation with rational expressions'].map((a) => (
                <Button
                  key={a}
                  variant={questionsAnswered[1]?.answer === a ? 
                    (questionsAnswered[1]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    1, 
                    a, 
                    'An equation with rational expressions',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[1]}
                  className="hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                >
                  {a}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[1] && questionsAnswered[1] && !questionsAnswered[1].correct && (
              <div className="bg-red-500/20 rounded-lg p-4 border border-red-300/30 mt-3">
                <h5 className="text-red-200 font-semibold mb-3">💡 Understanding Rational Equations:</h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">KEY POINT: Rational expressions are fractions with polynomials</p>
                    <p>• A rational equation contains at least one rational expression</p>
                    <p>• Rational expressions have polynomials in numerator and/or denominator</p>
                    <p>• Examples: 1/x, (x+1)/(x-2), 3/(x²+1)</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">WHY "rational expressions"?</p>
                    <p>• "Rational" comes from "ratio" - these are ratios of polynomials</p>
                    <p>• They can be written as P(x)/Q(x) where P and Q are polynomials</p>
                    <p>• Q(x) ≠ 0 (denominator cannot be zero)</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[1] && questionsAnswered[1] && questionsAnswered[1].correct && (
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30 mt-3">
                <p className="text-green-200 font-semibold">✅ Excellent! You correctly identified rational equations.</p>
              </div>
            )}
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <h4 className="font-semibold text-white mb-3 text-lg">Q2</h4>
            <p className="text-white/90 mb-3 text-base">What are restrictions in rational equations?</p>
            <div className="grid grid-cols-2 gap-2">
              {['Values that make the equation true', 'Values that make denominators zero', 'Values that solve the equation', 'Values that make numerators zero'].map((a) => (
                <Button
                  key={a}
                  variant={questionsAnswered[2]?.answer === a ? 
                    (questionsAnswered[2]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    2, 
                    a, 
                    'Values that make denominators zero',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[2]}
                  className="hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                >
                  {a}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[2] && questionsAnswered[2] && !questionsAnswered[2].correct && (
              <div className="bg-red-500/20 rounded-lg p-4 border border-red-300/30 mt-3">
                <h5 className="text-red-200 font-semibold mb-3">💡 Understanding Restrictions:</h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">WHY do we have restrictions?</p>
                    <p>• Division by zero is undefined in mathematics</p>
                    <p>• If a denominator equals zero, the fraction becomes undefined</p>
                    <p>• Example: 1/(x-3) is undefined when x = 3</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">HOW to find restrictions:</p>
                    <p>• Set each denominator equal to zero</p>
                    <p>• Solve for the variable</p>
                    <p>• These values are excluded from solutions</p>
                  </div>
                  <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                    <p className="text-green-200 text-xs">✓ Example: For 1/(x-2) + 1/(x+1), restrictions are x ≠ 2 and x ≠ -1</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[2] && questionsAnswered[2] && questionsAnswered[2].correct && (
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30 mt-3">
                <p className="text-green-200 font-semibold">✅ Perfect! You understand restrictions correctly.</p>
              </div>
            )}
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <h4 className="font-semibold text-white mb-3 text-lg">Q3</h4>
            <p className="text-white/90 mb-3 text-base">What is the first step in solving rational equations?</p>
            <div className="grid grid-cols-2 gap-2">
              {['Find the LCD', 'Identify restrictions', 'Multiply by denominators', 'Cross multiply'].map((a) => (
                <Button
                  key={a}
                  variant={questionsAnswered[3]?.answer === a ? 
                    (questionsAnswered[3]?.correct ? "default" : "destructive") : "outline"}
                  size="sm"
                  onClick={() => handleQuizAnswer(
                    3, 
                    a, 
                    'Identify restrictions',
                    "Step-by-step explanation shown below"
                  )}
                  disabled={!!questionsAnswered[3]}
                  className="hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]"
                >
                  {a}
                </Button>
              ))}
            </div>
            {showQuestionFeedback[3] && questionsAnswered[3] && !questionsAnswered[3].correct && (
              <div className="bg-red-500/20 rounded-lg p-4 border border-red-300/30 mt-3">
                <h5 className="text-red-200 font-semibold mb-3">💡 Solving Rational Equations - Step Order:</h5>
                <div className="text-white/90 text-sm space-y-3">
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 1: Identify restrictions FIRST</p>
                    <p>• Find values that make any denominator zero</p>
                    <p>• These values are excluded from solutions</p>
                    <p>• Write them down: x ≠ 2, x ≠ -1, etc.</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 2: Find the LCD</p>
                    <p>• Determine the Least Common Denominator</p>
                    <p>• This will eliminate all fractions</p>
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <p className="font-semibold text-yellow-200 mb-1">STEP 3: Multiply through by LCD</p>
                    <p>• This converts to a polynomial equation</p>
                    <p>• Much easier to solve!</p>
                  </div>
                  <div className="bg-green-500/20 rounded p-2 border border-green-300/30">
                    <p className="text-green-200 text-xs">✓ Always check restrictions first to avoid undefined operations!</p>
                  </div>
                </div>
              </div>
            )}
            {showQuestionFeedback[3] && questionsAnswered[3] && questionsAnswered[3].correct && (
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-300/30 mt-3">
                <p className="text-green-200 font-semibold">✅ Great! You know the correct order of steps.</p>
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

  const handleNextSection = async () => {
    if (currentSection < sections.length - 1) {
      const newSection = currentSection + 1;
      setCurrentSection(newSection);
      const newProgress = ((newSection + 1) / sections.length) * 100;
      setProgress(newProgress);
      
      // Save progress to new tracking system
      if (user?.id) {
        await saveProgress(user.id, {
          module_id: 'mercury',
          section_id: `section_${newSection}`,
          slide_index: newSection,
          progress_pct: newProgress,
        });
      }
    }
  };

  const handlePrevSection = async () => {
    if (currentSection > 0) {
      const newSection = currentSection - 1;
      setCurrentSection(newSection);
      const newProgress = ((newSection + 1) / sections.length) * 100;
      setProgress(newProgress);
      
      // Save progress to new tracking system
      if (user?.id) {
        await saveProgress(user.id, {
          module_id: 'mercury',
          section_id: `section_${newSection}`,
          slide_index: newSection,
          progress_pct: newProgress,
        });
      }
    }
  };

  const handleSectionClick = async (sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    const newProgress = ((sectionIndex + 1) / sections.length) * 100;
    setProgress(newProgress);
    
    // Save progress to new tracking system
    if (user?.id) {
      await saveProgress(user.id, {
        module_id: 'mercury',
        section_id: `section_${sectionIndex}`,
        slide_index: sectionIndex,
        progress_pct: newProgress,
      });
    }
  };

  const handleNextDialogue = () => {
    if (showDialogue) {
      setShowDialogue(false);
    }
  };

  const handleGoBack = () => {
    navigate('/index');
  };

  const handleFinishLesson = async () => {
    // Award XP for completing the Mercury lesson
    awardXP(200, 'mercury-lesson-completed');
    
    // Save achievement
    if (user?.id) {
      saveAchievement({
        userId: user.id,
        lessonId: 'mercury-lesson',
        lessonName: 'Mercury: Intro to Rational Equations',
        lessonType: 'solar-system',
        xpEarned: 200,
        planetName: 'Mercury',
      });
    }
    
    // Save current lesson (Mercury) as completed
    await saveProgress(user.id, { module_id: 'mercury', section_id: 'section_0', slide_index: sections.length - 1, progress_pct: 100 });
    
    // Also save progress for next planet (Venus) so it shows up in "In Progress"
    if (user?.id) {
      await saveProgress(user.id, {
        module_id: 'venus',
        section_id: 'section_0',
        slide_index: 0,
        progress_pct: 0, // Starting fresh on next lesson
      });
    }
    
    // Show completion dialog instead of navigating directly
    setShowCompletionDialog(true);
  };

  const handleContinueToNext = () => {
    navigate('/venus-lesson');
  };

  const handleBackToSolarSystem = () => {
    saveProgress(user.id, { module_id: 'venus', section_id: 'section_0', slide_index: 0, progress_pct: 0 });
    navigate('/rpg');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with parallax and vignette */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${mercuryBg})` }}
        initial={{ scale: 1.02, x: 0, y: 0 }}
        animate={{ scale: 1.05, x: 5, y: 3 }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
      <div className="absolute inset-0 cosmic-starfield opacity-30" />
      <div className="absolute inset-0 bg-radial-vignette" />

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
                  onClick={handleGoBack}
                  className="flex items-center gap-2 text-white hover:bg-white/10"
                >
                  <ArrowLeft size={16} />
                  Back to Solar System
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGoBack}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  <Home size={16} className="mr-1" />
                  Exit Lesson
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                  <Star size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="font-orbitron font-bold text-xl bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent">
                    Mercury — Intro to Rational Equations
                  </h1>
                  <p className="text-xs text-white/60">Level {userLevel} • {userXP}/{maxXP} XP</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/rpg')} className="text-white border-white/20 hover:bg-white/10">
                <Home size={16} />
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Progress Bar */}
        <div className="container mx-auto px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-white/80 text-sm font-orbitron">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Section Navigation */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.map((section, index) => (
                  <motion.button
                    key={section.id}
                    onClick={() => handleSectionClick(index)}
                    className={`p-4 rounded-lg border transition-all ${
                      currentSection === index
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        currentSection === index ? 'bg-white/20' : 'bg-white/10'
                      }`}>
                        {section.icon}
                      </div>
                      <div className="text-left">
                        <h3 className="font-orbitron font-semibold text-sm">{section.title}</h3>
                        <p className="text-xs opacity-60">Section {index + 1}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

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
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
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
      
      {/* Global Audio Element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="metadata"
      />

      {/* Lesson Completion Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent className="border-cosmic-purple/20 bg-cosmic-dark/95 backdrop-blur-md">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-2xl font-orbitron text-cosmic-purple">
              🎉 Mercury Lesson Complete!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cosmic-text text-center">
              Excellent work! You've mastered the basic concepts of rational equations. 
              <br />
              <strong className="text-cosmic-green">Venus lesson is now unlocked!</strong>
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
              Continue to Venus 🌅
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MercuryLesson;
