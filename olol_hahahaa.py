import re
import sympy as sp
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


def extract_denominators(expr):
    """Return a set of denominators (in factored form) present in an expression."""
    denoms = set()
    expr = sp.sympify(expr)
    if expr.is_Add:
        for arg in expr.args:
            denoms.update(extract_denominators(arg))
    else:
        _, den = sp.fraction(sp.together(expr))
        if den.is_Mul:
            for factor in den.args:
                denoms.add(sp.factor(factor))
        else:
            denoms.add(sp.factor(den))
    return denoms


def _append_unique(seq, value):
    """Append SymPy value if not already present (up to symbolic equality)."""
    for existing in seq:
        if sp.simplify(value - existing) == 0:
            return
    seq.append(value)


def _normalize_solutions(solutions, symbol):
    """Normalize sympy.solve outputs into a flat list of expressions for the given symbol."""
    if solutions is None:
        return []
    if isinstance(solutions, dict):
        val = solutions.get(symbol)
        return [val] if val is not None else []
    if not isinstance(solutions, (list, tuple, set)):
        return [solutions]

    result = []
    for item in solutions:
        if isinstance(item, dict):
            if symbol in item and item[symbol] is not None:
                result.append(item[symbol])
        elif isinstance(item, (list, tuple)) and len(item) == 2 and isinstance(item[0], sp.Symbol):
            # handle [(x, value)] style
            sym, val = item
            if sym == symbol:
                result.append(val)
        else:
            result.append(item)
    return result


def compute_rational_solution_data(equation_str):
    """Compute structured data describing the rational equation solving process."""
    x = sp.symbols('x')
    valid, message = validate_rational_equation(equation_str)
    if not valid:
        raise ValueError(message)

    lhs_str, rhs_str = equation_str.split("=", 1)
    lhs = sp.sympify(lhs_str)
    rhs = sp.sympify(rhs_str)

    denominators = extract_denominators(lhs) | extract_denominators(rhs)
    simplified_denoms = []
    for den in denominators:
        den_simplified = sp.simplify(den)
        if den_simplified == 0:
            continue
        if den_simplified == 1:
            continue
        _append_unique(simplified_denoms, den_simplified)

    simplified_denoms.sort(key=sp.sstr)

    excluded_values = []
    for den in simplified_denoms:
        for sol in sp.solve(sp.Eq(den, 0), x):
            _append_unique(excluded_values, sp.simplify(sol))

    lcd = sp.Integer(1)
    if simplified_denoms:
        lcd = sp.lcm([sp.factor(den) for den in simplified_denoms])

    cleared_lhs = sp.expand(sp.simplify(lhs * lcd))
    cleared_rhs = sp.expand(sp.simplify(rhs * lcd))
    polynomial_expr = sp.expand(cleared_lhs - cleared_rhs)

    raw_solutions = _normalize_solutions(sp.solve(sp.Eq(cleared_lhs, cleared_rhs), x), x)

    valid_solutions = []
    extraneous_solutions = []
    for sol in raw_solutions:
        if any(sp.simplify(den.subs(x, sol)) == 0 for den in simplified_denoms):
            _append_unique(extraneous_solutions, sp.simplify(sol))
        else:
            _append_unique(valid_solutions, sp.simplify(sol))

    verification = []
    for sol in valid_solutions:
        lhs_val = sp.simplify(lhs.subs(x, sol))
        rhs_val = sp.simplify(rhs.subs(x, sol))
        try:
            lhs_eval = lhs.subs(x, sol)
            rhs_eval = rhs.subs(x, sol)
            satisfies = sp.simplify(lhs_eval - rhs_eval) == 0
        except Exception:
            satisfies = False
            lhs_eval = lhs_val
            rhs_eval = rhs_val
        verification.append({
            'solution': sol,
            'lhs_expr': lhs,
            'rhs_expr': rhs,
            'lhs_eval': lhs_eval,
            'rhs_eval': rhs_eval,
            'lhs': lhs_val,
            'rhs': rhs_val,
            'satisfies': satisfies,
        })

    return {
        'lhs': lhs,
        'rhs': rhs,
        'symbol': x,
        'denominators': simplified_denoms,
        'excluded_values': excluded_values,
        'lcd': lcd,
        'cleared_lhs': cleared_lhs,
        'cleared_rhs': cleared_rhs,
        'polynomial': polynomial_expr,
        'raw_solutions': raw_solutions,
        'valid_solutions': valid_solutions,
        'extraneous_solutions': extraneous_solutions,
        'verification': verification,
        'validation_message': message,
    }


