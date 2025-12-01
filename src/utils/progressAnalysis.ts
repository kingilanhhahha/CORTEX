/**
 * Analyze mistakes to determine areas for improvement
 */
export function analyzeAreasForImprovement(mistakes: string[]): string[] {
  const areas: string[] = [];
  const mistakeText = mistakes.join(' ').toLowerCase();
  
  if (mistakeText.includes('restriction') || mistakeText.includes('denominator')) {
    areas.push('Identifying restrictions');
  }
  if (mistakeText.includes('lcd') || mistakeText.includes('least common denominator')) {
    areas.push('Finding LCD');
  }
  if (mistakeText.includes('step') || mistakeText.includes('process') || mistakeText.includes('simplify')) {
    areas.push('Step-by-step solving');
  }
  if (mistakeText.includes('extraneous') || mistakeText.includes('solution')) {
    areas.push('Checking for extraneous solutions');
  }
  if (mistakeText.includes('factor') || mistakeText.includes('factoring')) {
    areas.push('Factoring');
  }
  if (mistakeText.includes('solve') || mistakeText.includes('algebra') || mistakeText.includes('manipulation')) {
    areas.push('Algebraic manipulation');
  }
  if (mistakeText.includes('graph') || mistakeText.includes('plot')) {
    areas.push('Graphing');
  }
  if (mistakeText.includes('domain') || mistakeText.includes('range')) {
    areas.push('Domain and range analysis');
  }
  
  // Remove duplicates
  return [...new Set(areas)];
}

/**
 * Analyze correct answers to determine strengths
 */
export function analyzeStrengths(equationsSolved: string[]): string[] {
  const strengths: string[] = [];
  const solvedText = equationsSolved.join(' ').toLowerCase();
  
  if (solvedText.includes('restriction')) {
    strengths.push('Identifying restrictions');
  }
  if (solvedText.includes('lcd')) {
    strengths.push('Finding LCD');
  }
  if (solvedText.includes('step') || solvedText.includes('process')) {
    strengths.push('Step-by-step solving');
  }
  if (solvedText.includes('extraneous')) {
    strengths.push('Checking for extraneous solutions');
  }
  if (solvedText.includes('factor')) {
    strengths.push('Factoring');
  }
  if (solvedText.includes('solved') || solvedText.includes('algebra')) {
    strengths.push('Algebraic manipulation');
  }
  if (solvedText.includes('graph')) {
    strengths.push('Graphing');
  }
  if (solvedText.includes('domain')) {
    strengths.push('Domain and range analysis');
  }
  
  // Remove duplicates
  return [...new Set(strengths)];
}

/**
 * Analyze mistakes to identify common patterns
 */
export function analyzeCommonMistakes(mistakes: string[]): string[] {
  const patterns: { [key: string]: number } = {
    'restriction_errors': 0,
    'lcd_errors': 0,
    'algebra_errors': 0,
    'factoring_errors': 0,
    'extraneous_errors': 0,
    'graphing_errors': 0,
    'domain_errors': 0,
  };
  
  mistakes.forEach(mistake => {
    const m = mistake.toLowerCase();
    if (m.includes('restriction') || m.includes('denominator')) patterns['restriction_errors']++;
    if (m.includes('lcd')) patterns['lcd_errors']++;
    if (m.includes('solve') || m.includes('algebra')) patterns['algebra_errors']++;
    if (m.includes('factor')) patterns['factoring_errors']++;
    if (m.includes('extraneous')) patterns['extraneous_errors']++;
    if (m.includes('graph') || m.includes('plot')) patterns['graphing_errors']++;
    if (m.includes('domain') || m.includes('range')) patterns['domain_errors']++;
  });
  
  return Object.entries(patterns)
    .filter(([_, count]) => count > 0)
    .map(([pattern, count]) => `${pattern.replace('_', ' ')}: ${count} error${count > 1 ? 's' : ''}`);
}


