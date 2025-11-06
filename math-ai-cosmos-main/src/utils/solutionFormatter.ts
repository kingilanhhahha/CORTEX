export interface SolutionSection {
  type: 'header' | 'math' | 'step' | 'verification' | 'answer' | 'text';
  content: string;
  level?: number; // For headers
}

export interface FormattedSolution {
  sections: SolutionSection[];
}

/**
 * Parses raw solver output and returns structured sections
 */
export function formatSolutionOutput(rawSolution: string): FormattedSolution {
  const sections: SolutionSection[] = [];
  const lines = rawSolution.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect headers (lines that start with # or are all caps)
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      const content = trimmedLine.slice(2, -2);
      if (content.includes('Step') || content.includes('Solution') || content.includes('Answer')) {
        sections.push({ type: 'header', content, level: 2 });
        continue;
      }
    }
    
    // Detect math expressions (lines with LaTeX or mathematical symbols)
    if (trimmedLine.includes('\\') || 
        trimmedLine.includes('=') || 
        trimmedLine.includes('+') || 
        trimmedLine.includes('-') || 
        trimmedLine.includes('*') || 
        trimmedLine.includes('/') ||
        trimmedLine.includes('^') ||
        trimmedLine.includes('_')) {
      sections.push({ type: 'math', content: trimmedLine });
      continue;
    }
    
    // Detect steps (lines that start with numbers or bullet points)
    if (/^[\d\.\)]/.test(trimmedLine) || trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
      sections.push({ type: 'step', content: trimmedLine });
      continue;
    }
    
    // Detect verification (lines with "verify", "check", "test")
    if (trimmedLine.toLowerCase().includes('verify') || 
        trimmedLine.toLowerCase().includes('check') || 
        trimmedLine.toLowerCase().includes('test')) {
      sections.push({ type: 'verification', content: trimmedLine });
      continue;
    }
    
    // Detect answers (lines with "answer", "solution", "result")
    if (trimmedLine.toLowerCase().includes('answer') || 
        trimmedLine.toLowerCase().includes('solution') || 
        trimmedLine.toLowerCase().includes('result') ||
        trimmedLine.toLowerCase().includes('therefore')) {
      sections.push({ type: 'answer', content: trimmedLine });
      continue;
    }
    
    // Default to text for everything else
    sections.push({ type: 'text', content: trimmedLine });
  }
  
  return { sections };
}

/**
 * Renders individual sections as formatted text
 */
export function renderSolutionSection(section: SolutionSection): string {
  switch (section.type) {
    case 'header':
      return `\n${section.content}\n`;
      
    case 'math':
      return `  ${section.content}`;
      
    case 'step':
      return `  ${section.content}`;
      
    case 'verification':
      return `  ✓ ${section.content}`;
      
    case 'answer':
      return `\n🎯 ${section.content}\n`;
      
    case 'text':
    default:
      return `  ${section.content}`;
  }
}

/**
 * Renders a complete solution as formatted text
 */
export function renderSolutionAsText(solution: FormattedSolution): string {
  return solution.sections.map(section => renderSolutionSection(section)).join('\n');
}
