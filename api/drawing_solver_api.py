#!/usr/bin/env python3
"""
Simple Flask API for Drawing Solver
Handles OCR processing and equation solving
"""

import os
import sys

# CRITICAL: Check for typing.py file that might shadow standard library
# This is a common issue on Raspberry Pi
def check_typing_conflict():
    """Check if there's a typing.py file that might shadow the standard library"""
    # Check current directory and parent directories
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    
    for check_dir in [current_dir, parent_dir]:
        typing_file = os.path.join(check_dir, 'typing.py')
        if os.path.exists(typing_file):
            print(f"WARNING: Found typing.py at {typing_file} - this may shadow the standard library!")
            print(f"Please rename or remove this file to fix the import error.")
            return True
    
    # Check if typing module is actually available
    try:
        import typing
        # Verify it's the standard library, not a local file
        typing_file_path = typing.__file__ if hasattr(typing, '__file__') else None
        if typing_file_path and not typing_file_path.startswith(sys.prefix):
            print(f"WARNING: typing module found at {typing_file_path} - may not be standard library!")
        return False
    except ImportError as e:
        print(f"ERROR: Cannot import typing module: {e}")
        print("This might be a Python installation issue.")
        return True
    except Exception as e:
        # Catch any other errors (like "typing is not a package")
        print(f"ERROR: Problem with typing module: {e}")
        return True

# Run the check
typing_conflict = check_typing_conflict()

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
from PIL import Image
import tempfile

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
    # Try to import typing first to catch the error early
    try:
        import typing
        # Check if it's trying to import typing.io (which doesn't exist)
        if hasattr(typing, 'io'):
            print("WARNING: typing.io found - this shouldn't exist in standard library")
    except ImportError as typing_error:
        print(f"ERROR: Cannot import typing module: {typing_error}")
        print("This is likely causing the OCR import to fail.")
        print("\nTroubleshooting steps:")
        print("1. Check if there's a file named 'typing.py' in your project directory")
        print("2. Check if there's a directory named 'typing' in your project")
        print("3. Try: python3 -c 'import typing; print(typing.__file__)' to see where typing is loaded from")
        print("4. If on Raspberry Pi, ensure Python 3.5+ is installed")
    
    import lcd
    OCR_AVAILABLE = True
    print("OCR module loaded successfully")
