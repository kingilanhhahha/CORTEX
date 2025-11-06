import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  RotateCcw
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface LaTeXKeyboardProps {
  onInput: (latex: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onEnter: () => void;
  currentInput: string;
}

export const LaTeXKeyboard: React.FC<LaTeXKeyboardProps> = ({
  onInput,
  onClear,
  onBackspace,
  onEnter,
  currentInput
}) => {
  const [isFractionMode, setIsFractionMode] = useState(false);
  const [isSuperscriptMode, setIsSuperscriptMode] = useState(false);
  const [isSubscriptMode, setIsSubscriptMode] = useState(false);

  const handleInput = (latex: string) => {
    onInput(latex);
  };

  const handleFraction = () => {
    if (isFractionMode) {
      onInput('}');
      setIsFractionMode(false);
    } else {
      onInput('\\frac{');
      setIsFractionMode(true);
    }
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

  const functionButtons = [
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
    { label: '[', latex: '[' },
    { label: ']', latex: ']' },
    { label: '{', latex: '{' },
    { label: '}', latex: '}' },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-4 space-y-4">
                 {/* Display current input */}
         <div className="bg-muted rounded-lg p-3 min-h-[60px] flex items-center justify-between">
           <div className="flex-1 font-mono text-sm break-all">
             {currentInput || 'Enter equation...'}
           </div>
           <div className="flex gap-2 ml-4">
             <Button
               variant="outline"
               size="sm"
               onClick={onBackspace}
               className="h-8 w-8 p-0"
             >
               <ArrowLeft className="h-4 w-4" />
             </Button>
             <Button
               variant="outline"
               size="sm"
               onClick={onClear}
               className="h-8 w-8 p-0"
             >
               <Trash2 className="h-4 w-4" />
             </Button>
           </div>
         </div>

         {/* Preview rendered math */}
         {currentInput && (
           <div className="bg-background rounded-lg p-3 border">
             <div className="text-xs text-muted-foreground mb-2">Preview:</div>
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
         )}

        {/* Numbers */}
        <div className="grid grid-cols-5 gap-2">
          {numberButtons.map((btn) => (
            <Button
              key={btn.label}
              variant="outline"
              className="h-12 text-lg font-mono"
              onClick={() => handleInput(btn.latex)}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Variables */}
        <div className="grid grid-cols-6 gap-2">
          {functionButtons.map((btn) => (
            <Button
              key={btn.label}
              variant="outline"
              className="h-12 text-lg font-mono"
              onClick={() => handleInput(btn.latex)}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Operators */}
        <div className="grid grid-cols-5 gap-2">
          {operatorButtons.map((btn) => (
            <Button
              key={btn.label}
              variant="outline"
              className="h-12 text-lg font-mono"
              onClick={() => handleInput(btn.latex)}
            >
              {btn.label}
            </Button>
          ))}
        </div>

                 {/* Special LaTeX functions */}
         <div className="grid grid-cols-3 gap-2">
           <Button
             variant={isFractionMode ? "default" : "outline"}
             className={`h-12 text-sm ${isFractionMode ? 'bg-primary text-primary-foreground' : ''}`}
             onClick={handleFraction}
           >
             <Divide className="h-4 w-4 mr-2" />
             Fraction
           </Button>
           <Button
             variant={isSuperscriptMode ? "default" : "outline"}
             className={`h-12 text-sm ${isSuperscriptMode ? 'bg-primary text-primary-foreground' : ''}`}
             onClick={handleSuperscript}
           >
             <Superscript className="h-4 w-4 mr-2" />
             Power
           </Button>
           <Button
             variant={isSubscriptMode ? "default" : "outline"}
             className={`h-12 text-sm ${isSubscriptMode ? 'bg-primary text-primary-foreground' : ''}`}
             onClick={handleSubscript}
           >
             <Subscript className="h-4 w-4 mr-2" />
             Subscript
           </Button>
         </div>

        {/* Parentheses and brackets */}
        <div className="grid grid-cols-6 gap-2">
          {specialButtons.map((btn) => (
            <Button
              key={btn.label}
              variant="outline"
              className="h-12 text-lg font-mono"
              onClick={() => handleInput(btn.latex)}
            >
              {btn.label}
            </Button>
          ))}
        </div>

                 {/* Common LaTeX patterns */}
         <div className="grid grid-cols-2 gap-2">
           <Button
             variant="outline"
             className="h-12 text-sm"
             onClick={() => handleInput('\\frac{1}{x}')}
             title="Insert basic fraction"
           >
             Basic Fraction
           </Button>
           <Button
             variant="outline"
             className="h-12 text-sm"
             onClick={() => handleInput('x^{2}')}
             title="Insert x squared"
           >
             x²
           </Button>
         </div>

         <div className="grid grid-cols-2 gap-2">
           <Button
             variant="outline"
             className="h-12 text-sm"
             onClick={() => handleInput('\\frac{x+1}{x-1}')}
             title="Insert complex fraction"
           >
             Complex Fraction
           </Button>
           <Button
             variant="outline"
             className="h-12 text-sm"
             onClick={() => handleInput('x^{2}+2x+1')}
             title="Insert quadratic expression"
           >
             Quadratic
           </Button>
         </div>

         <div className="grid grid-cols-2 gap-2">
           <Button
             variant="outline"
             className="h-12 text-sm"
             onClick={() => handleInput('\\frac{x+2}{x-3}=\\frac{1}{2}')}
             title="Insert complete rational equation"
           >
             Rational Equation
           </Button>
           <Button
             variant="outline"
             className="h-12 text-sm"
             onClick={() => handleInput('\\frac{x}{x+1}+\\frac{1}{x-1}=2')}
             title="Insert equation with multiple fractions"
           >
             Multiple Fractions
           </Button>
         </div>

        {/* Enter button */}
        <Button
          onClick={onEnter}
          className="w-full h-14 text-lg font-semibold"
        >
          Solve Equation
        </Button>
      </CardContent>
    </Card>
  );
}; 