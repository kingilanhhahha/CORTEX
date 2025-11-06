from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import traceback

# Add the parent directory to the path to import the solver
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the solver functions
try:
    from FINAL_SOLVING_CALCULATOR import (
        validate_rational_equation,
        stepwise_rational_solution_with_explanations,
        insert_multiplication_signs,
        classify_equation
    )
except ImportError as e:
    print(f"Error importing solver: {e}")
    # Fallback functions if import fails
    def validate_rational_equation(equation_str):
        return False, "Solver not available"
    
    def stepwise_rational_solution_with_explanations(equation_str):
        return "Solver not available"
    
    def insert_multiplication_signs(equation_str):
        return equation_str
    
    def classify_equation(equation, variable='x'):
        return {"type": "unknown", "error": "Solver not available"}

app = Flask(__name__)
CORS(app)

@app.route('/api/solve', methods=['POST'])
def solve_equation():
    try:
        data = request.get_json()
        equation = data.get('equation', '').strip()
        
        if not equation:
            return jsonify({
                'success': False,
                'error': 'No equation provided'
            }), 400
        
        # Preprocess the equation
        equation = equation.replace('X', 'x')  # Convert X to x
        equation = insert_multiplication_signs(equation)
        
        # Validate the equation
        valid, message = validate_rational_equation(equation)
        
        if not valid:
            return jsonify({
                'success': False,
                'error': message,
                'equation': equation
            }), 400
        
        # Get the step-by-step solution
        solution = stepwise_rational_solution_with_explanations(equation)
        
        # Classify the equation
        try:
            classification = classify_equation(equation)
        except Exception as e:
            classification = {"type": "unknown", "error": str(e)}
        
        return jsonify({
            'success': True,
            'equation': equation,
            'solution': solution,
            'classification': classification,
            'valid': valid,
            'message': message
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/validate', methods=['POST'])
def validate_equation():
    try:
        data = request.get_json()
        equation = data.get('equation', '').strip()
        
        if not equation:
            return jsonify({
                'success': False,
                'error': 'No equation provided'
            }), 400
        
        # Preprocess the equation
        equation = equation.replace('X', 'x')
        equation = insert_multiplication_signs(equation)
        
        # Validate the equation
        valid, message = validate_rational_equation(equation)
        
        return jsonify({
            'success': True,
            'valid': valid,
            'message': message,
            'equation': equation
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/classify', methods=['POST'])
def classify_equation_endpoint():
    try:
        data = request.get_json()
        equation = data.get('equation', '').strip()
        
        if not equation:
            return jsonify({
                'success': False,
                'error': 'No equation provided'
            }), 400
        
        # Preprocess the equation
        equation = equation.replace('X', 'x')
        equation = insert_multiplication_signs(equation)
        
        # Classify the equation
        classification = classify_equation(equation)
        
        return jsonify({
            'success': True,
            'classification': classification,
            'equation': equation
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'solver_available': True
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 