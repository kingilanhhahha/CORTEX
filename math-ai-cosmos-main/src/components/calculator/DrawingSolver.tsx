import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import Confetti from 'react-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Pencil, 
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
  RotateCcw,
  Eraser,
  Download,
  Upload
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { formatSolutionOutput, renderSolutionSection, renderSolutionAsText } from '@/utils/solutionFormatter';

interface DrawingSolverProps {
  className?: string;
}

interface OCRResult {
  latex_raw: string;
  sympy_out: any;
  error?: string;
}

interface SolutionResult {
  solution: string;
  steps: string[];
  error?: string;
}

export const DrawingSolver: React.FC<DrawingSolverProps> = ({ className }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [solutionResult, setSolutionResult] = useState<SolutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualEquation, setManualEquation] = useState('Eq((x**2 - 4)/(x - 2), x + 2)');
  const [activeTab, setActiveTab] = useState('drawing');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCanvasActive, setIsCanvasActive] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<Array<{ x: number; y: number }[]>>([]);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);

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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setCurrentPath([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (currentPath.length > 0) {
        setDrawingHistory(prev => [...prev, currentPath]);
        setCurrentPath([]);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setDrawingHistory([]);
    setCurrentPath([]);
  };

  const getCanvasImage = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    return canvas.toDataURL('image/png');
  };

  const processDrawing = async () => {
    if (drawingHistory.length === 0 && currentPath.length === 0) {
      setError('Please draw something first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setOcrResult(null);

    try {
      const imageData = getCanvasImage();
      if (!imageData) {
        setError('Failed to capture drawing');
        return;
      }

      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Create FormData for the API
      const formData = new FormData();
      formData.append('image', blob, 'drawing.png');

      // Call the OCR API
      const ocrResponse = await fetch('http://localhost:5001/api/ocr/process', {
        method: 'POST',
        body: formData
      });

      if (!ocrResponse.ok) {
        throw new Error('OCR processing failed');
      }

      const ocrData = await ocrResponse.json();
      
      if (ocrData.error) {
        setError(ocrData.error);
      } else {
        setOcrResult(ocrData);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (err) {
      setError(`OCR processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const solveEquation = async () => {
    if (!ocrResult?.sympy_out && !manualEquation.trim()) {
      setError('Please process a drawing or enter an equation first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSolutionResult(null);

    try {
      let equationStr = manualEquation.trim();
      
      if (ocrResult?.sympy_out) {
        // Convert sympy output to string format for the solver
        if (ocrResult.sympy_out.lhs && ocrResult.sympy_out.rhs) {
          equationStr = `${ocrResult.sympy_out.lhs}=${ocrResult.sympy_out.rhs}`;
        } else {
          equationStr = String(ocrResult.sympy_out);
        }
      }

      // Call the solver API
      const solverResponse = await fetch('http://localhost:5001/api/solver/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equation: equationStr
        })
      });

      if (!solverResponse.ok) {
        throw new Error('Equation solving failed');
      }

      const solverData = await solverResponse.json();
      
      if (solverData.error) {
        setError(solverData.error);
      } else {
        setSolutionResult(solverData);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (err) {
      setError(`Solving error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white ${className || ''}`}>
      {showConfetti && <Confetti />}
      
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎨 Drawing Equation Solver
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Draw your mathematical equations and let AI solve them step-by-step with detailed explanations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Drawing and Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="w-5 h-5" />
                  Drawing Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="drawing">Draw</TabsTrigger>
                    <TabsTrigger value="manual">Manual Input</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="drawing" className="space-y-4">
                    <div className="border-2 border-dashed border-slate-500 rounded-lg p-4">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-80 bg-white rounded cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={clearCanvas}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eraser className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        onClick={processDrawing}
                        disabled={isProcessing || (drawingHistory.length === 0 && currentPath.length === 0)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Process Drawing
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Enter Equation:</label>
                      <Input
                        value={manualEquation}
                        onChange={(e) => setManualEquation(e.target.value)}
                        placeholder="e.g., Eq((x**2 - 4)/(x - 2), x + 2)"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    
                    <Button
                      onClick={solveEquation}
                      disabled={isProcessing || !manualEquation.trim()}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Solve Equation
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Panel - Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Results & Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ocr" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ocr">OCR Results</TabsTrigger>
                    <TabsTrigger value="solution">Solution</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="ocr" className="space-y-4">
                    {error && (
                      <Alert className="border-red-500 bg-red-500/10">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {ocrResult && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-green-300">LaTeX Output:</h4>
                          <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                            {ocrResult.latex_raw ? (
                              <div className="bg-slate-600 p-3 rounded border border-slate-500">
                                <BlockMath math={ocrResult.latex_raw} />
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No LaTeX output available</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2 text-purple-300">SymPy Expression:</h4>
                          <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                            <div className="bg-slate-600 p-3 rounded border border-slate-500 font-mono text-sm">
                              {ocrResult.sympy_out ? (
                                <code className="text-green-300">{String(ocrResult.sympy_out)}</code>
                              ) : (
                                <span className="text-gray-400 italic">No SymPy output available</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={solveEquation}
                          disabled={isProcessing}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          {isProcessing ? 'Solving...' : 'Solve This Equation'}
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="solution" className="space-y-4">
                    {solutionResult && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-blue-300">Step-by-Step Solution:</h4>
                          <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm font-mono bg-slate-800 p-4 rounded-lg border border-slate-600 text-green-300">
                              {renderSolutionAsText(formatSolutionOutput(solutionResult.solution))}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isProcessing && (
                      <div className="text-center text-blue-300 py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                        <p className="text-lg font-semibold">Solving your equation...</p>
                        <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
                      </div>
                    )}
                    
                    {!solutionResult && !isProcessing && (
                      <div className="text-center text-gray-400 py-8">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Process a drawing or enter an equation to see the solution</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-600">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">
              {isProcessing ? 'Processing...' : 'Ready to solve equations'}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export { DrawingSolver };
