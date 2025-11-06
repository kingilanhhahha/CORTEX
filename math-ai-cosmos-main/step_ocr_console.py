#!/usr/bin/env python3
"""
Console Version of OCR-Integrated Solution Checker
Simple command-line interface for checking solutions with OCR support
"""

import re

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
        print(f"Replaced comma with equals: {equation_str}")
    
    # Clean up double parentheses at start and end
    equation_str = re.sub(r'^\(+', '(', equation_str)
    equation_str = re.sub(r'\)+$', ')', equation_str)
    
    print(f"Final processed equation: {equation_str}")
    return equation_str

def comprehensive_solution_checker_with_ocr():
    """
    Content-Based Rational Equation Solution Checker with OCR Integration
    Grades purely on mathematical correctness, ignoring labels/keywords
    """
    print("\n" + "=" * 70)
    print("                    🔍 OCR-INTEGRATED SOLUTION CHECKER 🔍")
    print("=" * 70)
    
    # Input Phase
    print("\n📝 INPUT PHASE")
    print("─" * 50)
    
    # Get equation from OCR or manual input
    print("🎯 Choose input method:")
    print("   1. Use OCR from drawing")
    print("   2. Enter equation manually")
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "1":
        if not OCR_AVAILABLE:
            print("❌ OCR not available. Please install required packages.")
            return
        
        print("\n📱 OCR MODE")
        print("Please draw your equation and then provide the OCR output.")
        print("The OCR output will be automatically processed to clean format.")
        
        # Get OCR output
        ocr_output = input("📱 Paste the OCR output here: ").strip()
        if not ocr_output:
            print("❌ No OCR output provided.")
            return
        
        # Process OCR output
        original_eq = process_ocr_equation(ocr_output)
        print(f"✅ Processed equation: {original_eq}")
        
    else:
        # Manual input
        original_eq = input("🎯 Enter the original equation: ").strip()
        if not original_eq:
            print("❌ No equation provided. Returning to main menu.")
            return
    
    # Get student's final answer
    student_answer = input("📝 Enter student's final answer for x: ").strip()
    if not student_answer:
        print("❌ No answer provided. Returning to main menu.")
        return
    
    print("\n📖 STUDENT'S SOLUTION")
    print("─" * 50)
    print("💡 Please type your solution line by line:")
    print("💡 Type each step and press Enter after each one.")
    print("💡 When you're completely done, press Enter twice.")
    
    # Get the solution line by line
    student_solution = []
    
    try:
        line_number = 1
        empty_line_count = 0
        
        while True:
            line = input(f"  📝 Line {line_number}: ").strip()
            
            if line == "":
                empty_line_count += 1
                if empty_line_count >= 2:
                    print("  ✅ Input collection finished.")
                    break
                else:
                    print("  💡 Empty line detected. Press Enter again when you're completely done.")
                    continue
            else:
                empty_line_count = 0
                student_solution.append(line)
                line_number += 1
                
    except EOFError:
        print("  [DEBUG] EOF detected")
    except KeyboardInterrupt:
        print("  [DEBUG] Input interrupted")
    
    print(f"\n📊 Collected {len(student_solution)} lines of student solution:")
    if len(student_solution) == 0:
        print("  ⚠️  No lines collected! This might indicate an input issue.")
        return
    
    for i, line in enumerate(student_solution):
        print(f"  📄 Line {i+1}: '{line}'")
    
    print("\n" + "=" * 70)
    print("                    🔍 ANALYZING SOLUTION STAGES... 🔍")
    print("=" * 70)
    
    # Preprocessing Phase
    print("\n🔍 PREPROCESSING PHASE")
    print("─" * 50)
    
    try:
        import sympy as sp
        x = sp.symbols('x')
        
        # Parse original equation
        if "=" not in original_eq:
            print("❌ Invalid equation format. Missing '='.")
            return
        
        lhs_str, rhs_str = original_eq.split("=", 1)
        lhs, rhs = map(sp.sympify, [lhs_str, rhs_str])
        
        print(f"✅ Original equation: {sp.sstr(lhs)} = {sp.sstr(rhs)}")
        
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
                            restrictions.update(sols)
                        except:
                            pass
            else:
                num, den = sp.fraction(sp.together(expr))
                if den != 1:
                    denominators.append(den)
                    try:
                        sols = sp.solve(den, x)
                        restrictions.update(sols)
                    except:
                        pass
        
        # Check what the student actually mentioned
        student_mentions_denominators = False
        student_mentions_restrictions = False
        student_mentions_lcd = False
        student_shows_simplified_equation = False
        
        for line in student_solution:
            line_lower = line.lower()
            # Check for explicit denominator mentions
            if any(word in line_lower for word in ["denominator", "denominators", "denom", "lcd", "least common denominator"]):
                student_mentions_denominators = True
            # Check for explicit restriction mentions
            if any(word in line_lower for word in ["restriction", "restrictions", "excluded", "cannot", "≠", "!=", "not equal", "not equal to"]):
                student_mentions_restrictions = True
            # Check for implicit restriction mentions
            if "≠" in line or "!=" in line or "x" in line and any(char in line for char in ["≠", "!=", "not"]):
                restriction_patterns = [
                    r'x\s*[≠!]\s*\d+',
                    r'x\s+not\s+equal\s+to\s+\d+',
                    r'x\s+cannot\s+be\s+\d+',
                    r'x\s+≠\s+\d+',
                ]
                for pattern in restriction_patterns:
                    if re.search(pattern, line_lower):
                        student_mentions_restrictions = True
                        break
            # Check for implicit denominator identification
            if "(" in line and ")" in line and "/" in line and "x" in line:
                student_mentions_denominators = True
            # Check for LCD usage
            if any(word in line_lower for word in ["multiply both sides by", "multiply by", "lcd", "least common denominator"]):
                student_mentions_lcd = True
                student_mentions_denominators = True
            # Check for implicit LCD usage
            if "*" in line and "(" in line and ")" in line and "/" in line:
                student_mentions_lcd = True
                student_mentions_denominators = True
            # Check for simplified equation
            if "=" in line and not any(char in line for char in ["/", "÷"]) and any(char in line for char in ["x", "X"]) and len(line) > 5:
                student_shows_simplified_equation = True
        
        # AUTO-DETECT: If student shows work with denominators, they implicitly know about them
        if denominators:
            for line in student_solution:
                for denom in denominators:
                    denom_str = sp.sstr(denom)
                    if denom_str in line or denom_str.replace(" ", "") in line.replace(" ", ""):
                        student_mentions_denominators = True
                        break
                if student_mentions_denominators:
                    break
            
            for line in student_solution:
                line_lower = line.lower()
                if any(word in line_lower for word in ["restriction", "restrictions", "excluded", "cannot", "≠", "!=", "not equal", "not equal to", "undefined", "domain", "not allowed"]):
                    for restriction in restrictions:
                        restriction_str = sp.sstr(restriction)
                        if restriction_str in line or f"x ≠ {restriction_str}" in line or f"x!={restriction_str}" in line:
                            student_mentions_restrictions = True
                            break
                    if student_mentions_restrictions:
                        break
            
            for line in student_solution:
                for denom in denominators:
                    denom_str = sp.sstr(denom)
                    if (denom_str in line and "*" in line) or (denom_str in line and any(word in line.lower() for word in ["multiply", "times"])):
                        student_mentions_lcd = True
                        break
                if student_mentions_lcd:
                    break
        
        # Show what the checker found vs. what student mentioned
        if denominators:
            if student_mentions_denominators:
                print(f"✅ Denominators found: {[sp.sstr(d) for d in denominators]} (MENTIONED by student)")
            else:
                print(f"✅ Denominators found: {[sp.sstr(d) for d in denominators]} (NOT MENTIONED by student)")
            
            if restrictions:
                if student_mentions_restrictions:
                    print(f"✅ Restrictions: x ≠ {[sp.sstr(r) for r in restrictions]} (MENTIONED by student)")
                else:
                    print(f"✅ Restrictions: x ≠ {[sp.sstr(r) for r in restrictions]} (NOT MENTIONED by student)")
            else:
                print("✅ Restrictions: No restrictions (denominators are constants)")
        else:
            print("✅ No denominators (equation is already polynomial)")
        
        # Calculate LCD
        if denominators:
            lcd = sp.lcm([sp.factor(d) for d in denominators])
            if student_mentions_lcd:
                print(f"✅ LCD multiplication: {sp.sstr(sp.factor(lcd))} (MENTIONED by student)")
            else:
                print(f"✅ LCD multiplication: {sp.sstr(sp.factor(lcd))} (NOT MENTIONED by student)")
        else:
            lcd = 1
            print("✅ LCD multiplication: 1 (no denominators to clear)")
        
        # Show simplified equation status
        if student_shows_simplified_equation:
            print("✅ Simplified equation: (SHOWN by student)")
        else:
            print("✅ Simplified equation: (NOT SHOWN by student)")
        
    except Exception as e:
        print(f"❌ Error preprocessing equation: {e}")
        return
    
    # Symbol Normalization
    print("\n🔍 CORRECTNESS CHECK")
    print("─" * 50)
    
    # Normalize student solution
    normalized_solution = []
    for line in student_solution:
        normalized_line = normalize_math_expression(line)
        normalized_solution.append(normalized_line)
    
    # Parse student solution into mathematical content
    student_equations = []
    student_text = []
    
    for line in normalized_solution:
        line = line.strip()
        
        if "=" in line:
            student_equations.append(line)
        elif any(char in line for char in ["+", "-", "*", "/", "÷", "(", ")", "x", "²", "^", "±", "√", "sqrt"]):
            if len(line) > 2:
                student_equations.append(line)
        elif any(word in line.lower() for word in ["restriction", "excluded", "denominator", "multiply", "simplify", "expand", "solve", "check", "lhs", "rhs", "final", "answer"]):
            student_text.append(line)
        elif any(char.isdigit() for char in line) and len(line) > 3:
            student_equations.append(line)
        else:
            student_text.append(line)
    
    if len(student_equations) == 0 and len(student_text) == 0:
        print("⚠️  No solution lines detected. Trying to use student's final answer...")
        if student_answer.strip():
            student_equations.append(student_answer.strip())
            print(f"  📝 Added final answer as solution line: '{student_answer}'")
    
    for line in student_solution:
        line = line.strip()
        if "=" in line or any(char in line for char in ["+", "-", "*", "/", "x", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]):
            if line not in student_equations:
                student_equations.append(line)
    
    print(f"📊 Parsed {len(student_equations)} equations and {len(student_text)} text lines")
    
    # Check correctness silently
    answer_correct = False
    student_x = None
    
    try:
        clean_answer = student_answer.strip()
        clean_answer = clean_answer.replace('X', 'x')
        if clean_answer.startswith("x = "):
            clean_answer = clean_answer[4:]
        elif clean_answer.startswith("x="):
            clean_answer = clean_answer[2:]
        
        if "±" in clean_answer:
            clean_answer_plus = clean_answer.replace("±", "+")
            clean_answer_minus = clean_answer.replace("±", "-")
            
            try:
                clean_answer_plus = normalize_math_expression(clean_answer_plus)
                student_x = sp.sympify(clean_answer_plus)
            except:
                try:
                    clean_answer_minus = normalize_math_expression(clean_answer_minus)
                    student_x = sp.sympify(clean_answer_minus)
                except:
                    student_x = None
        else:
            clean_answer = normalize_math_expression(clean_answer)
            student_x = sp.sympify(clean_answer)
        
        if not student_x:
            for line in student_text + student_equations:
                if ("x =" in line or "x=" in line or 
                    "solution" in line.lower() or 
                    "answer" in line.lower() or
                    "final answer" in line.lower()):
                    try:
                        if "x =" in line:
                            math_part = line.split("x =", 1)[1].strip()
                        elif "x=" in line:
                            math_part = line.split("x=", 1)[1].strip()
                        else:
                            continue
                        
                        math_part = normalize_math_expression(math_part)
                        student_x = sp.sympify(math_part)
                        break
                    except:
                        continue
        
        if student_x:
            if denominators:
                simplified_lhs = sp.expand(sp.simplify(lhs * lcd))
                simplified_rhs = sp.expand(sp.simplify(rhs * lcd))
            else:
                simplified_lhs = lhs
                simplified_rhs = rhs
            
            standard_form = sp.expand(simplified_lhs - simplified_rhs)
            actual_solutions = sp.solve(standard_form, x)
            
            for actual_sol in actual_solutions:
                if abs(sp.N(student_x - actual_sol, 8)) < 1e-8:
                    answer_correct = True
                    break
                
    except Exception as e:
        pass
    
    # Show the step-by-step solution ONLY if answer is wrong
    if not answer_correct:
        print("\n🔍 STEP-BY-STEP SOLUTION (to help you learn)")
        print("─" * 50)
        
        try:
            print("📝 Step 1: Original equation")
            print(f"   {sp.sstr(lhs)} = {sp.sstr(rhs)}")
            
            if restrictions:
                print(f"\n📝 Step 2: Restrictions")
                print(f"   x ≠ {[sp.sstr(r) for r in restrictions]}")
            
            if denominators:
                print(f"\n📝 Step 3: Multiply both sides by LCD")
                print(f"   LCD = {sp.sstr(sp.factor(lcd))}")
                print(f"   {sp.sstr(sp.factor(lcd))} × ({sp.sstr(lhs)}) = {sp.sstr(sp.factor(lcd))} × ({sp.sstr(rhs)})")
                
                simplified_lhs = sp.expand(sp.simplify(lhs * lcd))
                simplified_rhs = sp.expand(sp.simplify(rhs * lcd))
                print(f"   {sp.sstr(simplified_lhs)} = {sp.sstr(simplified_rhs)}")
            else:
                print(f"\n📝 Step 3: No denominators to clear")
                simplified_lhs = lhs
                simplified_rhs = rhs
            
            print(f"\n📝 Step 4: Simplified equation")
            print(f"   {sp.sstr(simplified_lhs)} = {sp.sstr(simplified_rhs)}")
            
            print(f"\n📝 Step 5: Solve for x")
            standard_form = sp.expand(simplified_lhs - simplified_rhs)
            print(f"   {sp.sstr(simplified_lhs)} - {sp.sstr(simplified_rhs)} = 0")
            print(f"   {sp.sstr(standard_form)} = 0")
            
            actual_solutions = sp.solve(standard_form, x)
            print(f"\n📝 Step 6: Solutions")
            print(f"   x = {[sp.sstr(sol) for sol in actual_solutions]}")
            
        except Exception as e:
            print(f"❌ Error showing solution steps: {e}")
    else:
        print("\n🎉 Since your answer is correct, no need to show the solution steps!")
        print("   You've already solved it correctly! 🚀")
    
    # Final Assessment
    print("\n" + "=" * 70)
    print("                    📊 SOLUTION CORRECTNESS REPORT 📊")
    print("=" * 70)
    
    if answer_correct:
        print("🎉 EXCELLENT! Student's answer is correct!")
        print("✅ The solution checks out mathematically")
    else:
        print("❌ Student's answer is incorrect")
        print("💡 Double-check the algebra steps")
    
    print("\n" + "=" * 70)

