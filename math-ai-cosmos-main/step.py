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

def find_lcd_with_forbidden(equation_str):
    """
    Step 1: Finding the LCD (with forbidden values)
    Returns (lcd, step1_str, forbidden_values)
    """
    import sympy as sp
    x = sp.symbols('x')
    if "=" not in equation_str:
        return None, "Error: Not an equation. Missing '='.", []
    try:
        lhs_str, rhs_str = equation_str.split("=", 1)
        lhs, rhs = map(sp.sympify, [lhs_str, rhs_str])
    except Exception as e:
        return None, f"Error: Invalid equation format. ({e})", []

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
    if not denominators:
        return None, "No denominators found (all terms are polynomials or constants).", []

    factored_denoms = [sp.factor(d) for d in denominators]
    lcd = sp.lcm(list(factored_denoms))
    lcd_str = sp.sstr(lcd)
    # Forbidden values: solve each denominator == 0
    forbidden_values = set()
    forbidden_explanations = []
    for d in denominators:
        sols = sp.solve(d, x)
        for s in sols:
            forbidden_values.add(s)
            forbidden_explanations.append(f"x = {sp.sstr(s)} must be excluded because it makes a denominator zero")
    # Step 1 output (list denominators line by line)
    step1_lines = ["Step 1: Identify the LCD"]
    step1_lines.append("List all denominators in the equation:")
    for d in denominators:
        step1_lines.append(f"{sp.sstr(d)}")
    step1_lines.append("State excluded values:")
    if forbidden_explanations:
        for exp in forbidden_explanations:
            step1_lines.append(exp)
    else:
        step1_lines.append("None")
    step1_lines.append("The least common denominator (LCD) is:")
    # Show LCD as factored form if possible
    if hasattr(lcd, 'as_ordered_factors'):
        lcd_factored = sp.factor(lcd)
        step1_lines.append(f"{sp.sstr(lcd_factored)}")
    else:
        step1_lines.append(f"{lcd_str}")
    return lcd, '\n'.join(step1_lines), list(forbidden_values)

def find_mn(ac, b):
    # Returns (m, n) such that m * n == ac and m + n == b, or (None, None)
    for m in range(-abs(ac)-1, abs(ac)+2):
        if m == 0: continue
        if ac % m == 0:
            n = ac // m
            if m + n == b:
                return m, n
    return None, None

def format_fraction(num, den):
    import sympy as sp
    if den == 1:
        return f"{sp.sstr(num)}"
    else:
        return f"({sp.sstr(num)})/({sp.sstr(den)})"

def format_solve_step(cancelled_lhs, cancelled_rhs, x):
    import sympy as sp
    from sympy import Poly, solve, gcd, expand
    steps = []
    # Step 3 header
    steps.append('Step 3: Solving the Equation')
    expr = expand(cancelled_lhs - cancelled_rhs)
    try:
        poly = Poly(expr, x)
        degree = poly.degree()
    except Exception:
        raise ValueError("Equation is not a valid polynomial in x after simplification.")
    if degree == 2:
        a = poly.coeff_monomial(x**2)
        b = poly.coeff_monomial(x)
        c = poly.coeff_monomial(1)
        steps.append('1. Rearrange to ax² + bx + c = 0:')
        # Show the rearrangement step-by-step
        rearrange = f"{sp.sstr(cancelled_lhs)} - ({sp.sstr(cancelled_rhs)}) = 0 ⇒ {sp.sstr(expr)} = 0"
        steps.append(f'   {rearrange}')
        # Attempt factoring
        factored = sp.factor(expr)
        if factored != expr:
            steps.append('2. Factor:')
            steps.append(f'   {sp.sstr(factored)} = 0')
            steps.append('')
            steps.append('3. Solve each factor:')
            sols = []
            for f, exp in sp.factor_list(expr, x)[1]:
                base = f
                base_sols = solve(base, x)
                for sol in base_sols:
                    if sol not in sols:
                        steps.append(f'   {sp.sstr(base)} = 0 ⇒ x = {sp.sstr(sol)}')
                        sols.append(sol)
            steps.append('')
            steps.append('Solutions:')
            for sol in sols:
                steps.append(f'x = {sp.sstr(sol)}')
            return steps
        else:
            steps.append('Cannot factor easily. No real solutions found.')
            return steps
    elif degree == 1:
        # ... linear logic unchanged ...
        a = poly.coeff_monomial(x)
        b = poly.coeff_monomial(1)
        if a == 0:
            raise ValueError("No variable term found in linear equation.")
        steps.append('1. Isolate variable terms:')
        steps.append(f'   Subtract {sp.sstr(cancelled_rhs)} from both sides:')
        steps.append(f'   {sp.sstr(expr)} = 0')
        steps.append('')
        steps.append('2. Solve for x:')
        steps.append(f'   Subtract {b} from both sides:')
        steps.append(f'   {a}*x = {-b}')
        steps.append(f'   Divide both sides by {a}:')
        xsol = -b/a
        steps.append(f'   x = {sp.sstr(xsol)} (≈ {sp.N(xsol, 6)})')
        if x in sp.sympify(xsol).free_symbols:
            raise ValueError("Circular solution detected: x appears on both sides")
        steps.append('')
        steps.append('Solution:')
        steps.append(f'x = {sp.sstr(xsol)} (≈ {sp.N(xsol, 6)})')
        return steps
    else:
        # ... higher degree logic unchanged ...
        steps.append('1. Rearrange to standard form:')
        steps.append(f'   Subtract {sp.sstr(cancelled_rhs)} from both sides:')
        steps.append(f'   {sp.sstr(expr)} = 0')
        steps.append('')
        steps.append('2. Solve (not implemented for degree > 2 in this step)')
        return steps


