from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import traceback
import json

# Add the parent directory to the path to import the solver
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the solver functions
try:
    from yessss import RationalFunctionCalculator
except ImportError as e:
    print(f"Error importing solver: {e}")
    # Fallback functions if import fails
    class RationalFunctionCalculator:
        def analyze_rational_function(self, func_str):
            return "Solver not available"

app = Flask(__name__)
CORS(app)

@app.route('/api/rational-function/analyze', methods=['POST'])
def analyze_rational_function():
    """Analyze a rational function and return step-by-step solution"""
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
        import io
        import sys
        from contextlib import redirect_stdout
        
        output = io.StringIO()
        with redirect_stdout(output):
            calculator.analyze_rational_function(function_str)
        
        analysis_output = output.getvalue()
        
        # Parse the output to extract structured data
        analysis_data = parse_analysis_output(analysis_output, function_str)
        
        return jsonify({
            'success': True,
            'function': function_str,
            'analysis': analysis_data,
            'raw_output': analysis_output
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/rational-function/validate', methods=['POST'])
def validate_rational_function():
    """Validate if a string represents a valid rational function"""
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
        
        try:
            numerator, denominator = calculator.parse_function(function_str)
            valid = True
            message = "Valid rational function"
        except Exception as e:
            valid = False
            message = str(e)
        
        return jsonify({
            'success': True,
            'valid': valid,
            'message': message,
            'function': function_str
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/rational-function/domain', methods=['POST'])
def find_domain():
    """Find the domain of a rational function"""
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
        
        try:
            numerator, denominator = calculator.parse_function(function_str)
            domain_restrictions = calculator.find_domain(denominator)
            
            return jsonify({
                'success': True,
                'domain_restrictions': [str(r) for r in domain_restrictions],
                'domain': f"(-∞, ∞) excluding {', '.join([str(r) for r in domain_restrictions])}" if domain_restrictions else "(-∞, ∞)"
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error finding domain: {str(e)}'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/rational-function/zeros', methods=['POST'])
def find_zeros():
    """Find the zeros of a rational function"""
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
        
        try:
            numerator, denominator = calculator.parse_function(function_str)
            common_factors, simplified_num, simplified_den = calculator.find_common_factors(numerator, denominator)
            zeros = calculator.find_zeros(simplified_num, common_factors)
            
            return jsonify({
                'success': True,
                'zeros': [str(z) for z in zeros],
                'common_factors': [str(cf) for cf in common_factors],
                'simplified_numerator': str(simplified_num),
                'simplified_denominator': str(simplified_den)
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error finding zeros: {str(e)}'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/rational-function/asymptotes', methods=['POST'])
def find_asymptotes():
    """Find asymptotes of a rational function"""
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
        
        try:
            numerator, denominator = calculator.parse_function(function_str)
            common_factors, simplified_num, simplified_den = calculator.find_common_factors(numerator, denominator)
            
            vertical_asymptotes = calculator.find_vertical_asymptotes(denominator, common_factors)
            horizontal_asymptote = calculator.find_horizontal_asymptote(numerator, denominator)
            oblique_asymptote = calculator.find_oblique_asymptote(numerator, denominator)
            
            return jsonify({
                'success': True,
                'vertical_asymptotes': [str(va) for va in vertical_asymptotes],
                'horizontal_asymptote': horizontal_asymptote,
                'oblique_asymptote': str(oblique_asymptote) if oblique_asymptote else None
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error finding asymptotes: {str(e)}'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

def parse_analysis_output(output, function_str):
    """Parse the analysis output to extract structured data"""
    try:
        # This is a simplified parser - you can enhance it based on your needs
        lines = output.split('\n')
        
        analysis_data = {
            'function': function_str,
            'cleaned_function': '',
            'factored_form': '',
            'domain': '',
            'domain_restrictions': [],
            'zeros': [],
            'x_intercepts': [],
            'y_intercept': '',
            'vertical_asymptotes': [],
            'horizontal_asymptote': '',
            'oblique_asymptote': '',
            'holes': [],
            'steps': []
        }
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Detect sections
            if '1) CLEANED FUNCTION' in line:
                current_section = 'cleaned_function'
            elif '2) DOMAIN & DOMAIN RESTRICTIONS' in line:
                current_section = 'domain'
            elif '3) ZEROS' in line:
                current_section = 'zeros'
            elif '4) INTERCEPTS' in line:
                current_section = 'intercepts'
            elif '5) VERTICAL ASYMPTOTES' in line:
                current_section = 'vertical_asymptotes'
            elif '6) HORIZONTAL / OBLIQUE ASYMPTOTES' in line:
                current_section = 'horizontal_asymptotes'
            elif '7) HOLES' in line:
                current_section = 'holes'
            
            # Extract data based on current section
            if current_section == 'cleaned_function' and 'Original:' in line:
                analysis_data['cleaned_function'] = line.split('Original:')[1].strip()
            elif current_section == 'cleaned_function' and 'Factored:' in line:
                analysis_data['factored_form'] = line.split('Factored:')[1].strip()
            elif current_section == 'domain' and 'Excluded x-values:' in line:
                restrictions = line.split('Excluded x-values:')[1].strip()
                analysis_data['domain_restrictions'] = [r.strip() for r in restrictions.split(',')]
            elif current_section == 'domain' and 'Domain:' in line:
                analysis_data['domain'] = line.split('Domain:')[1].strip()
            elif current_section == 'zeros' and 'Zeros:' in line:
                zeros = line.split('Zeros:')[1].strip()
                analysis_data['zeros'] = [z.strip() for z in zeros.split(',')]
            elif current_section == 'vertical_asymptotes' and 'VA:' in line:
                va = line.split('VA:')[1].strip()
                analysis_data['vertical_asymptotes'].append(va)
            elif current_section == 'horizontal_asymptotes' and 'Horizontal asymptote:' in line:
                ha = line.split('Horizontal asymptote:')[1].strip()
                analysis_data['horizontal_asymptote'] = ha
            elif current_section == 'holes' and 'Hole at' in line:
                hole_info = line.split('Hole at')[1].strip()
                analysis_data['holes'].append(hole_info)
            
            # Add to steps for step-by-step display
            if line and not line.startswith('=') and not line.startswith('-'):
                analysis_data['steps'].append(line)
        
        return analysis_data
        
    except Exception as e:
        print(f"Error parsing analysis output: {e}")
        return {
            'function': function_str,
            'error': 'Could not parse analysis output',
            'raw_output': output
        }

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint to verify the server is working"""
    try:
        # Test if we can create the calculator instance
        calculator = RationalFunctionCalculator()
        return jsonify({
            'success': True,
            'message': 'Calculator instance created successfully',
            'calculator_type': str(type(calculator))
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to create calculator: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'rational_function_solver_available': True,
        'message': 'Quantum solver backend is running'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
