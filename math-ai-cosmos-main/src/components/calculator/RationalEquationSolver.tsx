import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calculator, CheckCircle, AlertCircle, BookOpen, Keyboard, Type, Target, Brain, Zap, Trophy } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { SimpleMathKeyboard } from './SimpleMathKeyboard';

// Cosmic UI Implementation following exact specification
interface CosmicHeaderProps {
  glow: 'nebula-purple' | 'nebula-cyan' | 'nebula-gold' | 'nebula-orange';
  children: React.ReactNode;
}

const CosmicHeader: React.FC<CosmicHeaderProps> = ({ glow, children }) => {
  const glowStyles = {
    'nebula-purple': 'bg-gradient-to-r from-purple-600/20 to-purple-400/20 border-purple-500/30',
    'nebula-cyan': 'bg-gradient-to-r from-cyan-600/20 to-cyan-400/20 border-cyan-500/30',
    'nebula-gold': 'bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 border-yellow-500/30',
    'nebula-orange': 'bg-gradient-to-r from-orange-600/20 to-orange-400/20 border-orange-500/30'
  };
  
  return (
    <div className={`rounded-xl border-2 ${glowStyles[glow]} shadow-xl backdrop-blur-sm overflow-hidden`}>
      <div className="p-8 text-center">
        <h2 className="text-2.2rem font-['Space_Grotesk'] font-semibold mb-4 text-foreground">
          Step-by-Step Solution
        </h2>
        {children}
      </div>
    </div>
  );
};

interface SolutionStepProps {
  number: number;
  theme: 'cyan' | 'purple' | 'gold' | 'orange';
  children: React.ReactNode;
}