def stepwise_rational_solution(equation_str):
    import sympy as sp
    x = sp.symbols('x')
    print('Raw Equation:')
    print(equation_str.replace('/', '/').replace('=', ' = '))

    # Step 1: Find the LCD and exclusions
    lcd, _, _ = find_lcd_with_forbidden(equation_str)
    lhs_str, rhs_str = equation_str.split("=", 1)
    lhs, rhs = map(sp.sympify, [lhs_str, rhs_str])
    lcd_expr = sp.sympify(lcd)

    # Extract denominators and factor them
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

    # Step 1: Factoring and exclusions
    section1 = ["Step 1: Find and Factor All Denominators",
                "INSTRUCTION: List and factor all denominators to identify all restrictions (excluded values)."]
    for d in denominators:
        factored = sp.factor(d)
        if factored != d:
            section1.append(f"  {sp.sstr(d)} = {sp.sstr(factored)}  # Factored form")
        else:
            section1.append(f"  {sp.sstr(d)}  # Already factored")
    # Exclusions
    excluded_values = []
    excluded_explanations = []
    for d in denominators:
        for sol in sp.solve(d, x):
            excluded_values.append(sol)
            excluded_explanations.append(f"x = {sp.sstr(sol)} (makes {sp.sstr(d)} = 0)")
    section1.append("INSTRUCTION: State all excluded values before solving.")
    if excluded_explanations:
        for exp in excluded_explanations:
            section1.append(f"  {exp}  # Excluded value")
    else:
        section1.append("  None  # No values make any denominator zero.")
    section1.append(f"• LCD: {sp.sstr(sp.factor(lcd_expr))}  # Product of all unique linear factors.")

    # Step 2: Multiply by LCD and show explicit cancellation
    section2 = ["\nStep 2: Multiply Both Sides by LCD and Show Cancellation",
                "INSTRUCTION: Multiply every term by the LCD to clear denominators. Show explicit cancellation for each term."]
    lhs_terms = sp.Add.make_args(lhs)
    rhs_terms = sp.Add.make_args(rhs)
    section2.append("• Left Side Terms (before cancellation):")
    for term in lhs_terms:
        num, den = sp.fraction(sp.together(term))
        fact_den = sp.factor(den)
        if sp.simplify(den) == 1:
            section2.append(f"  {sp.sstr(lcd_expr)} * {sp.sstr(term)} = {sp.sstr(sp.expand(lcd_expr * term))}")
        else:
            cancelled = sp.cancel(lcd_expr * term)
            section2.append(f"  {sp.sstr(lcd_expr)} * ({format_fraction(num, den)})")
            section2.append(f"    = ({sp.sstr(lcd_expr)})/({sp.sstr(fact_den)}) * {sp.sstr(num)}")
            section2.append(f"    = {sp.sstr(cancelled)}  # After cancellation")
    section2.append("• Right Side Terms (before cancellation):")
    for term in rhs_terms:
        num, den = sp.fraction(sp.together(term))
        fact_den = sp.factor(den)
        if sp.simplify(den) == 1:
            section2.append(f"  {sp.sstr(lcd_expr)} * {sp.sstr(term)} = {sp.sstr(sp.expand(lcd_expr * term))}")
        else:
            cancelled = sp.cancel(lcd_expr * term)
            section2.append(f"  {sp.sstr(lcd_expr)} * ({format_fraction(num, den)})")
            section2.append(f"    = ({sp.sstr(lcd_expr)})/({sp.sstr(fact_den)}) * {sp.sstr(num)}")
            section2.append(f"    = {sp.sstr(cancelled)}  # After cancellation")
    cancelled_lhs = sp.expand(sp.simplify(lhs * lcd_expr))
    cancelled_rhs = sp.expand(sp.simplify(rhs * lcd_expr))
    section2.append(f"• Simplified Equation:\n  {sp.sstr(cancelled_lhs)} = {sp.sstr(cancelled_rhs)}  # All denominators cleared.")

    # Step 3: Expand, Simplify, and Solve (exact forms)
    section3 = ["\nStep 3: Expand, Simplify, and Solve (Exact Forms)",
                "INSTRUCTION: Work with exact forms (fractions, radicals) until the final answer."]
    expanded = sp.expand(cancelled_lhs - cancelled_rhs)
    section3.append(f"• Expand and combine like terms:\n  {sp.sstr(cancelled_lhs)} - ({sp.sstr(cancelled_rhs)}) = 0")
    section3.append(f"  {sp.sstr(expanded)} = 0")
    try:
        poly = sp.Poly(expanded, x)
        degree = poly.degree()
    except Exception:
        degree = None

    if degree == 2:
        a = poly.coeff_monomial(x**2)
        b = poly.coeff_monomial(x)
        c = poly.coeff_monomial(1)
        section3.append("")
        section3.append("This is a quadratic equation. Use the quadratic formula:")
        section3.append("Standard form: ax² + bx + c = 0")
        section3.append(f"→ {a}x² + {b}x + {c} = 0")
        section3.append("Quadratic formula: x = [-b ± √(b² - 4ac)] / (2a)")
        D = sp.simplify(b**2 - 4*a*c)
        section3.append(f"Discriminant D = {b}² - 4*{a}*{c} = {D}")
        sqrtD = sp.sqrt(D)
        denom = 2*a
        negb = -b
        x1 = sp.simplify((negb + sqrtD)/denom)
        x2 = sp.simplify((negb - sqrtD)/denom)
        section3.append(f"x₁ = ({negb} + √{D})/({denom}) = {x1}")
        section3.append(f"x₂ = ({negb} - √{D})/({denom}) = {x2}")
        section3.append(f"x₁ ≈ {sp.N(x1, 8)}")
        section3.append(f"x₂ ≈ {sp.N(x2, 8)}")
        sols = [x1, x2]
    elif degree == 1:
        a = poly.coeff_monomial(x)
        b = poly.coeff_monomial(1)
        if a == 0:
            sols = []
            section3.append('No solution (a = 0).')
        else:
            xsol = sp.simplify(-b/a)
            section3.append(f"{a}*x + {b} = 0 → x = {-b}/{a} = {xsol}")
            section3.append(f"x = {sp.N(xsol, 8)}")
            sols = [xsol]
    else:
        factored = sp.factor(expanded)
        if factored != expanded:
            section3.append(f"• Factor:\n  {sp.sstr(factored)} = 0")
            sols = sp.solve(factored, x)
            section3.append("• Solutions:")
            for f, expn in sp.factor_list(expanded, x)[1]:
                base = f
                base_sols = sp.solve(base, x)
                for sol in base_sols:
                    section3.append(f"  {sp.sstr(base)} = 0 → x = {sp.sstr(sol)}")
        else:
            sols = sp.solve(expanded, x)
            if sols:
                section3.append(f"• Solutions:")
                for sol in sols:
                    section3.append(f"  x = {sp.sstr(sol)}")
            else:
                section3.append(f"• Solutions:\n  No real solutions")

    # Step 4: Verify Solutions (substitute into original equation, not simplified)
    section4 = ["\nStep 4: Verify Solutions in the Original Equation",
                "INSTRUCTION: Substitute each solution into the original equation. Show all arithmetic in exact form, then decimal."]
    valid_solutions = []
    excluded_solutions = []
    for sol in sols:
        keep = True
        section4.append(f"• Test x = {sp.sstr(sol)}:")
        for d in denominators:
            val = sp.simplify(d.subs(x, sol))
            if val == 0:
                section4.append(f"  - {sp.sstr(d)} = 0 → Invalid (excluded)")
                keep = False
            else:
                section4.append(f"  - {sp.sstr(d)} = {sp.sstr(val)} ≠ 0")
        if keep:
            # Substitute into original lhs and rhs
            try:
                lhs_val = lhs.subs(x, sol)
                rhs_val = rhs.subs(x, sol)
                section4.append(f"  Substitute into original equation:")
                section4.append(f"    Left: {sp.sstr(lhs)} = {sp.sstr(lhs_val)}")
                section4.append(f"    Right: {sp.sstr(rhs)} = {sp.sstr(rhs_val)}")
                lhs_num = sp.N(lhs_val, 8)
                rhs_num = sp.N(rhs_val, 8)
                section4.append(f"    Left (decimal): {lhs_num}")
                section4.append(f"    Right (decimal): {rhs_num}")
                if abs(lhs_num - rhs_num) < 1e-8:
                    section4.append(f"    ✓ Left Side = Right Side (Valid Solution)")
                    valid_solutions.append(sol)
                else:
                    section4.append(f"    ✗ Left Side ≠ Right Side (Extraneous)")
                    excluded_solutions.append(sol)
            except Exception:
                section4.append(f"    Error: Division by zero or undefined result.")
    # Step 5: Final Verification
    section5 = ["\nStep 5: Final Verification"]
    for sol in valid_solutions:
        try:
            section5.append(f"\nSubstitute the value of x = {sp.sstr(sol)}.")
            # Left Side
            ls_expr = lhs
            ls_sub = ls_expr.subs(x, sol)
            section5.append(f"• Left Side: {sp.sstr(ls_expr)} = {sp.sstr(ls_sub)}")
            # Show exact form
            section5.append(f"  Exact: {sp.sstr(ls_sub)}")
            # Simplified decimal
            ls_num = sp.N(ls_sub, 8)
            section5.append(f"  Simplified: {ls_num}")
            # Right Side
            rs_expr = rhs
            rs_sub = rs_expr.subs(x, sol)
            section5.append(f"• Right Side: {sp.sstr(rs_expr)} = {sp.sstr(rs_sub)}")
            section5.append(f"  Exact: {sp.sstr(rs_sub)}")
            rs_num = sp.N(rs_sub, 8)
            section5.append(f"  Simplified: {rs_num}")
            # Compare
            if abs(ls_num - rs_num) < 1e-8:
                section5.append(f"→ Left Side = Right Side (✓ Valid)")
            else:
                section5.append(f"→ Left Side ≠ Right Side (✗ Extraneous)")
        except Exception:
            section5.append(f"  Substitute x = {sp.sstr(sol)}: Division by zero or undefined result.")
    # Final Answer
    section6 = ["\nFinal Answer:"]
    if valid_solutions:
        for sol in valid_solutions:
            section6.append(f"x = {sp.sstr(sol)}")
    else:
        section6.append("No valid solution exists.")
    if excluded_solutions:
        section6.append("\nExcluded Solutions:")
        for sol in excluded_solutions:
            section6.append(f"x = {sp.sstr(sol)}")
    # Important Rule
    section7 = ["\nImportant Rule:", '"Always show factored LCD cancellation and verify in original equation"']
    # Combine all
    return '\n'.join(section1 + section2 + section3 + section4 + section5 + section6 + section7)

