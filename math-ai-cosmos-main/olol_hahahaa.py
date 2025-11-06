import re
from sympy import sympify, Poly, simplify, together, symbols, degree, denom, S, lcm, factor, Poly
from sympy.core.function import AppliedUndef
from sympy.core import Function
from sympy import sin, cos, tan, sqrt, log, exp

def insert_multiplication_signs(equation_str):
    # Insert * between a number and a variable (e.g., 2x -> 2*x)
    equation_str = re.sub(r'(\d)([a-zA-Z])', r'\1*\2', equation_str)
    # Insert * between a variable and another variable (e.g., xy -> x*y)
    equation_str = re.sub(r'([a-zA-Z])([a-zA-Z])', r'\1*\2', equation_str)
    # Insert * between a variable and a number (e.g., x2 -> x*2)
    equation_str = re.sub(r'([a-zA-Z])(\d)', r'\1*\2', equation_str)
    return equation_str

def contains_forbidden_functions(expr):
    # Recursively check for forbidden functions (non-polynomial)
    forbidden = (sin, cos, tan, sqrt, log, exp)
    if expr.has(*forbidden):
        return True
    # Also check for undefined functions
    if any(isinstance(a, (Function, AppliedUndef)) for a in expr.atoms(Function)):
        return True
    return False