def stepwise_rational_solution_concise(equation_str):
    """Generate a concise, explanation-free textual solution."""
    data = compute_rational_solution_data(equation_str)
    lines = []

    lines.append("Step 1: Original equation")
    lines.append(f"  {sp.sstr(data['lhs'])} = {sp.sstr(data['rhs'])}")

    if data['denominators']:
        lines.append("Step 2: Least common denominator")
        lines.append(f"  LCD = {sp.sstr(data['lcd'])}")
        lines.append("  After clearing denominators:")
        lines.append(f"    {sp.sstr(data['cleared_lhs'])} = {sp.sstr(data['cleared_rhs'])}")
    else:
        lines.append("Step 2: No denominators to clear (LCD = 1)")

    lines.append("Step 3: Polynomial form")
    lines.append(f"  {sp.sstr(data['polynomial'])} = 0")

    if data['raw_solutions']:
        lines.append("Step 4: Solve for x")
        for sol in data['raw_solutions']:
            lines.append(f"  x = {sp.sstr(sol)}")
    else:
        lines.append("Step 4: No solutions returned by solver")

    if data['extraneous_solutions']:
        lines.append("Remove extraneous values")
        for sol in data['extraneous_solutions']:
            lines.append(f"  x = {sp.sstr(sol)} (excluded)")

    if data['excluded_values']:
        lines.append("Domain restrictions")
        for val in data['excluded_values']:
            lines.append(f"  x ≠ {sp.sstr(val)}")

    lines.append("Step 5: Verify solutions")
    if data['verification']:
        symbol = data.get('symbol', sp.symbols('x'))
        for item in data['verification']:
            sol = item['solution']
            lhs_expr = sp.simplify(item.get('lhs_expr', data['lhs']))
            rhs_expr = sp.simplify(item.get('rhs_expr', data['rhs']))
            lhs_eval = sp.simplify(item.get('lhs_eval', lhs_expr.subs(symbol, sol)))
            rhs_eval = sp.simplify(item.get('rhs_eval', rhs_expr.subs(symbol, sol)))
            lhs_val = sp.simplify(item['lhs'])
            rhs_val = sp.simplify(item['rhs'])
            lhs_dec = sp.N(lhs_val, 8)
            rhs_dec = sp.N(rhs_val, 8)
            satisfies = item.get('satisfies', False)
            lines.append(f"  Substitute x = {sp.sstr(sol)}")
            lines.append(f"    Left side expression: {sp.sstr(lhs_expr)}")
            lines.append(f"      → Substitute: {sp.sstr(lhs_eval)}")
            lines.append(f"      → Simplify: {sp.sstr(lhs_val)}")
            if lhs_val != lhs_dec:
                lines.append(f"      → ≈ {lhs_dec}")
            lines.append(f"    Right side expression: {sp.sstr(rhs_expr)}")
            lines.append(f"      → Substitute: {sp.sstr(rhs_eval)}")
            lines.append(f"      → Simplify: {sp.sstr(rhs_val)}")
            if rhs_val != rhs_dec:
                lines.append(f"      → ≈ {rhs_dec}")
            lines.append(f"    Result: {'VALID ✅' if satisfies else 'INVALID ❌'}")
    else:
        lines.append("  No valid solutions to verify")

    lines.append("Final solution")
    if data['valid_solutions']:
        for sol in data['valid_solutions']:
            approx = sp.N(sol, 8)
            if approx.is_real and approx != sol:
                lines.append(f"  x = {sp.sstr(sol)}  (≈ {approx})")
            else:
                lines.append(f"  x = {sp.sstr(sol)}")
    else:
        lines.append("  No valid solution")

    return '\n'.join(lines)


