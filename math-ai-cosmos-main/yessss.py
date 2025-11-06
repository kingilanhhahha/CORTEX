import sympy as sp
import matplotlib.pyplot as plt
import numpy as np
from sympy import symbols, solve, factor, limit, degree, simplify, cancel, div, expand
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor,
)
import re


class RationalFunctionCalculator:
    def __init__(self):
        self.x = symbols('x')

    def parse_function(self, func_str):
        """Parse the rational function string and return numerator and denominator"""
        # Normalization
        s = func_str.strip()
        s = s.replace('X', 'x')
        s = re.sub(r'(?i)\bf\s*\(\s*x\s*\)\s*=\s*', '', s)
        s = s.replace('−', '-').replace('–', '-').replace('—', '-')
        s = s.replace('÷', '/').replace('·', '*')

        # Convert ^ to ** for exponents, but handle negative exponents properly
        s = re.sub(r'\^(\d+)', r'**\1', s)

        # Find the main division symbol at top level (outside parentheses)
        def split_top_level_div(expr: str):
            depth = 0
            for i, ch in enumerate(expr):
                if ch == '(':
                    depth += 1
                elif ch == ')':
                    depth -= 1
                elif ch == '/' and depth == 0:
                    return expr[:i], expr[i + 1:]
            return None, None

        num_str, den_str = split_top_level_div(s)
        if num_str is None or den_str is None:
            raise ValueError("No division found. Please use format p(x)/q(x)")

        # Clean up individual parts
        num_str = num_str.strip()
        den_str = den_str.strip()

        # Remove balanced outer parentheses if they exist
        if (num_str.startswith('(') and num_str.endswith(')') and
                num_str.count('(') == num_str.count(')')):
            num_str = num_str[1:-1]

        if (den_str.startswith('(') and den_str.endswith(')') and
                den_str.count('(') == den_str.count(')')):
            den_str = den_str[1:-1]

        # Add explicit multiplication where needed
        def add_explicit_mult(text: str) -> str:
            # Handle )( cases
            text = re.sub(r'\)\(', ')*(', text)
            # Handle number followed by variable (e.g., 4x -> 4*x), but avoid exponents
            # Look ahead to make sure it's not followed by *
            text = re.sub(r'(\d)([a-zA-Z])(?!\*)', r'\1*\2', text)
            # Handle variable followed by parenthesis like x(something)
            text = re.sub(r'([a-zA-Z])\(', r'\1*(', text)
            # Handle parenthesis followed by variable like (something)x
            text = re.sub(r'\)([a-zA-Z])', r')*\1', text)
            return text

        num_str = add_explicit_mult(num_str)
        den_str = add_explicit_mult(den_str)

        try:
            # Use basic sympify with explicit variable definition
            local_dict = {'x': self.x}
            numerator = sp.sympify(num_str, locals=local_dict)
            denominator = sp.sympify(den_str, locals=local_dict)

            return numerator, denominator
        except Exception as e:
            raise ValueError(f"Invalid polynomial expressions: {e}")

    def factor_polynomial(self, poly):
        """Factor a polynomial and return the factored form"""
        try:
            factored = factor(poly)
            return factored
        except:
            return poly

    def find_common_factors(self, num, den):
        """Find common factors between numerator and denominator"""
        num_factors = factor(num)
        den_factors = factor(den)

        # Extract factors (this is a simplified approach)
        common = []
        simplified_num = num
        simplified_den = den

        # Check for common linear factors
        num_roots = solve(num, self.x)
        den_roots = solve(den, self.x)

        for root in num_roots:
            if root in den_roots:
                common.append(root)
                # Cancel the common factor
                simplified_num = cancel(simplified_num / (self.x - root))
                simplified_den = cancel(simplified_den / (self.x - root))

        return common, simplified_num, simplified_den

    def find_domain(self, denominator):
        """Find domain restrictions by solving denominator = 0"""
        try:
            roots = solve(denominator, self.x)
            return roots
        except:
            return []

    def find_zeros(self, numerator, cancelled_roots):
        """Find zeros of the function (roots of numerator after cancellations)"""
        try:
            roots = solve(numerator, self.x)
            # Remove cancelled roots (these become holes, not zeros)
            valid_roots = [r for r in roots if r not in cancelled_roots]
            return valid_roots
        except:
            return []

    def find_intercepts(self, func, zeros, domain_restrictions):
        """Find x and y intercepts"""
        # X-intercepts
        x_intercepts = [(z, 0) for z in zeros]

        # Y-intercept (check if x=0 is in domain)
        y_intercept = None
        if 0 not in domain_restrictions:
            try:
                y_val = func.subs(self.x, 0)
                y_intercept = (0, y_val)
            except:
                pass

        return x_intercepts, y_intercept

    def find_vertical_asymptotes(self, denominator, cancelled_roots):
        """Find vertical asymptotes from uncancelled roots of denominator"""
        try:
            roots = solve(denominator, self.x)
            # Only roots that weren't cancelled become asymptotes
            asymptotes = [r for r in roots if r not in cancelled_roots]
            return asymptotes
        except:
            return []

    def find_horizontal_asymptote(self, numerator, denominator):
        """Find horizontal asymptote based on degrees"""
        n = degree(numerator, self.x)
        m = degree(denominator, self.x)

        if n < m:
            return "y = 0"
        elif n == m:
            # Ratio of leading coefficients
            num_coeff = numerator.coeff(self.x ** n)
            den_coeff = denominator.coeff(self.x ** m)
            return f"y = {num_coeff}/{den_coeff}"
        else:
            return None

    def find_oblique_asymptote(self, numerator, denominator):
        """Find oblique asymptote using polynomial long division"""
        n = degree(numerator, self.x)
        m = degree(denominator, self.x)

        # According to the rules:
        # If n < m: y = 0 (horizontal asymptote, not oblique)
        # If n = m: y = a/b (horizontal asymptote, not oblique)
        # If n > m: no horizontal asymptote, but could have oblique
        if n > m:
            try:
                quotient, remainder = div(numerator, denominator)
                if degree(quotient, self.x) == 1:
                    return f"y = {quotient}"
            except:
                pass
        return None

    def find_holes(self, cancelled_roots, simplified_func):
        """Find holes from cancelled factors"""
        holes = []
        for root in cancelled_roots:
            try:
                # Use simplified function to find y-value
                y_val = simplified_func.subs(self.x, root)
                holes.append((root, y_val))
            except:
                pass
        return holes

    def analyze_rational_function(self, func_str):
        """Complete analysis of a rational function"""
        print("=" * 60)
        print("RATIONAL FUNCTION CALCULATOR")
        print("=" * 60)

        try:
            # 1) Parse and clean function
            print("\n1) CLEANED FUNCTION")
            print("-" * 30)
            numerator, denominator = self.parse_function(func_str)
            print(f"Original: f(x) = {numerator}/{denominator}")

            # Factor both
            factored_num = self.factor_polynomial(numerator)
            factored_den = self.factor_polynomial(denominator)
            print(f"Factored: f(x) = {factored_num}/{factored_den}")

            # Also show the factored denominator separately for clarity
            if factored_den != denominator:
                print(f"  Denominator factors: {denominator} = {factored_den}")

            # Find common factors
            common_factors, simplified_num, simplified_den = self.find_common_factors(numerator, denominator)
            if common_factors:
                print(f"Simplified: f(x) = {simplified_num}/{simplified_den}")
                print(f"Common factors cancelled: {common_factors}")
            else:
                print("No common factors to cancel")

            # 2) Domain & Restrictions
            print("\n2) DOMAIN & DOMAIN RESTRICTIONS")
            print("-" * 40)
            domain_restrictions = self.find_domain(denominator)
            print("Steps:")
            print(f"  • Solve {denominator} = 0")
            if factored_den != denominator:
                print(f"  • Factored: {factored_den} = 0")
            if domain_restrictions:
                print(f"  • Excluded x-values: {domain_restrictions}")
                domain_str = "(-∞, ∞) excluding " + ", ".join([str(r) for r in domain_restrictions])
            else:
                print("  • No excluded values")
                domain_str = "(-∞, ∞)"
            print(f"  • Domain: {domain_str}")
            print("Explain: We exclude values that make the denominator zero.")

            # 3) Zeros
            print("\n3) ZEROS (ROOTS OF f)")
            print("-" * 30)
            zeros = self.find_zeros(simplified_num, common_factors)
            print("Steps:")
            print(f"  • Solve {simplified_num} = 0 (after cancellations)")
            if zeros:
                print("  • Solving step by step:")
                # Show the factored form and solve each factor
                try:
                    factored_num = sp.factor(simplified_num)
                    if factored_num != simplified_num:
                        print(f"    {simplified_num} = {factored_num}")
                        # Extract factors and show solving steps
                        factors = sp.factor_list(simplified_num, self.x)[1]
                        for factor_expr, multiplicity in factors:
                            if multiplicity > 0:
                                sol = sp.solve(factor_expr, self.x)[0]
                                print(f"    {factor_expr} = 0 → x = {sol}")
                    else:
                        # If it can't be factored, show the solving directly
                        print(f"    {simplified_num} = 0 → x = {zeros[0] if zeros else 'no solution'}")
                except:
                    # Fallback if factoring doesn't work
                    print(f"    {simplified_num} = 0 → x = {zeros[0] if zeros else 'no solution'}")
                print(f"  • Zeros: {zeros}")
                print("Explain: Zeros come from the numerator, unless cancelled by the denominator.")
            else:
                print("  • No zeros found")

            # 4) Intercepts
            print("\n4) INTERCEPTS")
            print("-" * 20)
            x_intercepts, y_intercept = self.find_intercepts(simplified_num / simplified_den, zeros,
                                                             domain_restrictions)

            print("X-intercepts:")
            if x_intercepts:
                print("  • f(x) = 0, y = 0")
                for x_int in x_intercepts:
                    x_val = x_int[0]
                    # Show the complete solving step
                    try:
                        factored_num = sp.factor(simplified_num)
                        if factored_num != simplified_num:
                            factors = sp.factor_list(simplified_num, self.x)[1]
                            for factor_expr, multiplicity in factors:
                                if multiplicity > 0:
                                    sol = sp.solve(factor_expr, self.x)[0]
                                    if sol == x_val:
                                        print(f"    → {factor_expr} = 0 → x = {x_val}")
                                        print(f"    → ({x_val}, 0)")
                                        break
                    except:
                        # If factoring doesn't work, show the direct solving
                        print(f"    → {simplified_num} = 0 → x = {x_val}")
                        print(f"    → ({x_val}, 0)")
            else:
                print("  • None")

            print("Y-intercept:")
            if y_intercept:
                print("  • f(0) = substitute x = 0")
                try:
                    # Show the complete substitution step by step
                    print(f"    f(0) = {simplified_num}/{simplified_den}")
                    print(f"    f(0) = {simplified_num.subs(self.x, 0)}/{simplified_den.subs(self.x, 0)}")
                    
                    # Show the calculation step by step
                    num_val = simplified_num.subs(self.x, 0)
                    den_val = simplified_den.subs(self.x, 0)
                    if den_val != 0:
                        result = num_val / den_val
                        print(f"    f(0) = {num_val}/{den_val} = {result}")
                        print(f"    → (0, {result})")
                    else:
                        print(f"    → Undefined (denominator = 0)")
                except Exception as e:
                    print(f"    → Error calculating y-intercept: {e}")
            else:
                print("  • None (x=0 is excluded from domain)")

            # 5) Vertical Asymptotes
            print("\n5) VERTICAL ASYMPTOTES")
            print("-" * 30)
            v_asymptotes = self.find_vertical_asymptotes(denominator, common_factors)
            print("Rule: Uncancelled real roots of q(x) produce VAs.")
            print("Steps:")
            print(f"  • Solve {denominator} = 0")
            if factored_den != denominator:
                print(f"  • Factored: {factored_den} = 0")
            print(f"  • Check for cancellations: {common_factors}")
            if v_asymptotes:
                for va in v_asymptotes:
                    print(f"  • VA: x = {va}")
                    print(f"    lim(x→{va}±) f(x) = ±∞")
            else:
                print("  • No vertical asymptotes")

            # 6) Horizontal/Oblique Asymptotes
            print("\n6) HORIZONTAL / OBLIQUE ASYMPTOTES")
            print("-" * 40)
            n = degree(numerator, self.x)
            m = degree(denominator, self.x)
            print(f"Degrees: n = {n} (numerator), m = {m} (denominator)")

            # Explain the rules clearly with mathematical notation
            print("Rules for horizontal asymptotes:")
            print("• If degree numerator < degree denominator → y = 0")
            print("• If degree numerator = degree denominator → y = a/b (ratio of leading coefficients)")
            print(
                "• If degree numerator > degree denominator → no horizontal asymptote (instead: maybe oblique or higher polynomial asymptote)")

            # Apply the specific rule for this function
            print(f"\nFor this function:")
            if n < m:
                print(f"  Since degree numerator ({n}) < degree denominator ({m}) → y = 0")
            elif n == m:
                print(f"  Since degree numerator ({n}) = degree denominator ({m}) → y = a/b")
            else:
                print(f"  Since degree numerator ({n}) > degree denominator ({m}) → no horizontal asymptote")

            ha = self.find_horizontal_asymptote(numerator, denominator)
            if ha:
                print(f"Horizontal asymptote: {ha}")

            oa = self.find_oblique_asymptote(numerator, denominator)
            if oa:
                print(f"Oblique asymptote: {oa}")
                print("Long division work:")
                try:
                    quotient, remainder = div(numerator, denominator)
                    print(f"  {numerator} ÷ {denominator} = {quotient} + {remainder}/{denominator}")
                    print(f"  So the slant asymptote is: y = {quotient}")
                except:
                    print("  Division calculation shown above")
            elif n > m:
                print("Since numerator degree > denominator degree, check for oblique asymptote:")
                try:
                    quotient, remainder = div(numerator, denominator)
                    if degree(quotient, self.x) > 1:
                        print(f"  Long division: {numerator} ÷ {denominator} = {quotient} + {remainder}/{denominator}")
                        print(
                            f"  This gives a polynomial asymptote of degree {degree(quotient, self.x)}: y = {quotient}")
                    else:
                        print(f"  Long division: {numerator} ÷ {denominator} = {quotient} + {remainder}/{denominator}")
                        print(f"  No linear oblique asymptote found")
                except:
                    print("  Long division could not be performed")

            if not ha and not oa:
                print("No horizontal or oblique asymptote")
                if n <= m:
                    print("  This is expected since numerator degree ≤ denominator degree")
                else:
                    print("  Long division was performed but no linear asymptote found")

            # 7) Holes
            print("\n7) HOLES (REMOVABLE DISCONTINUITIES)")
            print("-" * 40)
            holes = self.find_holes(common_factors, simplified_num / simplified_den)
            print("Rule: Any common factor between p(x) and q(x) that was cancelled creates a hole.")
            if holes:
                for hole in holes:
                    x_val = hole[0]
                    print(f"  • Hole at ({x_val}, {hole[1]})")
                    print(f"    (from cancelled factor x - {x_val} = 0 → x = {x_val})")
            else:
                print("  • No holes")

            # 8) End Behavior
            print("\n8) END BEHAVIOR & LOCAL BEHAVIOR")
            print("-" * 40)
            if v_asymptotes:
                for va in v_asymptotes:
                    print(f"  • Near VA x = {va}: function approaches ±∞")
            if ha:
                print(f"  • End behavior: approaches {ha}")
            elif oa:
                print(f"  • End behavior: approaches {oa}")
            else:
                print(f"  • End behavior: dominated by highest degree terms")

            # 9) Graph
            print("\n9) GRAPH")
            print("-" * 10)
            self.plot_function(numerator, denominator, simplified_num, simplified_den,
                               zeros, y_intercept, v_asymptotes, ha, oa, holes, domain_restrictions)

            # 10) Final Checklist
            print("\n10) FINAL CHECKLIST")
            print("-" * 20)
            print(f"✓ Domain: {domain_str}")
            print(f"✓ Domain restrictions: {domain_restrictions if domain_restrictions else 'None'}")
            print(f"✓ Zeros: {zeros if zeros else 'None'}")
            print(f"✓ X-intercepts: {x_intercepts if x_intercepts else 'None'}")
            print(f"✓ Y-intercept: {y_intercept if y_intercept else 'None'}")
            print(f"✓ Vertical asymptotes: {v_asymptotes if v_asymptotes else 'None'}")
            print(f"✓ Horizontal/Oblique asymptote: {ha if ha else oa if oa else 'None'}")
            print(f"✓ Holes: {holes if holes else 'None'}")

        except Exception as e:
            print(f"Error analyzing function: {e}")

    def plot_function(self, numerator, denominator, simplified_num, simplified_den,
                      zeros, y_intercept, v_asymptotes, ha, oa, holes, domain_restrictions):
        """Create a comprehensive plot of the rational function"""
        try:
            # Create the function for plotting
            if simplified_num != numerator or simplified_den != denominator:
                func = simplified_num / simplified_den
            else:
                func = numerator / denominator

            # Create plot
            fig, ax = plt.subplots(figsize=(12, 8))

            # Determine x-range (avoid asymptotes)
            x_min, x_max = -10, 10
            if v_asymptotes:
                # Adjust range to show asymptotes clearly
                x_min = min(x_min, min(v_asymptotes) - 2)
                x_max = max(x_max, max(v_asymptotes) + 2)

            # Generate x values, avoiding asymptotes
            x_vals = []
            y_vals = []

            for x in np.linspace(x_min, x_max, 1000):
                # Skip values too close to asymptotes
                skip = False
                for va in v_asymptotes:
                    if abs(x - va) < 0.1:
                        skip = True
                        break

                if not skip:
                    try:
                        y = float(func.subs(self.x, x))
                        if abs(y) < 100:  # Limit extreme values for visibility
                            x_vals.append(x)
                            y_vals.append(y)
                    except:
                        continue

            # Plot the main function
            ax.plot(x_vals, y_vals, 'b-', linewidth=2, label='f(x)')

            # Plot asymptotes
            for va in v_asymptotes:
                ax.axvline(x=va, color='r', linestyle='--', alpha=0.7, label=f'VA: x={va}')

            # Plot horizontal asymptote
            if ha and ha != "y = 0":
                try:
                    y_val = float(sp.sympify(ha.split('=')[1].strip()))
                    ax.axhline(y=y_val, color='g', linestyle='--', alpha=0.7, label=f'HA: {ha}')
                except:
                    pass

            # Plot oblique asymptote
            if oa:
                try:
                    # Extract slope and intercept from y = ax + b
                    oa_parts = oa.split('=')[1].strip()
                    if 'x' in oa_parts:
                        if '+' in oa_parts:
                            parts = oa_parts.split('+')
                            slope = float(sp.sympify(parts[0].replace('x', '').strip() or '1'))
                            intercept = float(sp.sympify(parts[1].strip()))
                        elif '-' in oa_parts:
                            parts = oa_parts.split('-')
                            slope = float(sp.sympify(parts[0].replace('x', '').strip() or '1'))
                            intercept = -float(sp.sympify(parts[1].strip()))
                        else:
                            slope = float(sp.sympify(oa_parts.replace('x', '').strip() or '1'))
                            intercept = 0

                        x_oa = np.linspace(x_min, x_max, 100)
                        y_oa = slope * x_oa + intercept
                        ax.plot(x_oa, y_oa, 'g--', alpha=0.7, label=f'OA: {oa}')
                except:
                    pass

            # Plot intercepts
            for zero in zeros:
                ax.plot(zero, 0, 'ko', markersize=8, label=f'x-int: ({zero}, 0)')

            if y_intercept:
                ax.plot(0, y_intercept[1], 'ko', markersize=8, label=f'y-int: (0, {y_intercept[1]:.2f})')

            # Plot holes
            for hole in holes:
                ax.plot(hole[0], hole[1], 'wo', markersize=8, markeredgecolor='red',
                        markeredgewidth=2, label=f'Hole: ({hole[0]}, {hole[1]:.2f})')

            # Customize plot
            ax.grid(True, alpha=0.3)
            ax.set_xlabel('x')
            ax.set_ylabel('y')
            ax.set_title('Rational Function Graph')
            ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
            ax.set_xlim(x_min, x_max)
            ax.set_ylim(-10, 10)

            # Add domain restrictions as text
            if domain_restrictions:
                restriction_text = f"Domain: x ≠ {', '.join([str(r) for r in domain_restrictions])}"
                ax.text(0.02, 0.98, restriction_text, transform=ax.transAxes,
                        verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))

            plt.tight_layout()
            plt.show()

        except Exception as e:
            print(f"Error plotting function: {e}")
            print("Graph could not be generated.")


def main():
    calculator = RationalFunctionCalculator()

    print("RATIONAL FUNCTION CALCULATOR")
    print("=" * 40)
    print("Please enter a single rational function f(x) = p(x)/q(x)")
    print("Acceptable forms: plain text like (x^2-8x-20)/(x+3)")
    print("or fully factored like ((x-10)(x+2))/(x+3)")
    print()

    while True:
        try:
            func_input = input("Enter rational function (or 'quit' to exit): ").strip()

            if func_input.lower() in ['quit', 'exit', 'q']:
                print("Goodbye!")
                break

            if not func_input:
                print("Please enter a function.")
                continue

            # Analyze the function
            calculator.analyze_rational_function(func_input)

            print("\n" + "=" * 60)
            print("Analysis complete! Enter another function or 'quit' to exit.")
            print("=" * 60 + "\n")

        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")
            print("Please try again with a valid rational function.\n")


if __name__ == "__main__":
    main()
