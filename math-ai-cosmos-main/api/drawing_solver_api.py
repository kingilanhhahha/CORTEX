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
import traceback

# Add the parent directory to the path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)
CORS(app)

# Try to import our modules
try:
    import olol_hahahaa
    SOLVER_AVAILABLE = True
    print("✅ Solver module (olol_hahahaa) loaded successfully")
except ImportError as e:
    print(f"❌ Solver module not available: {e}")
    SOLVER_AVAILABLE = False

try:
    import lcd
    OCR_AVAILABLE = True
    print("✅ OCR module (lcd) loaded successfully")
except ImportError as e:
    print(f"❌ OCR module not available: {e}")
    OCR_AVAILABLE = False

@app.route('/api/ocr/process', methods=['POST'])
def process_ocr():
    """Process uploaded image through OCR and automatically generate solution"""
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
        
        print(f"[DEBUG] Processing image: {temp_file.name}")
        
        # Real OCR processing using your lcd module
        if OCR_AVAILABLE:
            result = lcd.process_image(temp_file.name)
            print(f"[DEBUG] OCR result: {result}")
            
            # Clean up temp file before returning
            if temp_file:
                os.unlink(temp_file.name)
            
            # Enhanced error handling and response formatting
            if result.get("error") and not result.get("latex_raw"):
                # Real OCR failure
                print(f"[DEBUG] OCR failed: {result['error']}")
                return jsonify({
                    'error': result['error'],
                    'success': False,
                    'message': 'OCR processing failed'
                }), 500
            elif result.get("error") and result.get("latex_raw"):
                # OCR succeeded but solving failed - this is not a 500 error
                print(f"[DEBUG] OCR succeeded but solving failed: {result['error']}")
                return jsonify({
                    'warning': result['error'],
                    'latex_raw': result['latex_raw'],
                    'success': True,
                    'message': 'OCR succeeded but equation solving failed',
                    'can_solve_separately': True
                }), 200
            else:
                # Complete success - now automatically generate solution
                print(f"[DEBUG] OCR complete success, generating solution...")
                
                # Extract the equation for solving
                equation = result.get('equation', '')
                if equation and SOLVER_AVAILABLE:
                    try:
                        print(f"[DEBUG] Solving equation: {equation}")
                        solution = olol_hahahaa.stepwise_rational_solution_with_explanations(equation)
                        print(f"[DEBUG] Solution generated successfully, length: {len(solution)}")
                        
                        # Add solution to the result
                        result['solution'] = solution
                        result['solution_steps'] = solution.split('\n')
                        result['solution_length'] = len(solution)
                        result['auto_solved'] = True
                        result['message'] = 'OCR processing completed successfully with automatic solution generation'
                        
                    except Exception as solve_error:
                        print(f"[DEBUG] Auto-solving failed: {solve_error}")
                        result['solve_error'] = str(solve_error)
                        result['auto_solved'] = False
                        result['message'] = 'OCR processing completed successfully but automatic solving failed'
                else:
                    result['auto_solved'] = False
                    result['message'] = 'OCR processing completed successfully (no equation to solve)'
                
                return jsonify(result), 200
        else:
            # Fallback if OCR not available
            result = {
                "error": "OCR module not available",
                "success": False,
                "message": "OCR processing not available"
            }
            # Clean up temp file before returning
            if temp_file:
                os.unlink(temp_file.name)
            return jsonify(result), 500
        
    except Exception as e:
        print(f"[DEBUG] API exception: {e}")
        print(f"[DEBUG] Full traceback: {traceback.format_exc()}")
        # Clean up temp file before returning error
        if temp_file:
            os.unlink(temp_file.name)
        return jsonify({
            'error': f'OCR processing failed: {str(e)}',
            'success': False,
            'message': 'Internal server error during OCR processing'
        }), 500

