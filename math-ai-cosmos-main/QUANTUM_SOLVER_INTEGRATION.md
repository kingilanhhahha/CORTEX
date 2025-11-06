# Quantum Rational Function Solver Integration

This document describes the integration of the advanced rational function solver (`7yessss.py`) into the Math Cosmos Tutor frontend with a quantum calculator design.

## 🚀 Features

### Frontend (React + TypeScript)
- **Quantum Design**: Modern, space-themed UI with gradient backgrounds and animations
- **Interactive Input**: Support for various rational function formats
- **Real-time Analysis**: Live connection to Python backend solver
- **Step-by-Step Solutions**: Animated progression through solution steps
- **Responsive Design**: Works on desktop and mobile devices
- **Example Functions**: Quick access to common rational function examples

### Backend (Python + Flask)
- **Advanced Solver**: Full integration with `7yessss.py` rational function calculator
- **Multiple Endpoints**: Separate APIs for analysis, validation, domain, zeros, and asymptotes
- **Error Handling**: Comprehensive error handling and user feedback
- **CORS Support**: Cross-origin requests enabled for frontend integration

## 🛠️ Installation & Setup

### 1. Backend Setup

#### Install Python Dependencies
```bash
cd math-cosmos-tutor-main/api
pip install -r requirements_quantum.txt
```

#### Start the Backend Server
```bash
# Option 1: Use the batch file (Windows)
start_quantum_solver.bat

# Option 2: Manual start
cd api
python rational_function_solver.py
```

The backend will run on `http://localhost:5001`

### 2. Frontend Setup

#### Install Node Dependencies
```bash
cd math-cosmos-tutor-main
npm install
```

#### Start the Frontend
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔌 API Endpoints

### Base URL: `http://localhost:5001`

| Endpoint | Method | Description | Request Body | Response |
|-----------|--------|-------------|--------------|----------|
| `/api/rational-function/analyze` | POST | Full function analysis | `{"function": "string"}` | Complete analysis with steps |
| `/api/rational-function/validate` | POST | Validate function format | `{"function": "string"}` | Validation result |
| `/api/rational-function/domain` | POST | Find function domain | `{"function": "string"}` | Domain and restrictions |
| `/api/rational-function/zeros` | POST | Find function zeros | `{"function": "string"}` | Zeros and factors |
| `/api/rational-function/asymptotes` | POST | Find asymptotes | `{"function": "string"}` | All asymptote types |
| `/api/health` | GET | Health check | None | Server status |

## 🎯 Usage Examples

### Supported Function Formats
- `(x^2-8x-20)/(x+3)`
- `(x^2-4)/(x-2)`
- `(x^3-1)/(x^2-1)`
- `(2x^2+5x-3)/(x^2-9)`
- `(x^2+2x+1)/(x+1)`

### Frontend Routes
- **Main Page**: `/index` - Contains embedded iframe previews
- **Quantum Solver**: `/quantum-solver` - Full-page quantum solver interface
- **Calculator**: `/calculator` - Original tutor calculator panel
- **Solver**: `/solver` - Original rational equation solver

## 🎨 UI Components

### QuantumRationalSolver Component
- **Location**: `src/components/calculator/QuantumRationalSolver.tsx`
- **Features**: 
  - Gradient backgrounds with cosmic theme
  - Animated step-by-step progression
  - Interactive controls (play, pause, reset)
  - Real-time error handling
  - Responsive grid layouts

### Integration Points
- **Main Index**: Embedded iframe preview
- **Navigation**: Direct route access
- **Styling**: Consistent with existing cosmic theme

## 🔧 Technical Details

### Frontend Architecture
- **State Management**: React hooks for local state
- **API Integration**: Fetch API with error handling
- **Animations**: Framer Motion for smooth transitions
- **Styling**: Tailwind CSS with custom gradients
- **Math Rendering**: KaTeX for mathematical expressions

### Backend Architecture
- **Framework**: Flask with CORS support
- **Solver Integration**: Direct import of `RationalFunctionCalculator` class
- **Output Parsing**: Structured parsing of solver output
- **Error Handling**: Comprehensive exception handling

### Data Flow
1. User inputs rational function in frontend
2. Frontend sends POST request to backend
3. Backend processes function using `7yessss.py` solver
4. Backend parses and structures the output
5. Frontend receives structured data and displays results
6. User can interact with step-by-step solution

## 🐛 Troubleshooting

### Common Issues

#### Backend Connection Failed
- Ensure Python server is running on port 5001
- Check firewall settings
- Verify CORS configuration

#### Solver Import Error
- Ensure `7yessss.py` is in the correct location
- Check Python path configuration
- Verify all dependencies are installed

#### Frontend Build Errors
- Clear node_modules and reinstall
- Check TypeScript compilation
- Verify all imports are correct

### Debug Steps
1. Check browser console for frontend errors
2. Check Python console for backend errors
3. Verify API endpoints are accessible
4. Test with simple function inputs first

## 🚀 Future Enhancements

### Planned Features
- **Graph Visualization**: Interactive function plotting
- **Export Options**: PDF/LaTeX export of solutions
- **Batch Processing**: Multiple functions at once
- **Custom Themes**: User-selectable UI themes
- **Offline Mode**: Cached solutions for common functions

### Integration Opportunities
- **Progress Tracking**: Save analysis history
- **Classroom Integration**: Teacher-student sharing
- **AI Tutoring**: Enhanced explanations and hints
- **Mobile App**: Native mobile application

## 📚 Dependencies

### Backend Dependencies
- `flask==2.3.3`
- `flask-cors==4.0.0`
- `sympy==1.12`
- `matplotlib==3.7.2`
- `numpy==1.24.3`

### Frontend Dependencies
- `react==^18.3.1`
- `framer-motion==^12.23.11`
- `react-katex==^3.0.1`
- `katex==^0.16.9`
- `tailwindcss==^3.4.11`

## 🤝 Contributing

### Development Workflow
1. Make changes to backend or frontend
2. Test locally with both servers running
3. Update documentation as needed
4. Submit pull request with detailed description

### Code Standards
- Follow existing naming conventions
- Add TypeScript types for new interfaces
- Include error handling for all API calls
- Maintain consistent styling patterns

## 📄 License

This integration follows the same license as the main Math Cosmos Tutor project.

---

For additional support or questions, please refer to the main project documentation or create an issue in the repository.
