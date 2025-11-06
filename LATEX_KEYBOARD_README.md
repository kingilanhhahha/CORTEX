# LaTeX Keyboard for Touchscreen LCD

This feature provides a LaTeX keyboard interface for easy equation input on touchscreen LCD displays. Users can input equations in LaTeX format, which are then converted to standard format for the solver.

## Features

### 1. Dual Input Modes
- **Keyboard Input**: Traditional text input for equations
- **LaTeX Keyboard**: Touch-friendly LaTeX input interface

### 2. LaTeX Keyboard Components
- **Number Pad**: 0-9 digits
- **Variables**: x, y, z, a, b, c
- **Operators**: +, -, ×, ÷, =
- **Special Functions**: Fractions, Powers, Subscripts
- **Parentheses**: (, ), [, ], {, }
- **Common Patterns**: Pre-built LaTeX patterns for common equations

### 3. LaTeX Conversion
The system automatically converts LaTeX input to standard format:

| LaTeX Input | Standard Output | Description |
|-------------|-----------------|-------------|
| `\frac{1}{x}` | `(1)/(x)` | Basic fraction |
| `\frac{x+1}{x-1}` | `(x+1)/(x-1)` | Complex fraction |
| `x^{2}` | `x^(2)` | Power notation |
| `x \times y` | `x * y` | Multiplication |
| `\sqrt{x}` | `sqrt(x)` | Square root |

### 4. Input Validation
- Checks for unmatched braces and parentheses
- Validates equation structure (must contain '=')
- Provides helpful error messages

## Usage

### Switching Input Modes
1. Click "Keyboard Input" for traditional text input
2. Click "LaTeX Keyboard" for touch-friendly LaTeX input

### Using the LaTeX Keyboard
1. **Basic Input**: Click number and variable buttons
2. **Fractions**: Click "Fraction" button, then input numerator and denominator
3. **Powers**: Click "Power" button, then input the exponent
4. **Subscripts**: Click "Subscript" button, then input the subscript
5. **Common Patterns**: Use pre-built buttons for common equation patterns

### Example Workflow
1. Switch to "LaTeX Keyboard" mode
2. Click "Complex Fraction" button → `\frac{x+1}{x-1}`
3. Click "=" button
4. Click "Basic Fraction" button → `\frac{1}{2}`
5. Click "Solve Equation"
6. View the converted standard format and solution

## Technical Implementation

### Components
- `LaTeXKeyboard.tsx`: Main keyboard component
- `latexConverter.ts`: LaTeX conversion utilities
- Updated `RationalEquationSolver.tsx`: Integration with existing solver

### Conversion Process
1. **Input**: User enters LaTeX via keyboard
2. **Validation**: Check for proper LaTeX syntax
3. **Conversion**: Convert LaTeX to standard format
4. **Solver**: Send standard format to backend solver
5. **Display**: Show both LaTeX input and converted format

### Error Handling
- Invalid LaTeX syntax
- Unmatched braces/parentheses
- Missing equals sign
- Conversion errors

## Benefits for Touchscreen LCD

1. **Large Buttons**: Easy to tap on touchscreen
2. **Visual Feedback**: Clear button states
3. **Common Patterns**: Quick access to frequent equations
4. **Error Prevention**: Built-in validation
5. **Dual Display**: Shows both LaTeX and standard format

## Future Enhancements

- Voice input support
- Handwriting recognition
- More LaTeX patterns
- Custom equation templates
- Export to different formats 