#!/usr/bin/env python3
"""
Test script for raw format conversion functionality
"""

import re

def convert_latex_to_raw_format(latex_text):
    """Convert LaTeX to raw format without solving - just format conversion"""
    if not latex_text:
        return latex_text
    
    print(f"DEBUG: Converting LaTeX to raw format: {latex_text}")
    
    # Handle SymPy Eq format FIRST (before LaTeX conversion)
    if latex_text.startswith('Eq(') and latex_text.endswith(')'):
        # Extract content from Eq(..., ...) format
        content = latex_text[3:-1]  # Remove 'Eq(' and ')'
        
        # Find the comma that separates left and right sides
        # We need to be careful about commas inside parentheses
        paren_count = 0
        split_pos = -1
        
        for i, char in enumerate(content):
            if char == '(':
                paren_count += 1
            elif char == ')':
                paren_count -= 1
            elif char == ',' and paren_count == 0:
                split_pos = i
                break
        
        if split_pos != -1:
            left_side = content[:split_pos]
            right_side = content[split_pos + 1:]
            latex_text = f"{left_side}={right_side}"
        else:
            # If no comma found, treat as single expression = 0
            latex_text = f"{content}=0"
    
    # Handle OCR errors: replace comma with equal sign if no equals present
    if ',' in latex_text and '=' not in latex_text:
        latex_text = latex_text.replace(',', '=')
    
    # Common LaTeX to raw format conversions (NO SOLVING)
    # IMPORTANT: Apply these BEFORE removing backslashes
    conversions = {
        r'\\frac\{([^}]+)\}\{([^}]+)\}': r'(\1)/(\2)',  # \frac{a}{b} -> (a)/(b)
        r'\\left\\(([^)]+)\\right\\)': r'(\1)',        # \left(a\right) -> (a)
        r'\\cdot': '*',                             # \cdot -> *
        r'\\times': '*',                            # \times -> *
        r'\\div': '/',                              # \div -> /
        r'\\pm': '+',                               # \pm -> +
        r'\\mp': '-',                               # \mp -> -
        r'\\sqrt\{([^}]+)\}': r'sqrt(\1)',           # \sqrt{a} -> sqrt(a)
        r'\\sqrt\[([^\]]+)\]\{([^}]+)\}': r'(\2)**(1/(\1))',  # \sqrt[n]{a} -> (a)**(1/(n))
        r'([a-zA-Z])\^([0-9]+)': r'\1**\2',      # a^2 -> a**2
        r'([a-zA-Z])\^\{([^}]+)\}': r'\1**(\2)', # a^{n} -> a**(n)
        r'([a-zA-Z])\^([a-zA-Z])': r'\1**\2',    # a^b -> a**b
    }
    
    result = latex_text
    
    # Apply conversions
    for pattern, replacement in conversions.items():
        try:
            old_result = result
            result = re.sub(pattern, replacement, result)
            if old_result != result:
                print(f"DEBUG: Applied pattern '{pattern}' -> '{replacement}'")
                print(f"DEBUG: Result changed from '{old_result}' to '{result}'")
        except re.error as regex_error:
            print(f"Regex error with pattern '{pattern}': {regex_error}")
            continue
    
    # Remove backslashes after other conversions
    result = result.replace('\\', '')
    print(f"DEBUG: After removing backslashes: {result}")
    
    # Clean up double parentheses at start and end (remove outer wrapping parentheses)
    result = re.sub(r'^\(+', '(', result)  # Remove multiple opening parentheses
    result = re.sub(r'\)+$', ')', result)  # Remove multiple closing parentheses
    
    # If the entire expression is wrapped in parentheses, remove them
    if result.startswith('(') and result.endswith(')') and result.count('(') == result.count(')'):
        # Check if it's a simple wrapping case
        inner_content = result[1:-1]
        if inner_content.count('(') == inner_content.count(')'):
            result = inner_content
    
    # Clean up extra spaces and parentheses
    result = re.sub(r'\s+', ' ', result)  # Multiple spaces to single
    result = result.strip()
    
    print(f"DEBUG: Final result: {result}")
    return result

def clean_raw_format(raw_text):
    """Clean up basic OCR errors in raw format output"""
    if not raw_text:
        return raw_text
    
    # Basic cleaning for raw format
    cleaned = raw_text.strip()
    cleaned = cleaned.replace('×', '*')
    cleaned = cleaned.replace('÷', '/')
    cleaned = cleaned.replace('−', '-')
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()

if __name__ == "__main__":
    # Test cases
    test_cases = [
        r"x+1[\frac{2x}{x+1}=4]x+1",
        r"2x-1[\frac{3x+1}{2x-1}=5]2x-1",
        r"\frac{2x}{x+1}=4",
        r"x+1[\frac{2x}{x+1}=9]x+1"
    ]
    
    print("🧪 Testing Raw Format Conversion")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case}")
        print("-" * 30)
        
        # Convert to raw format
        raw_format = convert_latex_to_raw_format(test_case)
        print(f"Raw format: {raw_format}")
        
        # Clean up
        cleaned = clean_raw_format(raw_format)
        print(f"Cleaned: {cleaned}")
        
        print()
    
    print("✅ Testing complete!")


