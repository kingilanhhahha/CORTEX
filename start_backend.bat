@echo off
echo Starting Math Tutor Backend Server...
cd /d "%~dp0api"
echo Current directory: %CD%
echo Starting Flask server on port 5055...
python hybrid_db_server.py
pause


