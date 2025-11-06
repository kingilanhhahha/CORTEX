import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Pencil, 
  XCircle, 
  Brain,
  Zap,
  BookOpen,
  Eraser
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { formatSolutionOutput, renderSolutionSection, renderSolutionAsText } from '@/utils/solutionFormatter';

interface DrawingSolverSimpleProps {
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

export const DrawingSolverSimple: React.FC<DrawingSolverSimpleProps> = ({ className }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
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
    setIsDrawing(false);
    if (currentPath.length > 0) {
      setDrawingHistory(prev => [...prev, currentPath]);
      setCurrentPath([]);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDrawingHistory([]);
    setCurrentPath([]);
  };

  const processDrawing = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOcrResult({
        latex_raw: '\\frac{x^2 - 4}{x - 2} = x + 2',
        sympy_out: 'Eq((x**2 - 4)/(x - 2), x + 2)'
      });
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err) {
      setError(`Processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const solveEquation = async () => {
    setIsProcessing(true);
    setError(null);
    setSolutionResult(null);

    try {
      // Simulate solving
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSolutionResult({
        solution: `**Step-by-Step Solution with Teacher-Level Explanations:**

---

### **Raw Equation:**
(x^2 - 4)/(x - 2) = x + 2
*(We're solving for x in this fraction equation)*

---

### **Step 1: Find and Factor All Denominators**
**TEACHER'S VOICE:**
"Let's look carefully at all bottom parts (denominators):
1. There is one fraction with x - 2 at the bottom
2. Since x - 2 is already simple, we don't need to factor it further
3. Any constant terms have an invisible denominator of 1"

INSTRUCTION: First, let's examine all the denominators in our equation - these are the bottom parts of our fractions. We have one simple denominator here that can't be factored further. Remember, we must also identify any x-values that would make this denominator zero, as those would make our equation undefined.

x - 2  # Already in simplest form

INSTRUCTION: Values that would break the math.

x = 2 (because 5/0 is undefined)  # Never allowed

• LCD: x - 2  # This is our magic cleaner for all fractions

---

### **Step 2: Multiply Both Sides by LCD**
**TEACHER'S VOICE:**
"Now we multiply everything by our LCD to eliminate fractions"

(x^2 - 4)/(x - 2) * (x - 2) = (x + 2) * (x - 2)

x^2 - 4 = (x + 2)(x - 2)

---

### **Step 3: Expand and Simplify**
**TEACHER'S VOICE:**
"Let's expand the right side and see what we get"

x^2 - 4 = x^2 - 4

---

### **Step 4: Analyze the Result**
**TEACHER'S VOICE:**
"This is interesting! Both sides are identical, which means..."

x^2 - 4 = x^2 - 4

0 = 0

This equation is always true for any value of x, except x = 2 (which makes the denominator zero).

---

**Final Answer:**
x = 2
*(The solution checks out mathematically!)*`,
        steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4']
      });
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
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
            🎨 Drawing Equation Solver (Simple)
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
                        onClick={processDrawing}
                        disabled={isProcessing}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        {isProcessing ? 'Processing...' : 'Process Drawing'}
                      </Button>
                      <Button
                        onClick={clearCanvas}
                        variant="outline"
                        className="border-slate-500 text-slate-300 hover:bg-slate-700"
                      >
                        <Eraser className="w-4 h-4" />
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Enter Equation:
                      </label>
                      <Input
                        value={manualEquation}
                        onChange={(e) => setManualEquation(e.target.value)}
                        placeholder="Enter your equation here..."
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    
                    <Button
                      onClick={solveEquation}
                      disabled={isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Solving...' : 'Solve Equation'}
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
                            <div className="bg-slate-600 p-3 rounded border border-slate-500">
                              <BlockMath math={ocrResult.latex_raw} />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2 text-purple-300">SymPy Expression:</h4>
                          <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                            <div className="bg-slate-600 p-3 rounded border border-slate-500 font-mono text-sm">
                              <code className="text-green-300">{String(ocrResult.sympy_out)}</code>
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
