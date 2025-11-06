@echo off
echo Starting Local Network Database Server (Auto Mode)...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

REM Check if the server script exists
if not exist "local_network_server.py" (
    echo Error: local_network_server.py not found
    echo Please make sure you're running this from the correct directory
    pause
    exit /b 1
)

echo Python found. Starting server with automatic configuration...
echo.
echo The server will automatically:
echo - Find your existing database file
echo - Choose an available port
echo - Share the database across your local network
echo.
echo Make sure your firewall allows connections on the chosen port.
echo.

REM Start the server with automatic configuration
python start_local_network_server.py

echo.
echo Server stopped.
pause