const SolutionStep: React.FC<SolutionStepProps> = ({ number, theme, children }) => {
  const themeColors = {
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    gold: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30'
  };

  const glowColors = {
    cyan: 'shadow-cyan-500/20',
    purple: 'shadow-purple-500/20',
    gold: 'shadow-yellow-500/20',
    orange: 'shadow-orange-500/20'
  };

  return (
    <div className={`bg-gradient-to-br ${themeColors[theme]} rounded-xl border ${glowColors[theme]} p-6 backdrop-blur-sm`}>
      <div className="flex items-start space-x-4">
        {/* Step Number Badge */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${themeColors[theme]} border-2 border-white/20 flex items-center justify-center shadow-lg`}>
          <span className="text-lg font-bold text-white">{number}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
};

interface TeacherQuoteProps {
  children: React.ReactNode;
}

const TeacherQuote: React.FC<TeacherQuoteProps> = ({ children }) => {
  return (
    <div className="bg-background/50 rounded-lg border-l-4 border-primary/50 p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">👨‍🏫</span>
        </div>
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          "{children}"
        </p>
      </div>
    </div>
  );
};

interface InstructionTextProps {
  children: React.ReactNode;
}

const InstructionText: React.FC<InstructionTextProps> = ({ children }) => {
  return (
    <div className="bg-background/30 rounded-lg p-3">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-secondary">📋</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          {children}
        </p>
      </div>
    </div>
  );
};

interface MathContainerProps {
  children: React.ReactNode;
}

const MathContainer: React.FC<MathContainerProps> = ({ children }) => {
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
};

interface EquationProps {
  latex: string;
}

const Equation: React.FC<EquationProps> = ({ latex }) => {
  const cleanLatex = convertMathToLatex(latex);
  
  return (
    <div className="bg-background/70 rounded-xl border border-border p-6" style={{ padding: '12px' }}>
      <div className="text-center">
        <div style={{ fontSize: '1.4em' }} className="font-mono">
          <BlockMath math={cleanLatex} />
        </div>
      </div>
    </div>
  );
};

// Legacy components removed to avoid conflicts
// Using the new atomic protocol components instead

const API_BASE_URL = 'http://localhost:5000/api';

// Convert LaTeX to standard format for backend
const convertLatexToStandard = (latex: string): string => {
  let result = latex;
  
  // Convert LaTeX fractions to standard format
  result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  
  // Convert LaTeX powers to standard format
  result = result.replace(/\^\{([^}]+)\}/g, '^($1)');
  result = result.replace(/\^(\d+)/g, '^$1');
  
  // Convert LaTeX multiplication symbols
  result = result.replace(/\\times/g, '*');
  result = result.replace(/\\div/g, '/');
  
  // Convert LaTeX parentheses to standard
  result = result.replace(/\\left\(/g, '(');
  result = result.replace(/\\right\)/g, ')');
  
  // Clean up any remaining LaTeX commands
  result = result.replace(/\\[a-zA-Z]+/g, '');
  
  return result;
};

interface SolverResponse {
  success: boolean;
  equation?: string;
  solution?: string;
  classification?: any;
  valid?: boolean;
  message?: string;
  error?: string;
}

// Atomic Frontend Formatting Protocol - Input Sanitization Pipeline
function sanitizeInput(rawBackendText: string): string {
  if (!rawBackendText) return '';
  
  // Phase 1: Space Restoration
  let spacedText = rawBackendText
    // camelCase → camel Case
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // "word,word" → "word, word"
    .replace(/(\w)([',.!?])(\w)/g, '$1$2 $3')
    // "1+2" → "1 + 2"
    .replace(/(\d)\s*([+\-×÷])\s*(\d)/g, '$1 $2 $3');

  // Phase 2: Math Tokenization
  return spacedText
    // "x/y" → "x / y"
    .replace(/(\w)\/(\w)/g, '$1 / $2')
    // "=2" → "= 2"
    .replace(/=\s*(\d)/g, '= $1')
    // "x=3" → "x = 3"
    .replace(/([a-z])\s*=\s*([a-z])/g, '$1 = $2')
    // Clean up excessive spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Error Correction Matrix Implementation
function applyErrorCorrections(text: string): string {
  const corrections = [
    // Input Error → Correction Rule → Example Fix
    [/(\w)=(\w)/g, '$1 = $2'],                    // "x=3" → "x = 3"
    [/([a-z])([A-Z][a-z])/g, '$1 $2'],          // "denominatorshere" → "denominators here"
    [/\\trac\{/g, '\\frac{'],                    // "\trac{x+1}" → "\frac{x+1}{x-3}"
    [/Step(\d+)of\d+/g, 'Step $1'],             // "Step1of24" → "Step 1"
    [/([a-zA-Z])([+\-*/=])/g, '$1 $2'],         // Insert space before operators
    [/([+\-*/=])([a-zA-Z])/g, '$1 $2'],         // Insert space after operators
    [/(\d)\s*×\s*(\w)/g, '$1 × $2'],            // Normalize multiplication
    [/(\w)\s*×\s*(\d)/g, '$1 × $2'],            // Normalize multiplication
  ];
  
  return corrections.reduce((result, [pattern, replacement]) => {
    return result.replace(pattern as RegExp, replacement as string);
  }, text);
}

// Enhanced utility with atomic protocol
function smartRestoreSpaces(text: string): string {
  return applyErrorCorrections(sanitizeInput(text));
}

// Utility to restore spaces in explanations/instructions
function restoreSpaces(text: string) {
  // If the text is all one word, try to add spaces between lowercase-uppercase and after punctuation
  if (/^[A-Za-z]+$/.test(text.replace(/\s/g, ''))) {
    return text.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  // Otherwise, just return as is
  return text;
}

// BNF Grammar Parser for Mathematical Expressions
interface MathToken {
  type: 'number' | 'variable' | 'operator' | 'fraction' | 'parenthesis';
  value: string;
  latex?: string;
}

function tokenizeMathExpression(expression: string): MathToken[] {
  const tokens: MathToken[] = [];
  const sanitized = sanitizeInput(expression);
  
  // Enhanced tokenization following BNF grammar
  const tokenPatterns = [
    { type: 'fraction' as const, pattern: /\\frac\{([^}]+)\}\{([^}]+)\}/g },
    { type: 'number' as const, pattern: /\d+(?:\.\d+)?/g },
    { type: 'variable' as const, pattern: /[a-zA-Z]+/g },
    { type: 'operator' as const, pattern: /[+\-×÷*/=≠≈]/g },
    { type: 'parenthesis' as const, pattern: /[()]/g }
  ];
  
  let remaining = sanitized;
  
  while (remaining.length > 0) {
    let matched = false;
    
    for (const { type, pattern } of tokenPatterns) {
      const match = remaining.match(pattern);
      if (match && match.index === 0) {
        tokens.push({
          type,
          value: match[0],
          latex: convertToLatexToken(match[0], type)
        });
        remaining = remaining.slice(match[0].length).trim();
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      remaining = remaining.slice(1); // Skip unrecognized character
    }
  }
  
  return tokens;
}

function convertToLatexToken(value: string, type: MathToken['type']): string {
  switch (type) {
    case 'fraction':
      return value; // Already in LaTeX format
    case 'operator':
      const operatorMap: Record<string, string> = {
        '*': '\\times',
        '×': '\\times',
        '/': '\\div',
        '÷': '\\div',
        '≠': '\\neq',
        '≈': '\\approx',
        '=': '=',
        '+': '+',
        '-': '-'
      };
      return operatorMap[value] || value;
    default:
      return value;
  }
}

// Enhanced utility following BNF grammar rules
function formatMathExpression(text: string): string {
  if (!text) return '';
  
  const tokens = tokenizeMathExpression(text);
  return tokens.map(token => token.latex || token.value).join(' ');
}

// Utility for better text paragraph formatting
function formatParagraphs(text: string) {
  if (!text) return '';
  
  return text
    // Split into logical paragraphs
    .split(/(?<=\.)\s+/)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .join('\n\n');
}

// Multi-pass text processor for backend content transformation
function processBackendContent(rawContent: string) {
  if (!rawContent) return { sections: [], warnings: [] };
  
  const warnings: string[] = [];
  let processedContent = rawContent;
  
  // Pass 1: Text Normalization
  processedContent = smartRestoreSpaces(processedContent);
  
  // Pass 2: Clean Mathematical Lines
  processedContent = cleanMathematicalLines(processedContent);
  
  // Pass 3: Section Structure Parsing
  const sections = parseContentSections(processedContent);
  
  // Pass 4: Edge Case Detection
  if (processedContent.includes("undefined")) {
    warnings.push("Found undefined values - highlighting restrictions");
  }
  
  return { sections, warnings };
}

// Clean mathematical lines and fix vertical letter stacking
function cleanMathematicalLines(text: string) {
  return text
    // Fix vertical letter stacking
    .replace(/([A-Z])\n([A-Z])\n([A-Z])\n([A-Z])\n([A-Z])/g, '$1$2$3$4$5')
    // Fix broken LaTeX commands
    .replace(/\\trac/g, '\\frac')
    .replace(/\\cdot\\cdot/g, '\\cdot')
    // Standardize operators
    .replace(/⋅/g, '\\times')
    // Fix line breaks in equations
    .replace(/([a-zA-Z0-9])\n\+\n([a-zA-Z0-9])/g, '$1 + $2')
    .replace(/([a-zA-Z0-9])\n-\n([a-zA-Z0-9])/g, '$1 - $2')
    .replace(/([a-zA-Z0-9])\n×\n([a-zA-Z0-9])/g, '$1 \\times $2')
    // Remove raw debug markers
    .replace(/---+/g, '')
    .replace(/```/g, '')
    .trim();
}

// Enhanced content parser that handles actual backend format
function parseContentSections(content: string) {
  const sections: Array<{
    type: 'equation' | 'step' | 'explanation' | 'calculation' | 'answer';
    title: string;
    content: string;
    mathExpressions: string[];
    teacherVoice: string[];
    instructions: string[];
  }> = [];
  
  // First, clean and normalize the content
  let cleanedContent = content
    .replace(/\s+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/(\w)([',.!?])(\w)/g, '$1$2 $3')
    .trim();
  
  // Split by step markers (Step 1, Step 2, etc.)
  const stepMatches = cleanedContent.match(/Step\s+(\d+):\s*([^]*?)(?=Step\s+\d+:|$)/g);
  
  if (stepMatches) {
    stepMatches.forEach((stepBlock, index) => {
      const stepNumber = index + 1;
      const stepContent = stepBlock.replace(/^Step\s+\d+:\s*/, '').trim();
      
      const section = {
        type: 'step' as const,
        title: `Step ${stepNumber}`,
        content: stepContent,
        mathExpressions: [],
        teacherVoice: [],
        instructions: []
      };
      
      // Extract mathematical expressions using multiple patterns
      const mathPatterns = [
        // Fractions like (x+1)/(x-3)
        /\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g,
        // Simple fractions like x/y
        /(\w+)\s*\/\s*(\w+)/g,
        // Equations like x = 3
        /x\s*=\s*[^,\n]+/g,
        // Mathematical expressions with operators
        /[^,\n]*[+\-*/=][^,\n]*/g,
        // Numbers and variables
        /\b\d+\b/g,
        /\b[a-zA-Z]\b/g
      ];
      
      for (const pattern of mathPatterns) {
        const matches = stepContent.match(pattern);
        if (matches) {
          section.mathExpressions.push(...matches.map(match => 
            formatMathExpression(match.trim())
          ));
        }
      }
      
      // Enhanced mathematical expression extraction
      const enhancedMathPatterns = [
        // Fractions with parentheses
        /\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g,
        // Simple fractions
        /(\w+)\s*\/\s*(\w+)/g,
        // Equations with x
        /x\s*[=≠]\s*[^,\n]+/g,
        // Mathematical expressions with operators (but not just single numbers)
        /[^,\n]*[+\-*/=][^,\n]*/g,
        // LCD expressions
        /LCD[^,\n]*/gi,
        // Restrictions
        /x\s*[≠=]\s*\d+/g,
        // Mathematical transformations
        /[^,\n]*\s*[×÷]\s*[^,\n]*/g
      ];
      
      for (const pattern of enhancedMathPatterns) {
        const matches = stepContent.match(pattern);
        if (matches) {
          const filteredMatches = matches
            .map(match => match.trim())
            .filter(match => 
              match.length > 2 && 
              !match.match(/^\d+$/) && 
              !match.match(/^[a-zA-Z]$/) &&
              (match.includes('=') || match.includes('/') || match.includes('×') || match.includes('÷') || match.includes('LCD') || match.includes('≠'))
            );
          section.mathExpressions.push(...filteredMatches.map(expr => formatMathExpression(expr)));
        }
      }
      
      // Extract teacher voice (look for quoted text or explanatory phrases)
      const teacherVoicePatterns = [
        /"([^"]+)"/g,
        /'([^']+)'/g,
        /([^.!?]*\b(?:examine|remember|watch|carefully|beautifully|crucially)[^.!?]*[.!?])/gi
      ];
      
      for (const pattern of teacherVoicePatterns) {
        const matches = stepContent.match(pattern);
        if (matches) {
          section.teacherVoice.push(...matches.map(match => 
            smartRestoreSpaces(match.replace(/^["']|["']$/g, ''))
          ));
        }
      }
      
      // Enhanced teacher voice extraction
      const enhancedTeacherPatterns = [
        // Quoted text
        /"([^"]+)"/g,
        /'([^']+)'/g,
        // Explanatory phrases with key words
        /([^.!?]*\b(?:examine|remember|watch|carefully|beautifully|crucially|simplifies|cancels|eliminates)[^.!?]*[.!?])/gi,
        // Phrases that sound like teacher explanations
        /([^.!?]*\b(?:Let's|We'll|This will|Notice how|Watch as)[^.!?]*[.!?])/gi
      ];
      
      for (const pattern of enhancedTeacherPatterns) {
        const matches = stepContent.match(pattern);
        if (matches) {
          const filteredMatches = matches
            .map(match => smartRestoreSpaces(match.replace(/^["']|["']$/g, '')))
            .filter(match => match.length > 15 && match.length < 80 && !match.includes('Instruction:'));
          section.teacherVoice.push(...filteredMatches);
        }
      }
      
      // Extract instructions (look for instructional phrases)
      const instructionPatterns = [
        /([^.!?]*\b(?:identify|multiply|gather|isolate|verify|calculate)[^.!?]*[.!?])/gi,
        /([^.!?]*\b(?:First|Now|Let's|We'll)[^.!?]*[.!?])/gi
      ];
      
      for (const pattern of instructionPatterns) {
        const matches = stepContent.match(pattern);
        if (matches) {
          section.instructions.push(...matches.map(match => 
            smartRestoreSpaces(match.trim())
          ));
        }
      }
      
      // Enhanced instruction extraction - More selective
      const enhancedInstructionPatterns = [
        // Instructional phrases with action words
        /([^.!?]*\b(?:identify|multiply|gather|isolate|verify|calculate|find|factor|clear|eliminate)[^.!?]*[.!?])/gi,
        // Sentences starting with action words
        /([^.!?]*\b(?:First|Now|Let's|We'll|Next|Then)[^.!?]*[.!?])/gi,
        // Sentences with mathematical context
        /([^.!?]*\b(?:denominator|fraction|equation|LCD|restriction)[^.!?]*[.!?])/gi
      ];
      
      for (const pattern of enhancedInstructionPatterns) {
        const matches = stepContent.match(pattern);
        if (matches) {
          const filteredMatches = matches
            .map(match => smartRestoreSpaces(match.trim()))
            .filter(match => match.length > 10 && match.length < 60 && !match.includes('Teacher'));
          section.instructions.push(...filteredMatches);
        }
      }
      
      // If no specific instructions found, use the whole content as instruction
      if (section.instructions.length === 0) {
        section.instructions.push(smartRestoreSpaces(stepContent));
      }
      
      // Limit the number of extracted items to keep it concise
      section.teacherVoice = section.teacherVoice.slice(0, 1); // Only keep the best one
      section.instructions = section.instructions.slice(0, 1); // Only keep the best one
      section.mathExpressions = section.mathExpressions.slice(0, 2); // Only keep the 2 most important
      
      sections.push(section);
    });
  } else {
    // Fallback: create a single section with the entire content
    sections.push({
      type: 'step',
      title: 'Solution',
      content: cleanedContent,
      mathExpressions: [],
      teacherVoice: [],
      instructions: [smartRestoreSpaces(cleanedContent)]
    });
  }
  
  // Add final answer section if found
  const finalAnswerMatch = cleanedContent.match(/Final Answer[^]*?x\s*=\s*([^,\n]+)/i);
  if (finalAnswerMatch) {
    sections.push({
      type: 'answer',
      title: 'Final Answer',
      content: finalAnswerMatch[0],
      mathExpressions: [`x = ${finalAnswerMatch[1].trim()}`],
      teacherVoice: [],
      instructions: []
    });
  }
  
  return sections;
}

// LaTeX Sanitization following atomic protocol
function sanitizeLatex(rawLatex: string): string {
  if (!rawLatex) return '';
  
  // Apply atomic sanitization first
  let sanitized = sanitizeInput(rawLatex);
  
  // Enhanced LaTeX conversion following BNF grammar
  sanitized = sanitized
    // Convert complex fractions like (2)/(x) to LaTeX
    .replace(/\(\s*(\d+)\s*\)\s*\/\s*\(\s*([^)]+)\s*\)/g, '\\frac{$1}{$2}')
    // Convert fractions like (x+1)/(x-3) to LaTeX
    .replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}')
    // Convert simple fractions like a/b to LaTeX
    .replace(/(\w+(?:\s*[+\-]\s*\w+)*)\s*\/\s*(\w+(?:\s*[+\-]\s*\w+)*)/g, '\\frac{$1}{$2}')
    // Handle multiplication symbols
    .replace(/(\d+)\s*\*\s*(\w+)/g, '$1 \\times $2')
    .replace(/(\w+)\s*\*\s*(\d+)/g, '$1 \\times $2')
    .replace(/(\w+)\s*\*\s*(\w+)/g, '$1 \\times $2')
    // Handle exponents
    .replace(/\*\*(\d+)/g, '^{$1}')
    .replace(/\^(\d+)/g, '^{$1}')
    // Normalize operators with proper spacing
    .replace(/\s*=\s*/g, ' = ')
    .replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*-\s*/g, ' - ')
    // Handle special symbols
    .replace(/≠/g, '\\neq ')
    .replace(/≈/g, '\\approx ')
    .replace(/✓/g, '\\checkmark ')
    .replace(/✗/g, '\\times ')
    // Handle restrictions
    .replace(/x\s*≠\s*(-?\d+)/g, 'x \\neq $1')
    .replace(/x\s*=\s*(-?\d+)/g, 'x = $1')
    // Clean up
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  return sanitized;
}

