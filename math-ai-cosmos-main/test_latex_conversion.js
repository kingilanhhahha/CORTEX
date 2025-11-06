// Test LaTeX conversion functionality
const testCases = [
  {
    latex: '\\frac{1}{x}',
    expected: '(1)/(x)',
    description: 'Basic fraction'
  },
  {
    latex: '\\frac{x+1}{x-1}',
    expected: '(x+1)/(x-1)',
    description: 'Complex fraction'
  },
  {
    latex: 'x^{2}+2x+1',
    expected: 'x^(2)+2x+1',
    description: 'Power notation'
  },
  {
    latex: '\\frac{x+2}{x-3}=\\frac{1}{2}',
    expected: '(x+2)/(x-3)=(1)/(2)',
    description: 'Complete equation'
  },
  {
    latex: 'x \\times y',
    expected: 'x * y',
    description: 'Multiplication'
  }
];

console.log('Testing LaTeX conversion...\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`LaTeX: ${testCase.latex}`);
  console.log(`Expected: ${testCase.expected}`);
  
  // Simple conversion logic for testing
  let converted = testCase.latex
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\^\{([^}]+)\}/g, '^($1)')
    .replace(/\\times/g, '*');
  
  console.log(`Converted: ${converted}`);
  console.log(`Match: ${converted === testCase.expected ? '✅' : '❌'}`);
  console.log('---\n');
});

console.log('LaTeX conversion test completed!'); 