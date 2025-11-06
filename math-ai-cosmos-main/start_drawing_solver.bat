@echo off
echo Starting Drawing Solver Backend...
echo.
echo This will start the Flask API server for the drawing solver
echo Make sure you have Python and the required packages installed
echo.
echo Installing requirements...
pip install -r requirements.txt
echo.
echo Starting server...
python api/drawing_solver_api.py
echo.
pause