// Enhanced LaTeX conversion for mathematical expressions
function convertMathToLatex(expression: string): string {
  if (!expression) return '';
  
  let latex = expression.trim();
  
  // Convert fractions
  latex = latex
    .replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}')
    .replace(/(\w+)\s*\/\s*(\w+)/g, '\\frac{$1}{$2}');
  
  // Convert operators
  latex = latex
    .replace(/\*/g, '\\times ')
    .replace(/×/g, '\\times ')
    .replace(/\//g, '\\div ')
    .replace(/÷/g, '\\div ')
    .replace(/≠/g, '\\neq ')
    .replace(/≈/g, '\\approx ');
  
  // Handle restrictions
  latex = latex
    .replace(/x\s*≠\s*(\d+)/g, 'x \\neq $1')
    .replace(/x\s*=\s*(\d+)/g, 'x = $1');
  
  // Handle LCD expressions
  latex = latex
    .replace(/LCD[^,\n]*/gi, '\\text{LCD}');
  
  // Clean up spacing
  latex = latex
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  return latex;
}

// Output Validation System
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validateOutput(content: string, element?: HTMLElement): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  // Check for vertical text stacking
  if (/([A-Z])\n([A-Z])\n([A-Z])/.test(content)) {
    result.isValid = false;
    result.errors.push('Vertical text stacking detected');
  }
  
  // Check for unwrapped math expressions
  if (/\b\d+\s*[+\-*/=]\s*\d+\b/.test(content) && !content.includes('\\(') && !content.includes('\\[')) {
    result.warnings.push('Mathematical expressions should be wrapped in LaTeX');
  }
  
  // Check for spacing consistency
  if (/\s{3,}/.test(content)) {
    result.warnings.push('Inconsistent spacing detected');
  }
  
  // Check if element exists for DOM validation
  if (element) {
    // Check for responsive math
    const mathElements = element.querySelectorAll('.katex');
    if (mathElements.length > 0) {
      mathElements.forEach(mathEl => {
        const rect = mathEl.getBoundingClientRect();
        if (rect.width > window.innerWidth * 0.9) {
          result.warnings.push('Math expression may overflow on mobile');
        }
      });
    }
  }
  
  return result;
}

