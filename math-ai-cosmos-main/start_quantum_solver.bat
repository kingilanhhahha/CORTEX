@echo off
echo Starting Quantum Rational Function Solver Backend...
echo.
echo This will start the Flask API server on port 5001
echo Make sure you have the required Python packages installed:
echo - flask
echo - flask-cors
echo - sympy
echo - matplotlib
echo - numpy
echo.
echo Installing requirements...
pip install flask flask-cors sympy matplotlib numpy
echo.
echo Starting server...
cd api
python rational_function_solver.py
pause