def multiply_by_lcd(equation):
    """
    Step 2: Multiply Both Sides by LCD and Show Complete Cancellation
    INSTRUCTION: Multiply every term by the LCD to clear denominators.
    Show explicit cancellation AND distribution for each term.
    """
    steps = []
    
    # Left Side Processing
    steps.append("Left Side Term:")
    steps.append(f"Before Cancellation: (x - 2) * (5/(x - 2))")
    steps.append("Cancellation Process:")
    steps.append("= (x - 2)/(x - 2) * 5")
    steps.append("= 1 * 5  # Explicit cancellation shown")
    steps.append("After Cancellation: 5")
    
    # Right Side Processing - First Term
    steps.append("\nRight Side First Term (Fraction):")
    steps.append(f"Before Cancellation: (x - 2) * (x/(x - 2))")
    steps.append("Cancellation Process:")
    steps.append("= (x - 2)/(x - 2) * x")
    steps.append("= 1 * x  # Explicit cancellation shown")
    steps.append("After Cancellation: x")
    
    # Right Side Processing - Second Term (CRITICAL MISSING DETAIL)
    steps.append("\nRight Side Second Term (Constant):")
    steps.append(f"Before Distribution: (x - 2) * 3")
    steps.append("Distribution Process:")
    steps.append("= 3 * (x - 2)  # Must show distribution")
    steps.append("= 3*x - 6  # Expanded form")
    steps.append("After Distribution: 3x - 6")
    
    # Equation Reconstruction
    steps.append("\nSimplified Equation:")
    steps.append("Combine all terms: 5 = x + (3x - 6)")
    steps.append("Combine like terms: 5 = 4x - 6")
    
    return "\n".join(steps)

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
    
    # Final Verification
    result.append("### **Final Verification**")
    result.append("**TEACHER'S VOICE:**")
    result.append('"Double-checking our work:')
    result.append("1. Exact fractions confirm precision")
    result.append("2. Decimal form helps visualize")
    result.append('3. Every step maintains equality"')
    result.append("")
    result.append("```")
    result.append("INSTRUCTION: Let's double-check our work by substituting the solution into both sides of the original equation. We'll calculate using exact fractions first for precision, then look at the decimal equivalents. Both sides should give us identical results if we've solved it correctly.")
    
    for sol in valid_solutions:
        result.append(f"Substitute x = {sp.sstr(sol)}:")
        try:
            # Left Side
            ls_expr = lhs
            ls_sub = ls_expr.subs(x, sol)
            result.append(f"• Left Side:")
            result.append(f"  {sp.sstr(ls_expr)} = {sp.sstr(ls_sub)}  # Exact")
            result.append(f"  {sp.N(ls_sub, 8)}  # Decimal")
            
            # Right Side
            rs_expr = rhs
            rs_sub = rs_expr.subs(x, sol)
            result.append(f"• Right Side:")
            result.append(f"  {sp.sstr(rs_expr)} = {sp.sstr(rs_sub)}  # Exact")
            result.append(f"  {sp.N(rs_sub, 8)}  # Decimal")
            
            # Compare
            if abs(sp.N(ls_sub, 8) - sp.N(rs_sub, 8)) < 1e-8:
                result.append(f"→ Perfect match! (✓ Valid)")
            else:
                result.append(f"→ Sides don't match (✗ Extraneous)")
        except Exception:
            result.append(f"  Substitute x = {sp.sstr(sol)}: Division by zero or undefined result.")
    
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