except ImportError as e:
    error_msg = str(e)
    print(f"OCR module not available: {e}")
    
    # Provide specific help for typing errors
    if 'typing' in error_msg.lower() or 'typing.io' in error_msg:
        print("\n" + "="*60)
        print("TYPING MODULE ERROR DETECTED")
        print("="*60)
        print("The error 'typing is not a package' or 'no module named typing.io'")
        print("usually means one of these issues:")
        print("\n1. There's a file named 'typing.py' in your project that shadows the standard library")
        print("   Solution: Rename or delete any typing.py file in your project")
        print("\n2. There's a directory named 'typing' in your project")
        print("   Solution: Rename or delete any typing/ directory")
        print("\n3. A dependency is incorrectly trying to import typing.io")
        print("   Solution: Update your dependencies or check for conflicting packages")
        print("\n4. Python version is too old (needs Python 3.5+)")
        print("   Solution: Upgrade Python or use Python 3 explicitly")
        print("\nTo find the problematic file, run:")
        print("  find . -name 'typing.py' -o -name 'typing' -type d")
        print("="*60)
    
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
                error_lower = error_msg.lower()
                is_network_error = (
                    "Network connection" in error_msg or 
                    "network" in error_lower or
                    "connection" in error_lower or
                    "timeout" in error_lower or
                    "internet" in error_lower or
                    "dns" in error_lower or
                    "socket" in error_lower or
                    "ssl" in error_lower or
                    "unreachable" in error_lower or
                    "name resolution" in error_lower
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
        error_lower = error_str.lower()
        is_network_error = (
            "Network connection" in error_str or 
            "network" in error_lower or
            "connection" in error_lower or
            "timeout" in error_lower or
            "internet" in error_lower or
            "ConnectionError" in error_str or
            "Timeout" in error_str or
            "SSLError" in error_str or
            "dns" in error_lower or
            "socket" in error_lower or
            "unreachable" in error_lower or
            "name resolution" in error_lower or
            "chunkedencoding" in error_lower or
            "proxy" in error_lower
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

@app.route('/api/tts/generate', methods=['POST'])
def generate_tts():
    """Generate text-to-speech audio using Google Gemini TTS"""
    try:
        # Try to import google.genai
        try:
            from google import genai
            from google.genai import types
            import mimetypes
            import struct
        except ImportError:
            return jsonify({
                'success': False,
                'error': 'google-genai package not installed. Please run: pip install google-genai'
            }), 500
        
        data = request.get_json()
        text = data.get('text', '').strip()
        tone = data.get('tone', 'energetic_teaching')  # Default to energetic teaching tone
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'No text provided'
            }), 400
        
        # Rotate through multiple API keys to distribute requests (15 per day per key = 45 total)
        api_keys = [
            os.environ.get("GEMINI_API_KEY") or "AIzaSyBo7Ukqxk_6DyNHePb6rnWP23028hlbDQQ",
            "AIzaSyBrMCRwiT_VxFhRX8MHFtn60BVs_LDesyA",
            "AIzaSyCQKitRJPh5xHfqJxnhaLApqMRnAUGY7Uo"
        ]
        
        # Filter out None/empty keys
        api_keys = [key for key in api_keys if key]
        
        if not api_keys:
            return jsonify({
                'success': False,
                'error': 'No valid API keys available'
            }), 500
        
        # Simple round-robin: use request count or timestamp to rotate
        import time
        key_index = int(time.time()) % len(api_keys)
        api_key = api_keys[key_index]
        
        print(f"[TTS] Using API key {key_index + 1} of {len(api_keys)}")
        
        # Prepare text with energetic tutor tone instructions
        if tone == 'energetic_teaching':
            import re
            print(f"[TTS] Original text length: {len(text)} characters")
            
            # Check if this is the concise format (process mode) or detailed format (raw mode)
            has_teacher_voice = 'TEACHER\'S VOICE' in text.upper() or 'TEACHER\'S VOICE' in text
            has_instructions = 'INSTRUCTION' in text.upper()
            is_concise_format = not has_teacher_voice and not has_instructions
            
            print(f"[TTS] Format detected: {'Concise (process mode)' if is_concise_format else 'Detailed (raw mode)'}")
            
            # Simplified approach: Clean the text but preserve all content
            cleaned_text = text
            
            # Remove markdown formatting but keep content
            cleaned_text = re.sub(r'\*\*TEACHER\'S\s+VOICE:\*\*', 'TEACHER EXPLANATION:', cleaned_text, flags=re.IGNORECASE)
            cleaned_text = re.sub(r'TEACHER\'S\s+VOICE:', 'TEACHER EXPLANATION:', cleaned_text, flags=re.IGNORECASE)
            cleaned_text = re.sub(r'INSTRUCTION:', 'EXPLANATION:', cleaned_text, flags=re.IGNORECASE)
            
            # Remove code block markers but keep content
            cleaned_text = re.sub(r'```', '', cleaned_text)
            
            # Remove markdown headers but keep text
            cleaned_text = re.sub(r'###\s*\*\*', '', cleaned_text)
            cleaned_text = re.sub(r'\*\*', '', cleaned_text)
            
            # For concise format, enhance step explanations
            if is_concise_format:
                # Convert step labels to more explanatory format
                cleaned_text = re.sub(r'Step\s+(\d+):\s*([^\n]+)', r'Step \1: \2. Let me explain this step:', cleaned_text, flags=re.IGNORECASE)
                # Add explanations for common patterns
                cleaned_text = re.sub(r'Original equation\s*\n\s*([^\n]+)', r'We start with the original equation: \1', cleaned_text, flags=re.IGNORECASE)
                cleaned_text = re.sub(r'Least common denominator\s*\n\s*LCD\s*=\s*([^\n]+)', r'To solve this, we need to find the least common denominator, which is \1', cleaned_text, flags=re.IGNORECASE)
                cleaned_text = re.sub(r'After clearing denominators:\s*\n\s*([^\n]+)', r'After multiplying both sides by the LCD and clearing denominators, we get: \1', cleaned_text, flags=re.IGNORECASE)
                cleaned_text = re.sub(r'Polynomial form\s*\n\s*([^\n]+)', r'Now we rearrange this into polynomial form: \1', cleaned_text, flags=re.IGNORECASE)
                cleaned_text = re.sub(r'Solve for x\s*\n\s*x\s*=\s*([^\n]+)', r'Solving for x, we find that x equals \1', cleaned_text, flags=re.IGNORECASE)
                cleaned_text = re.sub(r'Substitute x\s*=\s*([^\n]+)', r'Let\'s verify by substituting x equals \1', cleaned_text, flags=re.IGNORECASE)
                cleaned_text = re.sub(r'Final solution\s*\n\s*x\s*=\s*([^\n]+)', r'Therefore, the final solution is x equals \1', cleaned_text, flags=re.IGNORECASE)
            else:
                # For detailed format, just clean step labels
                cleaned_text = re.sub(r'Step\s+\d+:\s*', 'Step: ', cleaned_text, flags=re.IGNORECASE)
            
            # Convert math symbols to spoken form for better TTS
            cleaned_text = cleaned_text.replace(' * ', ' times ')
            cleaned_text = cleaned_text.replace(' = ', ' equals ')
            cleaned_text = cleaned_text.replace(' / ', ' divided by ')
            cleaned_text = cleaned_text.replace(' + ', ' plus ')
            cleaned_text = cleaned_text.replace(' - ', ' minus ')
            cleaned_text = cleaned_text.replace(' ≠ ', ' is not equal to ')
            cleaned_text = cleaned_text.replace(' → ', ' which becomes ')
            
            # Remove excessive whitespace
            cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
            cleaned_text = re.sub(r' {2,}', ' ', cleaned_text)
            
            print(f"[TTS] Cleaned text length: {len(cleaned_text)} characters")
            
            # Create an energetic tutor tone with natural pauses
            if is_concise_format:
                instruction_text = """You are an energetic, enthusiastic math tutor explaining how to solve this equation step by step.
                The content shows the solution steps. Explain COMPLETELY how each step works and why we do it.
                Don't just read the steps - explain the reasoning behind each transformation.
                Walk through each step, explain what's happening, and show how the math works.
                Use natural pauses between steps.
                Be enthusiastic and clear - like a tutor who loves teaching!
                Use phrases like "Let's see...", "Watch this!", "Here's what happens...", "Perfect!"
                Explain the complete solving process from start to finish with full explanations."""
            else:
                instruction_text = """You are an energetic, enthusiastic math tutor explaining how to solve this equation step by step.
                Explain COMPLETELY how the equation is solved - don't just list steps, explain the reasoning and process.
                Walk through each transformation, explain why we do each step, and show how the math works.
                Use natural pauses between major points.
                Be enthusiastic and clear - like a tutor who loves teaching!
                Use phrases like "Let's see...", "Watch this!", "Here's what happens...", "Perfect!"
                Explain the complete solving process from start to finish.
                Read all the content including TEACHER EXPLANATION sections and EXPLANATION sections.
                Explain everything clearly and completely."""
            
            formatted_text = f"""{instruction_text}
            
            Tutorial content to explain:
            {cleaned_text}"""
            
            print(f"[TTS] Final formatted text length: {len(formatted_text)} characters")
        else:
            formatted_text = text
        
        # Initialize client
        client = genai.Client(api_key=api_key)
        # Try different model names - start with experimental, fallback to regular
        models_to_try = [
            "gemini-2.5-flash-exp-tts",  # Experimental version
            "gemini-2.5-flash-tts",      # Regular version
            "gemini-2.5-flash-preview-tts"  # Preview version
        ]
        model = models_to_try[0]  # Start with experimental
        
        # Create content
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=formatted_text),
                ],
            ),
        ]
        
        # Configure TTS with single energetic teaching voice
        generate_content_config = types.GenerateContentConfig(
            temperature=1.1,  # Balanced temperature for creativity without excess
            response_modalities=["audio"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="Zephyr"  # Warm, energetic voice perfect for teaching
                    )
                ),
            ),
        )
        
        # Collect audio chunks
        audio_chunks = []
        mime_type = "audio/L16;rate=24000"  # Default
        error_messages = []
        text_responses = []
        chunk_count = 0
        
        print(f"[TTS] Starting generation with model: {model}")
        print(f"[TTS] Text length: {len(formatted_text)} characters")
        
        try:
            for chunk in client.models.generate_content_stream(
                model=model,
                contents=contents,
                config=generate_content_config,
            ):
                chunk_count += 1
                
                # Check for errors in the chunk
                if hasattr(chunk, 'error') and chunk.error:
                    error_msg = str(chunk.error)
                    error_messages.append(error_msg)
                    print(f"[TTS] Chunk {chunk_count} error: {error_msg}")
                    continue
                
                # Check for finish reason (might indicate completion or error)
                if hasattr(chunk, 'candidates') and chunk.candidates:
                    for candidate in chunk.candidates:
                        if hasattr(candidate, 'finish_reason') and candidate.finish_reason:
                            print(f"[TTS] Finish reason: {candidate.finish_reason}")
                
                if (
                    chunk.candidates is None 
                    or len(chunk.candidates) == 0
                    or chunk.candidates[0].content is None 
                    or chunk.candidates[0].content.parts is None
                ):
                    if chunk_count == 1:
                        print(f"[TTS] First chunk has no candidates/parts")
                    continue
                
                # Check for text responses (might indicate an error)
                if hasattr(chunk, 'text') and chunk.text:
                    text_responses.append(chunk.text)
                    print(f"[TTS] Received text response: {chunk.text[:100]}")
                
                # Check for audio data
                if (len(chunk.candidates[0].content.parts) > 0):
                    part = chunk.candidates[0].content.parts[0]
                    if hasattr(part, 'inline_data') and part.inline_data:
                        if hasattr(part.inline_data, 'data') and part.inline_data.data:
                            inline_data = part.inline_data
                            audio_chunks.append(inline_data.data)
                            print(f"[TTS] Received audio chunk {len(audio_chunks)}, size: {len(inline_data.data)} bytes")
                            # Capture mime type from first chunk with data
                            if mime_type == "audio/L16;rate=24000" and hasattr(inline_data, 'mime_type') and inline_data.mime_type:
                                mime_type = inline_data.mime_type
                                print(f"[TTS] MIME type: {mime_type}")
        except Exception as stream_error:
            error_msg = f"Stream error: {str(stream_error)}"
            error_messages.append(error_msg)
            print(f"[TTS] Exception: {error_msg}")
            import traceback
            print(f"[TTS] Traceback: {traceback.format_exc()}")
        
        print(f"[TTS] Total chunks received: {chunk_count}, Audio chunks: {len(audio_chunks)}")
        
        # If no audio chunks, try fallback models and/or other API keys
        if not audio_chunks:
            # First try fallback models with current API key
            if len(models_to_try) > 1:
                print(f"[TTS] No audio from {model}, trying fallback models...")
                for fallback_model in models_to_try[1:]:
                    print(f"[TTS] Trying fallback model: {fallback_model}")
                    try:
                        audio_chunks = []
                        chunk_count = 0
                        for chunk in client.models.generate_content_stream(
                            model=fallback_model,
                            contents=contents,
                            config=generate_content_config,
                        ):
                            chunk_count += 1
                            if (chunk.candidates and len(chunk.candidates) > 0 and
                                chunk.candidates[0].content and chunk.candidates[0].content.parts and
                                len(chunk.candidates[0].content.parts) > 0):
                                part = chunk.candidates[0].content.parts[0]
                                if hasattr(part, 'inline_data') and part.inline_data:
                                    if hasattr(part.inline_data, 'data') and part.inline_data.data:
                                        audio_chunks.append(part.inline_data.data)
                                        if mime_type == "audio/L16;rate=24000" and hasattr(part.inline_data, 'mime_type') and part.inline_data.mime_type:
                                            mime_type = part.inline_data.mime_type
                        if audio_chunks:
                            print(f"[TTS] Success with fallback model: {fallback_model}")
                            model = fallback_model
                            break
                    except Exception as e:
                        print(f"[TTS] Fallback model {fallback_model} failed: {str(e)}")
                        continue
            
            # If still no audio, try other API keys
            if not audio_chunks and len(api_keys) > 1:
                print(f"[TTS] Trying other API keys...")
                for other_key in api_keys:
                    if other_key == api_key or not other_key:
                        continue
                    print(f"[TTS] Trying API key: {other_key[:20]}...")
                    try:
                        other_client = genai.Client(api_key=other_key)
                        audio_chunks = []
                        chunk_count = 0
                        for chunk in other_client.models.generate_content_stream(
                            model=model,
                            contents=contents,
                            config=generate_content_config,
                        ):
                            chunk_count += 1
                            if (chunk.candidates and len(chunk.candidates) > 0 and
                                chunk.candidates[0].content and chunk.candidates[0].content.parts and
                                len(chunk.candidates[0].content.parts) > 0):
                                part = chunk.candidates[0].content.parts[0]
                                if hasattr(part, 'inline_data') and part.inline_data:
                                    if hasattr(part.inline_data, 'data') and part.inline_data.data:
                                        audio_chunks.append(part.inline_data.data)
                                        if mime_type == "audio/L16;rate=24000" and hasattr(part.inline_data, 'mime_type') and part.inline_data.mime_type:
                                            mime_type = part.inline_data.mime_type
                        if audio_chunks:
                            print(f"[TTS] Success with alternative API key")
                            api_key = other_key
                            client = other_client
                            break
                    except Exception as e:
                        print(f"[TTS] API key failed: {str(e)}")
                        continue
        
        # If no audio chunks but we have error messages or text responses, return error
        if not audio_chunks:
            error_detail = 'No audio data generated'
            if error_messages:
                error_detail += f'. Errors: {"; ".join(error_messages)}'
            if text_responses:
                error_detail += f'. Text responses: {"; ".join(text_responses[:3])}'  # First 3 responses
            return jsonify({
                'success': False,
                'error': error_detail,
                'model_used': model,
                'errors': error_messages,
                'text_responses': text_responses[:5] if text_responses else []
            }), 500
        
        # Combine all audio chunks
        combined_audio = b''.join(audio_chunks)
        
        # Convert to WAV format
        def parse_audio_mime_type(mime_type: str) -> dict:
            """Parse bits per sample and rate from audio MIME type"""
            bits_per_sample = 16
            rate = 24000
            
            parts = mime_type.split(";")
            for param in parts:
                param = param.strip()
                if param.lower().startswith("rate="):
                    try:
                        rate_str = param.split("=", 1)[1]
                        rate = int(rate_str)
                    except (ValueError, IndexError):
                        pass
                elif param.startswith("audio/L"):
                    try:
                        bits_per_sample = int(param.split("L", 1)[1])
                    except (ValueError, IndexError):
                        pass
            
            return {"bits_per_sample": bits_per_sample, "rate": rate}
        
        def convert_to_wav(audio_data: bytes, mime_type: str) -> bytes:
            """Convert audio data to WAV format"""
            parameters = parse_audio_mime_type(mime_type)
            bits_per_sample = parameters["bits_per_sample"]
            sample_rate = parameters["rate"]
            num_channels = 1
            data_size = len(audio_data)
            bytes_per_sample = bits_per_sample // 8
            block_align = num_channels * bytes_per_sample
            byte_rate = sample_rate * block_align
            chunk_size = 36 + data_size
            
            header = struct.pack(
                "<4sI4s4sIHHIIHH4sI",
                b"RIFF",
                chunk_size,
                b"WAVE",
                b"fmt ",
                16,
                1,
                num_channels,
                sample_rate,
                byte_rate,
                block_align,
                bits_per_sample,
                b"data",
                data_size
            )
            return header + audio_data
        
        wav_audio = convert_to_wav(combined_audio, mime_type)
        
        # Encode to base64 for transmission
        audio_base64 = base64.b64encode(wav_audio).decode('utf-8')
        
        return jsonify({
            'success': True,
            'audio': audio_base64,
            'format': 'wav',
            'mime_type': 'audio/wav'
        })
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[TTS ERROR] {str(e)}")
        print(f"[TTS TRACEBACK] {error_trace}")
        return jsonify({
            'success': False,
            'error': f'TTS generation failed: {str(e)}',
            'traceback': error_trace,
            'model_attempted': model if 'model' in locals() else 'unknown'
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
