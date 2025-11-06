import React, { useState, useRef, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MathKeyboard from '@/components/calculator/MathKeyboard';
import simpleToSympy, { simpleToLatex } from '@/utils/simpleToSympy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import ErrorBoundary from '@/components/common/ErrorBoundary';

import { 
  Pencil, 
  XCircle, 
  Lightbulb, 
  Send,
  RefreshCw,
  Sparkles,
  Brain,
  Zap,
  BookOpen,
  Play,
  Eraser,
  Download,
  Upload
} from 'lucide-react';

const solutionModeLabels: Record<'raw' | 'process' | 'shortcut', string> = {
  raw: 'Raw Explanation',
  process: 'Solution Process',
  shortcut: 'Shortcut (LaTeX)',
};

function wrapEquation(raw: string): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('Eq(')) return trimmed;
  if (trimmed.includes('=')) {
    const parts = trimmed.split('=');
    if (parts.length === 2) {
      return `Eq(${parts[0].trim()}, ${parts[1].trim()})`;
    }
  }
  return trimmed;
}

interface EquationPayload {
  equation: string | null;
  fromOCR: boolean;
  convertedManual?: string | null;
}

interface CheckerSuccessResult {
  status: 'ok';
  input: {
    original_equation: string;
    student_answer: string;
    student_solution_lines: string[];
  };
  preprocessing: {
    lhs: string;
    rhs: string;
    denominators: string[];
    restrictions: string[];
    lcd: string | null;
    simplified_lhs: string | null;
    simplified_rhs: string | null;
  };
  student_detection: {
    mentions_denominators: boolean;
    mentions_restrictions: boolean;
    mentions_lcd: boolean;
    shows_simplified_equation: boolean;
    mentions_verification?: boolean;
    shows_verification_work?: boolean;
  };
  parsed_solution: {
    normalized_lines: string[];
    equations: string[];
    notes: string[];
  };
  evaluation: {
    answer_correct: boolean;
    student_value: string | null;
    actual_solutions: string[];
    extraneous_solutions: string[];
  };
  feedback?: string[];
  step_by_step: string[];
  verification?: {
    mentions_verification: boolean;
    shows_verification_work: boolean;
    score: number;
    details: string[];
    feedback: string[];
    examples: string[];
    analysis: string[];
    steps: string[];
  };
}

const CenteredLatex: React.FC<{ math: string }> = ({ math }) => (
  <div className="w-full overflow-auto">
    <div className="flex justify-center">
      <div className="inline-block px-4">
        <BlockMath math={math} errorColor="#f87171" throwOnError={false} />
      </div>
    </div>
  </div>
);

interface DrawingSolverProps {
  className?: string;
}

interface OCRResult {
  latex_raw: string;
  sympy_out: any;
  pretty?: string;
  solutions?: string;
  warning?: string;
  error?: string;
}

interface OCRCapture extends OCRResult {
  plainText: string;
}

interface SolutionResult {
  solution: string;
  steps?: string[];
  error?: string;
  mode?: 'raw' | 'process' | 'shortcut';
  latex?: string | null;
}

interface HistoryEntry {
  equation: string;
  solution: string;
  timestamp: Date;
  imageDataUrl?: string;
  latex?: string;
  steps?: string[];
  solutionMode?: 'raw' | 'process' | 'shortcut';
  solutionLatex?: string | null;
}

