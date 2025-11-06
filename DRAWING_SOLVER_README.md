# 🎨 Drawing Equation Solver

A powerful mathematical equation solver that allows you to draw equations by hand and get instant step-by-step solutions with AI-powered OCR recognition.

## Features

- **Handwriting Recognition**: Draw mathematical equations on a canvas
- **OCR Processing**: Convert handwritten equations to LaTeX and SymPy format
- **Step-by-Step Solutions**: Get detailed explanations for solving rational equations
- **Manual Input**: Also supports typing equations directly
- **Real-time Processing**: Instant feedback and results
- **Beautiful UI**: Modern, responsive interface with animations

## How to Use

### 1. Start the Backend

First, start the Python backend server:

```bash
# Windows
start_drawing_solver.bat

# Or manually
pip install -r requirements.txt
python api/drawing_solver_api.py
```

The backend will run on `http://localhost:5001`

### 2. Access the Drawing Solver

Navigate to `/drawing-solver` in your Math Cosmos Tutor application, or use the main page which now includes the drawing solver section.

### 3. Draw Your Equation

1. **Drawing Mode**: Use the canvas to draw your mathematical equation
   - Click and drag to draw
   - Use the Clear button to start over
   - Click "Process Drawing" to run OCR

2. **Manual Input Mode**: Type your equation directly
   - Use the format: `Eq((x**2 - 4)/(x - 2), x + 2)`
   - Click "Solve Equation" to get the solution

### 4. View Results

- **OCR Results Tab**: Shows LaTeX output and SymPy format
- **Solution Tab**: Displays step-by-step solution with explanations

## Supported Equation Types

The solver currently supports:
- **Rational Equations**: Fractions with polynomials
- **Linear Equations**: First-degree equations
- **Quadratic Equations**: Second-degree equations
- **Polynomial Equations**: Higher-degree equations

## Technical Details

### Frontend
- React with TypeScript
- Canvas-based drawing interface
- Real-time OCR processing
- Beautiful animations with Framer Motion

### Backend
- Flask API server
- OCR processing (currently mock data)
- SymPy-based equation solving
- CORS enabled for frontend integration

### Dependencies
- **Python**: Flask, SymPy, Pillow, NumPy
- **Frontend**: React, TypeScript, Tailwind CSS

## API Endpoints

- `POST /api/ocr/process` - Process uploaded images through OCR
- `POST /api/solver/solve` - Solve mathematical equations
- `GET /api/health` - Health check and module status

## Example Equations

Try these example equations:

1. **Basic Rational**: `Eq((x**2 - 4)/(x - 2), x + 2)`
2. **Linear**: `Eq(2*x + 3, 7)`
3. **Quadratic**: `Eq(x**2 - 5*x + 6, 0)`

## Troubleshooting

### Backend Issues
- Ensure Python 3.7+ is installed
- Install requirements: `pip install -r requirements.txt`
- Check if port 5001 is available
- Verify SymPy installation

### Frontend Issues
- Ensure the backend is running on port 5001
- Check browser console for errors
- Verify CORS settings

### OCR Issues
- Currently using mock data for testing
- To integrate real OCR, install and configure the `lcd` module
- Ensure proper image format (PNG recommended)

## Development

### Adding Real OCR
To integrate real OCR functionality:

1. Install your preferred OCR library
2. Update the `process_ocr` function in `api/drawing_solver_api.py`
3. Set `OCR_AVAILABLE = True`

### Extending Equation Types
To support more equation types:

1. Add validation logic in `olol_hahahaa.py`
2. Extend the solving functions
3. Update the frontend to handle new types

## Contributing

Feel free to contribute by:
- Improving the OCR integration
- Adding support for more equation types
- Enhancing the UI/UX
- Optimizing the solving algorithms

## License

This project is part of the Math Cosmos Tutor application.