@app.route('/api/solver/solve', methods=['POST'])
def solve_equation():
    """Solve the given equation"""
    try:
        data = request.get_json()
        if not data or 'equation' not in data:
            return jsonify({
                'error': 'No equation provided',
                'success': False,
                'message': 'Please provide an equation to solve'
            }), 400
        
        equation = data['equation']
        print(f"[DEBUG] API received equation: {equation}")
        
        if not SOLVER_AVAILABLE:
            return jsonify({
                'error': 'Equation solver not available',
                'success': False,
                'message': 'Solver module is not loaded'
            }), 500
        
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
        
        # Solve the equation using olol_hahahaa
        try:
            solution = olol_hahahaa.stepwise_rational_solution_with_explanations(equation)
            print(f"[DEBUG] Solution generated successfully, length: {len(solution)}")
            
            # Format the solution for better frontend display
            solution_lines = solution.split('\n')
            
            return jsonify({
                'success': True,
                'message': 'Equation solved successfully',
                'solution': solution,
                'steps': solution_lines,
                'equation': equation,
                'solution_length': len(solution),
                'error': None
            })
            
        except Exception as solve_error:
            print(f"[DEBUG] Equation solving error: {solve_error}")
            print(f"[DEBUG] Full solve traceback: {traceback.format_exc()}")
            return jsonify({
                'error': f'Equation solving failed: {str(solve_error)}',
                'success': False,
                'message': 'Failed to solve the equation',
                'equation': equation
            }), 500
        
    except Exception as e:
        print(f"[DEBUG] API solver exception: {e}")
        print(f"[DEBUG] Full traceback: {traceback.format_exc()}")
        return jsonify({
            'error': f'Equation solving failed: {str(e)}',
            'success': False,
            'message': 'Internal server error during equation solving'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'ocr_available': OCR_AVAILABLE,
        'solver_available': SOLVER_AVAILABLE,
        'modules': {
            'ocr': 'lcd' if OCR_AVAILABLE else None,
            'solver': 'olol_hahahaa' if SOLVER_AVAILABLE else None
        }
    })

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify API functionality"""
    try:
        if SOLVER_AVAILABLE:
            # Test with a simple equation
            test_eq = "2*x + 1 = 5"
            solution = olol_hahahaa.stepwise_rational_solution_with_explanations(test_eq)
            return jsonify({
                'success': True,
                'message': 'Test successful',
                'test_equation': test_eq,
                'solution_preview': solution[:200] + "..." if len(solution) > 200 else solution
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Solver not available for testing'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Test failed: {str(e)}'
        }), 500

@app.route('/api/test_ocr', methods=['POST'])
def test_ocr_endpoint():
    """Test OCR functionality with detailed debugging"""
    try:
        if not OCR_AVAILABLE:
            return jsonify({
                'success': False,
                'message': 'OCR module not available'
            }), 500
        
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No image file provided'
            }), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No image file selected'
            }), 400
        
        # Save the uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        temp_file.close()
        file.save(temp_file.name)
        
        print(f"[DEBUG] Testing OCR with image: {temp_file.name}")
        
        # Process the image with detailed debugging
        result = lcd.process_image(temp_file.name)
        
        # Clean up temp file
        if temp_file:
            os.unlink(temp_file.name)
        
        # Return detailed results for debugging
        return jsonify({
            'success': True,
            'message': 'OCR test completed',
            'raw_latex': result.get('latex_raw'),
            'cleaned_latex': result.get('latex_clean'),
            'extracted_equation': result.get('equation'),
            'sympy_output': result.get('sympy_out'),
            'debug_info': result.get('debug_info', {}),
            'error': result.get('error'),
            'ocr_quality': {
                'has_raw_latex': bool(result.get('latex_raw')),
                'has_cleaned_latex': bool(result.get('latex_clean')),
                'has_equation': bool(result.get('equation')),
                'equation_length': len(result.get('equation', '')),
                'debug_steps_passed': len([k for k, v in result.get('debug_info', {}).items() if v is True])
            }
        })
        
    except Exception as e:
        print(f"[DEBUG] Test OCR exception: {e}")
        import traceback
        print(f"[DEBUG] Full traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': f'OCR test failed: {str(e)}',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Drawing Solver API...")
    print(f"📷 OCR Available: {OCR_AVAILABLE}")
    print(f"🧮 Solver Available: {SOLVER_AVAILABLE}")
    
    if not OCR_AVAILABLE:
        print("⚠️  Warning: OCR module not available. Image processing will fail.")
    if not SOLVER_AVAILABLE:
        print("⚠️  Warning: Solver module not available. Equation solving will fail.")
    
    print("🌐 API will be available at http://localhost:5001")
    print("📋 Available endpoints:")
    print("   - POST /api/ocr/process - Process images through OCR")
    print("   - POST /api/solver/solve - Solve equations")
    print("   - GET  /api/health - Health check")
    print("   - GET  /api/test - Test solver functionality")
    print("   - POST /api/test_ocr - Test OCR with detailed debugging")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
