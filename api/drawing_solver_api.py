#!/usr/bin/env python3
"""
Simple Flask API for Drawing Solver
Handles OCR processing and equation solving
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
from PIL import Image
import tempfile
import os
import sys

# Add the parent directory to the path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set matplotlib to non-interactive backend BEFORE importing any modules that use it
try:
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
except ImportError:
    pass

app = Flask(__name__)
CORS(app)

# Try to import our modules
try:
    import olol_hahahaa
    SOLVER_AVAILABLE = True
except ImportError as e:
    print(f"Solver module not available: {e}")
    SOLVER_AVAILABLE = False

try:
    import lcd
    OCR_AVAILABLE = True
    print("OCR module loaded successfully")
except ImportError as e:
    print(f"OCR module not available: {e}")
    OCR_AVAILABLE = False

try:
    from solution_analysis import analyze_student_solution
    CHECKER_AVAILABLE = True
except ImportError as e:
    print(f"Solution checker module not available: {e}")
    CHECKER_AVAILABLE = False

try:
    from yessss import RationalFunctionCalculator
    RATIONAL_FUNCTION_AVAILABLE = True
    print("Rational function calculator loaded successfully")
except ImportError as e:
    print(f"Rational function module not available: {e}")
    RATIONAL_FUNCTION_AVAILABLE = False

@app.route('/api/ocr/process', methods=['POST'])
def process_ocr():
    """Process uploaded image through OCR"""
    temp_file = None
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        # Save the uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        temp_file.close()
        file.save(temp_file.name)
        
        # Real OCR processing using your lcd module
        if OCR_AVAILABLE:
            result = lcd.process_image(temp_file.name)
            print(f"[DEBUG] OCR result: {result}")
            
            # Clean up temp file before returning
            if temp_file:
                os.unlink(temp_file.name)
            
            # Check if OCR actually failed or just had solving issues
            if result.get("error") and not result.get("latex_raw"):
                # Real OCR failure - check if it's a network error
                error_msg = result.get("error", "")
                is_network_error = (
                    "Network connection" in error_msg or 
                    "network" in error_msg.lower() or
                    "connection" in error_msg.lower() or
                    "timeout" in error_msg.lower() or
                    "internet" in error_msg.lower()
                )
                
                if is_network_error:
                    # Network error - provide clearer message
                    result["error"] = f"Network error: {error_msg}. Please check your internet connection and try again."
                return jsonify(result), 500
            elif result.get("error") and result.get("latex_raw"):
                # OCR succeeded but solving failed - this is not a 500 error
                print(f"[DEBUG] OCR succeeded but solving failed: {result['error']}")
                result["warning"] = result.pop("error")  # Convert error to warning
                return jsonify(result), 200
            else:
                # Complete success
                return jsonify(result), 200
        else:
            # Fallback if OCR not available
            result = {
                "error": "OCR module not available"
            }
            # Clean up temp file before returning
            if temp_file:
                os.unlink(temp_file.name)
            return jsonify(result), 500
        
    except Exception as e:
        print(f"[DEBUG] API exception: {e}")
        # Clean up temp file before returning error
        if temp_file:
            try:
                os.unlink(temp_file.name)
            except:
                pass  # Ignore cleanup errors
        
        # Check if it's a network-related error
        error_str = str(e)
        is_network_error = (
            "Network connection" in error_str or 
            "network" in error_str.lower() or
            "connection" in error_str.lower() or
            "timeout" in error_str.lower() or
            "internet" in error_str.lower() or
            "ConnectionError" in error_str or
            "Timeout" in error_str
        )
        
        if is_network_error:
            error_message = f"Network connection error: {error_str}. Please check your internet connection and try again."
        else:
            error_message = f"OCR processing failed: {error_str}"
        
        return jsonify({'error': error_message}), 500

@app.route('/api/solver/solve', methods=['POST'])
def solve_equation():
    """Solve the given equation"""
    try:
        data = request.get_json()
        if not data or 'equation' not in data:
            return jsonify({'error': 'No equation provided'}), 400
        
        equation = data['equation']
        detail_level = data.get('detailLevel') or data.get('detail_level') or 'raw'
        if detail_level not in {'raw', 'process', 'shortcut'}:
            detail_level = 'raw'
        print(f"[DEBUG] API received equation: {equation}")
        print(f"[DEBUG] Requested detail level: {detail_level}")
        
        if not SOLVER_AVAILABLE:
            return jsonify({'error': 'Equation solver not available'}), 500
        
        # Sanitize potential LaTeX/ocr artifacts before further normalization
        try:
            if OCR_AVAILABLE and isinstance(equation, str):
                # Use unified normalizer to produce checker-accepted equation
                equation = lcd.to_checker_equation(equation)
        except Exception:
            pass

        # Handle Eq(...) format - extract content and convert to equation
        if equation.startswith('Eq(') and equation.endswith(')'):
            print(f"[DEBUG] Found Eq format: {equation}")
            # Extract content from Eq(..., ...) format
            content = equation[3:-1]  # Remove 'Eq(' and ')'
            print(f"[DEBUG] Extracted content: {content}")
            
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
                equation = f"{left_side}={right_side}"
                print(f"[DEBUG] Converted Eq to equation: {equation}")
            else:
                # If no comma found, treat as single expression = 0
                equation = f"{content}=0"
                print(f"[DEBUG] No comma found, treating as: {equation}")
        
        # Handle OCR errors: replace comma with equal sign
        # This helps with common OCR misreadings where "," is read instead of "="
        if ',' in equation and '=' not in equation:
            equation = equation.replace(',', '=')
            print(f"[DEBUG] Replaced comma with equals: {equation}")
        
        print(f"[DEBUG] Final equation to solve: {equation}")

        # As last resort try LaTeX -> SymPy -> string equation
        try:
            if OCR_AVAILABLE and ('=' not in equation or '[' in equation or ']' in equation):
                maybe_expr = lcd.latex_to_sympy_via_latex2sympy(equation)
                from sympy import Equality
                if isinstance(maybe_expr, Equality):
                    equation = f"{str(maybe_expr.lhs)}={str(maybe_expr.rhs)}"
        except Exception:
            pass
        
        # Solve the equation according to requested detail level
        latex_output = None
        if detail_level == 'shortcut':
            solution_text = olol_hahahaa.stepwise_rational_solution_concise(equation)
            latex_output = olol_hahahaa.stepwise_rational_solution_latex(equation)
        elif detail_level == 'process':
            solution_text = olol_hahahaa.stepwise_rational_solution_concise(equation)
        else:
            solution_text = olol_hahahaa.stepwise_rational_solution_with_explanations(equation)

        return jsonify({
            'solution': solution_text,
            'steps': solution_text.split('\n'),
            'detailLevel': detail_level,
            'latex': latex_output,
            'error': None
        })
        
    except Exception as e:
        print(f"[DEBUG] API solver exception: {e}")
        return jsonify({'error': f'Equation solving failed: {str(e)}'}), 500


@app.route('/api/solver/check', methods=['POST'])
def check_solution():
    """Line-by-line rational equation checker."""

    if not SOLVER_AVAILABLE or not CHECKER_AVAILABLE:
        return jsonify({'error': 'Solution checker not available'}), 500

    data = request.get_json(force=True, silent=True) or {}

    equation = data.get('equation') or data.get('originalEquation')
    student_answer = data.get('studentAnswer') or ''
    student_steps = data.get('studentSteps') or data.get('studentSolution')

    if equation is None:
        return jsonify({'error': 'No equation provided'}), 400

    # First, attempt to sanitize any LaTeX/ocr artifacts using lcd normalizer
    try:
        if OCR_AVAILABLE and isinstance(equation, str):
            equation = lcd.to_checker_equation(equation)
    except Exception:
        # Non-fatal: continue with raw equation
        pass

    # Normalize Eq(...) format just like the solver endpoint
    if equation.startswith('Eq(') and equation.endswith(')'):
        content = equation[3:-1]
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
            equation = f"{left_side}={right_side}"
        else:
            equation = f"{content}=0"

    if ',' in equation and '=' not in equation:
        equation = equation.replace(',', '=')

    # As a last resort, if the equation still looks like LaTeX, try converting via lcd
    try:
        if OCR_AVAILABLE and ('=' not in equation or '[' in equation or ']' in equation):
            maybe_expr = lcd.latex_to_sympy_via_latex2sympy(equation)
            # If we get an Equality, convert back to string lhs=rhs
            from sympy import Equality
            if isinstance(maybe_expr, Equality):
                equation = f"{str(maybe_expr.lhs)}={str(maybe_expr.rhs)}"
    except Exception:
        # Ignore and proceed; downstream will surface a clear error
        pass

    if isinstance(student_steps, str):
        student_lines = [line.strip() for line in student_steps.splitlines() if line.strip()]
    elif isinstance(student_steps, list):
        student_lines = [str(line).strip() for line in student_steps if str(line).strip()]
    else:
        student_lines = []

    analysis = analyze_student_solution(equation, student_answer, student_lines)

    status = analysis.get('status')
    if status != 'ok':
        return jsonify(analysis), 400

    return jsonify(analysis)

@app.route('/api/rational-function/analyze', methods=['POST'])
def analyze_rational_function():
    """Analyze a rational function and return step-by-step solution with graph"""
    import io
    from contextlib import redirect_stdout
    
    if not RATIONAL_FUNCTION_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Rational function calculator not available'
        }), 500
    
    try:
        data = request.get_json()
        function_str = data.get('function', '').strip()
        
        if not function_str:
            return jsonify({
                'success': False,
                'error': 'No function provided'
            }), 400
        
        # Create calculator instance
        calculator = RationalFunctionCalculator()
        
        # Capture the output by redirecting stdout
        output = io.StringIO()
        
        # Parse the function first to get the components
        numerator, denominator = calculator.parse_function(function_str)
        factored_num = calculator.factor_polynomial(numerator)
        factored_den = calculator.factor_polynomial(denominator)
        common_factors, simplified_num, simplified_den = calculator.find_common_factors(numerator, denominator)
        
        # Generate the text output
        with redirect_stdout(output):
            calculator.analyze_rational_function(function_str)
        
        analysis_output = output.getvalue()
        
        # Generate the graph
        domain_restrictions = calculator.find_domain(denominator)
        zeros = calculator.find_zeros(simplified_num, common_factors)
        x_intercepts, y_intercept = calculator.find_intercepts(simplified_num / simplified_den, zeros, domain_restrictions)
        v_asymptotes = calculator.find_vertical_asymptotes(denominator, common_factors)
        ha = calculator.find_horizontal_asymptote(numerator, denominator)
        oa = calculator.find_oblique_asymptote(numerator, denominator)
        holes = calculator.find_holes(common_factors, simplified_num / simplified_den)
        
        graph_base64 = calculator.plot_function_to_base64(
            numerator, denominator, simplified_num, simplified_den,
            zeros, y_intercept, v_asymptotes, ha, oa, holes, domain_restrictions
        )
        
        # Return both text and graph
        return jsonify({
            'success': True,
            'function': function_str,
            'raw_output': analysis_output,
            'graph': graph_base64
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'traceback': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'ocr_available': OCR_AVAILABLE,
        'solver_available': SOLVER_AVAILABLE,
        'rational_function_available': RATIONAL_FUNCTION_AVAILABLE
    })

if __name__ == '__main__':
    print("Starting Drawing Solver API...")
    print(f"OCR Available: {OCR_AVAILABLE}")
    print(f"Solver Available: {SOLVER_AVAILABLE}")
    print(f"Rational Function Calculator Available: {RATIONAL_FUNCTION_AVAILABLE}")
    app.run(host='0.0.0.0', port=5001, debug=True)
