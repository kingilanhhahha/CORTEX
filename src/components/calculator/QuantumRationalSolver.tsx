import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import Confetti from 'react-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  Send,
  RefreshCw,
  Sparkles,
  Brain,
  Target,
  Zap,
  BookOpen,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface AnalysisData {
  function: string;
  cleaned_function: string;
  factored_form: string;
  domain: string;
  domain_restrictions: string[];
  zeros: string[];
  x_intercepts: string[];
  y_intercept: string;
  vertical_asymptotes: string[];
  horizontal_asymptote: string;
  oblique_asymptote: string;
  holes: string[];
  steps: string[];
}

interface QuantumRationalSolverProps {
  className?: string;
}

export const QuantumRationalSolver: React.FC<QuantumRationalSolverProps> = ({ className }) => {
  const [inputFunction, setInputFunction] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepByStep, setIsStepByStep] = useState(false);
  const [stepInterval, setStepInterval] = useState<NodeJS.Timeout | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Example functions for quick input
  const exampleFunctions = [
    '(x^2-8x-20)/(x+3)',
    '(x^2-4)/(x-2)',
    '(x^3-1)/(x^2-1)',
    '(2x^2+5x-3)/(x^2-9)',
    '(x^2+2x+1)/(x+1)'
  ];

  const analyzeFunction = async () => {
    if (!inputFunction.trim()) {
      setError('Please enter a rational function');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('http://localhost:5001/api/rational-function/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function: inputFunction.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.analysis);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to connect to the solver. Please make sure the backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startStepByStep = () => {
    if (!analysisResult) return;
    
    setIsStepByStep(true);
    setCurrentStep(0);
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= analysisResult.steps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
    
    setStepInterval(interval);
  };

  const pauseStepByStep = () => {
    if (stepInterval) {
      clearInterval(stepInterval);
      setStepInterval(null);
    }
  };

  const resetStepByStep = () => {
    if (stepInterval) {
      clearInterval(stepInterval);
      setStepInterval(null);
    }
    setCurrentStep(0);
    setIsStepByStep(false);
  };

  const selectExample = (example: string) => {
    setInputFunction(example);
    setError(null);
    setAnalysisResult(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    return () => {
      if (stepInterval) {
        clearInterval(stepInterval);
      }
    };
  }, [stepInterval]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 ${className}`}>
      {showConfetti && <Confetti />}
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Quantum Rational Function Solver
          </span>
        </h1>
        <p className="text-xl text-gray-300">
          Advanced analysis with step-by-step solutions
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <Card className="bg-black/20 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <Calculator className="text-purple-400" />
              Enter Rational Function
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={inputFunction}
                onChange={(e) => setInputFunction(e.target.value)}
                placeholder="e.g., (x^2-8x-20)/(x+3)"
                className="flex-1 bg-black/30 border-purple-500/50 text-white placeholder:text-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && analyzeFunction()}
              />
              <Button
                onClick={analyzeFunction}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>

            {/* Example Functions */}
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Quick examples:</p>
              <div className="flex flex-wrap gap-2">
                {exampleFunctions.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => selectExample(example)}
                    className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto mb-6"
        >
          <Alert className="border-red-500/50 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Results Section */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          {/* Function Display */}
          <Card className="bg-black/20 border-cyan-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-3">
                <Target className="text-cyan-400" />
                Function Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Original Function</h4>
                  <div className="bg-black/30 p-3 rounded-lg border border-gray-600">
                    <BlockMath math={`f(x) = ${analysisResult.cleaned_function}`} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Factored Form</h4>
                  <div className="bg-black/30 p-3 rounded-lg border border-gray-600">
                    <BlockMath math={`f(x) = ${analysisResult.factored_form}`} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Domain */}
            <Card className="bg-black/20 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <BookOpen className="text-purple-400 w-5 h-5" />
                  Domain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{analysisResult.domain}</p>
                {analysisResult.domain_restrictions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">Restrictions:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analysisResult.domain_restrictions.map((restriction, index) => (
                        <Badge key={index} variant="outline" className="border-red-500/50 text-red-300">
                          x ≠ {restriction}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Zeros */}
            <Card className="bg-black/20 border-cyan-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Target className="text-cyan-400 w-5 h-5" />
                  Zeros
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult.zeros.length > 0 ? (
                  <div className="space-y-2">
                    {analysisResult.zeros.map((zero, index) => (
                      <Badge key={index} variant="outline" className="border-cyan-500/50 text-cyan-300">
                        x = {zero}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No zeros</p>
                )}
              </CardContent>
            </Card>

            {/* Asymptotes */}
            <Card className="bg-black/20 border-orange-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Zap className="text-orange-400 w-5 h-5" />
                  Asymptotes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysisResult.vertical_asymptotes.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400">Vertical:</p>
                    {analysisResult.vertical_asymptotes.map((va, index) => (
                      <Badge key={index} variant="outline" className="border-orange-500/50 text-orange-300">
                        x = {va}
                      </Badge>
                    ))}
                  </div>
                )}
                {analysisResult.horizontal_asymptote && (
                  <div>
                    <p className="text-sm text-gray-400">Horizontal:</p>
                    <Badge variant="outline" className="border-orange-500/50 text-orange-300">
                      {analysisResult.horizontal_asymptote}
                    </Badge>
                  </div>
                )}
                {analysisResult.oblique_asymptote && (
                  <div>
                    <p className="text-sm text-gray-400">Oblique:</p>
                    <Badge variant="outline" className="border-orange-500/50 text-orange-300">
                      {analysisResult.oblique_asymptote}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Step-by-Step Controls */}
          <Card className="bg-black/20 border-green-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-3">
                <Brain className="text-green-400" />
                Step-by-Step Solution
                <div className="flex gap-2 ml-auto">
                  <Button
                    onClick={startStepByStep}
                    disabled={isStepByStep}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </Button>
                  <Button
                    onClick={pauseStepByStep}
                    disabled={!isStepByStep || !stepInterval}
                    size="sm"
                    variant="outline"
                    className="border-green-500/50 text-green-300"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                  <Button
                    onClick={resetStepByStep}
                    size="sm"
                    variant="outline"
                    className="border-gray-500/50 text-gray-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/30 p-4 rounded-lg border border-gray-600 min-h-[200px]">
                {isStepByStep && analysisResult.steps[currentStep] ? (
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-white"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-green-600 text-white">Step {currentStep + 1}</Badge>
                      <span className="text-gray-400">
                        {currentStep + 1} of {analysisResult.steps.length}
                      </span>
                    </div>
                    <p className="text-lg leading-relaxed">{analysisResult.steps[currentStep]}</p>
                  </motion.div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p>Click "Start" to begin the step-by-step solution</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Raw Steps */}
          <Card className="bg-black/20 border-blue-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Sparkles className="text-blue-400 w-5 h-5" />
                Complete Solution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/30 p-4 rounded-lg border border-gray-600 max-h-96 overflow-y-auto">
                {analysisResult.steps.map((step, index) => (
                  <div key={index} className="text-gray-300 py-2 border-b border-gray-700 last:border-b-0">
                    {step}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Instructions */}
      {!analysisResult && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl mx-auto text-center"
        >
          <Card className="bg-black/20 border-gray-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-gray-400 space-y-4">
                <p className="text-lg">
                  Enter a rational function in the form f(x) = p(x)/q(x)
                </p>
                <div className="text-sm space-y-2">
                  <p>Examples of valid formats:</p>
                  <ul className="space-y-1 text-left max-w-md mx-auto">
                    <li>• (x^2-8x-20)/(x+3)</li>
                    <li>• (x^2-4)/(x-2)</li>
                    <li>• (x^3-1)/(x^2-1)</li>
                    <li>• (2x^2+5x-3)/(x^2-9)</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500">
                  The solver will provide step-by-step analysis including domain, zeros, asymptotes, and more.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default QuantumRationalSolver;