def main_menu():
    """Main menu for the OCR-Integrated Solution Checker"""
    while True:
        print("\n" + "=" * 70)
        print("                    🔍 OCR-INTEGRATED SOLUTION CHECKER 🔍")
        print("=" * 70)
        print()
        print("📚 Choose an option:")
        print("   1️⃣  Check your own solution (with OCR support)")
        print("   2️⃣  Demo mode")
        print("   3️⃣  Exit")
        print()
        
        choice = input("🎯 Enter your choice (1-3): ").strip()
        
        if choice == "1":
            comprehensive_solution_checker_with_ocr()
            input("\n⏸️  Press Enter to continue...")
            
        elif choice == "2":
            print("\n" + "=" * 70)
            print("                    🎬 DEMO MODE - SHOWING CHECKER IN ACTION 🎬")
            print("=" * 70)
            print("This demo shows how the OCR-integrated checker works:")
            print()
            print("1. Draw an equation using the drawing interface")
            print("2. Use OCR to convert drawing to text")
            print("3. The checker automatically processes OCR output:")
            print("   - Removes 'Eq(...)' wrapper")
            print("   - Converts commas to equals signs")
            print("   - Cleans up extra parentheses")
            print("4. Enter your solution step by step")
            print("5. Get detailed feedback on your work")
            print()
            print("Example OCR output: 'Eq((x+5)/(x-2), (x-1)/(x-2) + 1)'")
            print("Processed to: '(x+5)/(x-2) = (x-1)/(x-2) + 1'")
            input("\n⏸️  Press Enter to continue...")
            
        elif choice == "3":
            print("\n👋 Thank you for using the OCR-Integrated Solution Checker!")
            print("Goodbye! 👋")
            break
            
        else:
            print("❌ Invalid choice. Please enter 1, 2, or 3.")
            input("\n⏸️  Press Enter to continue...")

if __name__ == "__main__":
    main_menu()