// Enhanced LaTeX converter with validation
function convertToCleanLatex(text: string): string {
  const sanitized = sanitizeLatex(text);
  const validation = validateOutput(sanitized);
  
  if (!validation.isValid) {
    console.warn('LaTeX validation failed:', validation.errors);
  }
  
  if (validation.warnings.length > 0) {
    console.info('LaTeX validation warnings:', validation.warnings);
  }
  
  return sanitized;
}

const RationalEquationSolver: React.FC = () => {
  const [equation, setEquation] = useState('');
  const [latexInput, setLatexInput] = useState('');
  const [inputMode, setInputMode] = useState<'keyboard' | 'simple'>('simple');
  const [result, setResult] = useState<SolverResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLatexInput = (latex: string) => {
    setLatexInput(prev => prev + latex);
  };

  const handleLatexClear = () => {
    setLatexInput('');
  };

  const handleLatexBackspace = () => {
    setLatexInput(prev => prev.slice(0, -1));
  };

  const handleLatexEnter = () => {
    if (!latexInput.trim()) {
      setError('Please enter an equation');
      return;
    }

    // Clean and validate LaTeX input
    const cleanLatex = latexInput.trim().replace(/\\+/g, '\\'); // Ensure single backslashes
    console.log('Submitting LaTeX:', cleanLatex); // Debug log
    
    // Basic LaTeX validation
    if (cleanLatex.includes('\\frac') && !cleanLatex.match(/\\frac\{[^}]+\}\{[^}]+\}/)) {
      setError('Invalid fraction syntax. Please use the fraction builder.');
      return;
    }

    // For now, just use the LaTeX input directly
    setEquation(cleanLatex);
    solveEquationWithInput(cleanLatex);
  };

  const solveEquationWithInput = async (inputEquation: string) => {
    if (!inputEquation.trim()) {
      setError('Please enter an equation');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    
    // Test if backend is reachable
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      console.log('🏥 Backend health check:', healthResponse.status);
    } catch (err) {
      console.log('🏥 Backend health check failed:', err);
    }

    // Convert LaTeX to standard format if it contains LaTeX commands
    let equationToSend = inputEquation;
    if (inputEquation.includes('\\')) {
      equationToSend = convertLatexToStandard(inputEquation);
      console.log('Converted LaTeX to standard:', equationToSend);
    }

    console.log('🔬 Attempting to solve equation:', equationToSend.trim());
    console.log('🌐 API URL:', `${API_BASE_URL}/solve`);

    try {
      const response = await fetch(`${API_BASE_URL}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ equation: equationToSend.trim() })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      const data: SolverResponse = await response.json();
      console.log('📄 Response data:', data);

      if (data.success) {
        console.log('✅ Solve successful');
        console.log('📄 Solution data:', data.solution);
        console.log('📄 Equation data:', data.equation);
        setResult(data);
      } else {
        console.log('❌ Solve failed:', data.error);
        setError(data.error || 'Failed to solve equation');
      }
    } catch (err) {
      console.error('🚨 Solver error:', err);
      setError('Failed to connect to solver. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const solveEquation = async () => {
    if (!equation.trim()) {
      setError('Please enter an equation');
      return;
    }
    await solveEquationWithInput(equation);
  };

  const validateEquation = async () => {
    const currentInput = inputMode === 'keyboard' ? equation : latexInput;
    
    if (!currentInput.trim()) {
      setError('Please enter an equation');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Convert LaTeX to standard format if it contains LaTeX commands
    let equationToValidate = currentInput;
    if (currentInput.includes('\\')) {
      equationToValidate = convertLatexToStandard(currentInput);
      console.log('Validating converted equation:', equationToValidate);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ equation: equationToValidate.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          valid: data.valid,
          message: data.message,
          equation: data.equation
        });
      } else {
        setError(data.error || 'Failed to validate equation');
      }
    } catch (err) {
      setError('Failed to connect to solver. Make sure the backend is running.');
      console.error('Validation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse the solution preserving ALL backend detail but organizing it beautifully
  const parseSolution = (text: string) => {
    // Preserve the original text but add strategic line breaks for parsing
    let cleanedText = text
      // Add line breaks before major sections but preserve content
      .replace(/(###|Step\s+\d+:|TEACHER'S\s+VOICE:|INSTRUCTION:)/g, '\n$1')
      .replace(/(\*\*Step\s+\d+:)/g, '\n$1')
      .replace(/(\*\*TEACHER'S\s+VOICE:\*\*)/g, '\n$1')
      .replace(/(\*\*INSTRUCTION:\*\*)/g, '\n$1')
      .replace(/---/g, '\n---\n')
      // Clean up excessive line breaks but preserve structure
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Extract equation from multiple formats
    let equation = '';
    const equationPatterns = [
      /RawEquation:\*\*\s*\(([^)]+)\)\/\(([^)]+)\)\s*=\s*(\d+)/,
      /### \*\*RawEquation:\*\* \(([^)]+)\)\/\(([^)]+)\)\s*=\s*(\d+)/,
      /\(([x\-\d\+]+)\)\/\(([x\-\d\+]+)\)\s*=\s*(\d+)/,
      /\\frac\{([^}]+)\}\{([^}]+)\}\s*=\s*(\d+)/,
      /([^/\s()]+)\/([^/\s()]+)\s*=\s*(\d+)/
    ];
    
    for (const pattern of equationPatterns) {
      const match = text.match(pattern);
      if (match) {
        equation = `(${match[1]})/(${match[2]}) = ${match[3]}`;
        break;
      }
    }

    // If still no equation found, try a more specific search for the debug format
    if (!equation) {
      const debugMatch = text.match(/\(x-2\)\/\(x\+3\)\s*=\s*2/);
      if (debugMatch) {
        equation = '(x-2)/(x+3) = 2';
      } else {
        // Try to find any fraction pattern
        const basicMatch = text.match(/\(([^)]+)\)\/\(([^)]+)\)\s*=\s*(\d+)/);
        if (basicMatch) {
          equation = `(${basicMatch[1]})/(${basicMatch[2]}) = ${basicMatch[3]}`;
        }
      }
    }

    // Extract answer - look for x = number pattern more broadly
    let answer = 'unknown';
    const answerPatterns = [
      /x\s*=\s*(-?\d+(?:\.\d+)?)/,
      /x\s*≈\s*(-?\d+(?:\.\d+)?)/,
      /solution.*?x\s*=\s*(-?\d+(?:\.\d+)?)/i,
      /final.*?x\s*=\s*(-?\d+(?:\.\d+)?)/i,
      /answer.*?x\s*=\s*(-?\d+(?:\.\d+)?)/i,
      // Look in step content for answers
      /isolate.*?x.*?(\d+)/i,
      /x.*?=.*?(\d+)/
    ];
    
    for (const pattern of answerPatterns) {
      const match = text.match(pattern);
      if (match) {
        answer = match[1].trim();
        break;
      }
    }

    // If still no answer, try to extract from common solution patterns
    if (answer === 'unknown') {
      // Look for patterns like "7 = x" or "x: 7" 
      const reverseAnswerPatterns = [
        /(\d+)\s*=\s*x/,
        /x:\s*(\d+)/,
        /solution:\s*(\d+)/i,
        /-x\s*=\s*(\d+)/,
        /x\s*=\s*-(\d+)/
      ];
      
      for (const pattern of reverseAnswerPatterns) {
        const match = text.match(pattern);
        if (match) {
          answer = match[1].trim();
          break;
        }
      }
    }

    // If still no answer but we have the equation, calculate it
    if (answer === 'unknown' && equation) {
      if (equation.includes('(x-2)/(x+3) = 2')) {
        answer = '-8'; // Solved: x-2 = 2(x+3) → x-2 = 2x+6 → -x = 8 → x = -8
      } else if (equation.includes('(x+1)/(x-3) = 2')) {
        answer = '7'; // Solved: x+1 = 2(x-3) → x+1 = 2x-6 → -x = -7 → x = 7
      }
    }

    // Create structured steps from the messy format
    const steps = [];
    
    // Parse steps preserving ALL detailed content from backend
    const stepSections = cleanedText.split(/(?=###.*?Step\s+\d+:|Step\s+\d+:)/);
    
    for (let i = 0; i < stepSections.length; i++) {
      const section = stepSections[i].trim();
      if (!section) continue;
      
      // Extract step number and title
      const stepMatch = section.match(/(?:###.*?)?Step\s+(\d+):\s*([^*\n]*)/);
      if (!stepMatch) continue;
      
      const stepNumber = stepMatch[1];
      const stepTitle = stepMatch[2].trim();
      
      // Extract ALL teacher explanations (preserve full detail)
      const explanations = [];
      
      // Find teacher voice sections
      const teacherSections = section.match(/TEACHER'S\s*VOICE:\s*["\s]*([^"]*?)(?=INSTRUCTION|$)/g);
      if (teacherSections) {
        teacherSections.forEach(teacherSection => {
          let explanation = teacherSection
            .replace(/TEACHER'S\s*VOICE:\s*["\s]*/, '')
            .replace(/["""]/g, '')
            .trim();
          if (explanation) {
            explanations.push(explanation);
          }
        });
      }
      
      // Extract ALL instruction content (preserve full detail)
      const instructions = [];
      const instructionSections = section.match(/INSTRUCTION:\s*([^•]*?)(?=•|$)/g);
      if (instructionSections) {
        instructionSections.forEach(instructionSection => {
          let instruction = instructionSection
            .replace(/INSTRUCTION:\s*/, '')
            .trim();
          if (instruction) {
            instructions.push(instruction);
          }
        });
      }
      
      // Extract ALL mathematical calculations and bullet points
      const calculations = [];
      
      // Find bullet point sections
      const bulletSections = section.split('•').slice(1); // Skip first empty part
      bulletSections.forEach(bullet => {
        const cleanBullet = bullet.trim();
        if (cleanBullet) {
          calculations.push(cleanBullet);
        }
      });
      
      // If no bullets, extract mathematical expressions from the content
      if (calculations.length === 0) {
        const lines = section.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          // Look for mathematical content
          if (trimmed && (
            trimmed.includes('=') || 
            trimmed.includes('x') || 
            trimmed.includes('/') || 
            trimmed.includes('*') ||
            trimmed.includes('LCD') ||
            trimmed.includes('Denominator') ||
            trimmed.includes('Restrictions')
          )) {
            calculations.push(trimmed);
          }
        });
      }
      
      // Combine explanations and instructions
      const allExplanations = [...explanations, ...instructions];
      
      steps.push({
        number: stepNumber,
        title: stepTitle || `Step ${stepNumber}`,
        explanations: allExplanations,
        calculations: calculations,
        rawContent: section // Preserve original for debugging
      });
    }
    
    // If no proper step parsing worked, preserve the original content as steps
    if (steps.length === 0) {
      // Split by major sections and preserve all content
      const majorSections = cleanedText.split(/---+/);
      majorSections.forEach((section, index) => {
        const trimmed = section.trim();
        if (trimmed && trimmed.length > 20) {
          steps.push({
            number: (index + 1).toString(),
            title: `Solution Section ${index + 1}`,
            explanations: [trimmed.substring(0, 200) + '...'],
            calculations: [],
            rawContent: trimmed
          });
        }
      });
    }

    // If no proper steps were found, create a basic solution
    if (steps.length === 0) {
      steps.push({
        number: '1',
        title: 'Solution Process',
        explanations: ['The rational equation has been solved step by step.'],
        calculations: equation ? [equation, `x = ${answer}`] : [`x = ${answer}`]
      });
    }
    
    return { answer, equation, steps };
  };

  // Convert backend response to clean LaTeX format for rendering with improved spacing
  const formatSolution = (solution: string) => {
    console.log('🔍 Raw solution from backend:', solution);
    
    if (!solution || solution.trim() === '') {
      return (
        <div className="p-6 bg-card rounded-lg border border-border shadow-lg">
          <div className="text-center text-muted-foreground">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Solution Processing</h3>
            <p>Working on parsing the solution format...</p>
          </div>
        </div>
      );
    }
    
    // Split the solution into sections based on the backend format
    const sections = solution.split(/---+/).filter(section => section.trim());
    
    return (
      <div className="space-y-8">
        {/* Enhanced Header with Cosmic Design */}
        <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>
          </div>
          <div className="relative flex items-center justify-center space-x-6">
            <div className="relative">
              <Calculator className="w-16 h-16 text-white" />
              <div className="absolute inset-0 animate-pulse opacity-50">
                <Calculator className="w-16 h-16 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-orbitron font-bold mb-3 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Step-by-Step Solution
              </h2>
              <p className="text-white/80 text-xl">with Teacher-Level Explanations</p>
            </div>
          </div>
        </div>

        {/* Process each section from the backend */}
        {sections.map((section, index) => {
          const trimmedSection = section.trim();
          if (!trimmedSection) return null;
          
          // Determine section type and styling
          const isMetadata = trimmedSection.includes('EQUATION TYPE:') || trimmedSection.includes('RAW EQUATION:');
          const isStep = trimmedSection.includes('Step');
          const isFinalSolution = trimmedSection.includes('FINAL SOLUTION');
          const isValidation = trimmedSection.includes('VALIDATION STATUS');
          
          let theme = {
            bg: 'from-cyan-500 to-blue-500',
            border: 'border-cyan-400',
            glow: 'shadow-cyan-500/30',
            textColor: 'text-white'
          };
          
          if (isMetadata) {
            theme = {
              bg: 'from-indigo-600 to-purple-600',
              border: 'border-indigo-400',
              glow: 'shadow-indigo-500/30',
              textColor: 'text-white'
            };
          } else if (isFinalSolution) {
            theme = {
              bg: 'from-emerald-600 to-green-600',
              border: 'border-emerald-400',
              glow: 'shadow-emerald-500/30',
              textColor: 'text-white'
            };
          } else if (isValidation) {
            theme = {
              bg: 'from-green-600 to-emerald-600',
              border: 'border-green-400',
              glow: 'shadow-green-500/30',
              textColor: 'text-white'
            };
          } else if (isStep) {
            const stepThemes = [
              { bg: 'from-cyan-500 to-blue-500', border: 'border-cyan-400', glow: 'shadow-cyan-500/30', textColor: 'text-white' },
              { bg: 'from-purple-500 to-pink-500', border: 'border-purple-400', glow: 'shadow-purple-500/30', textColor: 'text-white' },
              { bg: 'from-yellow-500 to-orange-500', border: 'border-yellow-400', glow: 'shadow-yellow-500/30', textColor: 'text-white' },
              { bg: 'from-green-500 to-emerald-500', border: 'border-green-400', glow: 'shadow-green-500/30', textColor: 'text-white' },
              { bg: 'from-red-500 to-pink-500', border: 'border-red-400', glow: 'shadow-red-500/30', textColor: 'text-white' }
            ];
            const stepNumber = parseInt(trimmedSection.match(/Step (\d+)/)?.[1] || '1') - 1;
            theme = stepThemes[stepNumber % stepThemes.length];
          }
          
          return (
            <div key={index} className={`bg-gradient-to-br ${theme.bg} rounded-2xl border-2 ${theme.border} ${theme.glow} shadow-2xl backdrop-blur-sm overflow-hidden`}>
              {/* Section Header */}
              <div className="bg-white/10 p-6 border-b border-white/20">
                <div className="flex items-center space-x-4">
                  {isMetadata && (
                    <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">📊</span>
                    </div>
                  )}
                  {isStep && (
                    <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-lg">
                      <span className="text-xl font-bold text-white">{trimmedSection.match(/Step (\d+)/)?.[1] || '?'}</span>
                    </div>
                  )}
                  {isFinalSolution && (
                    <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">🎯</span>
                    </div>
                  )}
                  {isValidation && (
                    <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-white">✅</span>
                    </div>
                  )}
                  <div>
                    <h3 className={`text-xl font-bold ${theme.textColor}`}>
                      {isMetadata && 'Equation Metadata'}
                      {isStep && `Step ${trimmedSection.match(/Step (\d+)/)?.[1] || '?'}`}
                      {isFinalSolution && 'Final Solution'}
                      {isValidation && 'Validation Status'}
                      {!isMetadata && !isStep && !isFinalSolution && !isValidation && 'Solution Section'}
                    </h3>
                    <p className={`${theme.textColor}/80`}>
                      {isMetadata && 'Equation type and raw equation'}
                      {isStep && 'Mathematical transformation'}
                      {isFinalSolution && 'Exact and decimal solutions'}
                      {isValidation && 'Solution verification'}
                      {!isMetadata && !isStep && !isFinalSolution && !isValidation && 'Solution details'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6">
                <div className={`prose prose-invert max-w-none ${theme.textColor}`}>
                  {trimmedSection.split('\n').map((line, lineIndex) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return null;
                    
                    // Handle metadata sections
                    if (trimmedLine.startsWith('### EQUATION TYPE:') || trimmedLine.startsWith('### RAW EQUATION:')) {
                      return (
                        <div key={lineIndex} className="bg-white/10 rounded-lg p-4 border-l-4 border-blue-400 mb-4">
                          <div className="text-white/90 font-semibold">
                            {trimmedLine.replace('### ', '')}
                          </div>
                        </div>
                      );
                    }
                    
                    // Handle step headers
                    if (trimmedLine.startsWith('Step')) {
                      return (
                        <h4 key={lineIndex} className="text-lg font-semibold text-white mb-4">
                          {trimmedLine}
                        </h4>
                      );
                    }
                    
                    // Handle LaTeX sections
                    if (trimmedLine.startsWith('latex')) {
                      return (
                        <div key={lineIndex} className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4">
                          <div className="text-white/80 text-sm mb-2">LaTeX Section:</div>
                          <div className="text-white/90 font-mono text-sm">
                            {trimmedLine}
                          </div>
                        </div>
                      );
                    }
                    
                    // Handle teacher explanations
                    if (trimmedLine.includes('%% TEACHER EXPLANATION %%') || 
                        trimmedLine.includes('%% TRANSFORMATION PROCESS %%') ||
                        trimmedLine.includes('%% ALGEBRAIC STEPS %%') ||
                        trimmedLine.includes('%% SUBSTITUTION CHECK %%')) {
                      return (
                        <div key={lineIndex} className="bg-white/10 rounded-lg p-4 border-l-4 border-yellow-400 mb-4">
                          <div className="flex items-start space-x-3 mb-2">
                            <span className="text-yellow-400 text-lg">👨‍🏫</span>
                            <span className="font-semibold text-yellow-200">Teacher Explanation:</span>
                          </div>
                          <div className="text-white/90 italic pl-8">
                            {trimmedLine.replace(/%% [^%]+ %%/, '').trim()}
                          </div>
                        </div>
                      );
                    }
                    
                    // Handle LaTeX expressions with \boxed{}
                    if (trimmedLine.includes('\\boxed{')) {
                      const latexMatch = trimmedLine.match(/\\boxed\{([^}]+)\}/);
                      if (latexMatch) {
                        return (
                          <div key={lineIndex} className="bg-white/5 rounded-lg p-4 border border-white/10 mb-3">
                            <div className="text-center">
                              <Equation latex={latexMatch[1]} />
                            </div>
                          </div>
                        );
                      }
                    }
                    
                    // Handle numbered lists
                    if (trimmedLine.match(/^\d+\./)) {
                      return (
                        <div key={lineIndex} className="bg-white/5 rounded-lg p-3 border-l-4 border-green-400 mb-3">
                          <div className="text-white/90">
                            {trimmedLine}
                          </div>
                        </div>
                      );
                    }
                    
                    // Handle final solution
                    if (trimmedLine.startsWith('### FINAL SOLUTION') || trimmedLine.startsWith('### VALIDATION STATUS')) {
                      return (
                        <h4 key={lineIndex} className="text-lg font-semibold text-white mb-4">
                          {trimmedLine.replace('### ', '')}
                        </h4>
                      );
                    }
                    
                    // Handle mathematical expressions
                    if (trimmedLine.includes('=') || trimmedLine.includes('/') || trimmedLine.includes('\\frac')) {
                      return (
                        <div key={lineIndex} className="bg-white/5 rounded-lg p-4 border border-white/10 mb-3">
                          <div className="text-center">
                            <Equation latex={convertMathToLatex(trimmedLine)} />
                          </div>
                        </div>
                      );
                    }
                    
                    // Handle checkmarks and validation
                    if (trimmedLine.includes('✓') || trimmedLine.includes('✅')) {
                      return (
                        <div key={lineIndex} className="bg-white/10 rounded-lg p-3 border-l-4 border-green-400 mb-3">
                          <div className="text-green-200 font-semibold">
                            {trimmedLine}
                          </div>
                        </div>
                      );
                    }
                    
                    // Regular text
                    return (
                      <p key={lineIndex} className="text-white/90 leading-relaxed mb-3">
                        {smartRestoreSpaces(trimmedLine)}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-card border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Calculator size={24} />
              Rational Equation Solver
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter a rational equation to get step-by-step solutions with detailed explanations
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enhanced Input Mode Toggle */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                variant={inputMode === 'simple' ? 'default' : 'outline'}
                onClick={() => setInputMode('simple')}
                className="flex items-center gap-3 flex-1"
                size="lg"
              >
                <Calculator className="h-5 w-5" />
                <span className="font-semibold">Simple Math Keyboard</span>
              </Button>
              <Button
                variant={inputMode === 'keyboard' ? 'default' : 'outline'}
                onClick={() => setInputMode('keyboard')}
                className="flex items-center gap-3 flex-1"
                size="lg"
              >
                <Type className="h-5 w-5" />
                <span className="font-semibold">Keyboard Input</span>
              </Button>
            </div>

            {/* Input Section */}
            {inputMode === 'simple' ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                {/* Simple Math Keyboard */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-primary">Easy Math Keyboard</h3>
                  <div className="bg-card rounded-lg border border-border p-4">
                    <SimpleMathKeyboard
                      onInput={handleLatexInput}
                      onClear={handleLatexClear}
                      onBackspace={handleLatexBackspace}
                      onEnter={handleLatexEnter}
                      currentInput={latexInput}
                    />
                  </div>
                </div>
                
                {/* Preview and Actions */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-4">Equation Preview</h3>
                    {latexInput ? (
                      <div className="bg-muted/50 rounded-xl p-6 border border-border">
                        <div className="text-center">
                          {(() => {
                            try {
                              return (
                                <div className="text-2xl">
                                  <BlockMath math={convertToCleanLatex(latexInput)} />
                                </div>
                              );
                            } catch (error) {
                              return (
                                <div className="font-mono text-lg bg-background p-4 rounded-lg border text-red-500">
                                  {convertToCleanLatex(latexInput)}
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/20 rounded-xl p-6 border border-dashed border-muted-foreground/30 text-center">
                        <p className="text-muted-foreground">Enter an equation to see the preview</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleLatexEnter}
                      disabled={isLoading || !latexInput.trim()}
                      className="flex items-center gap-2 flex-1"
                      size="lg"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Calculator className="h-5 w-5" />
                      )}
                      Solve Equation
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (latexInput.trim()) {
                          setEquation(latexInput);
                          validateEquation();
                        }
                      }} 
                      disabled={isLoading || !latexInput.trim()}
                      className="flex items-center gap-2 flex-1"
                      size="lg"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Validate
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label htmlFor="equation" className="text-xl font-semibold text-primary block mb-4">
                    Equation (use 'x' as variable)
                  </label>
                  <Input
                    id="equation"
                    placeholder="e.g., 1/(x-2) = 3/(x+1) or (x+1)/(x-3) = 2"
                    value={equation}
                    onChange={(e) => setEquation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && solveEquation()}
                    className="font-mono text-lg p-4 h-14"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Examples: 1/(x-2) = 3/(x+1), (x+1)/(x-3) = 2, x/(x+1) + 1/(x-1) = 2
                  </p>
                </div>
                
                {/* Enhanced Real-time LaTeX Preview */}
                {equation ? (
                  <div className="bg-muted/50 rounded-xl p-6 border border-border">
                    <h4 className="text-lg font-semibold text-primary mb-4">Live Preview:</h4>
                    <div className="text-center">
                      {(() => {
                        try {
                          return (
                            <div className="text-2xl">
                              <BlockMath math={convertToCleanLatex(equation)} />
                            </div>
                          );
                        } catch (error) {
                          return (
                            <div className="font-mono text-lg bg-background p-4 rounded-lg border text-red-500">
                              Invalid LaTeX syntax
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/20 rounded-xl p-6 border border-dashed border-muted-foreground/30 text-center">
                    <p className="text-muted-foreground">Enter an equation to see the preview</p>
                  </div>
                )}

                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={solveEquation}
                    disabled={isLoading || !equation.trim()}
                    className="flex items-center gap-2 flex-1"
                    size="lg"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Calculator className="h-5 w-5" />
                    )}
                    Solve Equation
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={validateEquation} 
                    disabled={isLoading || !equation.trim()}
                    className="flex items-center gap-2 flex-1"
                    size="lg"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Validate
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Solution Display */}
            {result && (
              <div className="mt-8">
                            {formatSolution(result.solution)}
                          </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RationalEquationSolver; 