def validate_rational_equation(equation_str):
    """
    Validates if the input string is a rational equation that can be solved symbolically.
    Returns (True/False, message) depending on validity and reason.
    """
    x = symbols('x')

    # Step 1: Check if input is an equation
    if "=" not in equation_str:
        return False, "Error: Not an equation. Missing '='."

    # Step 2: Check if both sides are rational functions
    try:
        lhs_str, rhs_str = equation_str.split("=", 1)
        lhs, rhs = map(sympify, [lhs_str, rhs_str])
        for expr in [lhs, rhs]:
            num, den = together(expr).as_numer_denom()
            # Check for forbidden functions (sqrt, sin, etc.)
            if contains_forbidden_functions(num) or contains_forbidden_functions(den):
                return False, "Error: Not a rational equation (contains non-polynomial functions)."
            # Check if numerator and denominator are polynomials in x
            if num.as_poly(x) is None or den.as_poly(x) is None:
                return False, "Error: Not a rational equation (must be a fraction of polynomials in x)."
            # Check denominator is not identically zero
            if den.equals(0):
                return False, "Error: Denominator is identically zero."
    except Exception as e:
        return False, f"Error: Invalid equation format. ({e})"

    # Step 3: Check for identity/contradiction
    try:
        simplified = simplify(lhs - rhs)
        if simplified == 0:
            return True, "This equation is always true (infinite solutions)."
        elif simplified.is_Number and simplified != 0:
            return False, "This equation has no solution (contradiction)."
    except Exception as e:
        return False, f"Error during simplification: {e}"

    # Step 4: Check if denominators restrict solutions
    try:
        denominators = [denom(together(expr)) for expr in [lhs, rhs]]
        # If all denominators are constant (degree 0), proceed
        if all(d.as_poly(x) is not None and degree(d, x) == 0 for d in denominators):
            return True, "Valid rational equation (constant denominators)."
        else:
            return True, "Valid rational equation (proceed with solving, check for extraneous solutions)."
    except Exception as e:
        return False, f"Error checking denominators: {e}"

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
    
    # Validation
    valid, message = validate_rational_equation(equation_str)
    result.append("")
    result.append("---")
    
    # Raw Equation
    result.append("### **Raw Equation:**")
    result.append(f"{equation_str.replace('/', '/').replace('=', ' = ')}")
    result.append("*(We're solving for x in this fraction equation)*")
    result.append("")
    result.append("---")
    
    # Extract denominators first (before using them in teacher's voice)
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
    
    # Dynamic teacher explanation based on actual equation
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
        if len(den_list) == 2:
            result.append('"Let\'s look carefully at all bottom parts (denominators):')
            result.append(f"1. There are two fractions here, with {den_list[0]} and {den_list[1]} at the bottom")
            result.append("2. Since these are already simple, we don't need to factor them further")
            result.append('3. Any constant terms have an invisible denominator of 1"')
        else:
            result.append('"Let\'s look carefully at all bottom parts (denominators):')
            result.append(f"1. There are {len(den_list)} fractions with different denominators")
            result.append(f"2. The denominators are: {', '.join(den_list)}")
            result.append("3. Since these are already simple, we don't need to factor them further")
            result.append('4. Any constant terms have an invisible denominator of 1"')
    
    result.append("")
    
    result.append("```")
    result.append("INSTRUCTION: First, let's examine all the denominators in our equation - these are the bottom parts of our fractions. We have two simple denominators here that can't be factored further. Remember, we must also identify any x-values that would make these denominators zero, as those would make our equation undefined.")
    for d in denominators:
        result.append(f"  {sp.sstr(d)}  # Already in simplest form")
    
    # Excluded values
    excluded_values = []
    excluded_explanations = []
    for d in denominators:
        for sol in sp.solve(d, x):
            excluded_values.append(sol)
            excluded_explanations.append(f"x = {sp.sstr(sol)} (because 5/0 is undefined)  # Never allowed")
    
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
    
    # Dynamic teacher explanation for Step 2
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
    result.append("INSTRUCTION: To make this easier to work with, we'll multiply every single term by our least common denominator (LCD). This will clear all the fractions. Watch carefully how each fraction simplifies when we do this multiplication - the denominators will cancel out beautifully!")
    
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
                result.append(f"  {sp.sstr(lcd_factored)} * ({format_fraction(num, den)})")
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
                result.append(f"    {sp.sstr(lcd_factored)} * ({format_fraction(num, den)})")
                result.append(f"    = {sp.sstr(lcd_expr)} * {sp.sstr(num)} / {sp.sstr(den)}")
                result.append(f"    = {sp.sstr(cancelled)}  # After cancellation")
        
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
    
    # Dynamic teacher explanation for Step 3
    try:
        poly = sp.Poly(expanded, x)
        degree = poly.degree()
        if degree == 1:
            result.append('"Now we solve like a regular linear algebra problem:')
            result.append("1. Combine like terms on both sides")
            result.append("2. Move variable terms to one side, constants to the other")
            result.append('3. Divide by the coefficient of x"')
        elif degree == 2:
            result.append('"Now we solve like a regular quadratic algebra problem:')
            result.append("1. Combine like terms to get standard form ax² + bx + c = 0")
            result.append("2. Use the quadratic formula or factoring")
            result.append('3. Check for real solutions"')
        else:
            result.append('"Now we solve this polynomial equation:')
            result.append("1. Combine like terms to get standard form")
            result.append("2. Use appropriate solving methods")
            result.append('3. Check for valid solutions"')
    except Exception:
        result.append('"Now we solve this equation:')
        result.append("1. Combine like terms on both sides")
        result.append("2. Isolate the variable")
        result.append('3. Check for valid solutions"')
    
    result.append("")
    result.append("```")
    result.append("INSTRUCTION: Now that we've eliminated the fractions, we have a cleaner equation to work with. Let's gather all the x terms on one side and the constant numbers on the other. Remember to perform the same operation on both sides to keep the equation balanced. Our goal is to isolate x to find its value.")
    
    expanded = sp.expand(cancelled_lhs - cancelled_rhs)
    result.append(f"• Combine like terms:")
    result.append(f"  {sp.sstr(cancelled_lhs)} = {sp.sstr(cancelled_rhs)}  # We combined x + 3x")
    
    try:
        poly = sp.Poly(expanded, x)
        degree = poly.degree()
        
        if degree == 1:
            a = poly.coeff_monomial(x)
            b = poly.coeff_monomial(1)
            if a != 0:
                xsol = sp.simplify(-b/a)
                result.append("• Move terms:")
                result.append(f"  {sp.sstr(-b)} = {sp.sstr(a)}*x  # Added 6 to both sides")
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
    
    # Dynamic teacher explanation for Step 4
    if len(sols) == 1:
        sol_str = sp.sstr(sols[0])
        result.append(f'"Let\'s test x = {sol_str} in the original equation:')
        result.append("1. Calculate left side by substituting the value")
        result.append("2. Calculate right side by substituting the value")
        result.append('3. Both sides should give the same result"')
    elif len(sols) > 1:
        result.append('"Let\'s test each solution in the original equation:')
        result.append("1. Calculate left side for each solution")
        result.append("2. Calculate right side for each solution")
        result.append('3. Both sides should give the same result for valid solutions"')
    else:
        result.append('"Let\'s verify our work:')
        result.append("1. Check if any solutions were found")
        result.append("2. Verify that denominators are not zero")
        result.append('3. Confirm the mathematical validity"')
    
    result.append("")
    result.append("```")
    result.append("INSTRUCTION: It's crucial to verify our answer by plugging it back into the original equation. This ensures our solution doesn't make any denominators zero and that both sides of the equation balance correctly. Let's calculate both sides carefully to confirm our answer works.")
    
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

def format_fraction(num, den):
    import sympy as sp
    if den == 1:
        return f"{sp.sstr(num)}"
    else:
        return f"({sp.sstr(num)})/({sp.sstr(den)})"

if __name__ == "__main__":
    eq = input("Enter a rational equation to validate: ")
    eq = eq.replace('X', 'x')  # <-- Add this line
    eq = insert_multiplication_signs(eq)
    valid, message = validate_rational_equation(eq)
    if isinstance(message, str) and "object is not callable" in message:
        print("\nHint: It looks like you wrote something like '1(x-2)' instead of '1/(x-2)'.\nPlease use '/' for division and '*' for multiplication. For example: 1/(x-2) or 2*x.")
    if not message.startswith("Error: Not a rational equation") and not message.startswith("Error: Invalid equation format") and not message.startswith("Error: Not an equation"):
        print(stepwise_rational_solution_with_explanations(eq))


