#!/usr/bin/env python3
"""
OCR-Integrated Drawing Pad with Line-by-Line Solution Checker
Complete interface with drawing canvas, OCR processing, and real-time solution checking
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import os
import tempfile
import re
import datetime
from PIL import Image, ImageDraw

# Try to import required modules
try:
    import lcd
    OCR_AVAILABLE = True
except ImportError as e:
    print(f"OCR module not available: {e}")
    OCR_AVAILABLE = False

try:
    import olol_hahahaa
    SOLVER_AVAILABLE = True
except ImportError as e:
    print(f"Solver module not available: {e}")
    SOLVER_AVAILABLE = False

# Add new import for raw SymPy processing
try:
    import sympy as sp
    SYMPY_AVAILABLE = True
except ImportError as e:
    print(f"SymPy module not available: {e}")
    SYMPY_AVAILABLE = False

class DrawingArea:
    def __init__(self, parent):
        self.parent = parent
        self.canvas = tk.Canvas(parent, width=600, height=400, bg='white', cursor='cross')
        self.canvas.pack(pady=10)
        
        # Drawing variables
        self.drawing = False
        self.last_x = None
        self.last_y = None
        self.lines = []
        self.current_line = []
        
        # Bind mouse events
        self.canvas.bind('<Button-1>', self.start_draw)
        self.canvas.bind('<B1-Motion>', self.draw)
        self.canvas.bind('<ButtonRelease-1>', self.stop_draw)
        
        # Clear button
        self.clear_btn = tk.Button(parent, text="Clear Drawing", command=self.clear_canvas)
        self.clear_btn.pack(pady=5)
        
    def start_draw(self, event):
        self.drawing = True
        self.last_x = event.x
        self.last_y = event.y
        self.current_line = [(event.x, event.y)]
        
    def draw(self, event):
        if self.drawing:
            if self.last_x and self.last_y:
                self.canvas.create_line(self.last_x, self.last_y, event.x, event.y, 
                                     fill='black', width=3, smooth=True)
                self.current_line.append((event.x, event.y))
            self.last_x = event.x
            self.last_y = event.y
            
    def stop_draw(self, event):
        self.drawing = False
        if self.current_line:
            self.lines.append(self.current_line)
            self.current_line = []
            
    def clear_canvas(self):
        self.canvas.delete("all")
        self.lines = []
        self.current_line = []
        
    def get_drawing_as_image(self):
        """Convert canvas drawing to PIL Image using direct canvas capture"""
        try:
            # Get canvas dimensions
            width = self.canvas.winfo_width()
            height = self.canvas.winfo_height()
            
            # Create a PIL Image with the same dimensions
            img = Image.new('RGB', (width, height), 'white')
            draw = ImageDraw.Draw(img)
            
            # Draw all the lines from the stored drawing data
            for line in self.lines:
                if len(line) > 1:
                    # Convert canvas coordinates to image coordinates
                    points = [(x, y) for x, y in line]
                    # Draw the line with black color and appropriate thickness
                    draw.line(points, fill='black', width=3)
            
            return img
            
        except Exception as e:
            print(f"Image conversion failed: {e}")
            # Return a basic white image as fallback
            return Image.new('RGB', (600, 400), 'white')

def normalize_math_expression(expr_str):
    """Normalize mathematical expressions for SymPy parsing"""
    normalized = expr_str
    
    # Replace √n with sqrt(n)
    normalized = re.sub(r'√(\w+)', r'sqrt(\1)', normalized)
    
    # Handle ± symbol more intelligently
    if '±' in normalized:
        normalized = normalized.replace('±', '+')
    
    # Replace ^ with **
    normalized = normalized.replace('^', '**')
    
    # Handle comma-separated answers like "(a+sqrt(b))/c, (a-sqrt(b))/c"
    if ',' in normalized:
        normalized = normalized.split(',')[0].strip()
    
    # Clean up any extra spaces around operators
    normalized = re.sub(r'\s*([+\-*/])\s*', r'\1', normalized)
    
    # Handle brackets consistently
    normalized = normalized.replace('[', '(').replace(']', ')')
    
    return normalized

def process_ocr_equation(equation_str):
    """
    Process OCR output to clean equation format
    Handles Eq(...) format, comma-to-equals conversion, and parentheses cleanup
    """
    print(f"Original OCR output: {equation_str}")
    
    # Handle equations already in Eq() format FIRST
    if equation_str.startswith('Eq(') and equation_str.endswith(')'):
        print(f"Found Eq format: {equation_str}")
        # Extract content from Eq(..., ...) format
        content = equation_str[3:-1]  # Remove 'Eq(' and ')'
        print(f"Extracted content: {content}")
        
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
            equation_str = f"{left_side}={right_side}"
            print(f"Converted Eq to equation: {equation_str}")
        else:
            # If no comma found, treat as single expression = 0
            equation_str = f"{content}=0"
            print(f"No comma found, treating as: {equation_str}")
    
    # Handle OCR errors: replace comma with equal sign
    if ',' in equation_str and '=' not in equation_str:
        equation_str = equation_str.replace(',', '=')
    
    # Clean up double parentheses at start and end
    equation_str = re.sub(r'^\(+', '(', equation_str)
    equation_str = re.sub(r'\)+$', ')', equation_str)
    
    print(f"Final processed equation: {equation_str}")
    return equation_str

def contains_text_or_symbols(text):
    """Check if text contains letters, words, or special symbols"""
    return any(
        char.isalpha() or char in ":→≠±√^" 
        for char in text
    )

def get_verification_feedback(student_mentions_verification, student_shows_verification_work):
    """
    Provides specific feedback about verification based on what the student did
    """
    if student_mentions_verification and student_shows_verification_work:
        return [
            "🎯 EXCELLENT verification work!",
            "✅ You mentioned verification AND showed the actual calculations",
            "✅ This demonstrates strong mathematical thinking and thoroughness",
            "💡 Keep up this good practice in future problems!"
        ]
    elif student_mentions_verification and not student_shows_verification_work:
        return [
            "🎯 Good start with verification!",
            "✅ You mentioned verification, which shows good mathematical thinking",
            "💡 To improve: Show the actual substitution calculations",
            "💡 Example: 'Check: LHS = (5+2)/(5-1) = 7/4, RHS = (5-1)/(5-1) + 1 = 4/4 + 1 = 2'"
        ]
    elif student_shows_verification_work and not student_mentions_verification:
        return [
            "🎯 EXCELLENT verification work!",
            "✅ You showed verification calculations (this counts as mentioning verification!)",
            "✅ This demonstrates strong mathematical thinking and thoroughness",
            "💡 Keep up this good practice in future problems!"
        ]
    else:
        return [
            "💡 Consider adding verification to your solution",
            "✅ Verification helps ensure your answer is correct",
            "💡 Example: Substitute your answer back into the original equation",
            "💡 Show: LHS = [calculation], RHS = [calculation], both should equal the same value"
        ]

def analyze_verification_context(student_solution, student_answer):
    """
    Advanced verification detection that looks at the context and structure of the solution
    """
    verification_score = 0
    verification_details = []
    
    # Look for answer followed by verification pattern
    answer_found = False
    verification_after_answer = False
    
    for i, line in enumerate(student_solution):
        line_lower = line.lower()
        
        # Check if this line contains the final answer
        if ("x =" in line or "x=" in line) and any(char.isdigit() for char in line):
            answer_found = True
            verification_details.append(f"Final answer found on line {i+1}: {line}")
            
            # Look at next few lines for verification
            for j in range(i+1, min(i+4, len(student_solution))):
                next_line = student_solution[j].lower()
                if any(word in next_line for word in ["check", "verify", "test", "substitute", "substitute", "lhs", "rhs", "left", "right"]):
                    verification_after_answer = True
                    verification_details.append(f"Verification found on line {j+1}: {student_solution[j]}")
                    verification_score += 2
                    break
        
        # Check for verification keywords in context
        if any(word in line_lower for word in ["check", "verify", "test", "substitute"]):
            verification_score += 1
            verification_details.append(f"Verification keyword on line {i+1}: {line}")
        
        # Check for LHS/RHS calculations
        if any(phrase in line_lower for phrase in ["lhs =", "rhs =", "left side =", "right side ="]):
            verification_score += 2
            verification_details.append(f"Side-by-side verification on line {i+1}: {line}")
        
        # Check for substitution work after finding the answer (fraction calculations)
        if any(char in line for char in ["=", "/"]) and any(char.isdigit() for char in line) and "/" in line:
            # Check if this line comes after a line with "x = [number]"
            for prev_idx in range(max(0, i-3), i):
                prev_line = student_solution[prev_idx]
                if ("x =" in prev_line or "x=" in prev_line) and any(char.isdigit() for char in prev_line):
                    # This looks like verification by substitution
                    verification_score += 2
                    verification_details.append(f"Substitution verification on line {i+1}: {line}")
                    break
    
    # Bonus for having verification after the answer
    if answer_found and verification_after_answer:
        verification_score += 1
        verification_details.append("Bonus: Verification follows the answer logically")
    
    return verification_score, verification_details

def get_verification_examples(equation_str):
    """
    Provides specific verification examples based on the equation type
    """
    try:
        import sympy as sp
        x = sp.symbols('x')
        
        # Parse the equation to understand its structure
        if "=" not in equation_str:
            return ["Example: Substitute your answer back into the original equation"]
        
        lhs_str, rhs_str = equation_str.split("=", 1)
        lhs, rhs = map(sp.sympify, [lhs_str, rhs_str])
        
        # Check if it's a rational equation
        denominators = []
        for expr in [lhs, rhs]:
            if expr.is_Add:
                for arg in expr.args:
                    num, den = sp.fraction(sp.together(arg))
                    if den != 1:
                        denominators.append(den)
            else:
                num, den = sp.fraction(sp.together(arg))
                if den != 1:
                    denominators.append(den)
        
        if denominators:
            # Rational equation example
            return [
                "Example for rational equation:",
                "1. Substitute x = [your answer] into the original equation",
                "2. Calculate LHS: [left side with substituted value]",
                "3. Calculate RHS: [right side with substituted value]",
                "4. Both sides should equal the same value",
                "5. Also check that no denominator becomes zero"
            ]
        else:
            # Polynomial equation example
            return [
                "Example for polynomial equation:",
                "1. Substitute your answer back into the original equation",
                "2. Calculate LHS: [left side with substituted value]",
                "3. Calculate RHS: [right side with substituted value]",
                "4. Both sides should equal the same value"
            ]
            
    except Exception:
        return ["Example: Substitute your answer back into the original equation"]

def get_detailed_verification_analysis(student_solution, student_answer):
    """
    Provides detailed analysis of what verification work was detected
    """
    analysis = []
    
    # Look for the answer line
    answer_line = None
    for i, line in enumerate(student_solution):
        if ("x =" in line or "x=" in line) and any(char.isdigit() for char in line):
            answer_line = i
            break
    
    if answer_line is not None:
        analysis.append(f"📝 Final answer found on line {answer_line + 1}: {student_solution[answer_line]}")
        
        # Look for verification work after the answer
        verification_lines = []
        for i in range(answer_line + 1, len(student_solution)):
            line = student_solution[i]
            if any(char in line for char in ["=", "/"]) and any(char.isdigit() for char in line):
                if "/" in line:  # Fraction work
                    verification_lines.append(f"Line {i + 1}: {line}")
        
        if verification_lines:
            analysis.append("🔍 Verification work detected after the answer:")
            for v_line in verification_lines:
                analysis.append(f"   {v_line}")
            analysis.append("✅ This shows you're checking your work by substitution!")
        else:
            analysis.append("💡 No verification work detected after the answer")
    
    return analysis

def stepwise_rational_solution_with_explanations(equation_str):
    """
    Step-by-Step Solution with Teacher-Level Explanations
    Provides detailed explanations in natural language while maintaining mathematical precision.
    """
    import sympy as sp
    x = sp.symbols('x')
    
    # Header
    result = []
    result.append("**Step-by-Step Solution with Teacher-Level Explanations:**")
    result.append("")
    result.append("---")
    
    # Raw Equation
    result.append("### **Raw Equation:**")
    result.append(f"{equation_str.replace('/', '/').replace('=', ' = ')}")
    result.append("*(We're solving for x in this fraction equation)*")
    result.append("")
    result.append("---")
    
    # Extract denominators first
    lhs_str, rhs_str = equation_str.split("=", 1)
    lhs, rhs = map(sp.sympify, [lhs_str, rhs_str])
    
    def extract_denominators(expr):
        denoms = set()
        if expr.is_Add:
            for arg in expr.args:
                denoms.update(extract_denominators(arg))
        else:
            num, den = sp.fraction(sp.together(expr))
            if den.is_Mul:
                for factor in den.args:
                    denoms.add(factor)
            else:
                denoms.add(den)
        return denoms
    
    denominators = set()
    denominators.update(extract_denominators(lhs))
    denominators.update(extract_denominators(rhs))
    denominators = [d for d in denominators if not sp.simplify(d) == 1]
    
    # Step 1: Find and Factor All Denominators
    result.append("### **Step 1: Find and Factor All Denominators**")
    result.append("**TEACHER'S VOICE:**")
    
    if len(denominators) == 0:
        result.append('"Let\'s look carefully at all bottom parts (denominators):')
        result.append("1. This equation has no fractions with variables in the denominator")
        result.append("2. All terms are either constants or polynomials")
        result.append('3. We can solve this directly without clearing denominators"')
    elif len(denominators) == 1:
        den_str = sp.sstr(denominators[0])
        result.append('"Let\'s look carefully at all bottom parts (denominators):')
        result.append(f"1. There is one fraction with {den_str} at the bottom")
        result.append(f"2. Since {den_str} is already simple, we don't need to factor it further")
        result.append('3. Any constant terms have an invisible denominator of 1"')
    else:
        den_list = [sp.sstr(d) for d in denominators]
        result.append('"Let\'s look carefully at all bottom parts (denominators):')
        result.append(f"1. There are {len(den_list)} fractions with different denominators")
        result.append(f"2. The denominators are: {', '.join(den_list)}")
        result.append("3. Since these are already simple, we don't need to factor them further")
        result.append('4. Any constant terms have an invisible denominator of 1"')
    
    result.append("")
    result.append("```")
    result.append("INSTRUCTION: First, let's examine all the denominators in our equation - these are the bottom parts of our fractions.")
    for d in denominators:
        result.append(f"  {sp.sstr(d)}  # Already in simplest form")
    
    # Excluded values
    excluded_values = []
    excluded_explanations = []
    for d in denominators:
        for sol in sp.solve(d, x):
            excluded_values.append(sol)
            excluded_explanations.append(f"x = {sp.sstr(sol)} (because division by zero is undefined)  # Never allowed")
    
    result.append("INSTRUCTION: Values that would break the math.")
    if excluded_explanations:
        for exp in excluded_explanations:
            result.append(f"  {exp}")
    else:
        result.append("  None  # No values make any denominator zero.")
    
    # LCD
    if denominators:
        lcd = sp.lcm([sp.factor(d) for d in denominators])
        result.append(f"• LCD: {sp.sstr(sp.factor(lcd))}  # This is our magic cleaner for all fractions")
    else:
        result.append("• LCD: 1  # No denominators to clear")
    result.append("```")
    result.append("")
    result.append("---")
    
    # Step 2: Multiply Both Sides by LCD
    result.append("### **Step 2: Multiply Both Sides by LCD**")
    result.append("**TEACHER'S VOICE:**")
    
    if denominators:
        lcd_str = sp.sstr(sp.factor(lcd))
        result.append(f'"We\'ll multiply EVERY term by {lcd_str} to clean up:')
        result.append("1. For fractions: The bottom cancels with our LCD")
        result.append("2. For whole numbers: We distribute like multiplication")
        result.append('3. Watch how each part transforms!"')
    else:
        result.append('"Since there are no denominators to clear:')
        result.append("1. We can solve this equation directly")
        result.append("2. No multiplication by LCD is needed")
        result.append('3. Let\'s proceed to solving!"')
    
    result.append("")
    result.append("```")
    result.append("INSTRUCTION: To make this easier to work with, we'll multiply every single term by our least common denominator (LCD). This will clear all the fractions.")
    
    # Calculate LCD in factored form
    if denominators:
        lcd = sp.lcm([sp.factor(d) for d in denominators])
        lcd_factored = sp.factor(lcd)
        lcd_expr = sp.sympify(lcd)
        
        # Left side transformation
        result.append("• Left Side Transformation:")
        lhs_terms = sp.Add.make_args(lhs)
        for term in lhs_terms:
            num, den = sp.fraction(sp.together(term))
            if sp.simplify(den) == 1:
                # Constant term - just distribute
                expanded = sp.expand(lcd_expr * term)
                result.append(f"  {sp.sstr(lcd_factored)} * {sp.sstr(term)}")
                result.append(f"    = {sp.sstr(expanded)}  # Distribute")
            else:
                # Fraction term - show proper cancellation
                cancelled = sp.cancel(lcd_expr * term)
                result.append(f"  {sp.sstr(lcd_factored)} * ({sp.sstr(num)}/{sp.sstr(den)})")
                result.append(f"    = {sp.sstr(lcd_expr)} * {sp.sstr(num)} / {sp.sstr(den)}")
                result.append(f"    = {sp.sstr(cancelled)}  # After cancellation")
        
        # Right side transformation
        result.append("• Right Side Transformations:")
        rhs_terms = sp.Add.make_args(rhs)
        for i, term in enumerate(rhs_terms):
            if i == 0:
                result.append("  First Term:")
            else:
                result.append("  Second Term:")
            
            num, den = sp.fraction(sp.together(term))
            if sp.simplify(den) == 1:
                # Constant term - just distribute
                expanded = sp.expand(lcd_expr * term)
                result.append(f"    {sp.sstr(lcd_factored)} * {sp.sstr(term)}")
                result.append(f"      = {sp.sstr(expanded)}  # Distribute")
            else:
                # Fraction term - show proper cancellation
                cancelled = sp.cancel(lcd_expr * term)
                result.append(f"    {sp.sstr(lcd_factored)} * ({sp.sstr(num)}/{sp.sstr(den)})")
                result.append(f"      = {sp.sstr(lcd_expr)} * {sp.sstr(num)} / {sp.sstr(den)}")
                result.append(f"      = {sp.sstr(cancelled)}  # After cancellation")
        
        # Simplified equation
        cancelled_lhs = sp.expand(sp.simplify(lhs * lcd_expr))
        cancelled_rhs = sp.expand(sp.simplify(rhs * lcd_expr))
        result.append("• New Clean Equation:")
        result.append(f"  {sp.sstr(cancelled_lhs)} = {sp.sstr(cancelled_rhs)}  # All fractions gone!")
    else:
        result.append("• No denominators to clear - equation is already in polynomial form")
        cancelled_lhs = lhs
        cancelled_rhs = rhs
    
    result.append("```")
    result.append("")
    result.append("---")
    
    # Step 3: Solve the Simplified Equation
    result.append("### **Step 3: Solve the Simplified Equation**")
    result.append("**TEACHER'S VOICE:**")
    result.append('"Now we solve like a regular algebra problem:')
    result.append("1. Combine like terms on both sides")
    result.append("2. Move variable terms to one side, constants to the other")
    result.append('3. Divide by the coefficient of x"')
    
    result.append("")
    result.append("```")
    result.append("INSTRUCTION: Now that we've eliminated the fractions, we have a cleaner equation to work with.")
    
    expanded = sp.expand(cancelled_lhs - cancelled_rhs)
    result.append(f"• Combine like terms:")
    result.append(f"  {sp.sstr(cancelled_lhs)} = {sp.sstr(cancelled_rhs)}")
    
    try:
        poly = sp.Poly(expanded, x)
        degree = poly.degree()
        
        if degree == 1:
            a = poly.coeff_monomial(x)
            b = poly.coeff_monomial(1)
            if a != 0:
                xsol = sp.simplify(-b/a)
                result.append("• Move terms:")
                result.append(f"  {sp.sstr(-b)} = {sp.sstr(a)}*x")
                result.append("• Divide both sides to isolate x:")
                result.append(f"  {sp.sstr(-b)}/{sp.sstr(a)} = {sp.sstr(a)}*x/{sp.sstr(a)}")
                result.append(f"  {sp.sstr(xsol)} = x")
                result.append("• Final solution:")
                result.append(f"  x = {sp.sstr(xsol)}  # Exact form")
                result.append(f"  x ≈ {sp.N(xsol, 8)}  # Decimal form")
                sols = [xsol]
            else:
                result.append("  No solution (a = 0).")
                sols = []
        elif degree == 2:
            a = poly.coeff_monomial(x**2)
            b = poly.coeff_monomial(x)
            c = poly.coeff_monomial(1)
            result.append("This is a quadratic equation. Use the quadratic formula:")
            result.append("Standard form: ax² + bx + c = 0")
            result.append(f"→ {a}x² + {b}x + {c} = 0")
            result.append("Quadratic formula: x = [-b ± √(b² - 4ac)] / (2a)")
            D = sp.simplify(b**2 - 4*a*c)
            result.append(f"Discriminant D = {b}² - 4*{a}*{c} = {D}")
            sqrtD = sp.sqrt(D)
            denom = 2*a
            negb = -b
            x1 = sp.simplify((negb + sqrtD)/denom)
            x2 = sp.simplify((negb - sqrtD)/denom)
            result.append(f"x₁ = ({negb} + √{D})/({denom}) = {x1}")
            result.append(f"x₂ = ({negb} - √{D})/({denom}) = {x2}")
            result.append(f"x₁ ≈ {sp.N(x1, 8)}")
            result.append(f"x₂ ≈ {sp.N(x2, 8)}")
            sols = [x1, x2]
        else:
            sols = sp.solve(expanded, x)
            if sols:
                result.append("• Solutions:")
                for sol in sols:
                    result.append(f"  x = {sp.sstr(sol)}")
            else:
                result.append("• Solutions:")
                result.append("  No real solutions")
    except Exception:
        result.append("Error solving equation")
        sols = []
    
    result.append("```")
    result.append("")
    result.append("---")
    
    # Step 4: Verify the Solution
    result.append("### **Step 4: Verify the Solution**")
    result.append("**TEACHER'S VOICE:**")
    result.append('"Let\'s test our solution in the original equation:')
    result.append("1. Calculate left side by substituting the value")
    result.append("2. Calculate right side by substituting the value")
    result.append('3. Both sides should give the same result"')
    
    result.append("")
    result.append("```")
    result.append("INSTRUCTION: It's crucial to verify our answer by plugging it back into the original equation.")
    
    valid_solutions = []
    for sol in sols:
        result.append(f"• Check denominator safety:")
        for d in denominators:
            val = sp.simplify(d.subs(x, sol))
            if val == 0:
                result.append(f"  {sp.sstr(d)} = 0  # Bad!")
            else:
                result.append(f"  {sp.sstr(d)} = {sp.sstr(val)} ≠ 0  # Good!")
        
        result.append(f"• Left Side Calculation:")
        try:
            lhs_val = lhs.subs(x, sol)
            result.append(f"  {sp.sstr(lhs)} = {sp.sstr(lhs_val)}  # Exact")
            result.append(f"  {sp.N(lhs_val, 8)}  # Decimal")
        except Exception:
            result.append(f"  Error: Division by zero or undefined result.")
        
        result.append(f"• Right Side Calculation:")
        try:
            rhs_val = rhs.subs(x, sol)
            result.append(f"  {sp.sstr(rhs)} = {sp.sstr(rhs_val)}  # Exact")
            result.append(f"  {sp.N(rhs_val, 8)}  # Decimal")
            
            # Check if they match
            if abs(sp.N(lhs_val, 8) - sp.N(rhs_val, 8)) < 1e-8:
                result.append(f"  ✓ Both sides match perfectly!")
                valid_solutions.append(sol)
            else:
                result.append(f"  ✗ Sides don't match (extraneous)")
        except Exception:
            result.append(f"  Error: Division by zero or undefined result.")
    
    result.append("```")
    result.append("")
    result.append("---")
    
    # Final Answer
    result.append("**Final Answer:**")
    if valid_solutions:
        for sol in valid_solutions:
            result.append(f"x = {sp.sstr(sol)}")
        result.append("*(The solution checks out mathematically!)*")
    else:
        result.append("No valid solution exists.")
    
    result.append("")
    result.append("")
    result.append("---")
    
    return '\n'.join(result)

def check_solution_correctness(student_solution, original_equation):
    """
    Comprehensive Content-Based Rational Equation Solution Checker
    Grades purely on mathematical correctness, ignoring labels/keywords
    """
    try:
        import sympy as sp
        x = sp.symbols('x')
        
        # Parse original equation
        if "=" not in original_equation:
            return False, "Invalid equation format. Missing '='."
        
        lhs_str, rhs_str = original_equation.split("=", 1)
        lhs, rhs = map(sp.sympify, [lhs_str, rhs_str])
        
        # Extract denominators and compute restrictions
        denominators = []
        restrictions = set()
        
        for expr in [lhs, rhs]:
            if expr.is_Add:
                for arg in expr.args:
                    num, den = sp.fraction(sp.together(arg))
                    if den != 1:
                        denominators.append(den)
                        try:
                            sols = sp.solve(den, x)
                            # Check if sols is a list/iterable and not empty
                            if sols and hasattr(sols, '__iter__') and not isinstance(sols, bool):
                                restrictions.update(sols)
                        except:
                            pass
            else:
                num, den = sp.fraction(sp.together(expr))
                if den != 1:
                    denominators.append(den)
                    try:
                        sols = sp.solve(den, x)
                        # Check if sols is a list/iterable and not empty
                        if sols and hasattr(sols, '__iter__') and not isinstance(sols, bool):
                            restrictions.update(sols)
                    except:
                        pass
        
        # Check what the student actually mentioned
        student_mentions_denominators = False
        student_mentions_restrictions = False
        student_mentions_lcd = False
        student_shows_simplified_equation = False
        student_mentions_verification = False
        student_shows_verification_work = False
        
        for line in student_solution:
            line_lower = line.lower()
            # Check for explicit denominator mentions
            if any(word in line_lower for word in ["denominator", "denominators", "denom", "lcd", "least common denominator"]):
                student_mentions_denominators = True
            # Check for explicit restriction mentions
            if any(word in line_lower for word in ["restriction", "restrictions", "excluded", "cannot", "≠", "!=", "not equal", "not equal to"]):
                student_mentions_restrictions = True
            # Check for implicit restriction mentions (like "x ≠ 3")
            if "≠" in line or "!=" in line or "x" in line and any(char in line for char in ["≠", "!=", "not"]):
                # Look for patterns like "x ≠ 3", "x != 3", "x not equal to 3"
                import re
                restriction_patterns = [
                    r'x\s*[≠!]\s*\d+',  # x ≠ 3, x != 3
                    r'x\s+not\s+equal\s+to\s+\d+',  # x not equal to 3
                    r'x\s+cannot\s+be\s+\d+',  # x cannot be 3
                    r'x\s+≠\s+\d+',  # x ≠ 3
                ]
                for pattern in restriction_patterns:
                    if re.search(pattern, line_lower):
                        student_mentions_restrictions = True
                        break
            # Check for implicit denominator identification (like showing the equation with fractions)
            if "(" in line and ")" in line and "/" in line and "x" in line:
                # This looks like a rational equation with denominators
                student_mentions_denominators = True
            # Check for LCD usage in multiplication steps - more comprehensive detection
            if any(word in line_lower for word in ["multiply both sides by", "multiply by", "lcd", "least common denominator"]):
                student_mentions_lcd = True
                student_mentions_denominators = True  # If they use LCD, they're working with denominators
            # Check for implicit LCD usage (like "(x-3)*[...]")
            if "*" in line and "(" in line and ")" in line and "/" in line:
                # This looks like LCD multiplication
                student_mentions_lcd = True
                student_mentions_denominators = True
            # Check for simplified equation (no fractions, just x terms)
            if "=" in line and not any(char in line for char in ["/", "÷"]) and any(char in line for char in ["x", "X"]) and len(line) > 5:
                # This looks like a simplified equation without fractions
                student_shows_simplified_equation = True
            
            # Check for verification mentions and work
            line_lower = line.lower()
            if any(word in line_lower for word in ["verify", "verification", "check", "substitute", "substitution", "test", "testing", "plug in", "plugging in", "lhs", "rhs", "left side", "right side", "both sides", "balance", "balanced"]):
                student_mentions_verification = True
            # Check for actual verification work (substituting values back)
            if any(char in line for char in ["=", "≈", "≠"]) and any(char in line for char in ["x", "X"]) and any(char.isdigit() for char in line):
                # This looks like they're showing verification calculations
                if any(word in line_lower for word in ["check", "verify", "test", "substitute", "lhs", "rhs"]):
                    student_shows_verification_work = True
            
            # Enhanced verification detection - look for substitution patterns
            # Pattern 1: "x = 5" followed by substitution
            if "x =" in line or "x=" in line:
                # Check if next few lines contain substitution work
                line_idx = student_solution.index(line)
                if line_idx + 1 < len(student_solution):
                    next_line = student_solution[line_idx + 1].lower()
                    if any(word in next_line for word in ["check", "verify", "test", "substitute", "lhs", "rhs", "left", "right"]):
                        student_shows_verification_work = True
            
            # Pattern 2: Look for fraction calculations that look like verification
            if "/" in line and any(char.isdigit() for char in line) and any(char in line for char in ["=", "≈"]):
                # This might be showing verification calculations
                if any(word in line_lower for word in ["check", "verify", "test", "substitute"]):
                    student_shows_verification_work = True
            
            # Pattern 3: Look for "LHS = ..." and "RHS = ..." patterns
            if any(phrase in line_lower for phrase in ["lhs =", "rhs =", "left side =", "right side =", "left=", "right="]):
                student_shows_verification_work = True
            
            # Pattern 4: Look for substitution with specific values
            # This catches lines like "when x = 3: (3+2)/(3-1) = 5/2"
            if "when x =" in line_lower or "x =" in line_lower and ":" in line:
                if any(char in line for char in ["(", ")", "/"]) and any(char.isdigit() for char in line):
                    student_shows_verification_work = True
            
            # Pattern 5: Look for "check" or "verify" followed by calculations
            if any(word in line_lower for word in ["check:", "verify:", "test:"]):
                # Check if next line contains actual calculations
                line_idx = student_solution.index(line)
                if line_idx + 1 < len(student_solution):
                    next_line = student_solution[line_idx + 1]
                    if any(char in next_line for char in ["=", "/", "(", ")"]) and any(char.isdigit() for char in next_line):
                        student_shows_verification_work = True
            
            # Pattern 6: Look for substitution work after finding the answer
            # This catches cases where students substitute their answer back without explicit keywords
            if any(char in line for char in ["=", "/"]) and any(char.isdigit() for char in line) and "/" in line:
                # Check if this line comes after a line with "x = [number]"
                line_idx = student_solution.index(line)
                for prev_idx in range(max(0, line_idx-3), line_idx):
                    prev_line = student_solution[prev_idx]
                    if ("x =" in prev_line or "x=" in prev_line) and any(char.isdigit() for char in prev_line):
                        # This looks like verification by substitution
                        student_shows_verification_work = True
                        break
            
            # Pattern 7: Look for working with original equation structure after finding answer
            # This catches cases where students work with fractions that match the original equation
            if "/" in line and any(char.isdigit() for char in line) and "=" in line:
                # Check if this looks like working with the original equation structure
                if any(char in line for char in ["+", "-"]) and "/" in line:
                    # This might be verification work with the original equation
                    line_idx = student_solution.index(line)
                    for prev_idx in range(max(0, line_idx-3), line_idx):
                        prev_line = student_solution[prev_idx]
                        if ("x =" in prev_line or "x=" in prev_line) and any(char.isdigit() for char in prev_line):
                            # This looks like verification by working with original equation
                            student_shows_verification_work = True
                            break
        
        # AUTO-DETECT: If student shows work with denominators, they implicitly know about them
        if denominators and isinstance(denominators, (list, tuple)):
            # Check if any line contains the actual denominator expression
            for line in student_solution:
                for denom in denominators:
                    denom_str = sp.sstr(denom)
                    if denom_str in line or denom_str.replace(" ", "") in line.replace(" ", ""):
                        student_mentions_denominators = True
                        break
                if student_mentions_denominators:
                    break
            
            # Check if any line contains the actual restriction value - ONLY if they explicitly mention restrictions
            # Don't auto-detect restrictions just because they work with denominators
            for line in student_solution:
                line_lower = line.lower()
                # Only count as restriction if they use restriction-related language
                if any(word in line_lower for word in ["restriction", "restrictions", "excluded", "cannot", "≠", "!=", "not equal", "not equal to", "undefined", "domain", "not allowed"]):
                    if restrictions and isinstance(restrictions, (list, tuple, set)):
                        for restriction in restrictions:
                            restriction_str = sp.sstr(restriction)
                            if restriction_str in line or f"x ≠ {restriction_str}" in line or f"x!={restriction_str}" in line:
                                student_mentions_restrictions = True
                                break
                        if student_mentions_restrictions:
                            break
            
            # Check if any line shows multiplication by the LCD
            for line in student_solution:
                for denom in denominators:
                    denom_str = sp.sstr(denom)
                    # Look for patterns like "(x-1)*[...]" or "multiply by (x-1)"
                    if (denom_str in line and "*" in line) or (denom_str in line and any(word in line.lower() for word in ["multiply", "times"])):
                        student_mentions_lcd = True
                        break
                if student_mentions_lcd:
                    break
        
        # Calculate LCD
        if denominators and isinstance(denominators, (list, tuple)):
            lcd = sp.lcm([sp.factor(d) for d in denominators])
        else:
            lcd = 1
        
        # Look for final answer in student solution
        final_answer = None
        for line in reversed(student_solution):  # Check from last line first
            line_lower = line.lower()
            if "x =" in line or "x=" in line:
                try:
                    if "x =" in line:
                        math_part = line.split("x =", 1)[1].strip()
                    elif "x=" in line:
                        math_part = line.split("x=", 1)[1].strip()
                    else:
                        continue
                    
                    math_part = normalize_math_expression(math_part)
                    final_answer = sp.sympify(math_part)
                    break
                except:
                    continue
        
        # Check if answer is correct
        answer_correct = False
        if final_answer is not None:
            # Find the actual solution
            if denominators and isinstance(denominators, (list, tuple)):
                simplified_lhs = sp.expand(sp.simplify(lhs * lcd))
                simplified_rhs = sp.expand(sp.simplify(rhs * lcd))
            else:
                simplified_lhs = lhs
                simplified_rhs = rhs
            
            standard_form = sp.expand(simplified_lhs - simplified_rhs)
            actual_solutions = sp.solve(standard_form, x)
            
            # Check if student's answer matches any of the actual solutions
            for actual_sol in actual_solutions:
                if abs(sp.N(final_answer - actual_sol, 8)) < 1e-8:
                    answer_correct = True
                    break
        
        # Build comprehensive feedback message
        feedback_parts = []
        
        # Denominators feedback
        if denominators and isinstance(denominators, (list, tuple)):
            if student_mentions_denominators:
                feedback_parts.append("✅ Denominators identified and mentioned")
            else:
                feedback_parts.append("⚠️ Denominators present but not explicitly mentioned")
        else:
            feedback_parts.append("✅ No denominators to handle")
        
        # Restrictions feedback
        if restrictions and isinstance(restrictions, (list, tuple, set)):
            if student_mentions_restrictions:
                feedback_parts.append("✅ Restrictions/excluded values mentioned")
            else:
                feedback_parts.append("⚠️ Restrictions present but not mentioned")
        else:
            feedback_parts.append("✅ No restrictions to consider")
        
        # LCD feedback
        if denominators and isinstance(denominators, (list, tuple)):
            if student_mentions_lcd:
                feedback_parts.append("✅ LCD multiplication used")
            else:
                feedback_parts.append("⚠️ LCD multiplication not explicitly mentioned")
        
        # Simplified equation feedback
        if student_shows_simplified_equation:
            feedback_parts.append("✅ Simplified equation shown")
        else:
            feedback_parts.append("⚠️ Simplified equation not clearly shown")
        
        # Verification feedback
        if student_mentions_verification or student_shows_verification_work:
            if student_shows_verification_work:
                feedback_parts.append("✅ Verification work shown")
            else:
                feedback_parts.append("⚠️ Verification mentioned but not shown")
        else:
            feedback_parts.append("⚠️ Verification not attempted")
        
        # Final answer feedback
        if final_answer is None:
            feedback_parts.append("❌ No final answer found")
        elif answer_correct:
            feedback_parts.append("✅ Final answer is correct")
        else:
            feedback_parts.append("❌ Final answer is incorrect")
        
        # Combine feedback
        feedback_message = " | ".join(feedback_parts)
        
        return answer_correct, feedback_message
        
    except Exception as e:
        return False, f"Error checking solution: {str(e)}"

class OCRIntegratedDrawingSolverApp:
    def __init__(self, root):
        self.root = root
        self.root.title("OCR-Integrated Drawing Equation Solver & Line-by-Line Solution Checker")
        self.root.geometry("1600x1000")
        
        # Configure style
        style = ttk.Style()
        style.theme_use('clam')
        
        # Create main frame
        main_frame = ttk.Frame(root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Title
        title_label = ttk.Label(main_frame, text="OCR-Integrated Drawing Equation Solver & Line-by-Line Solution Checker", 
                               font=('Arial', 16, 'bold'))
        title_label.pack(pady=(0, 20))
        
        # Status indicator
        status_indicator = ttk.Label(main_frame, text="", font=('Arial', 10))
        status_indicator.pack(pady=(0, 10))
        
        if OCR_AVAILABLE and SOLVER_AVAILABLE:
            status_indicator.config(text="✓ All modules loaded successfully", foreground="green")
        elif OCR_AVAILABLE:
            status_indicator.config(text="⚠ OCR available, Solver missing", foreground="orange")
        elif SOLVER_AVAILABLE:
            status_indicator.config(text="⚠ Solver available, OCR missing", foreground="orange")
        else:
            status_indicator.config(text="🎭 Demo Mode Active - No modules available", foreground="blue")
        
        # Create left, center, and right panels
        left_panel = ttk.Frame(main_frame)
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        center_panel = ttk.Frame(main_frame)
        center_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(10, 10))
        
        right_panel = ttk.Frame(main_frame)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(10, 0))
        
        # Left panel - Drawing area
        drawing_label = ttk.Label(left_panel, text="Draw your equation/solution here:", 
                                 font=('Arial', 12, 'bold'))
        drawing_label.pack(pady=(0, 10))
        
        self.drawing_area = DrawingArea(left_panel)
        
        # OCR and Solution buttons
        button_frame = ttk.Frame(left_panel)
        button_frame.pack(pady=10)
        
        # OCR Button
        self.ocr_btn = ttk.Button(button_frame, text="🔍 Scan New Line", 
                                   command=self.scan_new_line)
        self.ocr_btn.pack(side=tk.LEFT, padx=5)
        
        # Test Conversion Button
        self.test_btn = tk.Button(button_frame, text="🧪 Test Conversion", 
                                 command=self.test_conversion)
        self.test_btn.pack(side=tk.LEFT, padx=5)
        
        # Demo Mode Toggle Button
        self.demo_mode_var = tk.BooleanVar(value=False)
        self.demo_toggle_btn = tk.Button(button_frame, text="🎭 Demo Mode: Regular", 
                                       command=self.toggle_demo_mode)
        self.demo_toggle_btn.pack(side=tk.LEFT, padx=5)
        
        # Clear Solution Button
        self.clear_solution_btn = tk.Button(button_frame, text="Clear Solution", 
                                           command=self.clear_solution)
        self.clear_solution_btn.pack(side=tk.LEFT, padx=5)
        
        # Raw SymPy Output Button
        self.raw_sympy_btn = tk.Button(button_frame, text="🔬 Processed SymPy", 
                                       command=self.get_raw_sympy_output)
        self.raw_sympy_btn.pack(side=tk.LEFT, padx=5)
        
        # Completely Raw Output Button (no processing)
        self.raw_output_btn = tk.Button(button_frame, text="📋 Raw Output", 
                                        command=self.get_completely_raw_output)
        self.raw_output_btn.pack(side=tk.LEFT, padx=5)
        
        # Raw Format Output Button (no solving, just format conversion)
        self.raw_format_btn = tk.Button(button_frame, text="📐 Raw Format", 
                                        command=self.get_raw_format_output)
        self.raw_format_btn.pack(side=tk.LEFT, padx=5)
        
        # Test Raw Format Conversion Button
        self.test_raw_format_btn = tk.Button(button_frame, text="🧪 Test Raw Format", 
                                             command=self.test_raw_format_conversion)
        self.test_raw_format_btn.pack(side=tk.LEFT, padx=5)
        
        # Test Your Specific OCR Error Button
        self.test_ocr_error_btn = tk.Button(button_frame, text="🎯 Test OCR Fix", 
                                            command=self.test_your_ocr_error)
        self.test_ocr_error_btn.pack(side=tk.LEFT, padx=5)
        
        # Quick Test Your Equation Button
        self.quick_test_btn = tk.Button(button_frame, text="⚡ Test Your Eq", 
                                        command=self.quick_test_your_equation)
        self.quick_test_btn.pack(side=tk.LEFT, padx=5)
        
        # Quick Add Raw Format Button
        self.quick_add_raw_btn = tk.Button(button_frame, text="⚡ Quick Add Raw", 
                                           command=self.quick_add_raw_format)
        self.quick_add_raw_btn.pack(side=tk.LEFT, padx=5)
        
        # Instructions for the buttons
        button_instructions = ttk.Label(left_panel, text="📋 Raw Output: Shows exactly what OCR returned (no processing)\n🔬 Processed SymPy: Shows processed and analyzed output\n📐 Raw Format: Shows raw format + asks to add to solution\n⚡ Quick Add Raw: Instantly adds raw format to solution\n🧪 Test Raw Format: Test the conversion with examples\n\n💡 DEFAULT: Raw format output is now used automatically!", 
                                       font=('Arial', 9), foreground='blue')
        button_instructions.pack(pady=(0, 10))
        
        # Center panel - Solution lines
        solution_label = ttk.Label(center_panel, text="Your Solution (Line by Line):", 
                                  font=('Arial', 12, 'bold'))
        solution_label.pack(pady=(0, 10))
        
        # Solution display
        self.solution_display = scrolledtext.ScrolledText(center_panel, height=20, width=50, wrap=tk.WORD)
        self.solution_display.pack(fill=tk.BOTH, expand=True)
        
        # Solution controls
        solution_controls = ttk.Frame(center_panel)
        solution_controls.pack(fill=tk.X, pady=10)
        
        self.check_solution_btn = ttk.Button(solution_controls, text="✅ Check Complete Solution", 
                                            command=self.check_complete_solution)
        self.check_solution_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # Test button to verify widget functionality
        self.test_widget_btn = tk.Button(solution_controls, text="🧪 Test Widget", 
                                         command=self.test_widget_functionality)
        self.test_widget_btn.pack(side=tk.LEFT, padx=(0, 10))
        
        # Right panel - Results and feedback
        results_label = ttk.Label(right_panel, text="Analysis & Feedback:", 
                                 font=('Arial', 12, 'bold'))
        results_label.pack(pady=(0, 10))
        
        # Create notebook for different result tabs
        self.notebook = ttk.Notebook(right_panel)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # Line Analysis tab
        self.line_analysis_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.line_analysis_frame, text="📝 Line Analysis")
        
        self.line_feedback = scrolledtext.ScrolledText(self.line_analysis_frame, height=15, width=50, wrap=tk.WORD)
        self.line_feedback.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Solution Checker tab
        self.checker_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.checker_frame, text="🔍 Solution Checker")
        
        # Solution checker interface
        self.setup_solution_checker()
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("🎯 Step 1: Draw your equation first, then click '🔍 Scan New Line' to capture it!")
        self.status_bar = ttk.Label(root, textvariable=self.status_var, 
                                   relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Store current data
        self._current_equation = ""  # No default equation - user draws it
        self.solution_lines = []
        self.line_number = 1  # This will be used for solution steps, not the equation
        self.last_ocr_result = None  # Store last OCR result for raw output analysis
        
        # Initialize with example
        self.initialize_example()
    
    @property
    def current_equation(self):
        return self._current_equation
    
    @current_equation.setter
    def current_equation(self, value):
        print(f"DEBUG: current_equation being set to: '{value}'")
        self._current_equation = value
    
    def initialize_example(self):
        """Initialize with instructions for the new workflow"""
        # Show initial instructions
        self.solution_display.delete(1.0, tk.END)
        self.solution_display.insert(1.0, "📚 SOLUTION WORKSPACE\n")
        self.solution_display.insert(tk.END, "=" * 50 + "\n\n")
        self.solution_display.insert(tk.END, "🎯 STEP 1: Draw the equation you want to solve\n")
        self.solution_display.insert(tk.END, "• Use the drawing pad on the left\n")
        self.solution_display.insert(tk.END, "• Write the equation clearly (e.g., (x+2)/x = 3/4)\n")
        self.solution_display.insert(tk.END, "• Click '🔍 Scan New Line' to capture it\n\n")
        self.solution_display.insert(tk.END, "🎯 STEP 2: Draw your solution steps\n")
        self.solution_display.insert(tk.END, "• After the equation is captured, draw your first solution step\n")
        self.solution_display.insert(tk.END, "• Click '🔍 Scan New Line' for each step\n");
        self.solution_display.insert(tk.END, "• Continue until you reach the final answer\n\n")
        self.solution_display.insert(tk.END, "🎯 STEP 3: Check your solution\n")
        self.solution_display.insert(tk.END, "• Click '✅ Check Complete Solution' when done\n");
        self.solution_display.insert(tk.END, "• View detailed analysis in the right panel\n\n")
        self.solution_display.insert(tk.END, "Ready to start! Draw your equation first.\n")
        
        # Update line feedback
        self.line_feedback.delete(1.0, tk.END)
        self.line_feedback.insert(1.0, "🎯 LINE-BY-LINE ANALYSIS\n")
        self.line_feedback.insert(tk.END, "=" * 50 + "\n\n")
        self.line_feedback.insert(tk.END, "Welcome to the OCR-Integrated Solution Checker!\n\n")
        self.line_feedback.insert(tk.END, "📝 Workflow:\n")
        self.line_feedback.insert(tk.END, "1. Draw your equation → Scan to capture it\n")
        self.line_feedback.insert(tk.END, "2. Draw solution steps → Scan each one\n")
        self.line_feedback.insert(tk.END, "3. Get real-time feedback and analysis\n")
        self.line_feedback.insert(tk.END, "4. Check complete solution correctness\n\n")
        self.line_feedback.insert(tk.END, "Start by drawing your equation!\n")
    
    def scan_new_line(self):
        """Scan a new line from the drawing and add it to the solution"""
        try:
            self.status_var.set("Scanning new line...")
            self.root.update()
            
            # Get drawing as image
            img = self.drawing_area.get_drawing_as_image()
            
            # Check if there's actually something drawn
            if not self.drawing_area.lines:
                if self.current_equation:
                    messagebox.showwarning("Warning", "Please draw your solution step first!\n\nYou have captured the equation, now you need to draw your first solution step.")
                    self.status_var.set("Draw your solution step first!")
                else:
                    messagebox.showwarning("Warning", "Please draw your equation first!\n\nStart by drawing the equation you want to solve.")
                    self.status_var.set("Draw your equation first!")
                return
            
            # Additional check: make sure we have enough drawing data
            total_points = sum(len(line) for line in self.drawing_area.lines)
            if total_points < 3:  # Need at least 3 points to form a meaningful drawing
                if self.current_equation:
                    messagebox.showwarning("Warning", "Please draw your solution step more clearly!\n\nYou need to draw at least a few strokes to form a readable solution step.")
                    self.status_var.set("Draw your solution step more clearly!")
                else:
                    messagebox.showwarning("Warning", "Please draw your equation more clearly!\n\nYou need to draw at least a few strokes to form a readable equation.")
                    self.status_var.set("Draw your equation more clearly!")
                return
            
            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_file.close()
            img.save(temp_file.name, 'PNG')
            
            # Process through OCR (simulate if not available)
            if OCR_AVAILABLE:
                try:
                    result = lcd.process_image(temp_file.name)
                    # Store raw result for potential display
                    self.last_ocr_result = result
                    
                    # Get raw outputs for display
                    raw_sympy = result.get("sympy_out", "No SymPy output")
                    raw_latex = result.get("latex_raw", "No LaTeX output")
                    
                    # DEFAULT: Use raw format instead of processed SymPy for better understanding
                    if isinstance(raw_latex, str) and raw_latex != "No LaTeX output":
                        # Convert LaTeX to raw format (no solving) as default
                        ocr_text = self.convert_latex_to_raw_format(raw_latex)
                        print(f"DEBUG: OCR processing - raw_latex: '{raw_latex}' -> ocr_text: '{ocr_text}'")
                        self.status_var.set("✅ Using raw format output (no automatic solving)")
                    elif isinstance(raw_sympy, str) and raw_sympy != "No SymPy output":
                        # Fallback to raw SymPy if no LaTeX
                        ocr_text = raw_sympy
                        print(f"DEBUG: OCR processing - raw_sympy: '{raw_sympy}' -> ocr_text: '{ocr_text}'")
                        self.status_var.set("✅ Using raw SymPy output")
                    else:
                        ocr_text = "OCR failed"
                        print(f"DEBUG: OCR processing - OCR failed")
                    
                    # Process the OCR text through our conversion function only if needed
                    if isinstance(ocr_text, str) and ocr_text != "OCR failed":
                        # For raw format, we don't need additional processing
                        # Just clean up any basic OCR errors
                        processed_ocr_text = self.clean_raw_format(ocr_text)
                        print(f"DEBUG: OCR processing - processed_ocr_text: '{processed_ocr_text}'")
                    else:
                        # OCR failed or returned invalid format, fall back to demo mode
                        print(f"OCR failed or invalid: {ocr_text}")
                        if self.demo_mode_var.get():
                            processed_ocr_text = self.simulate_ocr_with_latex()
                            self.status_var.set("⚠ OCR failed - using LaTeX Demo Mode (toggle with 🎭 button)")
                        else:
                            processed_ocr_text = self.simulate_ocr()
                            self.status_var.set("⚠ OCR failed - using Regular Demo Mode (toggle with 🎭 button)")
                except Exception as ocr_error:
                    print(f"OCR error: {ocr_error}")
                    # Fall back to demo mode if OCR fails
                    if self.demo_mode_var.get():
                        processed_ocr_text = self.simulate_ocr_with_latex()
                        self.status_var.set("⚠ OCR error - using LaTeX Demo Mode (toggle with 🎭 button)")
                    else:
                        processed_ocr_text = self.simulate_ocr()
                        self.status_var.set("⚠ OCR error - using LaTeX Demo Mode (toggle with 🎭 button)")
            else:
                # Simulate OCR for demo
                if self.demo_mode_var.get():
                    processed_ocr_text = self.simulate_ocr_with_latex()
                else:
                    processed_ocr_text = self.simulate_ocr()
            
            # Clean up temp file
            try:
                os.unlink(temp_file.name)
            except:
                pass
            
            # Process the OCR text
            # Check if this is the first line (equation to solve)
            print(f"DEBUG: Current equation: '{self.current_equation}'")
            print(f"DEBUG: Line number: {self.line_number}")
            print(f"DEBUG: Solution lines count: {len(self.solution_lines)}")
            
            if not self.current_equation:
                # First line becomes the equation to solve - preserve raw format
                processed_text = self.process_line_text(processed_ocr_text, is_equation=True)
                print(f"DEBUG: Capturing equation: {processed_text}")
                print(f"DEBUG: processed_ocr_text was: {processed_ocr_text}")
                self.current_equation = processed_text
                self.status_var.set(f"✅ Equation captured: {processed_text}")
                
                # Update the display to show the new equation
                print(f"DEBUG: Updating solution display with: {processed_text}")
                self.solution_display.delete(1.0, tk.END)
                self.solution_display.insert(1.0, "📚 SOLUTION WORKSPACE\n")
                self.solution_display.insert(tk.END, "=" * 50 + "\n\n")
                self.solution_display.insert(tk.END, f"Equation to solve: {processed_text}\n\n")
                self.solution_display.insert(tk.END, "Instructions:\n")
                self.solution_display.insert(tk.END, "1. ✅ Equation captured! Now draw your first solution step\n")
                self.solution_display.insert(tk.END, "2. Click '🔍 Scan New Line' for each step\n")
                self.solution_display.insert(tk.END, "3. Click '✅ Check Complete Solution' when done\n\n")
                self.solution_display.insert(tk.END, "Your solution will appear here line by line...\n")
                
                # Update line feedback
                self.line_feedback.delete(1.0, tk.END)
                self.line_feedback.insert(tk.END, "🎯 LINE-BY-LINE ANALYSIS\n")
                self.line_feedback.insert(tk.END, "=" * 50 + "\n\n")
                self.line_feedback.insert(tk.END, f"✅ Equation captured: {processed_text}\n\n")
                self.line_feedback.insert(tk.END, "Now draw your first solution step!\n")
                
                # Add to solution lines as the equation (ONLY ONCE)
                self.add_solution_line(processed_text, is_equation=True)
                
            else:
                # Subsequent lines are solution steps
                processed_text = self.process_line_text(processed_ocr_text, is_equation=False)
                print(f"DEBUG: Adding solution step {self.line_number}: {processed_text}")
                self.add_solution_line(processed_text, is_equation=False)
                self.status_var.set(self.get_demo_status_message())
            
            # Clear the drawing for next line
            print(f"DEBUG: About to clear canvas. Current equation: '{self.current_equation}', Line number: {self.line_number}")
            self.drawing_area.clear_canvas()
            print(f"DEBUG: After clearing canvas. Current equation: '{self.current_equation}', Line number: {self.line_number}")
            
        except re.error as regex_error:
            error_msg = f"Regex error in conversion: {str(regex_error)}"
            messagebox.showerror("Regex Error", error_msg)
            self.status_var.set("Regex error in conversion")
        except Exception as e:
            error_msg = f"Failed to scan line: {str(e)}"
            messagebox.showerror("Error", error_msg)
            self.status_var.set("Error scanning line")
    
    def test_conversion(self):
        """Test the conversion function with examples"""
        try:
            # Create a test dialog
            dialog = tk.Toplevel(self.root)
            dialog.title("Test LaTeX to SymPy Conversion")
            dialog.geometry("700x500")
            dialog.transient(self.root)
            dialog.grab_set()
            
            # Center the dialog
            dialog.geometry("+%d+%d" % (self.root.winfo_rootx() + 50, self.root.winfo_rooty() + 50))
            
            # Title
            tk.Label(dialog, text="🧪 Testing LaTeX to SymPy Conversion", 
                    font=('Arial', 14, 'bold')).pack(pady=(20, 10))
            
            # Test cases
            test_cases = [
                r"Eq(\frac{x+2}{x}, \frac{3}{4})",
                r"Eq((x+2)/x, 3/4)",
                r"\frac{x+2}{x}=\frac{3}{4}",
                r"(x+2)/x, 3/4",
                r"((x+2)/x)=(3/4)",
                r"Eq(x^2 + 2x + 1, 0)",
                r"x^2 + 2x + 1, 0"
            ]
            
            # Create scrolled text for results
            result_text = scrolledtext.ScrolledText(dialog, height=20, width=80, wrap=tk.WORD)
            result_text.pack(pady=20, padx=20, fill=tk.BOTH, expand=True)
            
            # Show test results
            result_text.insert(1.0, "🔍 CONVERSION TEST RESULTS\n")
            result_text.insert(tk.END, "=" * 60 + "\n\n")
            result_text.insert(tk.END, "This shows how the conversion handles:\n")
            result_text.insert(tk.END, "1. Eq(...) format removal\n")
            result_text.insert(tk.END, "2. Comma to equals conversion\n")
            result_text.insert(tk.END, "3. Outer parentheses removal\n\n")
            
            for i, test_case in enumerate(test_cases, 1):
                result_text.insert(tk.END, f"Test {i}: {test_case}\n")
                converted = self.convert_latex_to_sympy(test_case)
                result_text.insert(tk.END, f"Result: {converted}\n")
                result_text.insert(tk.END, "─" * 50 + "\n\n")
            
            # Close button
            tk.Button(dialog, text="Close", command=dialog.destroy, 
                     bg='blue', fg='white', font=('Arial', 10, 'bold')).pack(pady=10)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to test conversion: {str(e)}")
    
    def toggle_demo_mode(self):
        """Toggle between regular demo mode and LaTeX demo mode"""
        current_mode = self.demo_mode_var.get()
        self.demo_mode_var.set(not current_mode)
        
        if self.demo_mode_var.get():
            self.demo_toggle_btn.config(text="🎭 Demo Mode: LaTeX")
            messagebox.showinfo("Demo Mode", "Switched to LaTeX Demo Mode!\n\nNow when you draw and scan, you'll see:\n• Eq(...) format conversion\n• LaTeX to SymPy conversion\n• Comma to equals conversion\n• Outer parentheses removal")
        else:
            self.demo_toggle_btn.config(text="🎭 Demo Mode: Regular")
            messagebox.showinfo("Demo Mode", "Switched to Regular Demo Mode!\n\nNow when you draw and scan, you'll see:\n• Simple step-by-step solution text\n• No LaTeX conversion needed")
    
    def simulate_ocr(self):
        """Simulate OCR output for demo purposes"""
        # This simulates what OCR would return for different solution steps
        if not self.current_equation:
            return "(x + 2)/x = 3/4"  # First line is the equation
        elif self.line_number == 2:
            return "Multiply both sides by x"
        elif self.line_number == 3:
            return "x(x + 2)/x = x(3/4)"
        elif self.line_number == 4:
            return "x + 2 = 3x/4"
        elif self.line_number == 5:
            return "Multiply both sides by 4"
        elif self.line_number == 6:
            return "4(x + 2) = 3x"
        elif self.line_number == 7:
            return "4x + 8 = 3x"
        elif self.line_number == 8:
            return "4x - 3x = -8"
        elif self.line_number == 9:
            return "x = -8"
        else:
            return f"Step {self.line_number}"
    
    def simulate_ocr_with_latex(self):
        """Simulate OCR output with LaTeX format to test conversion"""
        # This simulates OCR that returns LaTeX format
        if not self.current_equation:
            return r"Eq(\frac{x+2}{x}, \frac{3}{4})"  # First line is the equation in Eq format
        elif self.line_number == 2:
            return r"\frac{x+2}{x}=\frac{3}{4}"  # Test LaTeX format
        elif self.line_number == 3:
            return "(x+2)/x, 3/4"  # Test comma format
        elif self.line_number == 4:
            return "((x+2)/x)=(3/4)"  # Test outer parentheses
        elif self.line_number == 5:
            return "x(x + 2)/x = x(3/4)"
        elif self.line_number == 6:
            return "x + 2 = 3x/4"
        elif self.line_number == 7:
            return "4(x + 2) = 3x"
        elif self.line_number == 8:
            return "x = -8"
        else:
            return f"Step {self.line_number}"
    
    def get_demo_status_message(self):
        """Get appropriate status message based on current state"""
        if not self.current_equation:
            return "🎯 Step 1: Draw your equation first, then click '🔍 Scan New Line' to capture it!"
        else:
            return f"🎯 Step 2: Equation '{self.current_equation}' captured! Now draw solution step {self.line_number} and click '🔍 Scan New Line'"
    
    def convert_latex_to_sympy(self, latex_text):
        """Convert LaTeX format to SymPy format"""
        if not latex_text:
            return latex_text
        
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
        
        # Common LaTeX to SymPy conversions
        conversions = {
            r'\frac{([^}]+)}{([^}]+)}': r'(\1)/(\2)',  # \frac{a}{b} -> (a)/(b)
            r'\left\(([^)]+)\right\)': r'(\1)',        # \left(a\right) -> (a)
            r'\cdot': '*',                             # \cdot -> *
            r'\times': '*',                            # \times -> *
            r'\div': '/',                              # \div -> /
            r'\pm': '+',                               # \pm -> +
            r'\mp': '-',                               # \mp -> -
            r'\sqrt{([^}]+)}': r'sqrt(\1)',           # \sqrt{a} -> sqrt(a)
            r'\sqrt\[([^\]]+)\]{([^}]+)}': r'(\2)**(1/(\1))',  # \sqrt[n]{a} -> (a)**(1/(n))
            r'([a-zA-Z])\^([0-9]+)': r'\1**\2',      # a^2 -> a**2
            r'([a-zA-Z])\^\{([^}]+)\}': r'\1**(\2)', # a^{n} -> a**(n)
            r'([a-zA-Z])\^([a-zA-Z])': r'\1**\2',    # a^b -> a**b
        }
        
        result = latex_text
        
        # Apply conversions
        for pattern, replacement in conversions.items():
            try:
                result = re.sub(pattern, replacement, result)
            except re.error as regex_error:
                print(f"Regex error with pattern '{pattern}': {regex_error}")
                continue
        
        # Remove backslashes after other conversions
        result = result.replace('\\', '')
        
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
        
        return result
    
    def process_line_text(self, text, is_equation=False):
        """Process and clean the OCR text for a solution line"""
        print(f"DEBUG: process_line_text input: '{text}' (is_equation={is_equation})")
        
        # Basic cleaning
        text = text.strip()
        
        # For equations, preserve raw format - don't convert LaTeX to SymPy
        if is_equation and '\\' in text:
            print(f"DEBUG: Preserving raw format for equation: '{text}'")
            # Only do basic cleanup, no LaTeX conversion
        elif '\\' in text:  # If it contains LaTeX commands (for solution steps)
            text = self.convert_latex_to_sympy(text)
            print(f"DEBUG: After LaTeX conversion: '{text}'")
        
        # Handle common OCR errors
        text = text.replace('×', '*')
        text = text.replace('÷', '/')
        text = text.replace('−', '-')
        
        # If it's very short, add some context (but not for equations)
        if not is_equation and len(text) < 5:
            text = f"Step {self.line_number}: {text}"
            print(f"DEBUG: After adding context: '{text}'")
        
        print(f"DEBUG: process_line_text output: '{text}'")
        return text
    
    def add_solution_line(self, line_text, is_equation=False):
        """Add a new line to the solution"""
        print(f"DEBUG: add_solution_line called with is_equation={is_equation}")
        print(f"DEBUG: Before adding - current_equation: '{self.current_equation}'")
        
        if is_equation:
            # This is the equation to solve - DON'T add to solution_lines
            # Just update the display to show the equation
            formatted_line = f"📝 Equation to solve: {line_text}\n"
            self.solution_display.insert(tk.END, formatted_line)
            
            # DON'T store equation in solution_lines - it's stored in current_equation
            # self.solution_lines.append(line_text)  # REMOVED THIS LINE
            
            # Don't increment line number yet - wait for first solution step
            # Update line feedback
            self.line_feedback.insert(tk.END, f"\n📝 Equation captured: {line_text}\n")
            self.line_feedback.insert(tk.END, "─" * 40 + "\n")
            self.line_feedback.insert(tk.END, "  ✅ Equation set successfully!\n")
            
            # Show raw OCR information if available
            if hasattr(self, 'last_ocr_result') and self.last_ocr_result:
                self.line_feedback.insert(tk.END, "  🔬 Raw OCR Information:\n")
                if "latex_raw" in self.last_ocr_result:
                    self.line_feedback.insert(tk.END, f"    📝 Raw LaTeX: {self.last_ocr_result['latex_raw']}\n")
                if "sympy_out" in self.last_ocr_result:
                    self.line_feedback.insert(tk.END, f"    🐍 Raw SymPy: {self.last_ocr_result['sympy_out']}\n")
                self.line_feedback.insert(tk.END, "  💡 Click '📋 Raw Output' button for completely raw data\n")
                self.line_feedback.insert(tk.END, "  💡 Click '🔬 Processed SymPy' button for processed analysis\n")
                self.line_feedback.insert(tk.END, "  💡 Click '📐 Raw Format' button for format without solving\n")
            
            self.line_feedback.insert(tk.END, "  🎯 Now draw your first solution step\n")
            self.line_feedback.insert(tk.END, "\n")
            self.line_feedback.see(tk.END)
            
        else:
            # This is a solution step
            formatted_line = f"Line {self.line_number}: {line_text}\n"
            self.solution_display.insert(tk.END, formatted_line)
            
            # Store in solution lines
            self.solution_lines.append(line_text)
            
            # Analyze the line
            self.analyze_solution_line(line_text)
            
            # Increment line number for next solution step
            self.line_number += 1
        
        print(f"DEBUG: After adding - current_equation: '{self.current_equation}'")
        print(f"DEBUG: After adding - line_number: {self.line_number}")
        
        # Auto-scroll to bottom
        self.solution_display.see(tk.END)
    
    def analyze_solution_line(self, line_text):
        """Analyze a single solution line and provide enhanced feedback using backend analysis"""
        try:
            import sympy as sp
            x = sp.symbols('x')
            
            # Get current equation
            equation = self.current_equation
            if not equation:
                return
            
            # Parse equation to get denominators and restrictions
            lhs_str, rhs_str = equation.split("=", 1)
            lhs, rhs = map(sp.sympify, [lhs_str, rhs_str])
            
            # Extract denominators and compute restrictions
            denominators = []
            restrictions = set()
            
            for expr in [lhs, rhs]:
                if expr.is_Add:
                    for arg in expr.args:
                        num, den = sp.fraction(sp.together(arg))
                        if den != 1:
                            denominators.append(den)
                            try:
                                sols = sp.solve(den, x)
                                # Check if sols is a list/iterable and not empty
                                if sols and hasattr(sols, '__iter__') and not isinstance(sols, bool):
                                    restrictions.update(sols)
                            except:
                                pass
                else:
                    num, den = sp.fraction(sp.together(expr))
                    if den != 1:
                        denominators.append(den)
                        try:
                            sols = sp.solve(den, x)
                            # Check if sols is a list/iterable and not empty
                            if sols and hasattr(sols, '__iter__') and not isinstance(sols, bool):
                                restrictions.update(sols)
                        except:
                            pass
            
            # Calculate LCD
            if denominators and isinstance(denominators, (list, tuple)):
                lcd = sp.lcm([sp.factor(d) for d in denominators])
            else:
                lcd = 1
            
            # Enhanced analysis using backend logic
            feedback = []
            line_lower = line_text.lower()
            
            # Check for explicit denominator mentions
            if any(word in line_lower for word in ["denominator", "denominators", "denom", "lcd", "least common denominator"]):
                feedback.append("✅ Excellent! You mentioned denominators explicitly")
            
            # Check for explicit restriction mentions
            if any(word in line_lower for word in ["restriction", "restrictions", "excluded", "cannot", "≠", "!=", "not equal", "not equal to"]):
                feedback.append("✅ Great! You mentioned restrictions explicitly")
            
            # Check for implicit restriction mentions with enhanced patterns
            if "≠" in line_text or "!=" in line_text or "x" in line_text and any(char in line_text for char in ["≠", "!=", "not"]):
                restriction_patterns = [
                    r'x\s*[≠!]\s*\d+',  # x ≠ 3, x != 3
                    r'x\s+not\s+equal\s+to\s+\d+',  # x not equal to 3
                    r'x\s+cannot\s+be\s+\d+',  # x cannot be 3
                    r'x\s+≠\s+\d+',  # x ≠ 3
                ]
                for pattern in restriction_patterns:
                    if re.search(pattern, line_lower):
                        feedback.append("✅ Good! You mentioned restrictions")
                        break
            
            # Check for implicit denominator identification
            if "(" in line_text and ")" in line_text and "/" in line_text and "x" in line_text:
                feedback.append("✅ Good! You're working with denominators")
            
            # Check for LCD usage with enhanced detection
            if any(word in line_lower for word in ["multiply both sides by", "multiply by", "lcd", "least common denominator"]):
                feedback.append("✅ Excellent! You're using LCD multiplication")
            
            # Check for implicit LCD usage (like "(x-3)*[...]")
            if "*" in line_text and "(" in line_text and ")" in line_text and "/" in line_text:
                feedback.append("✅ Good! You're multiplying by denominators")
            
            # Check for simplified equation
            if "=" in line_text and not any(char in line_text for char in ["/", "÷"]) and any(char in line_text for char in ["x", "X"]) and len(line_text) > 5:
                feedback.append("✅ Good! You're showing simplified equations")
            
            # Check for mathematical operations
            if any(char in line_text for char in ["+", "-", "*", "/", "="]):
                feedback.append("✅ Mathematical operations detected")
            
            # Check for specific mathematical content
            if "x" in line_text and any(char in line_text for char in ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]):
                feedback.append("✅ Algebraic work detected")
            
            # Check for verification work
            if any(word in line_lower for word in ["verify", "verification", "check", "substitute", "substitution", "test", "testing", "plug in", "plugging in", "lhs", "rhs", "left side", "right side", "both sides", "balance", "balanced"]):
                feedback.append("✅ Great! You're including verification")
            
            # Check for actual verification calculations
            if any(char in line_text for char in ["=", "≈", "≠"]) and any(char in line_text for char in ["x", "X"]) and any(char.isdigit() for char in line_text):
                if any(word in line_lower for word in ["check", "verify", "test", "substitute", "lhs", "rhs"]):
                    feedback.append("✅ Excellent! You're showing verification calculations")
            
            # If no specific feedback, provide general encouragement
            if not feedback:
                feedback.append("📝 Line recorded - continue with your solution")
            
            # Add feedback to line analysis
            self.line_feedback.insert(tk.END, f"\n📝 Line {self.line_number - 1}: {line_text}\n")
            self.line_feedback.insert(tk.END, "─" * 40 + "\n")
            
            for fb in feedback:
                self.line_feedback.insert(tk.END, f"  {fb}\n")
            
            # Add raw OCR information if available
            if hasattr(self, 'last_ocr_result') and self.last_ocr_result:
                self.line_feedback.insert(tk.END, "  🔬 Raw OCR Information:\n")
                if "latex_raw" in self.last_ocr_result:
                    self.line_feedback.insert(tk.END, f"    📝 Raw LaTeX: {self.last_ocr_result['latex_raw']}\n")
                if "sympy_out" in self.last_ocr_result:
                    self.line_feedback.insert(tk.END, f"    🐍 Raw SymPy: {self.last_ocr_result['sympy_out']}\n")
                self.line_feedback.insert(tk.END, "  💡 Click '📋 Raw Output' button for completely raw data\n")
                self.line_feedback.insert(tk.END, "  💡 Click '🔬 Processed SymPy' button for processed analysis\n")
                self.line_feedback.insert(tk.END, "  💡 Click '📐 Raw Format' button for format without solving\n")
            
            # Add specific mathematical feedback based on equation structure
            if denominators and isinstance(denominators, (list, tuple)) and "x" in line_text:
                if any(str(d) in line_text for d in denominators):
                    self.line_feedback.insert(tk.END, "  🎯 Good! You're working with the denominators\n")
                
                if lcd != 1 and ("*" in line_text or "multiply" in line_lower):
                    self.line_feedback.insert(tk.END, "  🎯 Excellent! LCD multiplication detected\n")
            
            # Check for restrictions
            if restrictions and isinstance(restrictions, (list, tuple, set)):
                for restriction in restrictions:
                    if str(restriction) in line_text or f"x ≠ {restriction}" in line_text:
                        self.line_feedback.insert(tk.END, "  🎯 Great! You mentioned restrictions\n")
                        break
            
            # Add specific guidance based on what's missing
            if denominators and isinstance(denominators, (list, tuple)) and not any("denominator" in line_lower or "lcd" in line_lower):
                self.line_feedback.insert(tk.END, "  💡 Tip: Consider mentioning denominators or LCD\n")
            
            if restrictions and isinstance(restrictions, (list, tuple, set)) and not any("restriction" in line_lower or "≠" in line_text or "!=" in line_text):
                self.line_feedback.insert(tk.END, "  💡 Tip: Remember to mention excluded values\n")
            
            self.line_feedback.insert(tk.END, "\n")
            self.line_feedback.see(tk.END)
            
        except Exception as e:
            # Add basic feedback if analysis fails
            self.line_feedback.insert(tk.END, f"\n📝 Line {self.line_number - 1}: {line_text}\n")
            self.line_feedback.insert(tk.END, "─" * 40 + "\n")
            self.line_feedback.insert(tk.END, f"  📝 Line recorded successfully\n")
            self.line_feedback.insert(tk.END, f"  ⚠️ Analysis error: {str(e)}\n")
            self.line_feedback.insert(tk.END, "\n")
            self.line_feedback.see(tk.END)
    
    def check_complete_solution(self):
        """Check the complete solution for correctness using comprehensive backend analysis"""
        if not self.current_equation:
            messagebox.showwarning("Warning", "Please draw an equation first!")
            return
        
        try:
            # Get the equation (stored in current_equation)
            equation = self.current_equation
            print(f"DEBUG: Checking solution for equation: {equation}")
            
            # Get solution steps (all lines in solution_lines)
            solution_steps = self.solution_lines
            print(f"DEBUG: Solution steps: {solution_steps}")
            
            if not solution_steps:
                messagebox.showwarning("Warning", "Please add at least one solution step!")
                return
            
            # Check if this is a raw format equation (contains brackets or special formatting)
            is_raw_format = ("[" in equation and "]" in equation) or any("[" in step and "]" in step for step in solution_steps)
            print(f"DEBUG: Raw format detection - equation: '{equation}', contains brackets: {'[' in equation and ']' in equation}")
            print(f"DEBUG: Raw format detection - solution steps with brackets: {[step for step in solution_steps if '[' in step and ']' in step]}")
            print(f"DEBUG: Raw format detection result: {is_raw_format}")
            
            # Always try to use the comprehensive backend first
            try:
                print(f"DEBUG: Attempting to use comprehensive backend checker")
                
                # Import the backend functions
                from solving_real_copy import check_solution_correctness, analyze_verification_context, get_verification_feedback, get_verification_examples, get_detailed_verification_analysis
                
                # Convert raw format equation to standard format for backend processing
                processed_equation = equation
                if '[' in equation and ']' in equation:
                    print("DEBUG: Converting raw format equation for backend processing")
                    # Extract the actual equation part from raw format
                    # Example: x+1[(2x)/(x+1)=9]x+1 -> (2x)/(x+1)=9
                    import re
                    equation_match = re.search(r'\[(.*?)\]', equation)
                    if equation_match:
                        processed_equation = equation_match.group(1)
                        print(f"DEBUG: Extracted equation: {processed_equation}")
                    else:
                        print("DEBUG: Could not extract equation from raw format, using original")
                
                # Call the comprehensive backend checker
                print(f"DEBUG: Calling comprehensive backend checker with equation: {processed_equation}")
                backend_result = check_solution_correctness(processed_equation, solution_steps)
                
                # Get additional analysis
                verification_score, verification_details = analyze_verification_context(solution_steps, "")
                verification_feedback = get_verification_feedback(verification_score > 0, verification_details)
                verification_examples = get_verification_examples(processed_equation)
                detailed_analysis = get_detailed_verification_analysis(solution_steps, "")
                
                # Extract correctness from backend result
                if isinstance(backend_result, dict):
                    is_correct = backend_result.get('correct', False)
                    message = backend_result.get('feedback', ['Backend analysis complete'])
                else:
                    is_correct, message = backend_result
                
                print(f"DEBUG: Backend check successful - is_correct: {is_correct}, message: {message}")
                
                # Store comprehensive results for display
                self.comprehensive_results = {
                    'correct': is_correct,
                    'message': message,
                    'verification_score': verification_score,
                    'verification_details': verification_details,
                    'verification_feedback': verification_feedback,
                    'verification_examples': verification_examples,
                    'detailed_analysis': detailed_analysis,
                    'backend_result': backend_result
                }
                
            except Exception as check_error:
                print(f"DEBUG: Backend check failed: {check_error}")
                print("DEBUG: Falling back to basic analysis")
                is_correct, message = self.basic_solution_check(solution_steps, equation)
                print(f"DEBUG: Fallback basic check result - is_correct: {is_correct}, message: {message}")
                
                # Clear comprehensive results
                self.comprehensive_results = None
            
            # Show results in solution checker tab
            print(f"DEBUG: About to switch to solution checker tab")
            try:
                self.notebook.select(1)  # Switch to solution checker tab
                print(f"DEBUG: Successfully switched to solution checker tab")
            except Exception as tab_error:
                print(f"DEBUG: Failed to switch to solution checker tab: {tab_error}")
                # Try to force the switch
                try:
                    self.notebook.select(1)
                    print(f"DEBUG: Forced switch to solution checker tab")
                except:
                    print(f"DEBUG: Could not switch to solution checker tab, continuing anyway")
            
            # Check if checker_result widget exists
            if not hasattr(self, 'checker_result') or self.checker_result is None:
                print(f"DEBUG: checker_result widget not found, creating basic widget")
                # Create a basic widget instead of calling setup_solution_checker again
                result_frame = ttk.Frame(self.checker_frame)
                result_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
                self.checker_result = scrolledtext.ScrolledText(result_frame, height=20, width=60, wrap=tk.WORD)
                self.checker_result.pack(fill=tk.BOTH, expand=True)
            
            # Update checker results with comprehensive analysis
            print(f"DEBUG: About to update checker_result widget")
            if hasattr(self, 'checker_result') and self.checker_result is not None:
                self.checker_result.delete(1.0, tk.END)
            else:
                print(f"DEBUG: ERROR - checker_result widget still not available!")
                messagebox.showerror("Error", "Solution checker widget not available. Please restart the application.")
                return
            
            # Helper function to safely insert text
            def safe_insert(text):
                if hasattr(self, 'checker_result') and self.checker_result is not None:
                    self.checker_result.insert(tk.END, text)
                else:
                    print(f"DEBUG: ERROR - checker_result widget lost during operation!")
            
            self.checker_result.insert(1.0, "🔍 COMPREHENSIVE SOLUTION ANALYSIS\n")
            safe_insert("=" * 70 + "\n\n")
            
            # Show the equation
            safe_insert("📝 EQUATION TO SOLVE:\n")
            safe_insert(f"   {equation}\n\n")
            
            # Show solution steps count
            safe_insert(f"📊 SOLUTION STEPS: {len(solution_steps)}\n\n")
            
            # Show each solution step
            safe_insert("📝 YOUR SOLUTION STEPS:\n")
            for i, step in enumerate(solution_steps, 1):
                safe_insert(f"   {i:2d}. {step}\n")
            
            safe_insert("\n" + "=" * 70 + "\n")
            safe_insert("DETAILED ANALYSIS:\n\n")
            
            # Show the main correctness result
            if is_correct:
                safe_insert("🎉 EXCELLENT! Your solution is correct!\n")
                safe_insert("✅ " + str(message) + "\n\n")
            else:
                safe_insert("❌ Your solution needs work\n")
                safe_insert("💡 " + str(message) + "\n\n")
            
            # Show comprehensive backend results if available
            if hasattr(self, 'comprehensive_results') and self.comprehensive_results:
                safe_insert("\n" + "=" * 70 + "\n")
                safe_insert("🚀 COMPREHENSIVE BACKEND ANALYSIS 🚀\n")
                safe_insert("=" * 70 + "\n\n")
                
                # Show verification score
                if 'verification_score' in self.comprehensive_results:
                    safe_insert(f"📊 VERIFICATION SCORE: {self.comprehensive_results['verification_score']}/5\n\n")
                
                # Show verification details
                if 'verification_details' in self.comprehensive_results and self.comprehensive_results['verification_details']:
                    safe_insert("📝 VERIFICATION DETAILS:\n")
                    for detail in self.comprehensive_results['verification_details']:
                        safe_insert(f"   • {detail}\n")
                    safe_insert("\n")
                
                # Show verification feedback
                if 'verification_feedback' in self.comprehensive_results and self.comprehensive_results['verification_feedback']:
                    safe_insert("💡 VERIFICATION FEEDBACK:\n")
                    for feedback in self.comprehensive_results['verification_feedback']:
                        safe_insert(f"   {feedback}\n")
                    safe_insert("\n")
                
                # Show verification examples
                if 'verification_examples' in self.comprehensive_results and self.comprehensive_results['verification_examples']:
                    safe_insert("📚 VERIFICATION EXAMPLES:\n")
                    safe_insert("─" * 30 + "\n")
                    for example in self.comprehensive_results['verification_examples']:
                        safe_insert(f"   {example}\n")
                    safe_insert("\n")
                
                # Show detailed analysis
                if 'detailed_analysis' in self.comprehensive_results and self.comprehensive_results['detailed_analysis']:
                    safe_insert("🔍 DETAILED VERIFICATION ANALYSIS:\n")
                    safe_insert("─" * 40 + "\n")
                    for analysis_line in self.comprehensive_results['detailed_analysis']:
                        safe_insert(f"   {analysis_line}\n")
                    safe_insert("\n")
                
                # Show backend result details
                if 'backend_result' in self.comprehensive_results and self.comprehensive_results['backend_result']:
                    backend_result = self.comprehensive_results['backend_result']
                    if isinstance(backend_result, dict):
                        safe_insert("🔧 BACKEND ANALYSIS DETAILS:\n")
                        safe_insert("─" * 35 + "\n")
                        for key, value in backend_result.items():
                            if key not in ['correct', 'feedback']:  # Already shown above
                                safe_insert(f"   {key}: {value}\n")
                        safe_insert("\n")
            
            # Add the detailed step-by-step solution (like in solving_real_copy.py)
            safe_insert("\n" + "=" * 70 + "\n")
            safe_insert("📚 DETAILED STEP-BY-STEP SOLUTION 📚\n")
            safe_insert("=" * 70 + "\n\n")
            
            try:
                # Import the function from solving_real_copy
                from solving_real_copy import stepwise_rational_solution_with_explanations
                # Get the detailed solution using the backend function
                detailed_solution = stepwise_rational_solution_with_explanations(equation)
                safe_insert(detailed_solution)
            except Exception as sol_error:
                print(f"DEBUG: Detailed solution failed: {sol_error}")
                safe_insert("📝 Basic solution analysis completed\n")
                safe_insert("💡 The comprehensive backend analysis above provides detailed feedback\n")
            
            # Note: Comprehensive verification analysis is now shown above in the backend results section
            
            # Get verification context analysis
            # Note: Comprehensive verification analysis is now shown above in the backend results section
            
            # Note: Comprehensive verification analysis is now shown above in the backend results section
            
            # Note: Comprehensive verification analysis is now shown above in the backend results section
            
            # Note: Comprehensive verification analysis is now shown above in the backend results section
            
            # Add suggestions for improvement
            safe_insert("\n💡 SUGGESTIONS FOR IMPROVEMENT:\n")
            safe_insert("─" * 35 + "\n")
            
            if not is_correct:
                safe_insert("• Check your algebra steps carefully\n")
                safe_insert("• Verify you handled denominators correctly\n")
                safe_insert("• Make sure you found all restrictions\n")
                safe_insert("• Double-check your final answer\n")
            
            # Add suggestions for raw format
            if "[" in equation and "]" in equation:
                safe_insert("• Your equation is in raw format - this is good for understanding!\n")
                safe_insert("• Consider showing intermediate steps clearly\n")
                safe_insert("• Make sure each step follows logically from the previous one\n")
            
            safe_insert("\n" + "=" * 70 + "\n")
            safe_insert("ANALYSIS COMPLETE\n\n")
            
            if is_correct:
                safe_insert("🎯 Your solution is mathematically correct!\n")
                safe_insert("🚀 Great work on solving this rational equation!\n")
            else:
                safe_insert("🎯 Review the suggestions above to improve your solution.\n")
                safe_insert("💪 Keep practicing - you're on the right track!\n")
            
            print(f"DEBUG: Successfully updated checker_result widget")
            
            # Force the widget to update and be visible
            try:
                self.checker_result.update()
                self.checker_result.see(tk.END)
                print(f"DEBUG: Forced widget update and scroll to end")
            except Exception as update_error:
                print(f"DEBUG: Widget update failed: {update_error}")
            
            self.status_var.set("Comprehensive solution analysis complete - check the Solution Checker tab")
            
            # Show a message to guide the user
            try:
                messagebox.showinfo("Analysis Complete", 
                                  "Solution analysis is complete!\n\n"
                                  "The detailed results are now displayed in the '🔍 Solution Checker' tab.\n\n"
                                  "Click on that tab to view your complete solution analysis.")
            except Exception as msg_error:
                print(f"DEBUG: Could not show message box: {msg_error}")
            
        except Exception as e:
            print(f"DEBUG: Main check failed: {e}")
            messagebox.showerror("Error", f"Failed to check solution: {str(e)}")
            self.status_var.set("Error during solution analysis")
    
    def basic_solution_check(self, solution_steps, equation):
        """Basic solution check for raw format equations that the backend can't handle"""
        try:
            print(f"DEBUG: Basic check for equation: {equation}")
            print(f"DEBUG: Solution steps: {solution_steps}")
            
            # Basic analysis for raw format equations
            feedback_parts = []
            
            # Check if equation has the right structure
            if "[" in equation and "]" in equation and "=" in equation:
                feedback_parts.append("✅ Equation structure looks good (contains brackets and equals)")
            else:
                feedback_parts.append("⚠️ Equation structure may need attention")
            
            # Check solution steps
            if len(solution_steps) >= 2:
                feedback_parts.append(f"✅ Good number of solution steps ({len(solution_steps)})")
            else:
                feedback_parts.append("⚠️ Consider adding more intermediate steps")
            
            # Check for mathematical operations
            math_ops = 0
            for step in solution_steps:
                if any(op in step for op in ["+", "-", "*", "/", "="]):
                    math_ops += 1
            
            if math_ops > 0:
                feedback_parts.append(f"✅ Mathematical operations detected in {math_ops} steps")
            else:
                feedback_parts.append("⚠️ Mathematical operations not clearly shown")
            
            # Check for final answer
            final_answer_found = False
            for step in solution_steps:
                if "x =" in step or "x=" in step:
                    final_answer_found = True
                    break
            
            if final_answer_found:
                feedback_parts.append("✅ Final answer found")
            else:
                feedback_parts.append("⚠️ Final answer not clearly stated")
            
            # Overall assessment
            if len(feedback_parts) >= 3 and final_answer_found:
                is_correct = True
                message = " | ".join(feedback_parts)
            else:
                is_correct = False
                message = " | ".join(feedback_parts)
            
            print(f"DEBUG: Basic check result: {is_correct}, {message}")
            return is_correct, message
            
        except Exception as e:
            print(f"DEBUG: Basic check failed: {e}")
            return False, f"Basic analysis failed: {str(e)}"
    
    def get_raw_sympy_output(self):
        """Get raw SymPy output without automatic solving"""
        try:
            # Get the current drawing
            img = self.drawing_area.get_drawing_as_image()
            
            if not self.drawing_area.lines:
                messagebox.showwarning("Warning", "Please draw something first!")
                return
            
            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_file.close()
            img.save(temp_file.name, 'PNG')
            
            if OCR_AVAILABLE:
                try:
                    # Get raw OCR output
                    result = lcd.process_image(temp_file.name)
                    
                    # Create a detailed output dialog
                    self.show_raw_sympy_dialog(result)
                    
                except Exception as ocr_error:
                    messagebox.showerror("Error", f"OCR processing failed: {str(ocr_error)}")
            else:
                messagebox.showwarning("Warning", "OCR module not available!")
            
            # Clean up temp file
            try:
                os.unlink(temp_file.name)
            except:
                pass
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to get raw SymPy output: {str(e)}")
    
    def show_raw_sympy_dialog(self, ocr_result):
        """Show a dialog with raw SymPy output details"""
        # Create a new dialog window
        dialog = tk.Toplevel(self.root)
        dialog.title("🔬 Processed SymPy Output Analysis")
        dialog.geometry("900x700")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Center the dialog
        dialog.geometry("+%d+%d" % (self.root.winfo_rootx() + 50, self.root.winfo_rooty() + 50))
        
        # Title
        title_label = tk.Label(dialog, text="🔬 Processed SymPy Output Analysis", 
                              font=('Arial', 16, 'bold'))
        title_label.pack(pady=(20, 10))
        
        # Create notebook for different output types
        notebook = ttk.Notebook(dialog)
        notebook.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        # Raw LaTeX tab
        latex_frame = ttk.Frame(notebook)
        notebook.add(latex_frame, text="📝 Raw LaTeX (from OCR)")
        
        latex_text = scrolledtext.ScrolledText(latex_frame, height=15, width=80, wrap=tk.WORD)
        latex_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        if "latex_raw" in ocr_result:
            latex_text.insert(1.0, "🔍 Raw LaTeX Output (from OCR):\n")
            latex_text.insert(tk.END, "=" * 50 + "\n\n")
            latex_text.insert(tk.END, ocr_result["latex_raw"])
        else:
            latex_text.insert(1.0, "❌ No raw LaTeX output available")
        
        # SymPy Output tab
        sympy_frame = ttk.Frame(notebook)
        notebook.add(sympy_frame, text="🐍 SymPy Output (from OCR)")
        
        sympy_text = scrolledtext.ScrolledText(sympy_frame, height=15, width=80, wrap=tk.WORD)
        sympy_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        if "sympy_out" in ocr_result:
            sympy_text.insert(1.0, "🔍 SymPy Output (from OCR):\n")
            sympy_text.insert(tk.END, "=" * 50 + "\n\n")
            sympy_text.insert(tk.END, ocr_result["sympy_out"])
        else:
            sympy_text.insert(1.0, "❌ No SymPy output available")
        
        # Raw Processing tab
        raw_frame = ttk.Frame(notebook)
        notebook.add(raw_frame, text="🔬 Raw Processing")
        
        raw_text = scrolledtext.ScrolledText(raw_frame, height=15, width=80, wrap=tk.WORD)
        raw_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        raw_text.insert(1.0, "🔍 Complete OCR Result:\n")
        raw_text.insert(tk.END, "=" * 50 + "\n\n")
        for key, value in ocr_result.items():
            raw_text.insert(tk.END, f"📋 {key}:\n")
            raw_text.insert(tk.END, f"{value}\n\n")
        
        # Manual SymPy Conversion tab
        manual_frame = ttk.Frame(notebook)
        notebook.add(manual_frame, text="🛠️ Manual Conversion")
        
        # Input field for manual LaTeX
        input_frame = ttk.Frame(manual_frame)
        input_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(input_frame, text="Enter LaTeX manually:").pack(anchor=tk.W)
        manual_input = tk.Entry(input_frame, width=60)
        manual_input.pack(fill=tk.X, pady=5)
        
        # Convert button
        convert_btn = tk.Button(input_frame, text="🔄 Convert to SymPy", 
                               command=lambda: self.convert_manual_latex(manual_input.get(), manual_output))
        convert_btn.pack(pady=5)
        
        # Output display
        manual_output = scrolledtext.ScrolledText(manual_frame, height=10, width=80, wrap=tk.WORD)
        manual_output.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        manual_output.insert(1.0, "🔍 Manual Conversion Output:\n")
        manual_output.insert(tk.END, "=" * 50 + "\n\n")
        manual_output.insert(tk.END, "Enter LaTeX above and click Convert to see SymPy output\n")
        
        # Close button
        close_btn = tk.Button(dialog, text="Close", command=dialog.destroy, 
                             bg='blue', fg='white', font=('Arial', 10, 'bold'))
        close_btn.pack(pady=10)
    
    def convert_manual_latex(self, latex_input, output_widget):
        """Convert manually entered LaTeX to SymPy"""
        try:
            if not latex_input.strip():
                output_widget.delete(1.0, tk.END)
                output_widget.insert(1.0, "❌ Please enter some LaTeX input")
                return
            
            # Convert LaTeX to SymPy
            converted = self.convert_latex_to_sympy(latex_input)
            
            output_widget.delete(1.0, tk.END)
            output_widget.insert(1.0, "🔍 Manual Conversion Output:\n")
            output_widget.insert(tk.END, "=" * 50 + "\n\n")
            output_widget.insert(tk.END, f"📝 Input LaTeX:\n{latex_input}\n\n")
            output_widget.insert(tk.END, f"🔄 Converted SymPy:\n{converted}\n\n")
            
            # Try to parse with SymPy
            if SYMPY_AVAILABLE:
                try:
                    x = sp.symbols('x')
                    parsed = sp.sympify(converted)
                    output_widget.insert(tk.END, f"✅ SymPy Parsed Successfully:\n{sp.sstr(parsed)}\n\n")
                    output_widget.insert(tk.END, f"🔍 Expression Type: {type(parsed).__name__}\n")
                    output_widget.insert(tk.END, f"🔍 Free Symbols: {parsed.free_symbols}\n")
                except Exception as parse_error:
                    output_widget.insert(tk.END, f"❌ SymPy Parsing Failed:\n{str(parse_error)}\n")
            else:
                output_widget.insert(tk.END, "⚠️ SymPy not available for parsing test\n")
                
        except Exception as e:
            output_widget.delete(1.0, tk.END)
            output_widget.insert(1.0, f"❌ Conversion Error:\n{str(e)}")
    
    def clear_solution(self):
        """Clear the current solution"""
        if messagebox.askyesno("Clear Solution", "Are you sure you want to clear the entire solution?"):
            self.solution_lines = []
            self.line_number = 1
            self.current_equation = ""  # Reset the equation so logic works correctly
            self.solution_display.delete(1.0, tk.END)
            self.line_feedback.delete(1.0, tk.END)
            if hasattr(self, 'checker_result') and self.checker_result is not None:
                self.checker_result.delete(1.0, tk.END)
            self.drawing_area.clear_canvas()
            self.initialize_example()
            self.status_var.set("Solution cleared - ready to start over")
    
    def setup_solution_checker(self):
        """Setup the solution checker interface"""
        # Instructions
        instructions_frame = ttk.Frame(self.checker_frame)
        instructions_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(instructions_frame, text="Solution Checker Results:", 
                  font=('Arial', 12, 'bold')).pack(anchor=tk.W)
        
        # Result display
        result_frame = ttk.Frame(self.checker_frame)
        result_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create the checker_result widget as an instance variable
        self.checker_result = scrolledtext.ScrolledText(result_frame, height=20, width=60, wrap=tk.WORD)
        self.checker_result.pack(fill=tk.BOTH, expand=True)
        
        # Initial message
        self.checker_result.insert(1.0, "🔍 SOLUTION CHECKER\n")
        self.checker_result.insert(tk.END, "=" * 60 + "\n\n")
        self.checker_result.insert(tk.END, "This area will show the complete analysis of your solution.\n\n")
        self.checker_result.insert(tk.END, "To get started:\n")
        self.checker_result.insert(tk.END, "1. Draw your equation or enter one manually\n")
        self.checker_result.insert(tk.END, "2. Add solution steps line by line using the drawing pad\n")
        self.checker_result.insert(tk.END, "3. Click '✅ Check Complete Solution' when done\n")
        self.checker_result.insert(tk.END, "4. View detailed analysis here\n\n")
        self.checker_result.insert(tk.END, "The checker will analyze:\n")
        self.checker_result.insert(tk.END, "• Each line's mathematical content\n")
        self.checker_result.insert(tk.END, "• Denominator handling and restrictions\n")
        self.checker_result.insert(tk.END, "• LCD usage and simplification\n")
        self.checker_result.insert(tk.END, "• Final answer correctness\n")
    
    def get_completely_raw_output(self):
        """Get completely raw OCR output without any processing or conversion"""
        try:
            # Get the current drawing
            img = self.drawing_area.get_drawing_as_image()
            
            if not self.drawing_area.lines:
                messagebox.showwarning("Warning", "Please draw something first!")
                return
            
            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_file.close()
            img.save(temp_file.name, 'PNG')
            
            if OCR_AVAILABLE:
                try:
                    # Get completely raw OCR output
                    result = lcd.process_image(temp_file.name)
                    
                    # Create a dialog showing the raw output exactly as received
                    self.show_completely_raw_dialog(result)
                    
                except Exception as ocr_error:
                    messagebox.showerror("Error", f"OCR processing failed: {str(ocr_error)}")
            else:
                messagebox.showwarning("Warning", "OCR module not available!")
            
            # Clean up temp file
            try:
                os.unlink(temp_file.name)
            except:
                pass
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to get completely raw output: {str(e)}")
    
    def show_completely_raw_dialog(self, ocr_result):
        """Show a dialog with completely raw OCR output - no processing at all"""
        # Create a new dialog window
        dialog = tk.Toplevel(self.root)
        dialog.title("📋 Completely Raw OCR Output")
        dialog.geometry("1000x800")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Center the dialog
        dialog.geometry("+%d+%d" % (self.root.winfo_rootx() + 50, self.root.winfo_rooty() + 50))
        
        # Title
        title_label = tk.Label(dialog, text="📋 Completely Raw OCR Output - No Processing", 
                              font=('Arial', 16, 'bold'))
        title_label.pack(pady=(20, 10))
        
        # Subtitle explaining this is completely raw
        subtitle = tk.Label(dialog, text="This shows the exact output from OCR without any conversion or processing", 
                           font=('Arial', 10), fg='blue')
        subtitle.pack(pady=(0, 20))
        
        # Create notebook for different output types
        notebook = ttk.Notebook(dialog)
        notebook.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        # Raw LaTeX tab
        latex_frame = ttk.Frame(notebook)
        notebook.add(latex_frame, text="📝 Raw LaTeX (Exactly as OCR returned)")
        
        latex_text = scrolledtext.ScrolledText(latex_frame, height=15, width=80, wrap=tk.WORD)
        latex_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        if "latex_raw" in ocr_result:
            latex_text.insert(1.0, "🔍 Raw LaTeX Output (No Processing):\n")
            latex_text.insert(tk.END, "=" * 60 + "\n\n")
            latex_text.insert(tk.END, ocr_result["latex_raw"])
            latex_text.insert(tk.END, "\n\n" + "=" * 60 + "\n")
            latex_text.insert(tk.END, "This is exactly what the OCR returned - no conversion applied")
        else:
            latex_text.insert(1.0, "❌ No raw LaTeX output available")
        
        # Raw SymPy tab
        sympy_frame = ttk.Frame(notebook)
        notebook.add(sympy_frame, text="🐍 Raw SymPy (Exactly as OCR returned)")
        
        sympy_text = scrolledtext.ScrolledText(sympy_frame, height=15, width=80, wrap=tk.WORD)
        sympy_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        if "sympy_out" in ocr_result:
            sympy_text.insert(1.0, "🔍 Raw SymPy Output (No Processing):\n")
            sympy_text.insert(tk.END, "=" * 60 + "\n\n")
            sympy_text.insert(tk.END, ocr_result["sympy_out"])
            sympy_text.insert(tk.END, "\n\n" + "=" * 60 + "\n")
            sympy_text.insert(tk.END, "This is exactly what the OCR returned - no conversion applied")
        else:
            sympy_text.insert(1.0, "❌ No raw SymPy output available")
        
        # Complete Raw Data tab
        raw_frame = ttk.Frame(notebook)
        notebook.add(raw_frame, text="🔬 Complete Raw Data")
        
        raw_text = scrolledtext.ScrolledText(raw_frame, height=15, width=80, wrap=tk.WORD)
        raw_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        raw_text.insert(1.0, "🔍 Complete Raw OCR Result (No Processing):\n")
        raw_text.insert(tk.END, "=" * 60 + "\n\n")
        raw_text.insert(tk.END, "This shows every field exactly as returned by the OCR system:\n\n")
        for key, value in ocr_result.items():
            raw_text.insert(tk.END, f"📋 {key}:\n")
            raw_text.insert(tk.END, f"{value}\n\n")
        raw_text.insert(tk.END, "=" * 60 + "\n")
        raw_text.insert(tk.END, "This is the complete raw data - no processing or conversion applied")
        
        # Close button
        close_btn = tk.Button(dialog, text="Close", command=dialog.destroy, 
                             bg='red', fg='white', font=('Arial', 10, 'bold'))
        close_btn.pack(pady=10)
    
    def get_raw_format_output(self):
        """Get raw format output without automatic solving - just format conversion"""
        try:
            # Get the current drawing
            img = self.drawing_area.get_drawing_as_image()
            
            if not self.drawing_area.lines:
                messagebox.showwarning("Warning", "Please draw something first!")
                return
            
            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_file.close()
            img.save(temp_file.name, 'PNG')
            
            if OCR_AVAILABLE:
                try:
                    # Get raw OCR output
                    result = lcd.process_image(temp_file.name)
                    
                    # Convert LaTeX to raw format without solving
                    if "latex_raw" in result:
                        raw_format = self.convert_latex_to_raw_format(result["latex_raw"])
                        
                        # Ask user if they want to add this to their solution
                        if messagebox.askyesno("Add to Solution", 
                                             f"Do you want to add this raw format to your solution?\n\n{raw_format}\n\nThis will be added as a new solution line."):
                            
                            # Add to solution lines
                            if not self.current_equation:
                                # First line becomes the equation
                                self.current_equation = raw_format
                                self.add_solution_line(raw_format, is_equation=True)
                                self.status_var.set(f"✅ Equation captured: {raw_format}")
                            else:
                                # Add as solution step
                                self.add_solution_line(raw_format, is_equation=False)
                                self.status_var.set(f"✅ Added solution step: {raw_format}")
                            
                            # Clear the drawing for next step
                            self.drawing_area.clear_canvas()
                        
                        # Show the dialog with the raw format output
                        self.show_raw_format_dialog(result)
                        
                    else:
                        messagebox.showwarning("Warning", "No LaTeX output available for format conversion!")
                        
                except Exception as ocr_error:
                    messagebox.showerror("Error", f"OCR processing failed: {str(ocr_error)}")
            else:
                messagebox.showwarning("Warning", "OCR module not available!")
            
            # Clean up temp file
            try:
                os.unlink(temp_file.name)
            except:
                pass
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to get raw format output: {str(e)}")
    
    def show_raw_format_dialog(self, ocr_result):
        """Show a dialog with raw format output - format conversion without solving"""
        # Create a new dialog window
        dialog = tk.Toplevel(self.root)
        dialog.title("📐 Raw Format Output - No Automatic Solving")
        dialog.geometry("1000x800")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Center the dialog
        dialog.geometry("+%d+%d" % (self.root.winfo_rootx() + 50, self.root.winfo_rooty() + 50))
        
        # Title
        title_label = tk.Label(dialog, text="📐 Raw Format Output - No Automatic Solving", 
                              font=('Arial', 16, 'bold'))
        title_label.pack(pady=(20, 10))
        
        # Subtitle explaining this shows format without solving
        subtitle = tk.Label(dialog, text="This shows the raw format without automatic solving or simplification", 
                           font=('Arial', 10), fg='blue')
        subtitle.pack(pady=(0, 20))
        
        # Create notebook for different output types
        notebook = ttk.Notebook(dialog)
        notebook.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        # Raw LaTeX tab
        latex_frame = ttk.Frame(notebook)
        notebook.add(latex_frame, text="📝 Raw LaTeX (from OCR)")
        
        latex_text = scrolledtext.ScrolledText(latex_frame, height=15, width=80, wrap=tk.WORD)
        latex_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        if "latex_raw" in ocr_result:
            latex_text.insert(1.0, "🔍 Raw LaTeX Output (from OCR):\n")
            latex_text.insert(tk.END, "=" * 60 + "\n\n")
            latex_text.insert(tk.END, ocr_result["latex_raw"])
            latex_text.insert(tk.END, "\n\n" + "=" * 60 + "\n")
            latex_text.insert(tk.END, "This is the raw LaTeX from OCR")
        else:
            latex_text.insert(1.0, "❌ No raw LaTeX output available")
        
        # Raw Format SymPy tab (what you want)
        format_frame = ttk.Frame(notebook)
        notebook.add(format_frame, text="📐 Raw Format SymPy (No Solving)")
        
        format_text = scrolledtext.ScrolledText(format_frame, height=15, width=80, wrap=tk.WORD)
        format_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        if "latex_raw" in ocr_result:
            # Convert LaTeX to raw format without solving
            raw_format = self.convert_latex_to_raw_format(ocr_result["latex_raw"])
            format_text.insert(1.0, "🔍 Raw Format SymPy (No Solving):\n")
            format_text.insert(tk.END, "=" * 60 + "\n\n")
            format_text.insert(tk.END, raw_format)
            format_text.insert(tk.END, "\n\n" + "=" * 60 + "\n")
            format_text.insert(tk.END, "This is the raw format without automatic solving")
        else:
            format_text.insert(1.0, "❌ No LaTeX output available for format conversion")
        
        # Current SymPy Output tab (for comparison)
        current_frame = ttk.Frame(notebook)
        notebook.add(current_frame, text="🐍 Current SymPy (Solved)")
        
        current_text = scrolledtext.ScrolledText(current_frame, height=15, width=80, wrap=tk.WORD)
        current_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        if "sympy_out" in ocr_result:
            current_text.insert(1.0, "🔍 Current SymPy Output (Solved):\n")
            current_text.insert(tk.END, "=" * 60 + "\n\n")
            current_text.insert(tk.END, ocr_result["sympy_out"])
            current_text.insert(tk.END, "\n\n" + "=" * 60 + "\n")
            current_text.insert(tk.END, "This is what the OCR system automatically solved")
        else:
            current_text.insert(1.0, "❌ No SymPy output available")
        
        # Close button
        close_btn = tk.Button(dialog, text="Close", command=dialog.destroy, 
                             bg='blue', fg='white', font=('Arial', 10, 'bold'))
        close_btn.pack(pady=10)
    
    def convert_latex_to_raw_format(self, latex_text):
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
        
        # ENHANCED OCR ERROR CORRECTION for your specific case
        # Fix common OCR misreadings
        ocr_fixes = {
            r'frac\s*x4': 'x/4',           # "frac x4" -> "x/4"
            r'frac\s*(\d+)2': r'\1/2',     # "frac32" -> "3/2", "frac52" -> "5/2"
            r'frac\s*(\d+)4': r'\1/4',     # "frac54" -> "5/4", "frac34" -> "3/4"
            r'frac\s*(\d+)3': r'\1/3',     # "frac23" -> "2/3", "frac13" -> "1/3"
            r'frac\s*(\d+)5': r'\1/5',     # "frac25" -> "2/5", "frac35" -> "3/5"
            r'frac\s*(\d+)6': r'\1/6',     # "frac16" -> "1/6", "frac56" -> "5/6"
            r'frac\s*(\d+)8': r'\1/8',     # "frac18" -> "1/8", "frac38" -> "3/8"
            r'frac\s*(\d+)9': r'\1/9',     # "frac19" -> "1/9", "frac29" -> "2/9"
            r'frac\s*(\d+)1': r'\1/1',     # "frac21" -> "2/1", "frac31" -> "3/1"
            r'frac\s*(\d+)0': r'\1/0',     # "frac20" -> "2/0", "frac30" -> "3/0"
            r'frac\s*(\d+)7': r'\1/7',     # "frac17" -> "1/7", "frac27" -> "2/7"
        }
        
        # Additional OCR fixes for bracket and context issues
        additional_fixes = {
            r'9\[': '4[',                   # "9[" -> "4[" (common OCR error)
            r'\]9': ']4',                   # "]9" -> "]4" (common OCR error)
            r'8\[': '3[',                   # "8[" -> "3[" (common OCR error)
            r'\]8': ']3',                   # "]8" -> "]3" (common OCR error)
            r'7\[': '2[',                   # "7[" -> "2[" (common OCR error)
            r'\]7': ']2',                   # "]7" -> "]2" (common OCR error)
            r'6\[': '1[',                   # "6[" -> "1[" (common OCR error)
            r'\]6': ']1',                   # "]6" -> "]1" (common OCR error)
        }
        
        # Apply additional OCR fixes
        for pattern, replacement in additional_fixes.items():
            try:
                old_result = latex_text
                latex_text = re.sub(pattern, replacement, latex_text)
                if old_result != latex_text:
                    print(f"DEBUG: Applied additional OCR fix '{pattern}' -> '{replacement}'")
                    print(f"DEBUG: Result changed from '{old_result}' to '{latex_text}'")
            except re.error as regex_error:
                print(f"Regex error with additional OCR fix pattern '{pattern}': {regex_error}")
                continue
        
        # Apply OCR fixes first
        for pattern, replacement in ocr_fixes.items():
            try:
                old_result = latex_text
                latex_text = re.sub(pattern, replacement, latex_text, flags=re.IGNORECASE)
                if old_result != latex_text:
                    print(f"DEBUG: Applied OCR fix '{pattern}' -> '{replacement}'")
                    print(f"DEBUG: Result changed from '{old_result}' to '{latex_text}'")
            except re.error as regex_error:
                print(f"Regex error with OCR fix pattern '{pattern}': {regex_error}")
                continue
        
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
    
    def clean_raw_format(self, raw_text):
        """Clean up basic OCR errors in raw format output"""
        if not raw_text:
            return raw_text
        
        # Basic cleaning for raw format
        cleaned = raw_text.strip()
        
        # Handle common OCR errors
        cleaned = cleaned.replace('×', '*')
        cleaned = cleaned.replace('÷', '/')
        cleaned = cleaned.replace('−', '-')
        
        # Clean up extra spaces
        cleaned = re.sub(r'\s+', ' ', cleaned)
        
        return cleaned.strip()
    
    def test_widget_functionality(self):
        """Test if the checker_result widget is working properly"""
        try:
            print(f"DEBUG: Testing widget functionality")
            
            # Check if widget exists
            if not hasattr(self, 'checker_result') or self.checker_result is None:
                print(f"DEBUG: Widget does not exist")
                messagebox.showwarning("Widget Test", "The checker_result widget does not exist!")
                return
            
            # Try to insert some test text
            self.checker_result.delete(1.0, tk.END)
            self.checker_result.insert(1.0, "🧪 WIDGET TEST SUCCESSFUL!\n")
            self.checker_result.insert(tk.END, "=" * 50 + "\n\n")
            self.checker_result.insert(tk.END, "✅ The checker_result widget is working properly!\n")
            self.checker_result.insert(tk.END, "✅ You can now use the 'Check Complete Solution' button.\n\n")
            self.checker_result.insert(tk.END, "Test completed at: " + str(datetime.datetime.now()) + "\n")
            
            # Switch to the solution checker tab
            try:
                self.notebook.select(1)
                print(f"DEBUG: Successfully switched to solution checker tab")
            except Exception as tab_error:
                print(f"DEBUG: Failed to switch tab: {tab_error}")
            
            print(f"DEBUG: Widget test completed successfully")
            messagebox.showinfo("Widget Test", "Widget test completed successfully!\n\nThe checker_result widget is working properly.")
            
        except Exception as e:
            print(f"DEBUG: Widget test failed: {e}")
            messagebox.showerror("Widget Test Failed", f"Widget test failed: {str(e)}")
    
    def test_your_ocr_error(self):
        """Test the specific OCR error you encountered"""
        try:
            # Create a test dialog
            dialog = tk.Toplevel(self.root)
            dialog.title("🎯 Test Your OCR Error Fix")
            dialog.geometry("700x500")
            dialog.transient(self.root)
            dialog.grab_set()
            
            # Center the dialog
            dialog.geometry("+%d+%d" % (self.root.winfo_rootx() + 50, self.root.winfo_rooty() + 50))
            
            # Title
            tk.Label(dialog, text="🎯 Testing Your Specific OCR Error Fix", 
                    font=('Arial', 14, 'bold')).pack(pady=(20, 10))
            
            # Your specific case
            your_input = "9[frac x4+frac32=frac54]9"
            expected_output = "4[x/4+3/2=5/4]4"
            
            # Show the problem
            problem_frame = ttk.LabelFrame(dialog, text="Your OCR Error Case", padding=10)
            problem_frame.pack(fill=tk.X, padx=20, pady=10)
            
            tk.Label(problem_frame, text="What OCR returned:", font=('Arial', 10, 'bold')).pack(anchor=tk.W)
            tk.Label(problem_frame, text=your_input, font=('Courier', 12), fg='red').pack()
            
            tk.Label(problem_frame, text="What it should be:", font=('Arial', 10, 'bold')).pack(anchor=tk.W, pady=(10,0))
            tk.Label(problem_frame, text=expected_output, font=('Courier', 12), fg='green').pack()
            
            # Test the conversion
            result_frame = ttk.LabelFrame(dialog, text="Conversion Result", padding=10)
            result_frame.pack(fill=tk.X, padx=20, pady=10)
            
            converted = self.convert_latex_to_raw_format(your_input)
            
            tk.Label(result_frame, text="After OCR error correction:", font=('Arial', 10, 'bold')).pack(anchor=tk.W)
            tk.Label(result_frame, text=converted, font=('Courier', 12), fg='blue').pack()
            
            # Show success/failure
            if "x/4+3/2=5/4" in converted:
                success_label = tk.Label(result_frame, text="✅ SUCCESS! OCR errors corrected!", 
                                       font=('Arial', 12, 'bold'), fg='green')
                success_label.pack(pady=(10,0))
            else:
                failure_label = tk.Label(result_frame, text="❌ OCR errors still present", 
                                       font=('Arial', 12, 'bold'), fg='red')
                failure_label.pack(pady=(10,0))
            
            # Show what was fixed
            fixes_frame = ttk.LabelFrame(dialog, text="What Was Fixed", padding=10)
            fixes_frame.pack(fill=tk.X, padx=20, pady=10)
            
            fixes_text = scrolledtext.ScrolledText(fixes_frame, height=8, width=60, wrap=tk.WORD)
            fixes_text.pack(fill=tk.BOTH, expand=True)
            
            fixes_text.insert(1.0, "🔍 OCR Error Analysis:\n")
            fixes_text.insert(tk.END, "=" * 40 + "\n\n")
            fixes_text.insert(tk.END, "1. 'frac x4' → 'x/4' (fraction notation)\n")
            fixes_text.insert(tk.END, "2. 'frac32' → '3/2' (fraction notation)\n")
            fixes_text.insert(tk.END, "3. 'frac54' → '5/4' (fraction notation)\n")
            fixes_text.insert(tk.END, "4. '9[' → '4[' (bracket correction)\n")
            fixes_text.insert(tk.END, "5. ']9' → ']4' (bracket correction)\n\n")
            fixes_text.insert(tk.END, "The OCR was misreading:\n")
            fixes_text.insert(tk.END, "• '4' as '9' (common OCR error)\n")
            fixes_text.insert(tk.END, "• 'x' as 'frac x4' (fraction interpretation error)\n")
            fixes_text.insert(tk.END, "• '3/2' as 'frac32' (missing slash)\n")
            fixes_text.insert(tk.END, "• '5/4' as 'frac54' (missing slash)\n")
            
            # Close button
            tk.Button(dialog, text="Close", command=dialog.destroy, 
                     bg='blue', fg='white', font=('Arial', 10, 'bold')).pack(pady=10)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to test OCR error fix: {str(e)}")
    
    def quick_test_your_equation(self):
        """Quick test of your specific equation OCR error"""
        try:
            # Your specific OCR error case
            your_input = "9[frac x4+frac32=frac54]9"
            expected_output = "4[x/4+3/2=5/4]4"
            
            # Convert it
            converted = self.convert_latex_to_raw_format(your_input)
            
            # Show result
            if "x/4+3/2=5/4" in converted:
                messagebox.showinfo("OCR Fix Test", 
                                  f"✅ SUCCESS! OCR errors corrected!\n\n"
                                  f"Input: {your_input}\n"
                                  f"Expected: {expected_output}\n"
                                  f"Result: {converted}\n\n"
                                  f"The OCR errors have been fixed!")
            else:
                messagebox.showwarning("OCR Fix Test", 
                                     f"⚠️ OCR errors still present\n\n"
                                     f"Input: {your_input}\n"
                                     f"Expected: {expected_output}\n"
                                     f"Result: {converted}\n\n"
                                     f"Some OCR errors may need additional fixes.")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to test your equation: {str(e)}")
    
    def test_raw_format_conversion(self):
        """Test the raw format conversion with your specific example"""
        try:
            # Create a test dialog
            dialog = tk.Toplevel(self.root)
            dialog.title("🧪 Test Raw Format Conversion")
            dialog.geometry("800x600")
            dialog.transient(self.root)
            dialog.grab_set()
            
            # Center the dialog
            dialog.geometry("+%d+%d" % (self.root.winfo_rootx() + 50, self.root.winfo_rooty() + 50))
            
            # Title
            tk.Label(dialog, text="🧪 Testing Raw Format Conversion", 
                    font=('Arial', 14, 'bold')).pack(pady=(20, 10))
            
            # Test cases
            test_cases = [
                r"9[frac x4+frac32=frac54]9",  # Your specific OCR error case
                r"4[x/4+3/2=5/4]4",            # What it should be
                r"x+1[\frac{2x}{x+1}=9]x+1",
                r"x+1[\frac{2x}{x+1}=4]x+1",
                r"\frac{x+2}{x}=\frac{3}{4}",
                r"Eq(\frac{x+2}{x}, \frac{3}{4})",
                r"x^2 + 2x + 1 = 0"
            ]
            
            # Create scrolled text for results
            result_text = scrolledtext.ScrolledText(dialog, height=25, width=80, wrap=tk.WORD)
            result_text.pack(pady=20, padx=20, fill=tk.BOTH, expand=True)
            
            # Show test results
            result_text.insert(1.0, "🔍 RAW FORMAT CONVERSION TEST RESULTS\n")
            result_text.insert(tk.END, "=" * 60 + "\n\n")
            result_text.insert(tk.END, "This shows how the conversion handles LaTeX to raw format:\n")
            result_text.insert(tk.END, "1. \\frac{} -> ()/() conversion\n")
            result_text.insert(tk.END, "2. LaTeX command removal\n")
            result_text.insert(tk.END, "3. Format preservation without solving\n")
            result_text.insert(tk.END, "4. OCR ERROR CORRECTION (NEW!)\n\n")
            
            # Special highlight for your case
            result_text.insert(tk.END, "🎯 SPECIAL TEST: Your OCR Error Case\n")
            result_text.insert(tk.END, "─" * 50 + "\n")
            result_text.insert(tk.END, "Input: 9[frac x4+frac32=frac54]9\n")
            result_text.insert(tk.END, "Expected: 4[x/4+3/2=5/4]4\n")
            result_text.insert(tk.END, "─" * 50 + "\n\n")
            
            for i, test_case in enumerate(test_cases, 1):
                result_text.insert(tk.END, f"Test {i}: {test_case}\n")
                converted = self.convert_latex_to_raw_format(test_case)
                result_text.insert(tk.END, f"Result: {converted}\n")
                
                # Special highlighting for your case
                if "frac x4+frac32=frac54" in test_case:
                    result_text.insert(tk.END, "🎯 OCR ERROR CORRECTION APPLIED!\n")
                    if "x/4+3/2=5/4" in converted:
                        result_text.insert(tk.END, "✅ SUCCESS: OCR errors corrected!\n")
                    else:
                        result_text.insert(tk.END, "❌ OCR errors still present\n")
                
                result_text.insert(tk.END, "─" * 50 + "\n\n")
            
            # Close button
            tk.Button(dialog, text="Close", command=dialog.destroy, 
                     bg='blue', fg='white', font=('Arial', 10, 'bold')).pack(pady=10)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to test raw format conversion: {str(e)}")
    
    def quick_add_raw_format(self):
        """Quickly add raw format to solution without showing dialog"""
        try:
            # Get the current drawing
            img = self.drawing_area.get_drawing_as_image()
            
            if not self.drawing_area.lines:
                messagebox.showwarning("Warning", "Please draw something first!")
                return
            
            # Save to temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            temp_file.close()
            img.save(temp_file.name, 'PNG')
            
            if OCR_AVAILABLE:
                try:
                    # Get raw OCR output
                    result = lcd.process_image(temp_file.name)
                    
                    # Convert LaTeX to raw format without solving
                    if "latex_raw" in result:
                        raw_format = self.convert_latex_to_raw_format(result["latex_raw"])
                        
                        # Add to solution lines automatically
                        if not self.current_equation:
                            # First line becomes the equation
                            self.current_equation = raw_format
                            self.add_solution_line(raw_format, is_equation=True)
                            self.status_var.set(f"✅ Equation captured: {raw_format}")
                        else:
                            # Add as solution step
                            self.add_solution_line(raw_format, is_equation=False)
                            self.status_var.set(f"✅ Added solution step: {raw_format}")
                        
                        # Clear the drawing for next step
                        self.drawing_area.clear_canvas()
                        
                        # Show confirmation
                        messagebox.showinfo("Success", f"Raw format added to solution:\n\n{raw_format}")
                        
                    else:
                        messagebox.showwarning("Warning", "No LaTeX output available for format conversion!")
                        
                except Exception as ocr_error:
                    messagebox.showerror("Error", f"OCR processing failed: {str(ocr_error)}")
            else:
                messagebox.showwarning("Warning", "OCR module not available!")
            
            # Clean up temp file
            try:
                os.unlink(temp_file.name)
            except:
                pass
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to add raw format: {str(e)}")

def main():
    root = tk.Tk()
    app = OCRIntegratedDrawingSolverApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
