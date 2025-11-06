@echo off
echo 🌐 MathVerse Network Access Setup
echo =================================

echo.
echo 📍 Finding your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%
echo ✅ Your IP Address: %IP%

echo.
echo 🚀 Starting servers for network access...
echo.
echo 📝 Access URLs for other devices:
echo    Frontend: http://%IP%:5173
echo    Backend:  http://%IP%:5000
echo.
echo ⚠️  Make sure Windows Firewall allows connections on ports 5000 and 5173
echo.

cd /d "%~dp0"
start "Database Server" cmd /k "cd api && python hybrid_db_server.py"
timeout /t 2 /nobreak >nul
start "Solver Server" cmd /k "cd api && python solver.py"
timeout /t 2 /nobreak >nul
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ All servers started! Other devices can now access:
echo    Frontend: http://%IP%:5173
echo    Database: http://%IP%:5055
echo    Solver:   http://%IP%:5000
echo.
pause
