/**
 * Converts LaTeX input to standard equation format that the solver can understand
 */

export function convertLatexToStandard(latex: string): string {
  let result = latex;

  // Convert LaTeX fractions to standard format
  result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  
  // Convert LaTeX powers to standard format
  result = result.replace(/\^\{([^}]+)\}/g, '^($1)');
  result = result.replace(/\^(\d+)/g, '^$1');
  
  // Convert LaTeX subscripts to standard format
  result = result.replace(/_\{([^}]+)\}/g, '_($1)');
  result = result.replace(/_(\d+)/g, '_$1');
  
  // Convert LaTeX multiplication symbols
  result = result.replace(/\\times/g, '*');
  result = result.replace(/\\div/g, '/');
  
  // Convert LaTeX square root
  result = result.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
  
  // Convert LaTeX parentheses to standard
  result = result.replace(/\\left\(/g, '(');
  result = result.replace(/\\right\)/g, ')');
  
  // Convert LaTeX brackets to standard
  result = result.replace(/\\left\[/g, '[');
  result = result.replace(/\\right\]/g, ']');
  
  // Convert LaTeX braces to standard
  result = result.replace(/\\left\\{/g, '{');
  result = result.replace(/\\right\\}/g, '}');
  
  // Convert LaTeX special characters
  result = result.replace(/\\alpha/g, 'alpha');
  result = result.replace(/\\beta/g, 'beta');
  result = result.replace(/\\gamma/g, 'gamma');
  result = result.replace(/\\delta/g, 'delta');
  result = result.replace(/\\theta/g, 'theta');
  result = result.replace(/\\pi/g, 'pi');
  result = result.replace(/\\infty/g, 'infinity');
  
  // Convert LaTeX functions
  result = result.replace(/\\sin/g, 'sin');
  result = result.replace(/\\cos/g, 'cos');
  result = result.replace(/\\tan/g, 'tan');
  result = result.replace(/\\log/g, 'log');
  result = result.replace(/\\ln/g, 'ln');
  result = result.replace(/\\exp/g, 'exp');
  
  // Clean up any remaining LaTeX commands
  result = result.replace(/\\[a-zA-Z]+/g, '');
  
  // Ensure proper spacing around operators
  result = result.replace(/([0-9a-zA-Z])\*([0-9a-zA-Z])/g, '$1*$2');
  result = result.replace(/([0-9a-zA-Z])\/([0-9a-zA-Z])/g, '$1/$2');
  
  return result;
}

/**
 * Converts standard equation format back to LaTeX for display
 */
export function convertStandardToLatex(standard: string): string {
  let result = standard;
  
  // Convert fractions back to LaTeX
  result = result.replace(/\(([^)]+)\)\/([^)]+)/g, '\\frac{$1}{$2}');
  result = result.replace(/([0-9a-zA-Z]+)\/([0-9a-zA-Z]+)/g, '\\frac{$1}{$2}');
  
  // Convert powers back to LaTeX
  result = result.replace(/\^\(([^)]+)\)/g, '^{$1}');
  result = result.replace(/\^(\d+)/g, '^{$1}');
  
  // Convert multiplication back to LaTeX
  result = result.replace(/\*/g, '\\times ');
  
  return result;
}

/**
 * Validates if the LaTeX input is properly formatted
 */
export function validateLatexInput(latex: string): { isValid: boolean; error?: string } {
  // Check for unmatched braces
  const openBraces = (latex.match(/\{/g) || []).length;
  const closeBraces = (latex.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    return { isValid: false, error: 'Unmatched braces in LaTeX input' };
  }
  
  // Check for unmatched parentheses
  const openParens = (latex.match(/\(/g) || []).length;
  const closeParens = (latex.match(/\)/g) || []).length;
  
  if (openParens !== closeParens) {
    return { isValid: false, error: 'Unmatched parentheses in LaTeX input' };
  }
  
  // Check for basic equation structure
  if (!latex.includes('=')) {
    return { isValid: false, error: 'Equation must contain an equals sign (=)' };
  }
  
  return { isValid: true };
}

/**
 * Provides helpful suggestions for common LaTeX patterns
 */
export const latexSuggestions = [
  {
    name: 'Basic Fraction',
    latex: '\\frac{1}{x}',
    description: 'Simple fraction with numerator and denominator'
  },
  {
    name: 'Complex Fraction',
    latex: '\\frac{x+1}{x-1}',
    description: 'Fraction with expressions in numerator and denominator'
  },
  {
    name: 'Quadratic',
    latex: 'x^{2}+2x+1',
    description: 'Quadratic expression with powers'
  },
  {
    name: 'Rational Equation',
    latex: '\\frac{x+2}{x-3}=\\frac{1}{2}',
    description: 'Complete rational equation'
  },
  {
    name: 'Multiple Fractions',
    latex: '\\frac{x}{x+1}+\\frac{1}{x-1}=2',
    description: 'Equation with multiple fractions'
  }
]; 