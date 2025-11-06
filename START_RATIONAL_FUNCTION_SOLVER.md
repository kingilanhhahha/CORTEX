# 🚀 How to Start the Rational Function Analyzer Backend

## Quick Start

Simply run the following command:

```bash
# Windows
start_drawing_solver.bat

# Linux/Mac
python api/drawing_solver_api.py
```

## What Gets Started

When you run the backend, it will:

1. ✅ Install required dependencies from `requirements.txt`
2. ✅ Start Flask server on port 5001
3. ✅ Enable OCR processing for handwritten equations
4. ✅ Enable Rational Function Analyzer with graphing
5. ✅ Enable Equation Solver for rational equations
6. ✅ Enable Solution Checker for student work

## Prerequisites

Make sure you have:
- Python 3.7 or higher
- Internet connection (for first-time dependency installation)

## What the Backend Includes

### Main Features:
1. **Drawing Solver** - OCR for handwritten math
2. **Rational Function Analyzer** - Complete analysis with graphs
3. **Equation Solver** - Step-by-step solutions
4. **Solution Checker** - Feedback on student work

### API Endpoints:
- `POST /api/ocr/process` - Process images through OCR
- `POST /api/rational-function/analyze` - Analyze rational functions with graphs
- `POST /api/solver/solve` - Solve equations
- `POST /api/solver/check` - Check student solutions
- `GET /api/health` - Health check

## Dependencies Installed

The backend automatically installs:
- `flask==2.3.3` - Web framework
- `flask-cors==4.0.0` - CORS support
- `sympy==1.12` - Symbolic mathematics
- `pillow==10.0.1` - Image processing
- `numpy==1.24.3` - Numerical computing
- `matplotlib==3.7.2` - Plotting (for graphs!)
- `latex2sympy2==1.8.3` - LaTeX to SymPy conversion
- `requests>=2.31.0` - HTTP requests

## Troubleshooting

### Backend won't start
```bash
# Make sure you're in the correct directory
cd /path/to/math-ai-cosmos-main

# Try installing dependencies manually
pip install -r requirements.txt

# Then start the server
python api/drawing_solver_api.py
```

### Module not found errors
The backend will show which modules are available:
- ✓ OCR module loaded successfully
- ✓ Rational function calculator loaded successfully
- ✓ Solver module loaded successfully

If a module shows as "not available", check that the corresponding Python file is in the root directory:
- `lcd.py` - For OCR
- `yessss.py` - For Rational Function Analyzer
- `olol_hahahaa.py` - For equation solving
- `solution_analysis.py` - For solution checking

### Port already in use
If port 5001 is already in use:
1. Kill the existing process using port 5001
2. Or modify the port in `api/drawing_solver_api.py` line 372

## Testing

Once the backend is running, you can test it:

```bash
# Health check
curl http://localhost:5001/api/health

# Test rational function analyzer
curl -X POST http://localhost:5001/api/rational-function/analyze \
  -H "Content-Type: application/json" \
  -d '{"function": "(x^2-4)/(x-2)"}'
```

## Next Steps

After the backend is running:
1. Open your browser
2. Navigate to your frontend URL
3. Go to the Drawing Solver page
4. Click "Rational Function Analyzer" mode
5. Enter a function like `(x^2-4)/(x-2)` or draw it
6. Click "Solve" to see the complete analysis with graph!

## Configuration

### SimpleTex OCR Token
The OCR uses SimpleTex API. The token is set in `lcd.py`:
```python
SIMPLETEX_UAT = "your_token_here"
```

### Graph Generation
Graphs are automatically generated using matplotlib with Agg backend (non-interactive), making it perfect for server-side generation.

## Support

If you encounter issues:
1. Check the backend console for error messages
2. Verify all modules are loading correctly
3. Check that dependencies installed successfully
4. Make sure Python 3.7+ is being used


