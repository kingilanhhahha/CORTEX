#!/usr/bin/env python3
"""
Complete startup script for MathVerse - starts both backend and frontend
"""

import os
import sys
import subprocess
import time
import threading
import signal
import webbrowser
from pathlib import Path

def check_python_dependencies():
    """Check if required Python packages are installed"""
    required_packages = ['flask', 'flask-cors', 'sympy', 'numpy']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing Python packages: {', '.join(missing_packages)}")
        print("Installing missing packages...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing_packages)
            print("✅ Python packages installed successfully!")
        except subprocess.CalledProcessError:
            print("❌ Failed to install Python packages. Please install them manually:")
            print(f"pip install {' '.join(missing_packages)}")
            return False
    
    return True

def check_node_dependencies():
    """Check if Node.js dependencies are installed"""
    package_json = Path("package.json")
    node_modules = Path("node_modules")
    
    if not package_json.exists():
        print("❌ package.json not found. Are you in the correct directory?")
        return False
    
    if not node_modules.exists():
        print("📦 Node.js dependencies not found. Installing...")
        try:
            subprocess.check_call(["npm", "install"])
            print("✅ Node.js dependencies installed successfully!")
        except subprocess.CalledProcessError:
            print("❌ Failed to install Node.js dependencies.")
            return False
    
    return True

def start_backend():
    """Start the Flask backend server"""
    print("🚀 Starting Rational Equation Solver Backend...")
    
    # Change to the api directory
    api_dir = Path(__file__).parent / "api"
    os.chdir(api_dir)
    
    # Check if the solver file exists
    solver_file = 'FINAL_SOLVING_CALCULATOR.py'
    if not Path(solver_file).exists():
        print(f"❌ Solver file not found: {solver_file}")
        print("Please make sure the solver file is in the api directory.")
        return False
    
    print("✅ Solver file found")
    print("🌐 Starting backend server on http://localhost:5000")
    print("📝 API endpoints:")
    print("   - POST /api/solve - Solve rational equations")
    print("   - POST /api/validate - Validate equations")
    print("   - POST /api/classify - Classify equations")
    print("   - GET /api/health - Health check")
    
    try:
        # Start the Flask server
        subprocess.run([sys.executable, 'solver.py'])
    except KeyboardInterrupt:
        print("\n🛑 Backend server stopped by user")
    except Exception as e:
        print(f"❌ Error starting backend server: {e}")
        return False
    
    return True

def start_frontend():
    """Start the React frontend development server"""
    print("🎨 Starting React Frontend...")
    
    # Change back to the main directory
    main_dir = Path(__file__).parent
    os.chdir(main_dir)
    
    print("🌐 Starting frontend server on http://localhost:5173")
    print("📝 Available routes:")
    print("   - / - Main application (requires authentication)")
    print("   - /login - Login page")
    print("   - /test - Test page (no authentication)")
    print("   - /debug.html - Debug page")
    print("   - /solver - Rational equation solver")
    print("   - /calculator - Calculator panel")
    
    try:
        # Start the Vite development server
        subprocess.run(["npm", "run", "dev"])
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped by user")
    except Exception as e:
        print(f"❌ Error starting frontend server: {e}")
        return False
    
    return True

def wait_for_backend():
    """Wait for backend to be ready"""
    import requests
    max_attempts = 30
    attempt = 0
    
    print("⏳ Waiting for backend server to be ready...")
    
    while attempt < max_attempts:
        try:
            response = requests.get('http://localhost:5000/api/health', timeout=1)
            if response.status_code == 200:
                print("✅ Backend server is ready!")
                return True
        except:
            pass
        
        attempt += 1
        time.sleep(1)
        if attempt % 5 == 0:
            print(f"⏳ Still waiting... ({attempt}/{max_attempts})")
    
    print("⚠️ Backend server not responding, but continuing...")
    return False

def open_browser():
    """Open browser to the application"""
    time.sleep(3)  # Wait a bit for servers to start
    print("🌐 Opening browser...")
    
    # Try to open the debug page first
    try:
        webbrowser.open('http://localhost:5173/debug.html')
        print("✅ Opened debug page in browser")
    except:
        print("⚠️ Could not open browser automatically")
        print("Please open http://localhost:5173/debug.html manually")

def main():
    """Main startup function"""
    print("🔬 MathVerse - Complete Application Startup")
    print("=" * 50)
    
    # Check dependencies
    print("\n📦 Checking dependencies...")
    if not check_python_dependencies():
        print("❌ Failed to install Python dependencies")
        return
    
    if not check_node_dependencies():
        print("❌ Failed to install Node.js dependencies")
        return
    
    print("✅ All dependencies are ready!")
    
    # Start backend in a separate thread
    print("\n🚀 Starting servers...")
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # Wait a bit for backend to start
    time.sleep(2)
    
    # Start frontend in a separate thread
    frontend_thread = threading.Thread(target=start_frontend, daemon=True)
    frontend_thread.start()
    
    # Open browser
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    print("\n🎉 Application startup complete!")
    print("📝 Troubleshooting:")
    print("   - If you see a white screen, check the browser console (F12)")
    print("   - If backend is not working, check http://localhost:5000/api/health")
    print("   - If frontend is not working, check http://localhost:5173/debug.html")
    print("   - Clear browser cache if needed")
    print("\n🛑 Press Ctrl+C to stop all servers")
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")
        print("✅ Application stopped")

if __name__ == "__main__":
    main() 