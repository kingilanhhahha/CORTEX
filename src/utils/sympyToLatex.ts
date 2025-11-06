// Minimal SymPy -> LaTeX converter for previewing common forms

function replaceAllLoop(s: string, re: RegExp, replacer: (m: string, ...g: string[]) => string): string {
  let prev = s;
  let next = s.replace(re as any, replacer as any);
  while (next !== prev) {
    prev = next;
    next = next.replace(re as any, replacer as any);
  }
  return next;
}

export function sympyToLatex(sympy: string): string {
  if (!sympy) return '';
  let s = sympy.trim();

  // Handle Eq(L, R) to L = R (naive top-level split)
  if (s.startsWith('Eq(') && s.endsWith(')')) {
    const inner = s.slice(3, -1);
    let paren = 0;
    let idx = -1;
    for (let i = 0; i < inner.length; i++) {
      const c = inner[i];
      if (c === '(') paren++;
      else if (c === ')') paren--;
      else if (c === ',' && paren === 0) { idx = i; break; }
    }
    if (idx !== -1) {
      const lhs = inner.slice(0, idx);
      const rhs = inner.slice(idx + 1);
      s = `${lhs} = ${rhs}`;
    } else {
      s = `${inner} = 0`;
    }
  }

  // sqrt(x) -> \sqrt{x}
  s = replaceAllLoop(s, /sqrt\(([^()]+)\)/g, (_m, a) => `\\sqrt{${a}}`);

  // (A)/(B) -> \frac{A}{B}
  s = replaceAllLoop(s, /\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, (_m, a, b) => `\\frac{${a}}{${b}}`);

  // base**(exp) -> base^{exp}
  s = s.replace(/([0-9a-zA-Z_\)\]\}])\*\*\(([^()]+)\)/g, (_m, base, exp) => `${base}^{${exp}}`);
  // base**n -> base^{n}
  s = s.replace(/([0-9a-zA-Z_\)\]\}])\*\*(\d+)/g, (_m, base, exp) => `${base}^{${exp}}`);

  // Multiplication signs: use \cdot for explicit *
  s = s.replace(/\s*\*\s*/g, ' \\cdot ');

  return s;
}

export default sympyToLatex;