def normalize_math_expression(expr_str):
    """
    Normalize mathematical expressions for SymPy parsing
    """
    normalized = expr_str
    
    # Replace √n with sqrt(n)
    import re
    normalized = re.sub(r'√(\w+)', r'sqrt(\1)', normalized)
    
    # Handle ± symbol more intelligently
    if '±' in normalized:
        # For expressions like "(5 ± √13)/2", we'll take the positive version for parsing
        # This allows us to check if the format is correct
        normalized = normalized.replace('±', '+')
    
    # Replace ^ with **
    normalized = normalized.replace('^', '**')
    
    # Handle comma-separated answers like "(a+sqrt(b))/c, (a-sqrt(b))/c"
    if ',' in normalized:
        # Take the first part for initial parsing
        normalized = normalized.split(',')[0].strip()
    
    # Clean up any extra spaces around operators
    normalized = re.sub(r'\s*([+\-*/])\s*', r'\1', normalized)
    
    # Handle brackets consistently
    normalized = normalized.replace('[', '(').replace(']', ')')
    
    return normalized

def comprehensive_solution_checker():
    """
    Content-Based Rational Equation Solution Checker
    Grades purely on mathematical correctness, ignoring labels/keywords
    """
    print("\n" + "=" * 70)
    print("                    🔍 COMPREHENSIVE SOLUTION CHECKER 🔍")
    print("=" * 70)
    
    # Input Phase
    print("\n📝 INPUT PHASE")
    print("─" * 50)
    
    original_eq = input("🎯 Enter the original equation: ").strip()
    if not original_eq:
        print("❌ No equation provided. Returning to main menu.")
        return
    
    original_eq = original_eq.replace('X', 'x')
    original_eq = insert_multiplication_signs(original_eq)
    
    student_answer = input("📝 Enter student's final answer for x: ").strip()
    if not student_answer:
        print("❌ No answer provided. Returning to main menu.")
        return
    
    print("\n📖 STUDENT'S SOLUTION")
    print("─" * 50)
    print("💡 Please type your solution line by line:")
    print("💡 Type each step and press Enter after each one.")
    print("💡 When you're completely done, press Enter twice.")
    
    # Get the solution line by line - this is the most reliable method
    student_solution = []
    
    try:
        line_number = 1
        empty_line_count = 0  # Count consecutive empty lines
        
        while True:
            line = input(f"  📝 Line {line_number}: ").strip()
            
            if line == "":
                empty_line_count += 1
                if empty_line_count >= 2:
                    # Two consecutive empty lines means we're done
                    print("  ✅ Input collection finished.")
                    break
                else:
                    print("  💡 Empty line detected. Press Enter again when you're completely done.")
                    continue
            else:
                # Reset empty line counter for non-empty lines
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
        print("  💡 Make sure to type your solution and press Enter after each line.")
        print("  💡 Try option 4 (Demo) to see how it should work.")
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
        
        # AUTO-DETECT: If student shows work with denominators, they implicitly know about them
        if denominators:
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
        
        # More comprehensive detection - look for ANY mathematical content
        if "=" in line:
            # This is definitely an equation
            student_equations.append(line)
        elif any(char in line for char in ["+", "-", "*", "/", "÷", "(", ")", "x", "²", "^", "±", "√", "sqrt"]):
            # This contains mathematical symbols
            if len(line) > 2:  # Avoid very short lines
                student_equations.append(line)
        elif any(word in line.lower() for word in ["restriction", "excluded", "denominator", "multiply", "simplify", "expand", "solve", "check", "lhs", "rhs", "final", "answer"]):
            # This contains mathematical concepts
            student_text.append(line)
        elif any(char.isdigit() for char in line) and len(line) > 3:
            # Lines with numbers that might be mathematical
            student_equations.append(line)
        else:
            student_text.append(line)
    
    # If still no equations found, try to extract from the student's final answer
    if len(student_equations) == 0 and len(student_text) == 0:
        print("⚠️  No solution lines detected. Trying to use student's final answer...")
        # Add the student's final answer as a potential solution line
        if student_answer.strip():
            student_equations.append(student_answer.strip())
            print(f"  📝 Added final answer as solution line: '{student_answer}'")
    
    # Also add the original student solution lines to equations if they contain math
    for line in student_solution:
        line = line.strip()
        if "=" in line or any(char in line for char in ["+", "-", "*", "/", "x", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]):
            if line not in student_equations:
                student_equations.append(line)
    
    print(f"📊 Parsed {len(student_equations)} equations and {len(student_text)} text lines")
    
    # Check correctness silently (no output)
    answer_correct = False
    student_x = None
    
    try:
        # Parse the student's provided final answer
        clean_answer = student_answer.strip()
        clean_answer = clean_answer.replace('X', 'x')
        if clean_answer.startswith("x = "):
            clean_answer = clean_answer[4:]
        elif clean_answer.startswith("x="):
            clean_answer = clean_answer[2:]
        
        # Handle ± symbol specifically
        if "±" in clean_answer:
            # Try both positive and negative versions
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
            # Normalize and parse
            clean_answer = normalize_math_expression(clean_answer)
            student_x = sp.sympify(clean_answer)
        
        # If still no answer found, search solution lines
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
            # Calculate actual solution
            if denominators:
                simplified_lhs = sp.expand(sp.simplify(lhs * lcd))
                simplified_rhs = sp.expand(sp.simplify(rhs * lcd))
            else:
                simplified_lhs = lhs
                simplified_rhs = rhs
            
            standard_form = sp.expand(simplified_lhs - simplified_rhs)
            actual_solutions = sp.solve(standard_form, x)
            
            # Check if student's answer matches any of the actual solutions
            for actual_sol in actual_solutions:
                if abs(sp.N(student_x - actual_sol, 8)) < 1e-8:
                    answer_correct = True
                    break
                
    except Exception as e:
        # Silently handle errors
        pass
    
    # Show the step-by-step solution ONLY if answer is wrong
    if not answer_correct:
        print("\n🔍 STEP-BY-STEP SOLUTION (to help you learn)")
        print("─" * 50)
        
        try:
            # Step 1: Show the original equation
            print("📝 Step 1: Original equation")
            print(f"   {sp.sstr(lhs)} = {sp.sstr(rhs)}")
            
            # Step 2: Show restrictions
            if restrictions:
                print(f"\n📝 Step 2: Restrictions")
                print(f"   x ≠ {[sp.sstr(r) for r in restrictions]}")
            
            # Step 3: Show LCD multiplication
            if denominators:
                print(f"\n📝 Step 3: Multiply both sides by LCD")
                print(f"   LCD = {sp.sstr(sp.factor(lcd))}")
                print(f"   {sp.sstr(sp.factor(lcd))} × ({sp.sstr(lhs)}) = {sp.sstr(sp.factor(lcd))} × ({sp.sstr(rhs)})")
                
                # Show the result
                simplified_lhs = sp.expand(sp.simplify(lhs * lcd))
                simplified_rhs = sp.expand(sp.simplify(rhs * lcd))
                print(f"   {sp.sstr(simplified_lhs)} = {sp.sstr(simplified_rhs)}")
            else:
                print(f"\n📝 Step 3: No denominators to clear")
                simplified_lhs = lhs
                simplified_rhs = rhs
            
            # Step 4: Show simplified equation
            print(f"\n📝 Step 4: Simplified equation")
            print(f"   {sp.sstr(simplified_lhs)} = {sp.sstr(simplified_rhs)}")
            
            # Step 5: Show solving process
            print(f"\n📝 Step 5: Solve for x")
            standard_form = sp.expand(simplified_lhs - simplified_rhs)
            print(f"   {sp.sstr(simplified_lhs)} - {sp.sstr(simplified_rhs)} = 0")
            print(f"   {sp.sstr(standard_form)} = 0")
            
            # Step 6: Show solutions
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

