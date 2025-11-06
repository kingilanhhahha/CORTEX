// Convert simple human-friendly math input to SymPy-friendly string

function loopReplace(s: string, re: RegExp, repl: (m: string, ...g: string[]) => string): string {
  let prev = s;
  let next = s.replace(re as any, repl as any);
  while (next !== prev) {
    prev = next;
    next = next.replace(re as any, repl as any);
  }
  return next;
}

export function simpleToSympy(input: string): string {
  if (!input) return '';
  let s = input.trim();

  // Remove f(x) = prefix if present
  s = s.replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, '');

  // Normalize unicode and spacing
  s = s.replace(/×/g, ' * ').replace(/÷/g, ' / ');
  s = s.replace(/\s+/g, ' ');

  // Superscripts unicode
  s = s.replace(/²/g, '**(2)');
  s = s.replace(/³/g, '**(3)');

  // sqrt is already sqrt( )

  // Caret powers: base^{exp} like inputs not expected; handle base^exp
  s = s.replace(/([0-9a-zA-Z_\)\]\}])\^(\d+)/g, (_m, base, exp) => `${base}**(${exp})`);
  s = s.replace(/([0-9a-zA-Z_\)\]\}])\^\(([^()]+)\)/g, (_m, base, exp) => `${base}**(${exp})`);

  // Token/Token -> (Token)/(Token)
  s = loopReplace(s, /\(([^(\)]*)\)\s*\/\s*\(([^(\)]*)\)/g, (_m, a, b) => `(${a})/(${b})`);
  s = loopReplace(s, /([0-9a-zA-Z_\)\]]+)\s*\/\s*\(([^(\)]*)\)/g, (_m, a, b) => `(${a})/(${b})`);
  s = loopReplace(s, /\(([^(\)]*)\)\s*\/\s*([0-9a-zA-Z_\(\[\{][^\s]*)/g, (_m, a, b) => `(${a})/(${b})`);
  s = loopReplace(s, /([0-9a-zA-Z_\)\]]+)\s*\/\s*([0-9a-zA-Z_\(\[\{][^\s]*)/g, (_m, a, b) => `(${a})/(${b})`);

  // Cleanup spacing
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// Convert simple input to LaTeX for preview
export function simpleToLatex(input: string): string {
  if (!input) return '';
  let s = input.trim();

  // Normalize unicode and spacing
  s = s.replace(/×/g, ' \\times ').replace(/÷/g, ' \\div ');
  s = s.replace(/\s+/g, ' ');

  // Superscripts unicode
  s = s.replace(/²/g, '^{2}');
  s = s.replace(/³/g, '^{3}');

  // sqrt
  s = s.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');

  // Caret powers
  s = s.replace(/([0-9a-zA-Z_\)\]\}])\^(\d+)/g, (_m, base, exp) => `${base}^{${exp}}`);
  s = s.replace(/([0-9a-zA-Z_\)\]\}])\^\(([^()]+)\)/g, (_m, base, exp) => `${base}^{${exp}}`);

  // Fractions: (a)/(b) -> \frac{a}{b}
  s = loopReplace(s, /\(([^(\)]*)\)\s*\/\s*\(([^(\)]*)\)/g, (_m, a, b) => `\\frac{${a}}{${b}}`);
  s = loopReplace(s, /([0-9a-zA-Z_\)\]]+)\s*\/\s*\(([^(\)]*)\)/g, (_m, a, b) => `\\frac{${a}}{${b}}`);
  s = loopReplace(s, /\(([^(\)]*)\)\s*\/\s*([0-9a-zA-Z_\(\[\{][^\s]*)/g, (_m, a, b) => `\\frac{${a}}{${b}}`);
  s = loopReplace(s, /([0-9a-zA-Z_\)\]]+)\s*\/\s*([0-9a-zA-Z_\(\[\{][^\s]*)/g, (_m, a, b) => `\\frac{${a}}{${b}}`);

  // Cleanup spacing
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export default simpleToSympy;


