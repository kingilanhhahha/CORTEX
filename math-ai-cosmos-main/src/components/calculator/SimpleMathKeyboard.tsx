import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Minus, 
  X, 
  Divide, 
  Equal, 
  Parentheses, 
  Superscript, 
  Subscript,
  ArrowLeft,
  Trash2,
  RotateCcw,
  Type,
  Hash,
  Variable
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface SimpleMathKeyboardProps {
  onInput: (latex: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onEnter: () => void;
  currentInput: string;
}

export const SimpleMathKeyboard: React.FC<SimpleMathKeyboardProps> = ({
  onInput,
  onClear,
  onBackspace,
  onEnter,
  currentInput
}) => {
  const [isFractionMode, setIsFractionMode] = useState(false);
  const [isSuperscriptMode, setIsSuperscriptMode] = useState(false);
  const [isSubscriptMode, setIsSubscriptMode] = useState(false);
  const [fractionStep, setFractionStep] = useState<'numerator' | 'denominator'>('numerator');
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');

  const handleFractionNext = () => {
    if (fractionStep === 'numerator') {
      setFractionStep('denominator');
    } else {
      // Complete the fraction - ensure proper LaTeX syntax
      if (numerator && denominator) {
        const fraction = `\\frac{${numerator.trim()}}{${denominator.trim()}}`;
        console.log('Creating fraction:', fraction); // Debug log
        onInput(fraction);
      }
      setIsFractionMode(false);
      setFractionStep('numerator');
      setNumerator('');
      setDenominator('');
    }
  };

  const handleFractionCancel = () => {
    setIsFractionMode(false);
    setFractionStep('numerator');
    setNumerator('');
    setDenominator('');
  };

  const handleSuperscript = () => {
    if (isSuperscriptMode) {
      onInput('}');
      setIsSuperscriptMode(false);
    } else {
      onInput('^{');
      setIsSuperscriptMode(true);
    }
  };

  const handleSubscript = () => {
    if (isSubscriptMode) {
      onInput('}');
      setIsSubscriptMode(false);
    } else {
      onInput('_{');
      setIsSubscriptMode(true);
    }
  };

  // Helper function to safely add input
  const safeInput = (input: string) => {
    // Clean up any potential LaTeX issues
    const cleanInput = input.replace(/\\+/g, '\\'); // Ensure single backslash
    return cleanInput;
  };

  const handleInput = (latex: string) => {
    onInput(safeInput(latex));
  };

  const handleFractionInput = (input: string) => {
    const cleanInput = safeInput(input);
    if (fractionStep === 'numerator') {
      setNumerator(prev => prev + cleanInput);
    } else {
      setDenominator(prev => prev + cleanInput);
    }
  };

  const handleFraction = () => {
    if (!isFractionMode) {
      setIsFractionMode(true);
      setFractionStep('numerator');
      setNumerator('');
      setDenominator('');
    }
  };

  const numberButtons = [
    { label: '0', latex: '0' },
    { label: '1', latex: '1' },
    { label: '2', latex: '2' },
    { label: '3', latex: '3' },
    { label: '4', latex: '4' },
    { label: '5', latex: '5' },
    { label: '6', latex: '6' },
    { label: '7', latex: '7' },
    { label: '8', latex: '8' },
    { label: '9', latex: '9' },
  ];

  const operatorButtons = [
    { label: '+', latex: '+' },
    { label: '-', latex: '-' },
    { label: '×', latex: '\\times' },
    { label: '÷', latex: '\\div' },
    { label: '=', latex: '=' },
  ];

  const variableButtons = [
    { label: 'x', latex: 'x' },
    { label: 'y', latex: 'y' },
    { label: 'z', latex: 'z' },
    { label: 'a', latex: 'a' },
    { label: 'b', latex: 'b' },
    { label: 'c', latex: 'c' },
  ];

  const specialButtons = [
    { label: '(', latex: '(' },
    { label: ')', latex: ')' },
    { label: '²', latex: '^2' },
    { label: '³', latex: '^3' },
  ];

  return (
    <div className="space-y-4">
      {/* Current Input Display */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Current Input</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[60px] p-3 bg-background rounded border">
            {currentInput ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">LaTeX Code:</div>
                <div className="font-mono text-sm break-all">{currentInput}</div>
                <div className="text-xs text-muted-foreground">Rendered:</div>
                <div className="text-center">
                  {(() => {
                    try {
                      return <BlockMath math={currentInput} />;
                    } catch (error) {
                      return (
                        <div className="text-red-500 text-sm">
                          Invalid LaTeX syntax
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-center">Enter your equation...</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fraction Builder (when active) */}
      {isFractionMode && (
        <Card className="bg-primary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-primary">
              Building Fraction: {fractionStep === 'numerator' ? 'Numerator' : 'Denominator'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Numerator:</span>
                <div className="flex-1 p-2 bg-background rounded border font-mono text-sm">
                  {numerator || 'empty'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Denominator:</span>
                <div className="flex-1 p-2 bg-background rounded border font-mono text-sm">
                  {denominator || 'empty'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleFractionNext} disabled={!numerator && fractionStep === 'numerator'}>
                  {fractionStep === 'numerator' ? 'Next' : 'Complete'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleFractionCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Number Pad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {numberButtons.map((button) => (
              <Button
                key={button.label}
                variant="outline"
                size="sm"
                onClick={() => isFractionMode ? handleFractionInput(button.latex) : handleInput(button.latex)}
                className="h-10"
              >
                {button.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Variable className="h-4 w-4" />
            Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {variableButtons.map((button) => (
              <Button
                key={button.label}
                variant="outline"
                size="sm"
                onClick={() => isFractionMode ? handleFractionInput(button.latex) : handleInput(button.latex)}
                className="h-10"
              >
                {button.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Operators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {operatorButtons.map((button) => (
              <Button
                key={button.label}
                variant="outline"
                size="sm"
                onClick={() => isFractionMode ? handleFractionInput(button.latex) : handleInput(button.latex)}
                className="h-10"
              >
                {button.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Special Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Special Functions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFraction}
              disabled={isFractionMode}
              className="h-10 flex items-center gap-2"
            >
              <Divide className="h-4 w-4" />
              Fraction
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSuperscript}
              className="h-10 flex items-center gap-2"
            >
              <Superscript className="h-4 w-4" />
              Power
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSubscript}
              className="h-10 flex items-center gap-2"
            >
              <Subscript className="h-4 w-4" />
              Subscript
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => isFractionMode ? handleFractionInput('(') : handleInput('(')}
              className="h-10 flex items-center gap-2"
            >
              <Parentheses className="h-4 w-4" />
              Parentheses
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Special Symbols */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Special Symbols</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {specialButtons.map((button) => (
              <Button
                key={button.label}
                variant="outline"
                size="sm"
                onClick={() => isFractionMode ? handleFractionInput(button.latex) : handleInput(button.latex)}
                className="h-10"
              >
                {button.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Control Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBackspace}
              className="h-10 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="h-10 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onInput(' ')}
              className="h-10 flex items-center gap-2"
            >
              <Type className="h-4 w-4" />
              Space
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onEnter}
              className="h-10 flex items-center gap-2"
            >
              <Hash className="h-4 w-4" />
              Solve
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 