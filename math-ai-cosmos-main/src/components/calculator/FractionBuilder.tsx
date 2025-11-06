import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Minus } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface FractionBuilderProps {
  onComplete: (fraction: string) => void;
  onCancel: () => void;
}

export const FractionBuilder: React.FC<FractionBuilderProps> = ({
  onComplete,
  onCancel
}) => {
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  const [currentInput, setCurrentInput] = useState<'numerator' | 'denominator'>('numerator');

  const handleNumber = (num: string) => {
    if (currentInput === 'numerator') {
      setNumerator(prev => prev + num);
    } else {
      setDenominator(prev => prev + num);
    }
  };

  const handleVariable = (variable: string) => {
    if (currentInput === 'numerator') {
      setNumerator(prev => prev + variable);
    } else {
      setDenominator(prev => prev + variable);
    }
  };

  const handleOperator = (operator: string) => {
    if (currentInput === 'numerator') {
      setNumerator(prev => prev + operator);
    } else {
      setDenominator(prev => prev + operator);
    }
  };

  const handleComplete = () => {
    if (numerator.trim() && denominator.trim()) {
      const fraction = `(${numerator})/(${denominator})`;
      onComplete(fraction);
    }
  };

  const numberButtons = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const variables = ['x', 'y', 'z'];
  const operators = ['+', '-', '*'];

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle className="text-lg">Build Your Fraction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step Indicator */}
        <div className="flex gap-4 mb-4">
          <Button
            variant={currentInput === 'numerator' ? 'default' : 'outline'}
            onClick={() => setCurrentInput('numerator')}
            className="flex items-center gap-2"
          >
            Numerator (top)
          </Button>
          <Button
            variant={currentInput === 'denominator' ? 'default' : 'outline'}
            onClick={() => setCurrentInput('denominator')}
            className="flex items-center gap-2"
          >
            Denominator (bottom)
          </Button>
        </div>

        {/* Current Fraction Display */}
        <div className="bg-muted rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-2">Your Fraction:</div>
          <div className="text-center">
            {(() => {
              try {
                const latex = `\\frac{${numerator || '?'}}{${denominator || '?'}}`;
                return <BlockMath math={latex} />;
              } catch (error) {
                return (
                  <div className="font-mono text-lg">
                    {numerator || '?'} / {denominator || '?'}
                  </div>
                );
              }
            })()}
          </div>
        </div>

        {/* Current Input Display */}
        <div className="bg-background rounded-lg p-3 border">
          <div className="text-sm text-muted-foreground mb-2">
            Currently editing: <strong>{currentInput === 'numerator' ? 'Numerator' : 'Denominator'}</strong>
          </div>
          <div className="font-mono text-lg">
            {currentInput === 'numerator' ? numerator : denominator}
          </div>
        </div>

        {/* Numbers */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Numbers:</Label>
          <div className="grid grid-cols-5 gap-2">
            {numberButtons.map((num) => (
              <Button
                key={num}
                variant="outline"
                className="h-10 text-lg font-mono"
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
                className="h-10 text-lg font-mono"
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
          <div className="grid grid-cols-3 gap-2">
            {operators.map((op) => (
              <Button
                key={op}
                variant="outline"
                className="h-10 text-lg font-mono"
                onClick={() => handleOperator(op)}
              >
                {op}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Patterns */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Add:</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-10 text-sm"
              onClick={() => {
                if (currentInput === 'numerator') {
                  setNumerator(prev => prev + 'x+1');
                } else {
                  setDenominator(prev => prev + 'x+1');
                }
              }}
            >
              x+1
            </Button>
            <Button
              variant="outline"
              className="h-10 text-sm"
              onClick={() => {
                if (currentInput === 'numerator') {
                  setNumerator(prev => prev + 'x-1');
                } else {
                  setDenominator(prev => prev + 'x-1');
                }
              }}
            >
              x-1
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!numerator.trim() || !denominator.trim()}
            className="flex-1 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Fraction
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
          <h4 className="font-medium mb-2">How to build a fraction:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Click "Numerator" to build the top part of your fraction</li>
            <li>Click numbers, variables, and operators to build the numerator</li>
            <li>Click "Denominator" to build the bottom part of your fraction</li>
            <li>Click numbers, variables, and operators to build the denominator</li>
            <li>Click "Add Fraction" when you're done</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}; 