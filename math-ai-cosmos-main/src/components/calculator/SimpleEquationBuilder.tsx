import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Minus, 
  X, 
  Divide, 
  Equal, z
  ArrowLeft,
  Trash2,
  Calculator,
  Fractions,
  Superscript
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { FractionBuilder } from './FractionBuilder';

interface SimpleEquationBuilderProps {
  onSolve: (equation: string) => void;
  onClear: () => void;
}

export const SimpleEquationBuilder: React.FC<SimpleEquationBuilderProps> = ({
  onSolve,
  onClear
}) => {
  const [leftSide, setLeftSide] = useState<string>('');
  const [rightSide, setRightSide] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'left' | 'right'>('left');
  const [showFractionBuilder, setShowFractionBuilder] = useState(false);

  const handleNumber = (num: string) => {
    if (currentStep === 'left') {
      setLeftSide(prev => prev + num);
    } else {
      setRightSide(prev => prev + num);
    }
  };

  const handleVariable = (variable: string) => {
    if (currentStep === 'left') {
      setLeftSide(prev => prev + variable);
    } else {
      setRightSide(prev => prev + variable);
    }
  };

  const handleOperator = (operator: string) => {
    if (currentStep === 'left') {
      setLeftSide(prev => prev + operator);
    } else {
      setRightSide(prev => prev + operator);
    }
  };

  const handleFraction = () => {
    setShowFractionBuilder(true);
  };

  const handleFractionComplete = (fraction: string) => {
    if (currentStep === 'left') {
      setLeftSide(prev => prev + fraction);
    } else {
      setRightSide(prev => prev + fraction);
    }
    setShowFractionBuilder(false);
  };

  const handleFractionCancel = () => {
    setShowFractionBuilder(false);
  };

  const handlePower = () => {
    const base = prompt('Enter the base (e.g., x):');
    const exponent = prompt('Enter the exponent (e.g., 2):');
    if (base && exponent) {
      const power = `${base}^(${exponent})`;
      if (currentStep === 'left') {
        setLeftSide(prev => prev + power);
      } else {
        setRightSide(prev => prev + power);
      }
    }
  };

  const handleClear = () => {
    setLeftSide('');
    setRightSide('');
    setCurrentStep('left');
    onClear();
  };

  const handleSolve = () => {
    const equation = `${leftSide} = ${rightSide}`;
    onSolve(equation);
  };

  const getCurrentLatex = () => {
    const equation = `${leftSide} = ${rightSide}`;
    return equation;
  };

  const numberButtons = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const variables = ['x', 'y', 'z'];
  const operators = ['+', '-', '*', '/'];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Simple Equation Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Indicator */}
        <div className="flex gap-4 mb-4">
          <Button
            variant={currentStep === 'left' ? 'default' : 'outline'}
            onClick={() => setCurrentStep('left')}
            className="flex items-center gap-2"
          >
            Left Side
          </Button>
          <Button
            variant={currentStep === 'right' ? 'default' : 'outline'}
            onClick={() => setCurrentStep('right')}
            className="flex items-center gap-2"
          >
            Right Side
          </Button>
        </div>

        {/* Current Equation Display */}
        <div className="bg-muted rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-2">Current Equation:</div>
          <div className="text-center">
            {(() => {
              try {
                return <BlockMath math={getCurrentLatex()} />;
              } catch (error) {
                return (
                  <div className="font-mono text-lg">
                    {leftSide} = {rightSide}
                  </div>
                );
              }
            })()}
          </div>
        </div>

        {/* Fraction Builder Modal */}
        {showFractionBuilder && (
          <FractionBuilder
            onComplete={handleFractionComplete}
            onCancel={handleFractionCancel}
          />
        )}

        {/* Numbers */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Numbers:</Label>
          <div className="grid grid-cols-5 gap-2">
            {numberButtons.map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-12 text-lg font-mono"
                onClick={() => handleNumber(num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Variables */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Variables:</Label>
          <div className="grid grid-cols-3 gap-2">
            {variables.map((variable) => (
              <Button
                key={variable}
                variant="outline"
                className="h-12 text-lg font-mono"
                onClick={() => handleVariable(variable)}
              >
                {variable}
              </Button>
            ))}
          </div>
        </div>

        {/* Operators */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Operators:</Label>
          <div className="grid grid-cols-4 gap-2">
            {operators.map((op) => (
              <Button
                key={op}
                variant="outline"
                className="h-12 text-lg font-mono"
                onClick={() => handleOperator(op)}
              >
                {op}
              </Button>
            ))}
          </div>
        </div>

        {/* Special Functions */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Special Functions:</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-12 text-sm"
              onClick={handleFraction}
            >
              <Fractions className="h-4 w-4 mr-2" />
              Add Fraction
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm"
              onClick={handlePower}
            >
              <Superscript className="h-4 w-4 mr-2" />
              Add Power
            </Button>
          </div>
        </div>

        {/* Common Patterns */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Add:</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-12 text-sm"
              onClick={() => {
                if (currentStep === 'left') {
                  setLeftSide(prev => prev + '(x+1)/(x-1)');
                } else {
                  setRightSide(prev => prev + '(x+1)/(x-1)');
                }
              }}
            >
              Complex Fraction
            </Button>
            <Button
              variant="outline"
              className="h-12 text-sm"
              onClick={() => {
                if (currentStep === 'left') {
                  setLeftSide(prev => prev + 'x^(2)');
                } else {
                  setRightSide(prev => prev + 'x^(2)');
                }
              }}
            >
              x²
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
          <Button
            onClick={handleSolve}
            disabled={!leftSide.trim() || !rightSide.trim()}
            className="flex-1 flex items-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Solve Equation
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
          <h4 className="font-medium mb-2">How to use:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Click "Left Side" to build the left side of your equation</li>
            <li>Click numbers, variables, and operators to build your expression</li>
            <li>Use "Add Fraction" to create fractions with a simple form</li>
            <li>Use "Add Power" to create expressions like x²</li>
            <li>Click "Right Side" to build the right side of your equation</li>
            <li>Click "Solve Equation" when you're done</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}; 