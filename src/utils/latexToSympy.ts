// Minimal LaTeX -> SymPy converter for common patterns used by the on-screen keyboard.
// Supports: fractions, powers, sqrt, multiplication/division, spaces, \left/\right.

function replaceAll(input: string, search: RegExp, replacer: (match: string, ...groups: string[]) => string): string {
  let prev = input;
  let next = input.replace(search, replacer as any);
  // Repeat until no further change (handles nested \frac and \sqrt limitedly)
  while (next !== prev) {
    prev = next;
    next = next.replace(search, replacer as any);
  }
  return next;
}

export function latexToSympy(latex: string): string {
  if (!latex) return '';
  let s = latex;

  // Normalize common latex wrappers
  s = s.replace(/\\left\s*/g, '');
  s = s.replace(/\\right\s*/g, '');
  s = s.replace(/\s+/g, ' ');

  // Multiplication/division
  s = s.replace(/(\\times|×)/g, ' * ');
  s = s.replace(/(\\cdot)/g, ' * ');
  s = s.replace(/(\\div|÷)/g, ' / ');

  // \sqrt{A} -> sqrt(A)
  s = replaceAll(s, /\\sqrt\{([^{}]+)\}/g, (_m, a) => `sqrt(${a})`);

  // \frac{A}{B} -> (A)/(B)
  s = replaceAll(s, /\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_m, a, b) => `(${a})/(${b})`);

  // superscript with braces: base^{exp} -> base**(exp)
  s = s.replace(/([0-9a-zA-Z_\)\]\}])\^\{([^{}]+)\}/g, (_m, base, exp) => `${base}**(${exp})`);
  // superscript simple: base^n -> base**(n)
  s = s.replace(/([0-9a-zA-Z_\)\]\}])\^(\d+)/g, (_m, base, exp) => `${base}**(${exp})`);

  // Cleanup multiple spaces
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export default latexToSympy;



