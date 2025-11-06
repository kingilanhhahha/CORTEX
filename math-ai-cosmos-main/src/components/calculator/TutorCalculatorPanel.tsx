import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import Confetti from 'react-confetti';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import XPBar from '@/components/game/XPBar';
import { 
  Pencil, 
  Keyboard, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  Trash2,
  Send,
  RefreshCw,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface StepData {
  id: number;
  title: string;
  equation: string;
  explanation: string;
  status: 'correct' | 'incorrect' | 'pending';
  aiComment: string;
}

interface TutorExpression {
  type: 'happy' | 'thinking' | 'concerned' | 'excited' | 'encouraging';
  message: string;
}

export const TutorCalculatorPanel: React.FC = () => {
  const [inputMode, setInputMode] = useState<'handwriting' | 'keyboard'>('handwriting');
  const [keyboardInput, setKeyboardInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [xpProgress, setXpProgress] = useState(65);
  const [tutorExpression, setTutorExpression] = useState<TutorExpression>({
    type: 'encouraging',
    message: "Let's solve this rational equation step by step! Start by writing or typing the equation."
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCanvasActive, setIsCanvasActive] = useState(false);

  const [steps, setSteps] = useState<StepData[]>([
    {
      id: 1,
      title: "Original Equation",
      equation: "\\frac{x+2}{x-3} = \\frac{1}{2}",
      explanation: "This is our starting rational equation.",
      status: 'correct',
      aiComment: "Perfect! Now let's eliminate the denominators."
    }
  ]);

  // Canvas drawing functionality
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setIsCanvasActive(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsCanvasActive(false);
  };

  const submitEquation = () => {
    // Simulate AI processing
    const newStep: StepData = {
      id: steps.length + 1,
      title: `Step ${steps.length}`,
      equation: "2(x+2) = x-3",
      explanation: "Multiply both sides by 2(x-3) to eliminate denominators.",
      status: 'correct',
      aiComment: "Excellent work! You've successfully eliminated the fractions."
    };

    setSteps(prev => [...prev, newStep]);
    setCurrentStep(prev => prev + 1);
    setXpProgress(prev => Math.min(prev + 15, 100));
    
    setTutorExpression({
      type: 'happy',
      message: "Great job! Now let's simplify this equation further."
    });

    if (steps.length >= 3) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setTutorExpression({
        type: 'excited',
        message: "🎉 Amazing! You've mastered this problem! Ready for the next challenge?"
      });
    }
  };

  const getTutorAvatar = () => {
    const expressions = {
      happy: "😊",
      thinking: "🤔",
      concerned: "😕",
      excited: "🤩",
      encouraging: "💪"
    };
    return expressions[tutorExpression.type];
  };

  const getTutorColor = () => {
    const colors = {
      happy: "from-success to-success-light",
      thinking: "from-primary to-primary-light",
      concerned: "from-destructive to-destructive-light",
      excited: "from-accent to-accent-light",
      encouraging: "from-primary to-accent"
    };
    return colors[tutorExpression.type];
  };

  return (
    <div className="min-h-screen bg-cosmic-dark p-6">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      {/* Header with XP Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="font-orbitron text-3xl font-bold text-center mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Rational Equation Solver
          </h1>
          <XPBar currentXP={xpProgress} maxXP={100} level={3} showLevel={true} />
        </div>
      </motion.div>

      {/* Main Split Layout */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
        
        {/* Left Side: Whiteboard Area */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <Card className="bg-gradient-card border-primary/30 shadow-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-xl text-card-foreground">
                Equation Input
              </CardTitle>
              
              {/* Input Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={inputMode === 'handwriting' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputMode('handwriting')}
                  className="transition-all duration-200"
                >
                  <Pencil size={16} className="mr-2" />
                  Handwriting ✍️
                </Button>
                <Button
                  variant={inputMode === 'keyboard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputMode('keyboard')}
                  className="transition-all duration-200"
                >
                  <Keyboard size={16} className="mr-2" />
                  Keyboard ⌨️
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <AnimatePresence mode="wait">
                {inputMode === 'handwriting' ? (
                  <motion.div
                    key="handwriting"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative"
                  >
                    <div className={`
                      relative bg-card rounded-lg border-2 shadow-md w-full h-[300px] overflow-hidden
                      ${isCanvasActive ? 'border-primary glow-border' : 'border-border'}
                      transition-all duration-300
                    `}>
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 cursor-crosshair"
                        style={{ width: '100%', height: '100%' }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                      
                      <div className="absolute top-2 right-2 z-10 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearCanvas}
                          className="bg-card/90 hover:bg-accent"
                        >
                          <Trash2 size={14} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={submitEquation}
                          className="bg-gradient-primary hover:opacity-90"
                        >
                          <Send size={14} className="mr-1" />
                          Submit
                        </Button>
                      </div>
                    </div>
                    
                    {!isCanvasActive && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-muted-foreground text-center">
                          Draw your equation here...
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="keyboard"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                  >
                    <Input
                      value={keyboardInput}
                      onChange={(e) => setKeyboardInput(e.target.value)}
                      placeholder="Enter equation: (x+2)/(x-3) = 1/2"
                      className="text-lg h-12"
                    />
                    <Button
                      onClick={submitEquation}
                      className="w-full bg-gradient-primary hover:opacity-90"
                    >
                      <Send size={16} className="mr-2" />
                      Solve Equation
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Side: AI Tutor + Calculator Panel */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          
          {/* AI Tutor */}
          <Card className="bg-gradient-card border-primary/30 shadow-card backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatType: "reverse" 
                  }}
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-2xl
                    bg-gradient-to-br ${getTutorColor()} shadow-lg
                  `}
                >
                  {getTutorAvatar()}
                </motion.div>
                
                <div className="flex-1">
                  <h3 className="font-orbitron font-semibold text-primary mb-2">
                    AI Math Tutor
                  </h3>
                  <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                    <TypeAnimation
                      sequence={[tutorExpression.message, 1000]}
                      wrapper="p"
                      speed={80}
                      className="text-card-foreground leading-relaxed"
                      repeat={0}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Solution Steps */}
          <Card className="bg-gradient-card border-primary/30 shadow-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-xl text-card-foreground flex items-center gap-2">
                <Sparkles className="text-accent" size={20} />
                Solution Steps
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Collapsible defaultOpen={index === 0}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between hover:bg-accent/10 p-4"
                      >
                        <div className="flex items-center gap-3">
                          {step.status === 'correct' ? (
                            <CheckCircle className="text-success" size={20} />
                          ) : step.status === 'incorrect' ? (
                            <XCircle className="text-destructive" size={20} />
                          ) : (
                            <div className="w-5 h-5 border-2 border-primary rounded-full animate-pulse" />
                          )}
                          <span className="font-medium">{step.title}</span>
                        </div>
                        <ChevronDown size={16} />
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="bg-accent/5 rounded-lg p-4 space-y-3">
                        <div className="font-mono text-lg bg-card rounded p-3 border">
                          {step.equation}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {step.explanation}
                        </p>
                        <div className="flex items-start gap-2 bg-primary/10 rounded-lg p-3">
                          <Lightbulb className="text-primary mt-0.5" size={16} />
                          <p className="text-sm text-primary font-medium">
                            {step.aiComment}
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              ))}
              
              {/* Next Step Placeholder */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-2 border-dashed border-primary/30 rounded-lg p-4 text-center"
              >
                <p className="text-muted-foreground">
                  {currentStep > steps.length ? "Problem Complete! 🎉" : "Next step will appear here..."}
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};