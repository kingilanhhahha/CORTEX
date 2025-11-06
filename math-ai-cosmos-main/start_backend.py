#!/usr/bin/env python3
"""
Startup script for the Rational Equation Solver Backend
"""

import os
import sys
import subprocess
import time

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = ['flask', 'flask-cors', 'sympy', 'numpy']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("Installing missing packages...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing_packages)
            print("✅ Packages installed successfully!")
        except subprocess.CalledProcessError:
            print("❌ Failed to install packages. Please install them manually:")
            print(f"pip install {' '.join(missing_packages)}")
            return False
    
    return True

def start_backend():
    """Start the Flask backend server"""
    print("🚀 Starting Rational Equation Solver Backend...")
    
    # Change to the api directory
    api_dir = os.path.join(os.path.dirname(__file__), 'api')
    os.chdir(api_dir)
    
    # Check if the solver file exists
    solver_file = 'FINAL_SOLVING_CALCULATOR.py'
    if not os.path.exists(solver_file):
        print(f"❌ Solver file not found: {solver_file}")
        print("Please make sure the solver file is in the api directory.")
        return False
    
    print("✅ Solver file found")
    print("✅ Dependencies checked")
    print("🌐 Starting server on http://localhost:5000")
    print("📝 API endpoints:")
    print("   - POST /api/solve - Solve rational equations")
    print("   - POST /api/validate - Validate equations")
    print("   - POST /api/classify - Classify equations")
    print("   - GET /api/health - Health check")
    print("\nPress Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Start the Flask server
        subprocess.run([sys.executable, 'solver.py'])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔬 Rational Equation Solver Backend")
    print("=" * 40)
    
    if check_dependencies():
        start_backend()
    else:
        print("❌ Failed to start backend")
        sys.exit(1) 