import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, CheckCircle, Calculator, BookOpen, Eraser, Undo2, Camera, RotateCcw } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SolutionCheckerProps {
  onClose: () => void;
}

const SolutionChecker: React.FC<SolutionCheckerProps> = ({ onClose }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [equation, setEquation] = useState('');
  const [solutionLines, setSolutionLines] = useState<string[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'equation' | 'solution'>('equation');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [paths, setPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // API endpoints
  const API_BASE = 'http://localhost:5001/api';
  const OCR_ENDPOINT = `${API_BASE}/ocr/process`;
  const SOLVER_ENDPOINT = `${API_BASE}/solver/solve`;

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setContext(ctx);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPath(prev => [...prev, { x, y }]);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !context) return;
    
    setIsDrawing(false);
    if (currentPath.length > 0) {
      setPaths(prev => [...prev, currentPath]);
    }
    setCurrentPath([]);
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setPaths([]);
    setCurrentPath([]);
  };

  const undoLastPath = () => {
    if (!context || !canvasRef.current || paths.length === 0) return;
    
    setPaths(prev => prev.slice(0, -1));
    redrawCanvas();
  };

  const redrawCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    paths.forEach(path => {
      if (path.length > 0) {
        context.beginPath();
        context.moveTo(path[0].x, path[0].y);
        path.forEach(point => {
          context.lineTo(point.x, point.y);
        });
        context.stroke();
      }
    });
  };

  const canvasToBlob = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!canvasRef.current) {
        resolve(new Blob());
        return;
      }
      canvasRef.current.toBlob((blob) => {
        resolve(blob || new Blob());
      }, 'image/png');
    });
  };

  const captureAndRecognize = async () => {
    if (!canvasRef.current || paths.length === 0) {
      toast({
        title: "No Drawing",
        description: "Please draw something before capturing.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Convert canvas to blob
      const blob = await canvasToBlob();
      
      // Create FormData for the API call
      const formData = new FormData();
      formData.append('image', blob, 'drawing.png');
      
      // Call the OCR API
      const response = await fetch(OCR_ENDPOINT, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`OCR API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Extract the LaTeX result
      const latexResult = result.latex_raw;
      
      if (!latexResult) {
        throw new Error('No LaTeX result from OCR');
      }
      
      if (drawingMode === 'equation') {
        setEquation(latexResult);
        setDrawingMode('solution');
        setCurrentLineIndex(0);
        toast({
          title: "Equation Recognized!",
          description: `"${latexResult}" - Now draw your first solution step.`,
          variant: "default"
        });
      } else {
        // Add as solution line
        setSolutionLines(prev => [...prev, latexResult]);
        setCurrentLineIndex(prev => prev + 1);
        toast({
          title: "Solution Step Added!",
          description: `Line ${currentLineIndex + 1}: "${latexResult}"`,
          variant: "default"
        });
      }
      
      // Clear canvas for next drawing
      clearCanvas();
      
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "Recognition Failed",
        description: `Could not recognize the drawing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const finishSolution = async () => {
    if (!equation.trim()) {
      toast({
        title: "Missing Equation",
        description: "Please draw and recognize an equation first.",
        variant: "destructive"
      });
      return;
    }

    if (solutionLines.length === 0) {
      toast({
        title: "No Solution",
        description: "Please add at least one solution step.",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    
    try {
      // Call the solver API to check the solution
      const response = await fetch(SOLVER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equation: equation,
          solutionSteps: solutionLines
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Solver API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Process the solution analysis
      const analysis = analyzeSolutionWithBackendLogic(equation, solutionLines, result.solution);
      setCheckResult(analysis);
      setShowResults(true);
      
      toast({
        title: "Solution Checked!",
        description: "Your solution has been analyzed using AI. Check the results below.",
        variant: "default"
      });
    } catch (error) {
      console.error('Solver Error:', error);
      toast({
        title: "Check Failed",
        description: `There was an error checking your solution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const analyzeSolutionWithBackendLogic = (eq: string, lines: string[], backendSolution: string) => {
    // Enhanced analysis based on olol_hahahaa.py logic
    const analysis = {
      equation: eq,
      totalLines: lines.length,
      hasDenominators: false,
      mentionsRestrictions: false,
      showsVerification: false,
      hasFinalAnswer: false,
      showsLCDWork: false,
      showsFactoring: false,
      showsCancellation: false,
      score: 0,
      feedback: [] as string[],
      suggestions: [] as string[],
      detailedAnalysis: {} as any,
      backendAnalysis: backendSolution
    };

    // Check for denominators and rational expressions
    if (eq.includes('/') && (eq.includes('x') || eq.includes('X'))) {
      analysis.hasDenominators = true;
      analysis.score += 1;
      analysis.feedback.push("✅ Equation contains rational expressions");
      
      // Check for specific denominator patterns
      const denominatorPatterns = [
        /\(x\s*[+\-]\s*\d+\)/g,  // (x+2), (x-3)
        /x\s*[+\-]\s*\d+/g,      // x+2, x-3
        /\d+\s*\/\s*\(x\s*[+\-]\s*\d+\)/g,  // 5/(x-2)
        /\d+\s*\/\s*x/g,         // 3/x
      ];
      
      let hasComplexDenominators = false;
      denominatorPatterns.forEach(pattern => {
        if (pattern.test(eq)) {
          hasComplexDenominators = true;
        }
      });
      
      if (hasComplexDenominators) {
        analysis.score += 1;
        analysis.feedback.push("✅ Complex rational expressions detected");
      }
    }

    // Analyze each solution line with enhanced pattern recognition
    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      const lineClean = line.replace(/\s+/g, ' ').trim();
      
      // Check for restriction mentions (enhanced patterns)
      const restrictionPatterns = [
        /restriction/i,
        /excluded/i,
        /cannot/i,
        /undefined/i,
        /domain/i,
        /x\s*[≠!]\s*\d+/,
        /x\s+not\s+equal/i,
        /x\s+cannot\s+be/i
      ];
      
      if (restrictionPatterns.some(pattern => pattern.test(lineClean))) {
        analysis.mentionsRestrictions = true;
        analysis.score += 1;
        analysis.feedback.push(`✅ Line ${index + 1}: Mentions restrictions/exclusions`);
      }

      // Check for verification work (enhanced patterns)
      const verificationPatterns = [
        /check/i,
        /verify/i,
        /test/i,
        /substitute/i,
        /lhs\s*=/i,
        /rhs\s*=/i,
        /left\s+side/i,
        /right\s+side/i,
        /both\s+sides/i,
        /balance/i,
        /balanced/i
      ];
      
      if (verificationPatterns.some(pattern => pattern.test(lineClean))) {
        analysis.showsVerification = true;
        analysis.score += 2;
        analysis.feedback.push(`✅ Line ${index + 1}: Shows verification work`);
      }

      // Check for LCD work and multiplication
      const lcdPatterns = [
        /multiply\s+both\s+sides/i,
        /multiply\s+by/i,
        /lcd/i,
        /least\s+common\s+denominator/i,
        /\(\s*[^)]+\s*\)\s*\*/i,  // (x-2) * pattern
        /\*\s*\([^)]+\)/i          // * (x-2) pattern
      ];
      
      if (lcdPatterns.some(pattern => pattern.test(lineClean))) {
        analysis.showsLCDWork = true;
        analysis.score += 1;
        analysis.feedback.push(`✅ Line ${index + 1}: Shows LCD multiplication work`);
      }

      // Check for factoring work
      const factoringPatterns = [
        /factor/i,
        /factored/i,
        /\(\s*[^)]+\s*\)\s*\(\s*[^)]+\s*\)/i,  // (x+1)(x-2)
        /x\^2/i,
        /x²/i,
        /quadratic/i
      ];
      
      if (factoringPatterns.some(pattern => pattern.test(lineClean))) {
        analysis.showsFactoring = true;
        analysis.score += 1;
        analysis.feedback.push(`✅ Line ${index + 1}: Shows factoring work`);
      }

      // Check for cancellation work
      const cancellationPatterns = [
        /cancel/i,
        /cancelled/i,
        /simplify/i,
        /simplified/i,
        /reduce/i,
        /reduced/i,
        /\(\s*[^)]+\s*\)\s*\/\s*\(\s*[^)]+\s*\)\s*=\s*1/i  // (x-2)/(x-2) = 1
      ];
      
      if (cancellationPatterns.some(pattern => pattern.test(lineClean))) {
        analysis.showsCancellation = true;
        analysis.score += 1;
        analysis.feedback.push(`✅ Line ${index + 1}: Shows cancellation/simplification work`);
      }

      // Check for final answer (enhanced patterns)
      const answerPatterns = [
        /x\s*=\s*[\d\.]+/i,        // x = 5, x = 3.14
        /x\s*=\s*[+\-]?\s*[\d\.]+/i,  // x = -5, x = +3
        /x\s*=\s*\(\s*[^)]+\s*\)/i,   // x = (5+√13)/2
        /x\s*=\s*[+\-]?\s*√\s*[\d\.]+/i,  // x = ±√5
        /solution/i,
        /answer/i,
        /final/i
      ];
      
      if (answerPatterns.some(pattern => pattern.test(lineClean))) {
        analysis.hasFinalAnswer = true;
        analysis.score += 1;
        analysis.feedback.push(`✅ Line ${index + 1}: Contains final answer`);
      }

      // Check for mathematical operations and structure
      if (lineClean.includes('=') && (lineClean.includes('x') || lineClean.includes('X'))) {
        // This looks like a mathematical step
        if (lineClean.length > 5) {  // Avoid very short lines
          analysis.score += 0.5;
          analysis.feedback.push(`✅ Line ${index + 1}: Shows mathematical work`);
        }
      }
    });

    // Generate intelligent suggestions based on what's missing
    if (analysis.hasDenominators && !analysis.mentionsRestrictions) {
      analysis.suggestions.push("💡 Consider mentioning restrictions (values that make denominators zero)");
      analysis.suggestions.push("💡 Example: 'x ≠ 2 because it makes the denominator zero'");
    }

    if (analysis.hasDenominators && !analysis.showsLCDWork) {
      analysis.suggestions.push("💡 Show your LCD multiplication work clearly");
      analysis.suggestions.push("💡 Example: 'Multiply both sides by (x-2): (x-2) × 5/(x-2) = (x-2) × [right side]'");
    }

    if (!analysis.showsCancellation) {
      analysis.suggestions.push("💡 Show cancellation steps explicitly");
      analysis.suggestions.push("💡 Example: '(x-2)/(x-2) = 1, so we get: 5 = [simplified right side]'");
    }

    if (!analysis.showsVerification) {
      analysis.suggestions.push("💡 Add verification by substituting your answer back into the original equation");
      analysis.suggestions.push("💡 Example: 'Check: LHS = 5/(5-2) = 5/3, RHS = (5-1)/(5-2) + 1 = 4/3 + 1 = 7/3'");
    }

    if (!analysis.hasFinalAnswer) {
      analysis.suggestions.push("💡 Make sure to state your final answer clearly");
      analysis.suggestions.push("💡 Example: 'Therefore, x = 5' or 'The solution is x = 5'");
    }

    // Check for common mathematical errors
    const commonErrors = [];
    lines.forEach((line, index) => {
      const lineClean = line.replace(/\s+/g, ' ').trim();
      
      // Check for division by zero
      if (lineClean.includes('/0') || lineClean.includes('÷0')) {
        commonErrors.push(`⚠️ Line ${index + 1}: Division by zero detected`);
      }
      
      // Check for unbalanced equations
      if (lineClean.includes('=') && lineClean.split('=').length !== 2) {
        commonErrors.push(`⚠️ Line ${index + 1}: Unbalanced equation (multiple equals signs)`);
      }
      
      // Check for incomplete expressions
      if (lineClean.includes('(') && !lineClean.includes(')')) {
        commonErrors.push(`⚠️ Line ${index + 1}: Unclosed parentheses detected`);
      }
    });

    if (commonErrors.length > 0) {
      analysis.suggestions.push(...commonErrors);
    }

    // Calculate final score (max 10)
    analysis.score = Math.min(analysis.score, 10);

    // Add detailed analysis
    analysis.detailedAnalysis = {
      denominatorComplexity: analysis.hasDenominators ? 'High' : 'None',
      mathematicalSteps: lines.filter(line => line.includes('=') || line.includes('+') || line.includes('-') || line.includes('*') || line.includes('/')).length,
      verificationQuality: analysis.showsVerification ? 'Excellent' : 'Missing',
      overallStructure: analysis.score >= 8 ? 'Excellent' : analysis.score >= 6 ? 'Good' : analysis.score >= 4 ? 'Fair' : 'Needs Improvement'
    };

    return analysis;
  };

  const resetChecker = () => {
    setEquation('');
    setSolutionLines([]);
    setCurrentDrawing('');
    setCheckResult(null);
    setShowResults(false);
    setDrawingMode('equation');
    setCurrentLineIndex(0);
    clearCanvas();
  };

  const removeSolutionLine = (index: number) => {
    setSolutionLines(solutionLines.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-7xl max-h-[95vh] overflow-hidden bg-gradient-to-r from-gray-900/95 to-slate-800/95 backdrop-blur-md border-2 border-gray-400/50">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 border-b border-gray-600/50 bg-gradient-to-r from-gray-800/50 to-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="w-8 h-8 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Drawing Solution Checker</h2>
                  <p className="text-gray-400">
                    Draw your equation and solution steps, then check them with AI analysis
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>
          </div>

          <div className="flex h-[calc(95vh-120px)]">
            {/* Left Side - Drawing Canvas */}
            <div className="w-1/2 p-6 border-r border-gray-600/50">
              <div className="space-y-4">
                {/* Drawing Mode Indicator */}
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    drawingMode === 'equation' 
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                      : 'bg-green-600/20 text-green-300 border border-green-500/30'
                  }`}>
                    {drawingMode === 'equation' ? '📝 Drawing Equation' : '📚 Drawing Solution Step'}
                  </div>
                </div>

                {/* Canvas */}
                <div className="bg-gray-900 rounded-lg border border-gray-600/50 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={400}
                    className="w-full h-[400px] cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>

                {/* Drawing Controls */}
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={clearCanvas}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                  >
                    <Eraser size={16} className="mr-1" />
                    Clear
                  </Button>
                  <Button
                    onClick={undoLastPath}
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20"
                  >
                    <Undo2 size={16} className="mr-1" />
                    Undo
                  </Button>
                  <Button
                    onClick={captureAndRecognize}
                    disabled={isProcessing}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Camera size={16} className="mr-1" />
                        {drawingMode === 'equation' ? 'Recognize Equation' : 'Add Solution Step'}
                      </>
                    )}
                  </Button>
                </div>

                {/* Instructions */}
                <div className="text-center text-gray-400 text-sm">
                  {drawingMode === 'equation' ? (
                    <p>Draw the equation you want to solve, then click "Recognize Equation"</p>
                  ) : (
                    <p>Draw your solution step, then click "Add Solution Step" to add it to your solution</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Results and Analysis */}
            <div className="w-1/2 p-6 overflow-y-auto">
              {!showResults ? (
                <div className="space-y-6">
                  {/* Current Equation Display */}
                  {equation && (
                    <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-300 mb-2">📝 Equation to Solve:</h3>
                      <div className="bg-gray-800/50 rounded px-3 py-2 text-white font-mono text-lg">
                        {equation}
                      </div>
                    </div>
                  )}

                  {/* Solution Steps */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">📚 Solution Steps:</h3>
                    <div className="space-y-3">
                      {solutionLines.map((line, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded px-3 py-2 text-white">
                            <span className="text-gray-400 text-sm mr-2">Line {index + 1}:</span>
                            {line}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSolutionLine(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {solutionLines.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                        <h4 className="text-lg font-semibold mb-2">Ready to Add Solution Steps</h4>
                        <p className="text-sm">
                          {equation ? 'Draw your first solution step on the left, then click "Add Solution Step"' : 'First draw and recognize an equation, then add solution steps'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={resetChecker}
                      variant="outline"
                      className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                    >
                      <RotateCcw size={16} className="mr-2" />
                      Reset All
                    </Button>
                    <Button
                      onClick={finishSolution}
                      disabled={isChecking || !equation.trim() || solutionLines.length === 0}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {isChecking ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Checking...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          Check Solution
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Solution Analysis Results</h3>
                    <div className="text-2xl font-bold text-blue-400">
                      Score: {checkResult.score}/10
                    </div>
                  </div>

                  {/* Backend Analysis */}
                  {checkResult.backendAnalysis && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">🤖 AI Backend Analysis</h4>
                      <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                          {checkResult.backendAnalysis}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">✅ What You Did Well</h4>
                    <div className="space-y-2">
                      {checkResult.feedback.length > 0 ? (
                        checkResult.feedback.map((item, index) => (
                          <div key={index} className="bg-green-900/20 border border-green-600/30 rounded px-3 py-2 text-green-300">
                            {item}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 italic">No specific strengths detected yet.</div>
                      )}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">💡 Suggestions for Improvement</h4>
                    <div className="space-y-2">
                      {checkResult.suggestions.length > 0 ? (
                        checkResult.suggestions.map((item, index) => (
                          <div key={index} className="bg-yellow-900/20 border border-yellow-600/30 rounded px-3 py-2 text-yellow-300">
                            {item}
                          </div>
                        ))
                      ) : (
                        <div className="text-green-400 italic">Great job! No suggestions needed.</div>
                      )}
                    </div>
                  </div>

                  {/* Detailed Analysis */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">🔍 Detailed Analysis</h4>
                    <div className="space-y-3">
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Equation:</span>
                        <span className="text-white ml-2">{checkResult.equation}</span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Total Steps:</span>
                        <span className="text-white ml-2">{checkResult.totalLines}</span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Has Denominators:</span>
                        <span className={`ml-2 ${checkResult.hasDenominators ? 'text-green-400' : 'text-gray-400'}`}>
                          {checkResult.hasDenominators ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Mentions Restrictions:</span>
                        <span className={`ml-2 ${checkResult.mentionsRestrictions ? 'text-green-400' : 'text-gray-400'}`}>
                          {checkResult.mentionsRestrictions ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Shows Verification:</span>
                        <span className={`ml-2 ${checkResult.showsVerification ? 'text-green-400' : 'text-gray-400'}`}>
                          {checkResult.showsVerification ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Has Final Answer:</span>
                        <span className={`ml-2 ${checkResult.hasFinalAnswer ? 'text-green-400' : 'text-gray-400'}`}>
                          {checkResult.hasFinalAnswer ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Shows LCD Work:</span>
                        <span className={`ml-2 ${checkResult.showsLCDWork ? 'text-green-400' : 'text-gray-400'}`}>
                          {checkResult.showsLCDWork ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Shows Factoring:</span>
                        <span className={`ml-2 ${checkResult.showsFactoring ? 'text-green-400' : 'text-gray-400'}`}>
                          {checkResult.showsFactoring ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Shows Cancellation:</span>
                        <span className={`ml-2 ${checkResult.showsCancellation ? 'text-green-400' : 'text-gray-400'}`}>
                          {checkResult.showsCancellation ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Mathematical Steps:</span>
                        <span className="text-white ml-2">{checkResult.detailedAnalysis.mathematicalSteps}</span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Denominator Complexity:</span>
                        <span className="text-white ml-2">{checkResult.detailedAnalysis.denominatorComplexity}</span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Verification Quality:</span>
                        <span className="text-white ml-2">{checkResult.detailedAnalysis.verificationQuality}</span>
                      </div>
                      <div className="bg-gray-800/50 rounded px-3 py-2">
                        <span className="text-gray-400">Overall Structure:</span>
                        <span className="text-white ml-2">{checkResult.detailedAnalysis.overallStructure}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={resetChecker}
                      variant="outline"
                      className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50"
                    >
                      Check Another Solution
                    </Button>
                    <Button
                      onClick={() => setShowResults(false)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Back to Drawing
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SolutionChecker;