const DrawingSolver: React.FC<DrawingSolverProps> = ({ className }) => {
  const navigate = useNavigate();
  const API_BASE = (import.meta as any)?.env?.VITE_DRAWING_API_BASE || `${window.location.protocol}//${window.location.hostname}:5001`;

  const [showCinematicTitle, setShowCinematicTitle] = useState(true);
  
  // Auto-hide cinematic title after animation completes
  useEffect(() => {
    if (showCinematicTitle) {
      // Reduced to 5 seconds total - much faster!
      const timer = setTimeout(() => {
        setShowCinematicTitle(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showCinematicTitle]);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [ocrResults, setOcrResults] = useState<OCRCapture[]>([]);
  const [solutionResult, setSolutionResult] = useState<SolutionResult | null>(null);
  const [checkerResult, setCheckerResult] = useState<CheckerSuccessResult | null>(null);
  const [solutionMode, setSolutionMode] = useState<'raw' | 'process' | 'shortcut'>('raw');
  const [error, setError] = useState<string | null>(null);
  const [checkerError, setCheckerError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [manualEquation, setManualEquation] = useState('Eq((x**2 - 4)/(x - 2), x + 2)');
  const [activeTab, setActiveTab] = useState<'drawing' | 'manual'>('drawing');
  const [resultsTab, setResultsTab] = useState<'ocr' | 'solution' | 'history' | 'checker' | 'demo'>('ocr');
  const [solverMode, setSolverMode] = useState<'equation' | 'rational_function'>('equation');
  const [brushSize, setBrushSize] = useState(3);
  const [brushColor, setBrushColor] = useState('#000000');
  const [showTutorial, setShowTutorial] = useState(false);
  const [equationHistory, setEquationHistory] = useState<HistoryEntry[]>([]);
  const [viewingSolution, setViewingSolution] = useState<HistoryEntry | null>(null);
  const [isSolutionFullscreen, setIsSolutionFullscreen] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState<'pretty' | 'sympy'>('pretty');
  const [prettyInput, setPrettyInput] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [studentSteps, setStudentSteps] = useState('');
  const [processedStrokeCount, setProcessedStrokeCount] = useState(0);
  const [rationalAnalysis, setRationalAnalysis] = useState<any>(null);

  const primaryOcrResult = ocrResults.length > 0 ? ocrResults[0] : null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const prettyInputRef = useRef<HTMLInputElement>(null);

  const deferredPrettyInput = useDeferredValue(prettyInput);
  const latexPreview = useMemo(() => simpleToLatex(deferredPrettyInput), [deferredPrettyInput]);
  const sympyPreview = useMemo(() => simpleToSympy(deferredPrettyInput), [deferredPrettyInput]);

  const buildEquationPayload = useCallback((): EquationPayload => {
    const primary = ocrResults.length > 0 ? ocrResults[0] : null;
    if (primary && primary.sympy_out !== undefined && primary.sympy_out !== null && primary.sympy_out !== '') {
      const sympyOut = primary.sympy_out as any;
      if (typeof sympyOut === 'object' && sympyOut !== null && 'lhs' in sympyOut && 'rhs' in sympyOut) {
        return {
          equation: `${sympyOut.lhs}=${sympyOut.rhs}`,
          fromOCR: true,
        };
      }
      return {
        equation: String(sympyOut),
        fromOCR: true,
      };
    }

    let trimmed = manualEquation.trim();
    let converted: string | null = null;

    if (keyboardMode === 'pretty') {
      const sympyString = typeof sympyPreview === 'string' ? sympyPreview : '';
      const wrapped = wrapEquation(sympyString);
      converted = wrapped || null;
      trimmed = wrapped;
    }

    if (!trimmed) {
      return {
        equation: null,
        fromOCR: false,
        convertedManual: converted,
      };
    }

    return {
      equation: trimmed,
      fromOCR: false,
      convertedManual: converted,
    };
  }, [ocrResults, manualEquation, keyboardMode, sympyPreview]);

  const equationPreview = useMemo(() => {
    const payload = buildEquationPayload();
    return payload.equation;
  }, [buildEquationPayload]);

  const deriveReadableLine = (result: OCRResult | null | undefined): string => {
    if (!result) return '';
    // Prefer showing the original LaTeX the OCR recognized to preserve what the user wrote
    if (result.latex_raw) {
      return String(result.latex_raw);
    }
    // Next, try the SymPy Eq(...) form and render as lhs = rhs
    if (result.sympy_out !== undefined && result.sympy_out !== null && result.sympy_out !== '') {
      const sympyStr = String(result.sympy_out);
      if (sympyStr.startsWith('Eq(') && sympyStr.endsWith(')')) {
        const content = sympyStr.slice(3, -1);
        let depth = 0;
        let splitIndex = -1;
        for (let i = 0; i < content.length; i += 1) {
          const char = content[i];
          if (char === '(') depth += 1;
          else if (char === ')') depth -= 1;
          else if (char === ',' && depth === 0) {
            splitIndex = i;
            break;
          }
        }
        if (splitIndex !== -1) {
          const lhs = content.slice(0, splitIndex).trim();
          const rhs = content.slice(splitIndex + 1).trim();
          return `${lhs} = ${rhs}`;
        }
      }
      return sympyStr;
    }
    // Fall back to pretty string only if nothing else is available
    if (result.pretty) {
      return String(result.pretty);
    }
    if (result.solutions) {
      return String(result.solutions);
    }
    return '';
  };

  const updatePrettyInputFromDom = useCallback(() => {
    const el = prettyInputRef.current;
    if (el) {
      setPrettyInput(el.value);
    }
  }, []);

  const updateManualEquationFromDom = useCallback(() => {
    const el = manualInputRef.current;
    if (el) {
      setManualEquation(el.value);
    }
  }, []);

  const handlePrettyInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPrettyInput(e.target.value);
  }, []);

  const handleManualInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setManualEquation(e.target.value);
  }, []);

  const [drawingHistory, setDrawingHistory] = useState<Array<{ x: number; y: number }[]>>([]);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  // Update example when switching modes
  useEffect(() => {
    if (solverMode === 'rational_function') {
      setManualEquation('(x**2 - 4)/(x - 2)');
    } else {
      setManualEquation('Eq((x**2 - 4)/(x - 2), x + 2)');
    }
    // Clear results when switching modes
    setRationalAnalysis(null);
    setSolutionResult(null);
    setCheckerResult(null);
    setOcrResults([]);
    setError(null);
  }, [solverMode]);

  const renderPathsToImage = useCallback((paths: Array<{ x: number; y: number }[]>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = rect.width * scale;
    tempCanvas.height = rect.height * scale;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(scale, scale);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    paths.forEach((path) => {
      if (!path || path.length === 0) {
        return;
      }
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i += 1) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    });

    return tempCanvas.toDataURL('image/png');
  }, [brushColor, brushSize]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    if ((e as any).pointerId != null) {
      try {
        canvas.setPointerCapture?.((e as any).pointerId);
      } catch {
        /* noop */
      }
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setCurrentPath([{ x, y }]);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setCurrentPath((prev) => [...prev, { x, y }]);
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      if (e?.currentTarget && (e as any).pointerId != null) {
        try {
          e.currentTarget.releasePointerCapture?.((e as any).pointerId);
        } catch {
          /* noop */
        }
      }
      if (currentPath.length > 0) {
        setDrawingHistory((prev) => [...prev, currentPath]);
        setCurrentPath([]);
      }
    }
  };

  const loadImageToCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = dataUrl;
  };

  const downloadImage = (dataUrl: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'drawing.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
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
    setProcessedStrokeCount(0);
    setOcrResults([]);
    setSolutionResult(null);
    setCheckerResult(null);
    setStudentSteps('');
    setStudentAnswer('');
    setError(null);
    setCheckerError(null);
  };

  const processDrawing = async () => {
    if (drawingHistory.length === 0 && currentPath.length === 0) {
      setError('Please draw something first');
      return;
    }

    let mergedPaths = drawingHistory;
    if (currentPath.length > 0) {
      mergedPaths = [...drawingHistory, currentPath];
      setDrawingHistory(mergedPaths);
      setCurrentPath([]);
    }

    const newPaths = mergedPaths.slice(processedStrokeCount);
    if (newPaths.length === 0) {
      setError('Draw a new step before processing.');
      return;
    }

    const imageData = renderPathsToImage(newPaths);
    if (!imageData) {
      setError('Failed to capture drawing for OCR.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(imageData);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'drawing-step.png');

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout. Please check your network connection and try again.')), 30000)
      );

      // Race between fetch and timeout
      const ocrResponse = await Promise.race([
        fetch(`${API_BASE}/api/ocr/process`, {
          method: 'POST',
          body: formData,
        }),
        timeoutPromise
      ]) as Response;

      if (!ocrResponse.ok) {
        // Try to get error message from response
        let errorMessage = 'OCR processing failed';
        try {
          const errorData = await ocrResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If can't parse error, use status text
          errorMessage = `OCR processing failed: ${ocrResponse.statusText || 'Unknown error'}`;
        }
        throw new Error(errorMessage);
      }

      const ocrData = (await ocrResponse.json()) as OCRResult;
      if (ocrData.error && !ocrData.latex_raw) {
        setError(ocrData.error);
        return;
      }

      const plainText = deriveReadableLine(ocrData);
      if (!plainText) {
        setError('OCR did not detect readable math. Please try writing more clearly.');
        return;
      }

      setOcrResults((prev) => [...prev, { ...ocrData, plainText }]);
      setProcessedStrokeCount(mergedPaths.length);
      setResultsTab('ocr');
      setCheckerResult(null);
      setCheckerError(null);

      if (mergedPaths.length === newPaths.length) {
        const eqCandidate = String(ocrData.sympy_out ?? ocrData.latex_raw ?? plainText);
        const wrappedEquation = wrapEquation(eqCandidate);
        if (wrappedEquation) {
          setManualEquation(wrappedEquation);
        }
        setStudentSteps('');
        setStudentAnswer('');
      } else {
        setStudentSteps((prev) => (prev ? `${prev}\n${plainText}` : plainText));
      }

      if (!ocrData.error) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1500);
      }
    } catch (err) {
      // Provide more specific error messages for network issues
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('Timeout')) {
          errorMessage = 'Network timeout. Please check your internet connection and try again.';
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Network connection failed. Please check your internet connection and ensure the backend server is running.';
        } else if (err.message.includes('Network connection')) {
          errorMessage = err.message;
        } else {
          errorMessage = `OCR processing error: ${err.message}`;
        }
      } else {
        errorMessage = `OCR processing error: ${String(err)}`;
      }
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const solveEquation = async () => {
    // Handle rational function mode
    if (solverMode === 'rational_function') {
      await analyzeRationalFunction();
      return;
    }

    const payload = buildEquationPayload();
    const equationStr = payload.equation;

    if (!equationStr) {
      setError('Please process a drawing or enter an equation first');
      return;
    }

    if (!payload.fromOCR && payload.convertedManual && payload.convertedManual !== manualEquation) {
      setManualEquation(payload.convertedManual);
    }

    setIsProcessing(true);
    setError(null);
    setSolutionResult(null);
    setCheckerResult(null);
    setCheckerError(null);

    try {
      const solverResponse = await fetch(`${API_BASE}/api/solver/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equation: equationStr, detailLevel: solutionMode }),
      });

      if (!solverResponse.ok) {
        throw new Error('Equation solving failed');
      }

      const solverData = await solverResponse.json();
      if (solverData.error) {
        setError(solverData.error);
      } else {
        const serverDetailLevel = typeof solverData.detailLevel === 'string' ? solverData.detailLevel : undefined;
        const normalizedMode: 'raw' | 'process' | 'shortcut' =
          serverDetailLevel === 'process' || serverDetailLevel === 'shortcut' || serverDetailLevel === 'raw'
            ? (serverDetailLevel as 'raw' | 'process' | 'shortcut')
            : solutionMode;
        const finalResult: SolutionResult = {
          solution: solverData.solution,
          steps: Array.isArray(solverData.steps) ? solverData.steps : [],
          mode: normalizedMode,
          latex: typeof solverData.latex === 'string' ? solverData.latex : null,
        };
        setSolutionResult(finalResult);
        setResultsTab('solution');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        
        setEquationHistory((prev) => [
          {
            equation: equationStr,
            solution: solverData.solution,
            steps: Array.isArray(solverData.steps) ? solverData.steps : [],
            timestamp: new Date(),
            imageDataUrl: (canvasRef.current?.toDataURL('image/png')) || undefined,
            latex: primaryOcrResult?.latex_raw,
            solutionMode: finalResult.mode,
            solutionLatex: finalResult.latex,
          },
          ...prev.slice(0, 19),
        ]);
      }
    } catch (err) {
      setError(`Solving error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeRationalFunction = async () => {
    const payload = buildEquationPayload();
    let functionStr = payload.equation;

    if (!functionStr) {
      setError('Please process a drawing or enter a rational function first');
      return;
    }

    // Handle Eq() format: Eq(f(x), (x+1)/(x-1)) -> (x+1)/(x-1)
    if (functionStr.startsWith('Eq(') && functionStr.endsWith(')')) {
      const inner = functionStr.slice(3, -1);
      let depth = 0;
      let splitIndex = -1;
      for (let i = 0; i < inner.length; i++) {
        const char = inner[i];
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
          splitIndex = i;
          break;
        }
      }
      if (splitIndex !== -1) {
        // Remove the left side (usually f(x)) and keep the right side
        const rhs = inner.slice(splitIndex + 1).trim();
        functionStr = rhs;
      }
    }
    
    // For rational functions, we need to parse the input as f(x) = p(x)/q(x)
    // If it's from OCR or an equation format, we need to extract the function
    if (functionStr.includes('=')) {
      // If it's an equation like f(x) = (x+1)/(x-1), extract right side
      const parts = functionStr.split('=');
      if (parts.length === 2) {
        const rightSide = parts[1].trim();
        // Strip any trailing closing parens that might have been from Eq()
        functionStr = rightSide.replace(/^\(+/, '').replace(/\)+$/, '');
      }
    }

    // Remove any f(x) prefix if still present
    functionStr = functionStr.replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, '').trim();

    setIsProcessing(true);
    setError(null);
    setRationalAnalysis(null);
    setSolutionResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/rational-function/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ function: functionStr }),
      });

      if (!response.ok) {
        throw new Error('Rational function analysis failed');
      }

      const data = await response.json();
      if (!data.success) {
        setError(data.error || 'Analysis failed');
      } else {
        setRationalAnalysis(data);
        setResultsTab('solution');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (err) {
      setError(`Analysis error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const checkStudentSolution = async () => {
    const payload = buildEquationPayload();
    const equationStr = payload.equation;

    setResultsTab('checker');

    if (!equationStr) {
      setCheckerError('Please process a drawing or enter an equation before checking.');
      setCheckerResult(null);
      return;
    }

    if (!payload.fromOCR && payload.convertedManual && payload.convertedManual !== manualEquation) {
      setManualEquation(payload.convertedManual);
    }

    const stepsArray = studentSteps
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (stepsArray.length === 0) {
      setCheckerError('Enter at least one line of your solution to run the checker.');
      setCheckerResult(null);
      return;
    }

    setIsChecking(true);
    setCheckerError(null);
    setCheckerResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/solver/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equation: equationStr,
          studentAnswer: studentAnswer.trim(),
          studentSteps: stepsArray,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        const message = data?.error || 'Solution checker failed';
        setCheckerError(message);
        return;
      }

      if (data.status !== 'ok') {
        setCheckerError(data.error || 'Solution checker returned an error.');
        return;
      }

      setCheckerResult(data as CheckerSuccessResult);
      if (data.evaluation?.answer_correct) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (err) {
      setCheckerError(`Solution checker error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsChecking(false);
    }
  };

  const renderHistoryPreview = (entry: HistoryEntry) => {
    if (!entry.latex) {
      return (
        <div className="text-xs text-gray-300 font-mono">
          {entry.equation}
        </div>
      );
    }

    return (
      <div className="bg-slate-900/70 rounded p-2 border border-slate-600/60">
        <BlockMath math={entry.latex} errorColor="#f87171" throwOnError={false} />
      </div>
    );
  };

  const renderHistorySolution = (entry: HistoryEntry) => {
    if (entry.solutionMode === 'shortcut' && entry.solutionLatex) {
      return (
      <div className="bg-slate-900/70 border border-slate-600 rounded p-3">
        <CenteredLatex math={entry.solutionLatex} />
        </div>
      );
    }

    return (
      <div className="bg-slate-900/70 border border-slate-600 rounded p-3 text-sm font-mono whitespace-pre-wrap">
        {entry.solution.split('\n')[0]}
        {entry.solution.includes('\n') && <span className="text-gray-500"> …</span>}
      </div>
    );
  };

  const renderSteps = (steps?: string[]) => {
    if (!steps || steps.length === 0) {
      return null;
    }
  return (
      <div className="mt-4 space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="rounded border border-slate-700/60 bg-slate-900/70 p-3 text-sm font-mono whitespace-pre-wrap">
            {step}
          </div>
        ))}
      </div>
    );
  };

  const renderSolutionPanel = () => {
    if (!solutionResult) return null;
    const currentMode = solutionResult.mode || solutionMode;
    const isShortcut = currentMode === 'shortcut';
    const headerLabel = currentMode ? solutionModeLabels[currentMode] : 'Step-by-step Solution';
    const copyPayload = isShortcut && solutionResult.latex ? solutionResult.latex : solutionResult.solution;
    const handleDownloadSolution = () => {
      if (!solutionResult) return;
      const mode = solutionResult.mode || solutionMode;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filename = `solution-${mode}-${timestamp}.txt`;
      let content = solutionResult.solution;
      let mimeType = 'text/plain;charset=utf-8';

      if (mode === 'shortcut' && solutionResult.latex) {
        filename = `solution-${mode}-${timestamp}.tex`;
        content = [
          '\\documentclass{article}',
          '\\usepackage{amsmath}',
          '\\usepackage{amssymb}',
          '\\begin{document}',
          solutionResult.latex,
          '\\end{document}',
        ].join('\n');
      } else {
        const modeLabel = solutionModeLabels[mode];
        const stepsSection = (solutionResult.steps?.length ?? 0) > 0
          ? `\n\nSteps:\n${solutionResult.steps.join('\n')}`
          : '';
        content = `Mode: ${modeLabel}\n\n${solutionResult.solution}${stepsSection}`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" />
            {headerLabel}
          </h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSolutionFullscreen(true)}
            >
              <Play className="w-4 h-4 mr-1" /> Fullscreen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(copyPayload).catch(() => undefined);
              }}
            >
              <Upload className="w-4 h-4 mr-1" /> Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSolution}
            >
              <Download className="w-4 h-4 mr-1" /> Download
            </Button>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-700/70 to-slate-800/80 border border-slate-600 rounded-xl p-4 max-h-96 overflow-auto space-y-4">
          {isShortcut ? (
            solutionResult.latex ? (
              <div className="bg-slate-900/80 border border-slate-600 rounded-lg p-4">
                <CenteredLatex math={solutionResult.latex} />
              </div>
            ) : (
              <div className="text-sm text-gray-300">Shortcut view unavailable for this problem.</div>
            )
          ) : (
            <>
              <pre className="whitespace-pre-wrap text-sm font-mono text-gray-200">
                {solutionResult.solution}
              </pre>
              {renderSteps(solutionResult.steps)}
            </>
          )}
        </div>
        {solutionResult.mode && solutionResult.mode !== solutionMode && (
          <div className="text-xs text-yellow-300/80">
            Current result is in {solutionModeLabels[solutionResult.mode]}. Re-run solve to switch to {solutionModeLabels[solutionMode]}.
          </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
    <div className={`relative min-h-screen text-white ${className || ''}`}>
      <video
        className="fixed inset-0 w-full h-full object-cover -z-10"
        src="/DRAWING SOLVER BACKGROUND.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className={`pointer-events-none fixed inset-0 bg-gradient-to-br from-slate-900/70 via-purple-900/40 to-slate-900/70 backdrop-blur-[1px] z-0 transition-opacity duration-1000 ${showCinematicTitle ? 'opacity-30' : 'opacity-100'}`} />
      
      {/* Cinematic Title Animation */}
      <AnimatePresence>
        {showCinematicTitle && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0 }}
          >
            <div className="text-center px-6 max-w-6xl">
              {/* Main Title with glow effect */}
              <motion.div
                className="relative inline-block"
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
              >
                <motion.h1
                  className="font-orbitron font-bold text-5xl md:text-7xl lg:text-8xl mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(79, 195, 247, 0.5)",
                      "0 0 40px rgba(79, 195, 247, 0.8)",
                      "0 0 60px rgba(147, 51, 234, 0.8)",
                      "0 0 40px rgba(79, 195, 247, 0.8)",
                      "0 0 20px rgba(79, 195, 247, 0.5)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  CORTEX
                </motion.h1>
                <motion.div
                  className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-2xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              
              {/* Subtitle - faster and styled */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="mt-6"
              >
                <TypeAnimation
                  sequence={[
                    'A CNN-BASED MATHEMATICAL DEVICE FOR SOLVING RATIONAL EQUATIONS AND RATIONAL FUNCTIONS',
                    2000,
                  ]}
                  wrapper="div"
                  speed={75}
                  repeat={0}
                  className="font-orbitron text-sm md:text-base lg:text-lg text-cyan-300 font-medium tracking-wide"
                  style={{ 
                    display: 'inline-block', 
                    textAlign: 'center',
                    textShadow: '0 0 10px rgba(79, 195, 247, 0.5)'
                  }}
                />
              </motion.div>

              {/* Decorative line - faster */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{ duration: 0.8, delay: 2.5 }}
                className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400 via-purple-500 to-transparent mt-6 mx-auto max-w-md"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: showCinematicTitle ? 0 : 1 }}
        transition={{ duration: 1 }}
      >
      {showConfetti && <Confetti />}
      
      <div className="responsive-container py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: showCinematicTitle ? 0 : 1, y: 0 }}
          transition={{ duration: 0.6, delay: showCinematicTitle ? 0 : 0.5 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="responsive-heading font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎨 Drawing Equation Solver
          </h1>
          <p className="responsive-text text-gray-300 max-w-3xl mx-auto px-4">
              Draw or type equations, then let our AI assistant convert, solve, and explain them step-by-step.
            </p>
            
            {/* Mode Selector */}
            <div className="mt-4 mb-4 flex justify-center">
              <div className="inline-flex items-center gap-2 bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-600">
                <label className="text-sm text-gray-300">Mode:</label>
                <Button
                  size="sm"
                  variant={solverMode === 'equation' ? 'default' : 'outline'}
                  onClick={() => setSolverMode('equation')}
                >
                  Equation Solver
                </Button>
                <Button
                  size="sm"
                  variant={solverMode === 'rational_function' ? 'default' : 'outline'}
                  onClick={() => setSolverMode('rational_function')}
                >
                  Rational Function Analyzer
                </Button>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-blue-200/70 flex justify-center gap-2">
              <TypeAnimation
                sequence={[ 'Supports fractions, radicals, exponents, and systems ✨', 2000, 'Switch between natural input and SymPy instantly ⚡', 2000 ]}
                wrapper="span"
                speed={40}
                repeat={Infinity}
              />
            </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Pencil className="w-5 h-5" /> Drawing & Input Workspace
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'drawing' | 'manual')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="drawing">Draw</TabsTrigger>
                    <TabsTrigger value="manual">Manual Input</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="drawing" className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-300">Brush Size</label>
                        <input
                          type="range"
                          min="1"
                            max="12"
                          value={brushSize}
                          onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-24"
                        />
                          <span className="text-xs text-gray-400">{brushSize}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-300">Color</label>
                        <input
                          type="color"
                          value={brushColor}
                          onChange={(e) => setBrushColor(e.target.value)}
                          className="w-8 h-8 rounded border border-slate-600"
                        />
                      </div>
                      <Button
                          onClick={() => setShowTutorial((prev) => !prev)}
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                      >
                          <Lightbulb className="w-4 h-4 mr-2" /> Tips
                      </Button>
                    </div>

                    {showTutorial && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
                      >
                          <h4 className="font-semibold text-blue-300 mb-2">Drawing Tips</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                            <li>• Write symbols clearly and keep spacing consistent.</li>
                            <li>• Draw fractions with a visible horizontal bar.</li>
                            <li>• Use separate lines for multi-step work.</li>
                            <li>• Avoid overlapping characters and smudges.</li>
                        </ul>
                      </motion.div>
                    )}

                    <div className="border-2 border-dashed border-slate-500 rounded-lg p-3 sm:p-4">
                      <canvas
                        ref={canvasRef}
                          className="w-full h-72 sm:h-80 lg:h-80 bg-white rounded touch-none select-none cursor-crosshair"
                          onPointerDown={startDrawing}
                          onPointerMove={draw}
                          onPointerUp={stopDrawing}
                          onPointerCancel={stopDrawing}
                      />
                    </div>
                    
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="flex-1 min-w-[140px]" onClick={clearCanvas}>
                          <Eraser className="w-4 h-4 mr-2" /> Clear
                        </Button>
                      <Button
                        variant="outline"
                          className="flex-1 min-w-[140px]"
                          onClick={() => {
                            const canvas = canvasRef.current;
                            const dataUrl = canvas?.toDataURL('image/png');
                            if (dataUrl) downloadImage(dataUrl);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                      <Button
                        onClick={processDrawing}
                        disabled={isProcessing || ((drawingHistory.length === processedStrokeCount) && currentPath.length === 0)}
                          className="flex-1 min-w-[160px] bg-blue-600 hover:bg-blue-700"
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300">Input mode:</span>
                        <Button size="sm" variant={keyboardMode === 'pretty' ? 'default' : 'outline'} onClick={() => setKeyboardMode('pretty')}>
                          Simple
                        </Button>
                        <Button size="sm" variant={keyboardMode === 'sympy' ? 'default' : 'outline'} onClick={() => setKeyboardMode('sympy')}>
                          Advanced
                        </Button>
                      </div>

                      {keyboardMode === 'pretty' ? (
                        <div className="space-y-3">
                          <div className="bg-slate-800/60 border border-slate-600 rounded-xl p-4">
                            <div className="text-xs text-gray-400 mb-2">Preview</div>
                            <div className="bg-slate-900/50 rounded p-3 min-h-[64px] flex items-center text-lg">
                              {prettyInput ? (
                                <BlockMath math={latexPreview} errorColor="#f87171" throwOnError={false} />
                              ) : (
                                <span className="text-gray-500 text-sm">Type or use the keyboard…</span>
                              )}
                            </div>
                          </div>

                    <div className="space-y-2">
                            <label className="text-sm font-medium">Type naturally (e.g., 2/x = 5, (x+1)/(x-2) = 3)</label>
                      <Input
                              ref={prettyInputRef}
                              value={prettyInput}
                              onChange={handlePrettyInputChange}
                              placeholder="e.g., 2/x = 5 or (x+1)/(x-2) = 3"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                            <div className="mt-3 p-3 rounded-lg bg-slate-800/40 border border-slate-600">
                              <MathKeyboard
                                targetRef={prettyInputRef}
                                mode="pretty"
                                onInsert={updatePrettyInputFromDom}
                              />
                            </div>
                            <div className="bg-slate-800/60 border border-slate-600 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Will be solved as (SymPy)</div>
                              <pre className="bg-slate-900/50 rounded p-2 min-h-[48px] text-sm font-mono text-gray-200 whitespace-pre-wrap">
                                {sympyPreview || ''}
                              </pre>
                              <div className="text-[10px] text-gray-400 mt-1">
                                Tip: highlight part of your equation and use the fraction or exponent helpers below. You can still type "/", "^", or "sqrt()" if you prefer.
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label className="text-sm font-medium">SymPy Input</label>
                          <Input
                            ref={manualInputRef}
                        value={manualEquation}
                        onChange={handleManualInputChange}
                        placeholder="e.g., Eq((x**2 - 4)/(x - 2), x + 2)"
                        className="bg-slate-700 border-slate-600 text-white"
                          />
                          <div className="mt-3 p-3 rounded-lg bg-slate-800/40 border border-slate-600">
                            <MathKeyboard
                              targetRef={manualInputRef}
                              mode="sympy"
                              onInsert={updateManualEquationFromDom}
                      />
                    </div>
                        </div>
                      )}
                    
                    <Button
                      onClick={solveEquation}
                        disabled={isProcessing || (keyboardMode === 'pretty' ? !prettyInput.trim() : !manualEquation.trim())}
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

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-purple-500/30 shadow-2xl shadow-purple-500/10">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-purple-500/20">
                <CardTitle className="flex items-center gap-3 text-xl">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                    <Brain className="w-6 h-6 text-purple-400" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-bold">
                      AI Results & Solutions
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                  <div className="mb-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <span className="text-sm text-gray-300 font-medium">Solution output</span>
                      <div className="inline-flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={solutionMode === 'raw' ? 'default' : 'outline'}
                          onClick={() => setSolutionMode('raw')}
                          disabled={isProcessing}
                        >
                          Raw explanation
                        </Button>
                        <Button
                          size="sm"
                          variant={solutionMode === 'process' ? 'default' : 'outline'}
                          onClick={() => setSolutionMode('process')}
                          disabled={isProcessing}
                        >
                          Solution process
                        </Button>
                        <Button
                          size="sm"
                          variant={solutionMode === 'shortcut' ? 'default' : 'outline'}
                          onClick={() => setSolutionMode('shortcut')}
                          disabled={isProcessing}
                        >
                          Shortcut (LaTeX)
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Choose between the full narrated solution, a streamlined step list, or a LaTeX shortcut view.
                    </p>
                  </div>
                  <Tabs value={resultsTab} onValueChange={(value) => setResultsTab(value as 'ocr' | 'solution' | 'history' | 'checker' | 'demo')} className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-slate-700/50 border border-slate-600">
                      <TabsTrigger value="ocr">OCR</TabsTrigger>
                      <TabsTrigger value="solution">Solution</TabsTrigger>
                      <TabsTrigger value="checker">Checker</TabsTrigger>
                      <TabsTrigger value="demo">Demo</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="ocr" className="space-y-4">
                    {error && (
                      <Alert className="border-red-500 bg-red-500/10">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {primaryOcrResult ? (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="space-y-3 rounded-lg border border-slate-600/60 bg-slate-800/50 p-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-200">Recognized Equation</h4>
                              <span className="text-xs uppercase tracking-wide text-purple-300">Base</span>
                            </div>
                            {primaryOcrResult.latex_raw ? (
                              <div className="bg-slate-900/60 border border-slate-700 rounded p-3 overflow-auto">
                                <BlockMath math={primaryOcrResult.latex_raw} errorColor="#f87171" throwOnError={false} />
                              </div>
                            ) : null}
                            <div className="bg-slate-900/40 border border-slate-700/60 rounded p-3 text-xs text-gray-300 font-mono whitespace-pre-wrap">
                              {primaryOcrResult.plainText || 'No readable equation detected yet.'}
                            </div>
                            
                            {/* Manual correction for primary OCR result */}
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-gray-300">Manual correction (if OCR is wrong):</label>
                              <Input
                                placeholder="Enter correct equation here..."
                                className="bg-slate-800 border-slate-600 text-white text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const correctedValue = e.currentTarget.value.trim();
                                    if (correctedValue) {
                                      // Update the primary OCR result with corrected value
                                      setOcrResults(prev => prev.map((item, idx) => 
                                        idx === 0 ? { ...item, plainText: correctedValue } : item
                                      ));
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              <p className="text-xs text-gray-400">
                                Press Enter to apply correction. This will update the recognized equation.
                              </p>
                              
                              {/* Smart correction suggestions */}
                              {primaryOcrResult.plainText && (
                                <div className="mt-2 p-2 bg-slate-700/50 rounded border border-slate-600">
                                  <p className="text-xs text-gray-300 mb-2">💡 Smart correction suggestions:</p>
                                  <div className="space-y-1">
                                    {primaryOcrResult.plainText.includes('·') && primaryOcrResult.plainText.includes('+') && (
                                      <button
                                        className="block w-full text-left text-xs text-blue-300 hover:text-blue-200 p-1 rounded hover:bg-slate-600/50"
                                        onClick={() => {
                                          // Suggest a common bracket equation pattern
                                          const suggested = primaryOcrResult.plainText.replace('·', '*').replace('+', ' + ') + ' = 0';
                                          setOcrResults(prev => prev.map((item, idx) => 
                                            idx === 0 ? { ...item, plainText: suggested } : item
                                          ));
                                        }}
                                      >
                                        Convert to: {primaryOcrResult.plainText.replace('·', '*').replace('+', ' + ') + ' = 0'}
                                      </button>
                                    )}
                                    {primaryOcrResult.plainText.match(/^\d+[·x]\s*[+\-]\s*\d+$/) && (
                                      <button
                                        className="block w-full text-left text-xs text-green-300 hover:text-green-200 p-1 rounded hover:bg-slate-600/50"
                                        onClick={() => {
                                          // Suggest a bracket equation pattern
                                          const match = primaryOcrResult.plainText.match(/^(\d+)[·x]\s*([+\-])\s*(\d+)$/);
                                          if (match) {
                                            const [, num1, op, num2] = match;
                                            const suggested = `${num1}*(${num1}*x/${num1} + 3/2 - 5/4) = 0`;
                                            setOcrResults(prev => prev.map((item, idx) => 
                                              idx === 0 ? { ...item, plainText: suggested } : item
                                            ));
                                          }
                                        }}
                                      >
                                        Suggest bracket equation: 4*(4*x/4 + 3/2 - 5/4) = 0
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {primaryOcrResult.warning && (
                              <p className="text-xs text-yellow-400">⚠ {primaryOcrResult.warning}</p>
                            )}
                            {primaryOcrResult.error && !primaryOcrResult.warning && (
                              <p className="text-xs text-red-400">⚠ {primaryOcrResult.error}</p>
                            )}
                          </div>

                          {ocrResults.length > 1 && (
                            <div className="space-y-3">
                              {ocrResults.slice(1).map((capture, index) => (
                                <div key={index} className="space-y-3 rounded-lg border border-slate-600/60 bg-slate-800/40 p-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-gray-200">Step {index + 1}</h4>
                                    {index === ocrResults.length - 2 && (
                                      <span className="text-xs uppercase tracking-wide text-purple-300">Latest</span>
                                    )}
                                  </div>
                                  {capture.latex_raw ? (
                                    <div className="bg-slate-900/60 border border-slate-700 rounded p-3 overflow-auto">
                                      <BlockMath math={capture.latex_raw} errorColor="#f87171" throwOnError={false} />
                                    </div>
                                  ) : null}
                                  <div className="bg-slate-900/40 border border-slate-700/60 rounded p-3 text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                    {capture.plainText}
                                  </div>
                                  
                                  {/* Manual correction input */}
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-300">Manual correction (if OCR is wrong):</label>
                                    <Input
                                      placeholder="Enter correct equation here..."
                                      className="bg-slate-800 border-slate-600 text-white text-xs"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const correctedValue = e.currentTarget.value.trim();
                                          if (correctedValue) {
                                            // Update the OCR result with corrected value
                                            setOcrResults(prev => prev.map((item, idx) => 
                                              idx === index + 1 ? { ...item, plainText: correctedValue } : item
                                            ));
                                            e.currentTarget.value = '';
                                          }
                                        }
                                      }}
                                    />
                                    <p className="text-xs text-gray-400">
                                      Press Enter to apply correction. This will update the recognized equation.
                                    </p>
                                  </div>
                                  
                                  {capture.warning && (
                                    <p className="text-xs text-yellow-400">⚠ {capture.warning}</p>
                                  )}
                                  {capture.error && !capture.warning && (
                                    <p className="text-xs text-red-400">⚠ {capture.error}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={solveEquation}
                            disabled={isProcessing || !primaryOcrResult}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4 mr-2" />
                            )}
                            Solve Using Recognized Equation
                          </Button>
                          <p className="text-xs text-gray-400">
                            The first recognized line is used as the equation. Each additional OCR pass appends a new line to the checker automatically.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-60" />
                        <p>Process a drawing to view OCR recognition.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="solution" className="space-y-4">
                      {rationalAnalysis ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                              <Zap className="w-5 h-5 text-green-400" />
                              Rational Function Analysis
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(rationalAnalysis.raw_output || '').catch(() => undefined);
                              }}
                            >
                              <Upload className="w-4 h-4 mr-1" /> Copy
                            </Button>
                          </div>
                          
                          {/* Graph Display */}
                          {rationalAnalysis.graph && (
                            <div className="bg-gradient-to-br from-slate-700/70 to-slate-800/80 border border-slate-600 rounded-xl p-4">
                              <h5 className="font-semibold text-md mb-2 flex items-center gap-2">
                                📊 Function Graph
                              </h5>
                              <div className="flex justify-center bg-white rounded-lg p-2">
                                <img 
                                  src={`data:image/png;base64,${rationalAnalysis.graph}`} 
                                  alt="Rational function graph"
                                  className="max-w-full h-auto"
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Text Output */}
                          <div className="bg-gradient-to-br from-slate-700/70 to-slate-800/80 border border-slate-600 rounded-xl p-4 max-h-96 overflow-auto space-y-4">
                            {rationalAnalysis.raw_output ? (
                              <pre className="whitespace-pre-wrap text-sm font-mono text-gray-200 leading-relaxed">
                                {rationalAnalysis.raw_output}
                              </pre>
                            ) : (
                              <div className="text-sm text-gray-300">
                                No analysis output available.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : solutionResult ? (
                        renderSolutionPanel()
                      ) : (
                      <div className="text-center text-gray-400 py-8">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Process a drawing or enter an equation to see the solution.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="checker" className="space-y-4">
                    {checkerError && (
                      <Alert className="border-red-500 bg-red-500/10">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{checkerError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-gray-200">Equation being checked</h4>
                          <div className="bg-slate-800/60 border border-slate-600 rounded-lg p-3 font-mono text-sm text-gray-200 min-h-[72px] whitespace-pre-wrap">
                            {equationPreview ? equationPreview : 'No equation ready. Use OCR or manual input first.'}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Student final answer</label>
                          <Input
                            value={studentAnswer}
                            onChange={(e) => setStudentAnswer(e.target.value)}
                            placeholder="e.g., x = 3"
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Student solution (one step per line)</label>
                          <Textarea
                            value={studentSteps}
                            onChange={(e) => setStudentSteps(e.target.value)}
                            placeholder={`Write each step on a new line. Example:\nRestrictions: x ≠ 2\nMultiply both sides by (x-2)\n...`}
                            rows={10}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                          <p className="text-xs text-gray-400">Tip: include restrictions, LCD steps, and verification so the checker can give targeted feedback.</p>
                        </div>

                        <Button
                          onClick={checkStudentSolution}
                          disabled={isChecking}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          {isChecking ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Brain className="w-4 h-4 mr-2" />
                          )}
                          Check Student Solution
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {checkerResult ? (
                          <>
                            <Card className={checkerResult.evaluation.answer_correct ? 'border-green-500/60 bg-green-500/10' : 'border-yellow-500/40 bg-yellow-500/10'}>
                              <CardHeader>
                                <CardTitle>Checker Verdict</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm text-gray-200">
                                <p>
                                  {checkerResult.evaluation.answer_correct
                                    ? '✅ Student answer is mathematically correct.'
                                    : '❌ Student answer does not match the actual solution.'}
                                </p>
                                <p>
                                  <span className="font-semibold">Interpreted student answer:</span>{' '}
                                  {checkerResult.evaluation.student_value ?? 'Not detected'}
                                </p>
                                <p>
                                  <span className="font-semibold">Actual solutions:</span>{' '}
                                  {checkerResult.evaluation.actual_solutions.length > 0
                                    ? checkerResult.evaluation.actual_solutions.join(', ')
                                    : 'No solutions'}
                                </p>
                                {checkerResult.evaluation.extraneous_solutions.length > 0 && (
                                  <p>
                                    <span className="font-semibold">Extraneous:</span>{' '}
                                    {checkerResult.evaluation.extraneous_solutions.join(', ')}
                                  </p>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle>Key Checks</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="text-sm text-gray-300 space-y-1">
                                  <li>• Denominators mentioned: {checkerResult.student_detection.mentions_denominators ? '✅' : '⚠️ No'}</li>
                                  <li>• Restrictions stated: {checkerResult.student_detection.mentions_restrictions ? '✅' : '⚠️ No'}</li>
                                  <li>• LCD step shown: {checkerResult.student_detection.mentions_lcd ? '✅' : '⚠️ No'}</li>
                                  <li>• Simplified equation shown: {checkerResult.student_detection.shows_simplified_equation ? '✅' : '⚠️ No'}</li>
                                  <li>• Verification mentioned: {checkerResult.student_detection.mentions_verification ? '✅' : '⚠️ No'}</li>
                                  <li>• Verification work shown: {checkerResult.student_detection.shows_verification_work ? '✅' : '⚠️ No'}</li>
                                </ul>
                              </CardContent>
                            </Card>

                            {checkerResult.verification && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>Verification Insights</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-gray-300">
                                  <p>
                                    <span className="font-semibold">Score:</span> {checkerResult.verification.score}/5
                                  </p>
                                  {checkerResult.verification.details.length > 0 && (
                                    <div>
                                      <p className="font-semibold text-gray-200">Detected Patterns:</p>
                                      <ul className="list-disc list-inside space-y-1">
                                        {checkerResult.verification.details.map((detail, idx) => (
                                          <li key={idx}>{detail}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {checkerResult.verification.examples.length > 0 && (
                                    <div>
                                      <p className="font-semibold text-gray-200">How to Verify:</p>
                                      <ul className="list-disc list-inside space-y-1">
                                        {checkerResult.verification.examples.map((example, idx) => (
                                          <li key={idx}>{example}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {checkerResult.verification.analysis.length > 0 && (
                                    <div>
                                      <p className="font-semibold text-gray-200">Detailed Notes:</p>
                                      <ul className="list-disc list-inside space-y-1">
                                        {checkerResult.verification.analysis.map((item, idx) => (
                                          <li key={idx}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {(checkerResult.verification as any)?.steps && (checkerResult.verification as any).steps.length > 0 && (
                                    <div>
                                      <p className="font-semibold text-gray-200">Verification Steps:</p>
                                      <div className="bg-slate-800/50 rounded p-3 mt-2">
                                        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                                          {(checkerResult.verification as any).steps.join('\n')}
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}

                            {checkerResult.feedback && checkerResult.feedback.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>Instructor Feedback</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                                    {checkerResult.feedback.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            )}

                            <Card>
                              <CardHeader>
                                <CardTitle>Preprocessing Insights</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm text-gray-300">
                                <p>
                                  <span className="font-semibold text-gray-200">Original:</span>{' '}
                                  {checkerResult.preprocessing.lhs} = {checkerResult.preprocessing.rhs}
                                </p>
                                <p>
                                  <span className="font-semibold text-gray-200">Denominators:</span>{' '}
                                  {checkerResult.preprocessing.denominators.length > 0
                                    ? checkerResult.preprocessing.denominators.join(', ')
                                    : 'None'}
                                </p>
                                <p>
                                  <span className="font-semibold text-gray-200">Restrictions:</span>{' '}
                                  {checkerResult.preprocessing.restrictions.length > 0
                                    ? checkerResult.preprocessing.restrictions.join(', ')
                                    : 'None'}
                                </p>
                                <p>
                                  <span className="font-semibold text-gray-200">LCD:</span>{' '}
                                  {checkerResult.preprocessing.lcd || '1'}
                                </p>
                                {checkerResult.preprocessing.simplified_lhs && checkerResult.preprocessing.simplified_rhs && (
                                  <p>
                                    <span className="font-semibold text-gray-200">Simplified:</span>{' '}
                                    {checkerResult.preprocessing.simplified_lhs} = {checkerResult.preprocessing.simplified_rhs}
                                  </p>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle>Student Work (Normalized)</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {checkerResult.parsed_solution.normalized_lines.length > 0 ? (
                                  <div className="space-y-2">
                                    {checkerResult.parsed_solution.normalized_lines.map((line: string, index: number) => (
                                      <div key={index} className="rounded border border-slate-700/60 bg-slate-900/70 p-2 font-mono text-xs text-gray-200 whitespace-pre-wrap">
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">No mathematical lines detected.</div>
                                )}
                              </CardContent>
                            </Card>

                            {checkerResult.step_by_step.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>Remediation Steps</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <pre className="text-sm whitespace-pre-wrap text-gray-200 font-mono">
                                    {checkerResult.step_by_step.join('\n')}
                                  </pre>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        ) : (
                          <div className="h-full rounded-lg border border-slate-600/60 bg-slate-800/40 p-6 text-sm text-gray-300">
                            Enter the student answer and paste each step on the left, then click <span className="font-semibold text-gray-100">Check Student Solution</span>.
                            The checker will analyse denominators, restrictions, LCD usage, and verification just like the standalone tool.
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    {equationHistory.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                        {equationHistory.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: index * 0.05 }}
                            className="bg-slate-700/40 border border-slate-600/60 rounded-xl overflow-hidden hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/10 transition"
                          >
                              <div className="flex flex-col sm:flex-row gap-3 p-4">
                              {item.imageDataUrl ? (
                                  <div className="w-full sm:w-32 h-32 bg-slate-800 rounded-md overflow-hidden border border-slate-600/70">
                                  <img src={item.imageDataUrl} alt="drawing" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                  <div className="w-full sm:w-32 h-32 bg-slate-800 rounded-md flex items-center justify-center text-slate-400 border border-slate-600/70">
                                  No Image
                                </div>
                              )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm text-gray-300 truncate">{item.timestamp.toLocaleString()}</div>
                                    <Badge variant="outline">#{equationHistory.length - index}</Badge>
                                  </div>
                                  <div className="mt-2 space-y-2">
                                    <div className="text-xs text-gray-400">Equation</div>
                                    {renderHistoryPreview(item)}
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                      <span>Solution</span>
                                      {item.solutionMode && (
                                        <span className="text-[10px] uppercase tracking-wide text-gray-500">
                                          {solutionModeLabels[item.solutionMode]}
                                        </span>
                                      )}
                                    </div>
                                    {renderHistorySolution(item)}
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setManualEquation(item.equation);
                                        setActiveTab('manual');
                                        setKeyboardMode('sympy');
                                      }}
                                    >
                                      Use Equation
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSolutionResult({
                                          solution: item.solution,
                                          steps: item.steps ?? [],
                                          mode: item.solutionMode,
                                          latex: item.solutionLatex ?? null,
                                        });
                                        setResultsTab('solution');
                                      }}
                                    >
                                      View Solution
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setViewingSolution(item)}
                                    >
                                      View Details
                                    </Button>
                                    {item.imageDataUrl && (
                                      <Button size="sm" variant="outline" onClick={() => downloadImage(item.imageDataUrl!)}>
                                        Download Drawing
                                      </Button>
                                    )}
                                    {item.imageDataUrl && (
                                      <Button size="sm" variant="outline" onClick={() => loadImageToCanvas(item.imageDataUrl!)}>
                                        Load Drawing
                                      </Button>
                                    )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                          <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-60" />
                          <p>No equations solved yet. Draw or type one to build history!</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="inline-flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-600">
                <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'}`} />
              <span className="text-sm text-gray-300">
                {isProcessing ? 'Processing...' : 'Ready to solve equations'}
              </span>
            </div>

              <div className="flex gap-2 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                  onClick={() => setShowTutorial((prev) => !prev)}
              >
                  <Lightbulb className="w-4 h-4 mr-2" /> Handwritten Tips
              </Button>
              <Button
                variant="outline"
                size="sm"
                  onClick={() => navigate('/rpg')}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400 font-medium bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 ring-2 ring-purple-500/30 hover:ring-purple-500/50 relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse"></span>
                <span className="relative flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" /> Need Help? Learn More
                </span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {viewingSolution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900 z-50 flex flex-col"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-600"
            >
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white">🎯 Solution Details</h2>
                  <div className="text-sm text-gray-400">Solved on {viewingSolution.timestamp.toLocaleString()}</div>
                </div>
                <Button variant="outline" size="lg" onClick={() => setViewingSolution(null)} className="text-slate-300 hover:text-white hover:bg-slate-700 px-6 py-2">
                  <XCircle className="w-5 h-5 mr-2" /> Close
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="bg-slate-800/50 border-b border-slate-600 p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">📝 Original Equation</h3>
                <div className="bg-slate-700/70 rounded-lg p-4 border border-slate-600">
                    <pre className="text-lg font-mono text-gray-200 whitespace-pre-wrap break-all">{viewingSolution.equation}</pre>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    🧮 {viewingSolution.solutionMode ? solutionModeLabels[viewingSolution.solutionMode] : 'Step-by-Step Solution'}
                  </h3>
                <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-600 shadow-2xl">
                  {viewingSolution.solutionMode === 'shortcut' && viewingSolution.solutionLatex ? (
                      <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-4">
                        <CenteredLatex math={viewingSolution.solutionLatex} />
                      </div>
                    ) : (
                      <>
                        <pre className="whitespace-pre-wrap text-lg font-mono text-gray-200 leading-relaxed">
                          {viewingSolution.solution}
                        </pre>
                        {renderSteps(viewingSolution.steps)}
                      </>
                    )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSolutionFullscreen && solutionResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900 z-50 flex flex-col"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-600"
            >
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-6 h-6 text-green-400" /> 🎯 {solutionResult.mode ? solutionModeLabels[solutionResult.mode] : 'Current Solution'}
                </h2>
                  <div className="text-sm text-gray-400">Solved just now</div>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsSolutionFullscreen(false)}
                className="text-slate-300 hover:text-white hover:bg-slate-700 px-6 py-2"
              >
                  <XCircle className="w-5 h-5 mr-2" /> Close
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-6">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    🧮 {solutionResult.mode ? solutionModeLabels[solutionResult.mode] : 'Step-by-Step Solution'}
                  </h3>
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-8 border border-slate-600 shadow-2xl">
                  {solutionResult.mode === 'shortcut' && solutionResult.latex ? (
                      <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-4">
                        <CenteredLatex math={solutionResult.latex} />
                      </div>
                    ) : (
                      <>
                        <pre className="whitespace-pre-wrap text-lg font-mono text-gray-200 leading-relaxed">
                          {solutionResult.solution}
                        </pre>
                        {renderSteps(solutionResult.steps)}
                      </>
                    )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
    </ErrorBoundary>
  );
};

export default DrawingSolver;
