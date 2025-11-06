# 🚀 Backend Startup Guide

This guide will help you start the backend solver and test if it's working properly.

## 🔧 Step 1: Start the Backend Server

### Option A: Using the Startup Script
```bash
cd math-cosmos-tutor-main
python start_backend.py
```

### Option B: Manual Start
```bash
cd math-cosmos-tutor-main/api
python solver.py
```

You should see output like:
```
🔬 Rational Equation Solver Backend
========================================
✅ Solver file found
✅ Dependencies checked
🌐 Starting server on http://localhost:5000
📝 API endpoints:
   - POST /api/solve - Solve rational equations
   - POST /api/validate - Validate equations
   - POST /api/classify - Classify equations
   - GET /api/health - Health check

Press Ctrl+C to stop the server
--------------------------------------------------
 * Serving Flask app 'solver'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
```

## 🧪 Step 2: Test the Backend

### Option A: Use the Test Page
1. Open `test-backend.html` in your browser
2. Click "Test Health Endpoint" to check if backend is running
3. Try the validation and solve tests

### Option B: Use Browser Console
Open browser console and run:
```javascript
// Test health endpoint
fetch('http://localhost:5000/api/health')
  .then(response => response.json())
  .then(data => console.log('Health check:', data))
  .catch(error => console.error('Error:', error));

// Test equation solving
fetch('http://localhost:5000/api/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ equation: '1/(x-2) = 3/(x+1)' })
})
.then(response => response.json())
.then(data => console.log('Solve result:', data))
.catch(error => console.error('Error:', error));
```

### Option C: Use curl (if available)
```bash
# Health check
curl http://localhost:5000/api/health

# Solve equation
curl -X POST http://localhost:5000/api/solve \
  -H "Content-Type: application/json" \
  -d '{"equation": "1/(x-2) = 3/(x+1)"}'
```

## 🎯 Step 3: Test the Frontend Integration

1. Make sure the backend is running (Step 1)
2. Start the frontend: `npm run dev`
3. Navigate to `http://localhost:5173/solver`
4. Enter an equation like `1/(x-2) = 3/(x+1)`
5. Click "Solve Equation"
6. Check browser console for debug messages

## 🔍 Troubleshooting

### Backend Won't Start
1. **Check Python version**: `python --version` (should be 3.7+)
2. **Install dependencies**: `pip install -r api/requirements.txt`
3. **Check file permissions**: Make sure you can read the solver files

### Backend Starts But Frontend Can't Connect
1. **Check port**: Backend should be on port 5000
2. **Check CORS**: Backend includes CORS headers
3. **Check firewall**: Make sure port 5000 is not blocked

### Common Error Messages
- `ModuleNotFoundError`: Run `pip install -r api/requirements.txt`
- `Address already in use`: Kill process using port 5000 or change port
- `Permission denied`: Run with appropriate permissions

### Test Equations to Try
```
1/(x-2) = 3/(x+1)
(x+1)/(x-3) = 2
x/(x+1) + 1/(x-1) = 2
(x^2 + 1)/(x-1) = x + 2
```

## 📊 Expected Results

### Health Check Response
```json
{
  "status": "healthy",
  "solver_available": true
}
```

### Solve Response
```json
{
  "success": true,
  "equation": "1/(x-2) = 3/(x+1)",
  "solution": "Step-by-step solution text...",
  "classification": {
    "type": "rational",
    "degree": null,
    "characteristics": {
      "has_rational_terms": true,
      "missing_terms": [],
      "is_factorable": false
    }
  },
  "valid": true,
  "message": "Valid rational equation"
}
```

## 🆘 Still Having Issues?

1. **Check console output** from both backend and frontend
2. **Test with the HTML test page** first
3. **Verify network connectivity** to localhost:5000
4. **Check for any error messages** in the terminal

---

**Note**: The backend must be running for the calculator to show solutions. The frontend will show a connection error if the backend is not available. 