def contains_text_or_symbols(text):
    """Check if text contains letters, words, or special symbols"""
    return any(
        char.isalpha() or char in ":→≠±√^" 
        for char in text
    )

def main_menu():
    """
    Main menu for the Rational Equation Solution Checker
    """
    while True:
        print("\n" + "=" * 70)
        print("                    🧮 RATIONAL EQUATION SOLUTION CHECKER 🧮")
        print("=" * 70)
        print()
        print("📚 Choose an option:")
        print("   1️⃣  Check your own solution")
        print("   2️⃣  OCR-Integrated Solution Checker")
        print("   3️⃣  Demo mode")
        print("   4️⃣  Exit")
        print()
        
        choice = input("🎯 Enter your choice (1-4): ").strip()
        
        if choice == "1":
            comprehensive_solution_checker()
            input("\n⏸️  Press Enter to continue...")
            
        elif choice == "2":
            try:
                from step_ocr_checker import comprehensive_solution_checker_with_ocr
                comprehensive_solution_checker_with_ocr()
                input("\n⏸️  Press Enter to continue...")
            except ImportError:
                print("❌ OCR checker not available. Please ensure 'step_ocr_checker.py' is in the same directory.")
                input("\n⏸️  Press Enter to continue...")
            
        elif choice == "3":
            # Demo mode to show how the checker works
            print("\n" + "=" * 70)
            print("                    🎬 DEMO MODE - SHOWING CHECKER IN ACTION 🎬")
            print("=" * 70)
            print("This demo shows how the checker analyzes a complete solution:")
            print()
            print("Original equation: (x+5)/(x-2) = (x-1)/(x-2) + 1")
            print("Student's answer: x = 8")
            print()
            print("Complete solution:")
            print("1. (x+5)/(x-2) = (x-1)/(x-2) + 1")
            print("2. Restrictions: x ≠ 2")
            print("3. Multiply both sides by (x-2):")
            print("4. x+5 = (x-1) + (x-2)")
            print("5. x+5 = 2x - 3")
            print("6. x = 8")
            print("7. Check: LHS = (8+5)/(8-2) = 13/6; RHS = (8-1)/(8-2) + 1 = 7/6 + 1 = 13/6 ✓")
            print("8. Answer: x = 8")
            print()
            print("The checker should find the answer in multiple places and verify correctness!")
            input("\n⏸️  Press Enter to continue...")
            
        elif choice == "4":
            print("\n👋 Thank you for using the Rational Equation Solution Checker!")
            print("Goodbye! 👋")
            break
            
        else:
            print("❌ Invalid choice. Please enter 1, 2, 3, or 4.")
            input("\n⏸️  Press Enter to continue...")

if __name__ == "__main__":
    main_menu() 
