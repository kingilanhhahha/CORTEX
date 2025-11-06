# 🚀 Quantum Solver Quick Start Guide

Get the Quantum Rational Function Solver up and running in 5 minutes!

## ⚡ Quick Setup

### 1. Start the Backend (Python)
```bash
# Navigate to the project directory
cd math-cosmos-tutor-main

# Start the backend server
start_quantum_solver.bat
```

**What this does:**
- Installs required Python packages
- Starts Flask server on port 5001
- Connects to the `7yessss.py` solver

### 2. Start the Frontend (React)
```bash
# In a new terminal, navigate to the project directory
cd math-cosmos-tutor-main

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

**What this does:**
- Starts React dev server on port 5173
- Loads the quantum calculator interface
- Connects to the Python backend

## 🎯 Test the Integration

### Option 1: Test Backend Only
```bash
# Run the test script
python test_quantum_solver.py
```

### Option 2: Test Full Integration
1. Open your browser to `http://localhost:5173`
2. Navigate to the main page
3. Scroll down to see the "Quantum Rational Function Solver" section
4. Click the embedded preview or navigate to `/quantum-solver`

## 🔧 Troubleshooting

### Backend Issues
- **Port 5001 already in use**: Change port in `api/rational_function_solver.py`
- **Import errors**: Ensure `7yessss.py` is in the root directory
- **Package errors**: Run `pip install -r api/requirements_quantum.txt`

### Frontend Issues
- **Port 5173 already in use**: Vite will automatically use the next available port
- **Build errors**: Clear `node_modules` and run `npm install` again
- **API connection failed**: Ensure backend is running on port 5001

## 📱 What You'll See

### Quantum Calculator Interface
- **Cosmic Design**: Dark theme with purple/cyan gradients
- **Function Input**: Text field for rational functions
- **Quick Examples**: Pre-loaded function examples
- **Real-time Analysis**: Live results from Python solver
- **Step-by-Step**: Animated solution progression

### Supported Functions
- `(x^2-8x-20)/(x+3)` - Basic quadratic over linear
- `(x^2-4)/(x-2)` - Factored form with cancellation
- `(x^3-1)/(x^2-1)` - Higher degree polynomials
- `(2x^2+5x-3)/(x^2-9)` - Complex rational expressions

## 🎮 Try These Examples

1. **Start Simple**: Enter `(x^2-4)/(x-2)`
2. **Watch the Magic**: See domain, zeros, and asymptotes appear
3. **Step Through**: Use the play/pause controls for step-by-step solutions
4. **Explore More**: Try different function formats

## 🔗 Access Points

- **Main Page**: `http://localhost:5173/index` - Embedded preview
- **Full Solver**: `http://localhost:5173/quantum-solver` - Full interface
- **API Health**: `http://localhost:5001/api/health` - Backend status

## 🚨 Common Gotchas

1. **Backend must start first** - Frontend won't work without it
2. **Use correct function format** - Must be `p(x)/q(x)` format
3. **Check browser console** - For frontend errors
4. **Check Python console** - For backend errors

## 🎉 Success Indicators

✅ Backend shows "Running on http://0.0.0.0:5001"  
✅ Frontend loads without errors  
✅ Function input accepts text  
✅ Analysis results appear  
✅ Step-by-step controls work  

## 🆘 Need Help?

1. **Check the logs** - Both Python and browser consoles
2. **Verify ports** - 5001 (Python) and 5173 (React)
3. **Test endpoints** - Use `test_quantum_solver.py`
4. **Check dependencies** - Ensure all packages are installed

---

**Happy Solving! 🚀⚛️🧮**
