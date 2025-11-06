# Simple Math Keyboard for Rational Equation Solver

## Overview
The Simple Math Keyboard provides an easy-to-use interface for entering mathematical equations without needing to know LaTeX syntax. It generates LaTeX code behind the scenes and shows the rendered output in real-time.

## Features

### 🎯 Easy-to-Use Interface
- **Numbers**: Click 0-9 to input numbers
- **Variables**: Click x, y, z, a, b, c for variables
- **Operators**: Click +, -, ×, ÷, = for basic operations
- **Special Functions**: 
  - **Fraction**: Creates fractions step-by-step
  - **Power**: Adds superscripts (x², x³, etc.)
  - **Subscript**: Adds subscripts
  - **Parentheses**: Adds ( and )

### 🔄 Real-Time Preview
- Shows both LaTeX code and rendered output
- Live validation of mathematical syntax
- Clear visual feedback

### 📱 User-Friendly Design
- Organized button layout
- Clear section labels
- Intuitive icons
- Responsive design

## How to Use

### 1. Basic Input
1. Click number buttons (0-9) to input numbers
2. Click variable buttons (x, y, z, a, b, c) to input variables
3. Click operator buttons (+, -, ×, ÷, =) for operations

### 2. Creating Fractions
1. Click the **Fraction** button
2. Enter the numerator (top part)
3. Click **Next** to move to denominator
4. Enter the denominator (bottom part)
5. Click **Complete** to finish

**Example**: To create `\frac{2x+1}{x-3}`
- Click Fraction → Enter "2x+1" → Click Next → Enter "x-3" → Click Complete

### 3. Adding Powers
1. Click the **Power** button
2. Enter the base (e.g., "x")
3. Enter the exponent (e.g., "2")
4. Click **Power** again to finish

**Example**: To create `x^2`
- Click Power → Enter "x" → Enter "2" → Click Power

### 4. Using Parentheses
- Click the **Parentheses** button to add ( and )
- Use them to group expressions: `(x+1)/(x-2)`

### 5. Control Buttons
- **Back**: Remove the last character
- **Clear**: Clear all input
- **Space**: Add a space
- **Solve**: Submit the equation for solving

## Example Equations You Can Build

### Simple Fraction
```
2/x = 5
```
Steps: Click "2" → Click "÷" → Click "x" → Click "=" → Click "5"

### Complex Fraction
```
\frac{x+1}{x-3} = 2
```
Steps: 
1. Click Fraction → Enter "x+1" → Click Next → Enter "x-3" → Click Complete
2. Click "=" → Click "2"

### Equation with Powers
```
x^2 + 3x = 10
```
Steps:
1. Click "x" → Click Power → Enter "2" → Click Power
2. Click "+" → Click "3" → Click "x"
3. Click "=" → Click "1" → Click "0"

## Technical Details

### LaTeX Generation
The keyboard automatically generates proper LaTeX code:
- Fractions: `\frac{numerator}{denominator}`
- Powers: `x^{exponent}`
- Subscripts: `x_{subscript}`
- Operators: `+`, `-`, `\times`, `\div`, `=`

### Real-Time Rendering
- Uses KaTeX for fast LaTeX rendering
- Shows both code and rendered output
- Validates syntax in real-time

### Backend Integration
- Sends LaTeX code to the solver backend
- Converts to standard format for processing
- Returns step-by-step solutions

## Tips for Best Results

1. **Start Simple**: Begin with basic equations to get familiar
2. **Use Fractions**: The fraction builder makes complex fractions easy
3. **Check Preview**: Always verify the rendered output looks correct
4. **Use Variables**: Click variable buttons instead of typing letters
5. **Group with Parentheses**: Use parentheses to clarify order of operations

## Troubleshooting

### Common Issues
- **Invalid Syntax**: Check the preview to see if LaTeX renders correctly
- **Missing Parts**: Make sure to complete fractions and powers
- **Wrong Order**: Use parentheses to group expressions properly

### Getting Help
- The preview shows exactly what will be sent to the solver
- Invalid syntax will show an error message
- Clear and try again if something goes wrong

## Advanced Features

### Keyboard Shortcuts
- **Enter**: Submit equation (same as Solve button)
- **Backspace**: Remove last character
- **Escape**: Clear all input

### Mobile Support
- Touch-friendly button sizes
- Responsive layout
- Works on tablets and phones

This simple keyboard makes entering complex mathematical equations as easy as clicking buttons, while still generating proper LaTeX code for the solver! 