def stepwise_rational_solution_latex(equation_str):
    """Generate a LaTeX representation of the complete solving process."""
    data = compute_rational_solution_data(equation_str)

    body_lines = []
    body_lines.append(r"\text{Original equation: } " + sp.latex(data['lhs']) + " = " + sp.latex(data['rhs']))

    if data['denominators']:
        body_lines.append(r"\text{LCD: } " + sp.latex(data['lcd']))
        body_lines.append(sp.latex(sp.Eq(data['cleared_lhs'], data['cleared_rhs'])))
    else:
        body_lines.append(r"\text{LCD: } 1")
        body_lines.append(sp.latex(sp.Eq(data['lhs'], data['rhs'])))

    body_lines.append(sp.latex(sp.Eq(data['polynomial'], 0)))

    if data['raw_solutions']:
        for sol in data['raw_solutions']:
            body_lines.append(sp.latex(sp.Eq(sp.Symbol('x'), sol)))

    if data['extraneous_solutions']:
        extraneous = ", ".join(sp.latex(sol) for sol in data['extraneous_solutions'])
        body_lines.append(r"\text{Extraneous: } x = " + extraneous)

    if data['excluded_values']:
        restrictions = ", ".join(sp.latex(val) for val in data['excluded_values'])
        body_lines.append(r"\text{Restrictions: } x \ne " + restrictions)

    if data['verification']:
        symbol = data.get('symbol', sp.symbols('x'))
        for item in data['verification']:
            sol = item['solution']
            lhs_expr = sp.simplify(item.get('lhs_expr', data['lhs']))
            rhs_expr = sp.simplify(item.get('rhs_expr', data['rhs']))
            lhs_eval = sp.simplify(item.get('lhs_eval', lhs_expr.subs(symbol, sol)))
            rhs_eval = sp.simplify(item.get('rhs_eval', rhs_expr.subs(symbol, sol)))
            lhs_val = sp.simplify(item['lhs'])
            rhs_val = sp.simplify(item['rhs'])
            satisfies = item.get('satisfies', False)
            approx_lhs = sp.N(lhs_val, 8)
            approx_rhs = sp.N(rhs_val, 8)
            lhs_chain = r" \rightarrow ".join([
                sp.latex(lhs_expr),
                sp.latex(lhs_eval),
                sp.latex(lhs_val),
            ])
            rhs_chain = r" \rightarrow ".join([
                sp.latex(rhs_expr),
                sp.latex(rhs_eval),
                sp.latex(rhs_val),
            ])
            line = (
                r"\text{Check } x = "
                + sp.latex(sol)
                + r"\!:"
                + r"\quad \text{Left side: }"
                + lhs_chain
                + r"\quad \text{Right side: }"
                + rhs_chain
            )
            if (approx_lhs != lhs_val) or (approx_rhs != rhs_val):
                line += (
                    r" \; (\approx "
                    + sp.latex(approx_lhs)
                    + r" = "
                    + sp.latex(approx_rhs)
                    + r")"
                )
            line += r" \quad " + (r"\text{VALID ✅}" if satisfies else r"\text{INVALID ❌}")
            body_lines.append(line)
    else:
        body_lines.append(r"\text{Check: No valid solutions to verify}")

    if data['valid_solutions']:
        finals = ", ".join(sp.latex(sol) for sol in data['valid_solutions'])
        line = r"\text{Final solution(s): } x = " + finals
        approx_parts = []
        for sol in data['valid_solutions']:
            approx = sp.N(sol, 8)
            if approx.is_real and approx != sol:
                approx_parts.append(sp.latex(sp.Symbol('x')) + r" \approx " + sp.latex(approx))
        if approx_parts:
            line += r" \quad (" + "; ".join(approx_parts) + r")"
        body_lines.append(line)
    else:
        body_lines.append(r"\text{Final solution(s): none}")

    latex_body = r" \\ ".join(body_lines)
    return r"\begin{aligned}" + latex_body + r"\end{aligned}"

def stepwise_rational_solution_with_explanations(equation_str):
    """
    Step-by-Step Solution with Teacher-Level Explanations
    Provides detailed explanations in natural language while maintaining mathematical precision.
    """
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


