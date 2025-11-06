# Rational Function Calculator Integration Guide

## Overview
The rational function calculator (`yessss.py`) has been successfully integrated with the main backend server (`hybrid_db_server.py`). This integration provides a unified API for analyzing rational functions with step-by-step solutions.

## What's Been Integrated

### 1. Calculator Module (`yessss.py`)
- **Class**: `RationalFunctionCalculator`
- **Features**:
  - Parse rational functions in various formats
  - Find domain and domain restrictions
  - Calculate zeros and intercepts
  - Determine vertical, horizontal, and oblique asymptotes
  - Identify holes and removable discontinuities
  - Generate step-by-step analysis
  - Plot functions with matplotlib

### 2. Main Backend Server (`hybrid_db_server.py`)
- **Port**: 5055 (default)
- **New Endpoints**:
  - `/api/rational-function/analyze` - Full function analysis
  - `/api/rational-function/domain` - Domain analysis
  - `/api/rational-function/zeros` - Zeros and intercepts
  - `/api/rational-function/asymptotes` - Asymptote analysis
  - `/api/rational-function/health` - Health check

## How to Use

### Starting the Backend Server
```bash
cd math-cosmos-tutor-main/api
python hybrid_db_server.py
```

The server will start on `http://localhost:5055`

### Testing the Integration

#### 1. Health Check
```bash
curl http://localhost:5055/api/rational-function/health
```

#### 2. Full Function Analysis
```bash
curl -X POST http://localhost:5055/api/rational-function/analyze \
  -H "Content-Type: application/json" \
  -d '{"function": "(x^2-8x-20)/(x+3)"}'
```

#### 3. Domain Analysis
```bash
curl -X POST http://localhost:5055/api/rational-function/domain \
  -H "Content-Type: application/json" \
  -d '{"function": "(x^2-8x-20)/(x+3)"}'
```

#### 4. Zeros Analysis
```bash
curl -X POST http://localhost:5055/api/rational-function/zeros \
  -H "Content-Type: application/json" \
  -d '{"function": "(x^2-8x-20)/(x+3)"}'
```

#### 5. Asymptotes Analysis
```bash
curl -X POST http://localhost:5055/api/rational-function/asymptotes \
  -H "Content-Type: application/json" \
  -d '{"function": "(x^2-8x-20)/(x+3)"}'
```

## Example Function Formats

The calculator accepts various input formats:

### Basic Format
```
(x^2-8x-20)/(x+3)
```

### Factored Format
```
((x-10)(x+2))/(x+3)
```

### With Function Notation
```
f(x) = (x^2-8x-20)/(x+3)
```

### Complex Expressions
```
(2x^3 + 5x^2 - 3x + 1)/(x^2 - 4)
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "function": "(x^2-8x-20)/(x+3)",
  "analysis": "Step-by-step analysis output...",
  "message": "Analysis completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description"
}
```

## Integration Benefits

1. **Unified API**: All rational function operations through one server
2. **Error Handling**: Consistent error responses across all endpoints
3. **Scalability**: Easy to add more mathematical functions
4. **Maintenance**: Single server to manage and monitor
5. **Performance**: Shared resources and database connections

## Troubleshooting

### Common Issues

1. **Import Error**: Make sure `yessss.py` is in the correct directory
2. **Port Conflict**: Check if port 5055 is available
3. **Dependencies**: Ensure all required packages are installed

### Dependencies Required
```
flask
flask-cors
sympy
matplotlib
numpy
```

### Testing the Integration
```bash
# Test the calculator directly
python yessss.py

# Test the backend server
python api/hybrid_db_server.py

# Test API endpoints
curl http://localhost:5055/api/rational-function/health
```

## Future Enhancements

1. **Caching**: Cache results for repeated calculations
2. **Batch Processing**: Handle multiple functions at once
3. **Graph Export**: Save plots as images
4. **History**: Store calculation history in database
5. **User Authentication**: Secure endpoints with user accounts

## File Structure
```
math-cosmos-tutor-main/
├── yessss.py                           # Rational function calculator
├── api/
│   ├── hybrid_db_server.py            # Main backend server (integrated)
│   └── rational_function_solver.py    # Standalone solver (alternative)
└── RATIONAL_FUNCTION_INTEGRATION.md   # This guide
```

## Support

If you encounter any issues:
1. Check the server logs for error messages
2. Verify all dependencies are installed
3. Test the calculator module independently
4. Check network connectivity and port availability

The integration is now complete and ready for use!
