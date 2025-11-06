import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type KeyboardMode = 'pretty' | 'sympy';

export interface MathKeyboardProps {
  targetRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  onInsert?: (text: string) => void;
  className?: string;
  mode?: KeyboardMode; // pretty -> LaTeX-like, sympy -> direct SymPy
}

function replaceSelectionWith(target: HTMLInputElement | HTMLTextAreaElement, insertionText: string, caretOffsetWithinInsertion: number) {
  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  const before = target.value.slice(0, start);
  const after = target.value.slice(end);
  const next = before + insertionText + after;
  target.value = next;
  const caret = start + Math.max(0, Math.min(caretOffsetWithinInsertion, insertionText.length));
  target.setSelectionRange(caret, caret);
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.focus();
}

function insertAtCaret(target: HTMLInputElement | HTMLTextAreaElement, text: string) {
  replaceSelectionWith(target, text, text.length);
}

const rowClass = "grid grid-cols-6 gap-2";
const keyClass = "bg-slate-800/70 hover:bg-slate-700 text-slate-100 border border-slate-600 rounded-lg py-2";

type SelectionRange = { start: number; end: number };

const MathKeyboardComponent: React.FC<MathKeyboardProps> = ({ targetRef, onInsert, className, mode = 'pretty' }) => {
  const localRef = useRef<HTMLDivElement>(null);
  const [fractionOpen, setFractionOpen] = useState(false);
  const [powerOpen, setPowerOpen] = useState(false);
  const [fractionBuilder, setFractionBuilder] = useState({ numerator: '', denominator: '' });
  const [powerBuilder, setPowerBuilder] = useState({ base: '', exponent: '' });
  const fractionSelectionRef = useRef<SelectionRange | null>(null);
  const powerSelectionRef = useRef<SelectionRange | null>(null);

  const getTarget = () => targetRef.current ?? null;

  const handleInsert = (text: string) => {
    const target = targetRef.current;
    if (!target) return;
    insertAtCaret(target, text);
    onInsert?.(text);
  };

  const keysRow1 = ['7', '8', '9', '+', '-', '='];
  const keysRow2 = ['4', '5', '6', '×', '÷', '('];
  const keysRow3 = ['1', '2', '3', ')', 'x', 'y'];
  const keysRow4 = ['0', 'a', 'b', 'c', '^', '√'];

  const mapDisplayToInsert = (k: string) => {
    switch (k) {
      case '×':
      case '÷':
        return ' ' + (k === '×' ? '*' : '/') + ' ';
      case '=':
        return mode === 'pretty' ? ' = ' : '=';
      default:
        return k;
    }
  };

  const prepareSelectionRange = (target: HTMLInputElement | HTMLTextAreaElement): SelectionRange => {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    return { start, end };
  };

  const preparePowerSelection = (target: HTMLInputElement | HTMLTextAreaElement) => {
    const range = prepareSelectionRange(target);
    if (range.start !== range.end) {
      const selected = target.value.slice(range.start, range.end).trim();
      return { base: selected, range };
    }

    const value = target.value;
    const prevIndex = range.start - 1;
    const bracketPairs: Record<string, string> = {
      ')': '(',
      ']': '[',
      '}': '{',
    };
    const openingBrackets = new Set(Object.values(bracketPairs));

    if (prevIndex >= 0) {
      const lastChar = value[prevIndex];
      if (lastChar in bracketPairs) {
        let depth = 0;
        for (let i = prevIndex; i >= 0; i--) {
          const ch = value[i];
          if (Object.prototype.hasOwnProperty.call(bracketPairs, ch)) {
            depth++;
          } else if (openingBrackets.has(ch)) {
            depth--;
            if (depth === 0 && bracketPairs[lastChar] === ch) {
              let baseStart = i;
              while (baseStart > 0 && /[a-zA-Z0-9_]/.test(value[baseStart - 1])) {
                baseStart -= 1;
              }
              return { base: value.slice(baseStart, range.start), range: { start: baseStart, end: range.start } };
            }
          }
        }
      }
    }

    const before = value.slice(0, range.start);
    const match = before.match(/([a-zA-Z0-9_]+)$/);
    if (match) {
      const base = match[1];
      const baseStart = range.start - base.length;
      return { base, range: { start: baseStart, end: range.start } };
    }

    return { base: '', range };
  };

  const insertSqrt = () => {
    const target = getTarget();
    if (!target) return;
    const range = prepareSelectionRange(target);
    const selected = target.value.slice(range.start, range.end);
    target.setSelectionRange(range.start, range.end);
    if (selected) {
      const insertion = `sqrt(${selected.trim()})`;
      replaceSelectionWith(target, insertion, insertion.length);
    } else {
      replaceSelectionWith(target, 'sqrt()', 'sqrt('.length);
    }
    onInsert?.('sqrt');
  };

  const applyExponentQuick = (exponent: string) => {
    const target = getTarget();
    if (!target) return;
    const powerSelection = preparePowerSelection(target);
    powerSelectionRef.current = powerSelection.range;
    const baseValue = powerSelection.base.trim();
    const base = baseValue.length > 0 ? baseValue : '';
    target.setSelectionRange(powerSelection.range.start, powerSelection.range.end);
    const exponentClean = exponent.trim();
    const templateBase = base || '()';
    const insertion = mode === 'pretty'
      ? `${templateBase}^(${exponentClean})`
      : `${templateBase}**(${exponentClean})`;
    replaceSelectionWith(target, insertion, insertion.length);
    onInsert?.('power');
    powerSelectionRef.current = null;
  };

  useEffect(() => {
    if (!fractionOpen) return;
    const target = getTarget();
    if (!target) {
      setFractionBuilder({ numerator: '', denominator: '' });
      fractionSelectionRef.current = null;
      return;
    }
    const range = prepareSelectionRange(target);
    fractionSelectionRef.current = range;
    const selected = range.start !== range.end ? target.value.slice(range.start, range.end).trim() : '';
    setFractionBuilder({ numerator: selected, denominator: '' });
  }, [fractionOpen]);

  useEffect(() => {
    if (!powerOpen) return;
    const target = getTarget();
    if (!target) {
      setPowerBuilder({ base: '', exponent: '' });
      powerSelectionRef.current = null;
      return;
    }
    const powerSelection = preparePowerSelection(target);
    powerSelectionRef.current = powerSelection.range;
    setPowerBuilder({ base: powerSelection.base, exponent: '' });
  }, [powerOpen]);

  const commitFraction = () => {
    const target = getTarget();
    if (!target) return;
    const numerator = fractionBuilder.numerator.trim();
    const denominator = fractionBuilder.denominator.trim();
    const selectedRange = fractionSelectionRef.current;
    if (selectedRange) {
      target.setSelectionRange(selectedRange.start, selectedRange.end);
    }
    const insertion = `(${numerator})/(${denominator})`;
    replaceSelectionWith(target, insertion, insertion.length);
    onInsert?.('fraction');
    setFractionOpen(false);
    setFractionBuilder({ numerator: '', denominator: '' });
    fractionSelectionRef.current = null;
  };

  const commitPower = () => {
    const target = getTarget();
    if (!target) return;
    const baseValue = powerBuilder.base.trim();
    const exponentValue = powerBuilder.exponent.trim();
    const range = powerSelectionRef.current;
    if (range) {
      target.setSelectionRange(range.start, range.end);
    }
    const base = baseValue.length > 0 ? baseValue : '()';
    const insertion = mode === 'pretty'
      ? `${base}^(${exponentValue})`
      : `${base}**(${exponentValue})`;
    replaceSelectionWith(target, insertion, insertion.length);
    onInsert?.('power');
    setPowerOpen(false);
    setPowerBuilder({ base: '', exponent: '' });
    powerSelectionRef.current = null;
  };

  const canCommitFraction = useMemo(() => (
    fractionBuilder.numerator.trim().length > 0 && fractionBuilder.denominator.trim().length > 0
  ), [fractionBuilder]);

  const canCommitPower = useMemo(() => (
    powerBuilder.base.trim().length > 0 && powerBuilder.exponent.trim().length > 0
  ), [powerBuilder]);

  return (
    <div ref={localRef} className={`space-y-2 ${className || ''}`}>
      <div className="grid grid-cols-4 gap-2">
        <Button type="button" variant="outline" className="col-span-1" onClick={() => handleInsert(mode === 'pretty' ? ' = ' : 'Eq( , )')}>
          Eq( , )
        </Button>
        <Button type="button" variant="outline" className="col-span-1" onClick={() => handleInsert('(')}>
          (
        </Button>
        <Button type="button" variant="outline" className="col-span-1" onClick={() => handleInsert(')')}>
          )
        </Button>
        <div className="col-span-1">
          <Popover
            open={fractionOpen}
            onOpenChange={(open) => {
              setFractionOpen(open);
              if (!open) {
                setFractionBuilder({ numerator: '', denominator: '' });
                fractionSelectionRef.current = null;
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full" onClick={() => setFractionOpen(true)}>
                a⁄b
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3 bg-slate-900 border-slate-700">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Build a Fraction</h4>
                <p className="text-xs text-slate-400">Select the numerator first or type it below.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-slate-300">Numerator</span>
                  <Input
                    value={fractionBuilder.numerator}
                    onChange={(e) => setFractionBuilder((prev) => ({ ...prev, numerator: e.target.value }))}
                    placeholder="e.g. x+1"
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-300">Denominator</span>
                  <Input
                    value={fractionBuilder.denominator}
                    onChange={(e) => setFractionBuilder((prev) => ({ ...prev, denominator: e.target.value }))}
                    placeholder="e.g. x-2"
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
              </div>
              <Button type="button" disabled={!canCommitFraction} onClick={commitFraction} className="w-full">
                Insert Fraction
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className={rowClass}>
        {keysRow1.map(k => (
          <button
            key={k}
            type="button"
            className={keyClass}
            onClick={() => handleInsert(mapDisplayToInsert(k))}
          >
            {k}
          </button>
        ))}
      </div>
      <div className={rowClass}>
        {keysRow2.map(k => (
          <button
            key={k}
            type="button"
            className={keyClass}
            onClick={() => handleInsert(mapDisplayToInsert(k))}
          >
            {k}
          </button>
        ))}
      </div>
      <div className={rowClass}>
        {keysRow3.map(k => (
          <button
            key={k}
            type="button"
            className={keyClass}
            onClick={() => handleInsert(mapDisplayToInsert(k))}
          >
            {k}
          </button>
        ))}
      </div>
      <div className={rowClass}>
        {keysRow4.map(k => (
          <button
            key={k}
            type="button"
            className={keyClass}
            onClick={() => {
              if (k === '^') {
                setPowerOpen(true);
                return;
              }
              if (k === '√') {
                insertSqrt();
                return;
              }
              handleInsert(mapDisplayToInsert(k));
            }}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => applyExponentQuick(mode === 'pretty' ? '2' : '2')}
        >
          x²
        </Button>
        <div>
          <Popover
            open={powerOpen}
            onOpenChange={(open) => {
              setPowerOpen(open);
              if (!open) {
                setPowerBuilder({ base: '', exponent: '' });
                powerSelectionRef.current = null;
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full" onClick={() => setPowerOpen(true)}>
                Exponent Helper
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-3 bg-slate-900 border-slate-700">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Raise to a Power</h4>
                <p className="text-xs text-slate-400">We use your selected base or the token before the cursor.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-slate-300">Base</span>
                  <Input
                    value={powerBuilder.base}
                    onChange={(e) => setPowerBuilder((prev) => ({ ...prev, base: e.target.value }))}
                    placeholder="e.g. x+1"
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-300">Exponent</span>
                  <Input
                    value={powerBuilder.exponent}
                    onChange={(e) => setPowerBuilder((prev) => ({ ...prev, exponent: e.target.value }))}
                    placeholder="e.g. 2"
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
              </div>
              <Button type="button" disabled={!canCommitPower} onClick={commitPower} className="w-full">
                Insert Power
              </Button>
            </PopoverContent>
          </Popover>
        </div>
        <Button type="button" variant="outline" onClick={insertSqrt}>
          √( )
        </Button>
      </div>
      <p className="text-[11px] leading-tight text-slate-400">
        Tip: tap a number or variable, then use the helpers for fractions or exponents. Builders prefill from your selection, so you don’t have to remember the syntax.
      </p>
    </div>
  );
};
const MathKeyboard = React.memo(MathKeyboardComponent);
MathKeyboard.displayName = 'MathKeyboard';

export { MathKeyboard };
export default MathKeyboard;
