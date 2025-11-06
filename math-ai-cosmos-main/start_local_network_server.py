#!/usr/bin/env python3
"""
Startup script for Local Network Database Server
This script provides an easy way to start the server with automatic database detection.
"""

import os
import sys
import subprocess
import time
import glob

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 7):
        print("❌ Error: Python 3.7 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    return True

def check_dependencies():
    """Check if required dependencies are available"""
    try:
        import sqlite3
        import http.server
        import socketserver
        import json
        import uuid
        import socket
        return True
    except ImportError as e:
        print(f"❌ Error: Missing dependency: {e}")
        print("Please install Python 3.7+ with standard library")
        return False

def find_database_file():
    """Automatically find the existing database file"""
    print("🔍 Searching for existing database files...")
    
    # Common database file names to look for
    database_names = [
        'hybrid.db',
        'database.db',
        'math_tutor.db',
        'local.db'
    ]
    
    # Search in current directory and subdirectories
    search_paths = [
        '.',  # Current directory
        'api',  # API directory
        'src',  # Source directory
        '..',   # Parent directory
        '../api',  # Parent API directory
    ]
    
    found_databases = []
    
    for search_path in search_paths:
        if os.path.exists(search_path):
            for db_name in database_names:
                db_path = os.path.join(search_path, db_name)
                if os.path.exists(db_path):
                    # Get file size and modification time
                    stat = os.stat(db_path)
                    file_size = stat.st_size
                    mod_time = time.ctime(stat.st_mtime)
                    
                    found_databases.append({
                        'path': db_path,
                        'size': file_size,
                        'modified': mod_time,
                        'relative': os.path.relpath(db_path)
                    })
                    print(f"✅ Found: {db_path} ({file_size} bytes, modified: {mod_time})")
    
    if not found_databases:
        print("❌ No existing database files found")
        return None
    
    # Sort by modification time (newest first) and file size (largest first)
    found_databases.sort(key=lambda x: (x['modified'], x['size']), reverse=True)
    
    # Use the most recently modified database
    best_db = found_databases[0]
    print(f"🎯 Using database: {best_db['relative']}")
    print(f"   Size: {best_db['size']} bytes")
    print(f"   Modified: {best_db['modified']}")
    
    return best_db['path']

def get_port_automatically():
    """Automatically find an available port"""
    import socket
    
    # Try common ports in order
    preferred_ports = [8000, 8001, 8002, 9000, 9001, 9002]
    
    for port in preferred_ports:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                print(f"✅ Port {port} is available")
                return port
        except OSError:
            print(f"⚠️  Port {port} is in use, trying next...")
            continue
    
    # If all preferred ports are taken, find any available port
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', 0))
            port = s.getsockname()[1]
            print(f"✅ Using random available port: {port}")
            return port
    except Exception:
        print("❌ Could not find any available port")
        return 8000

def start_server_automatically():
    """Start the server with automatic configuration"""
    print("🚀 Local Network Database Server - Auto Setup")
    print("=" * 60)
    
    # Find database automatically
    db_path = find_database_file()
    if not db_path:
        print("❌ No database found. Please ensure you have a database file in your project.")
        input("Press Enter to exit...")
        return False
    
    # Find port automatically
    port = get_port_automatically()
    
    print(f"\n📋 Configuration:")
    print(f"   Database: {db_path}")
    print(f"   Port: {port}")
    print(f"   Auto-detected: ✅")
    
    # Ask user if they want to proceed
    proceed = input("\n🚀 Start server with these settings? (y/n): ").strip().lower()
    if proceed not in ['y', 'yes', '']:
        print("❌ Server startup cancelled")
        return False
    
    try:
        # Import and start the server
        from local_network_server import start_server
        
        print(f"\n🚀 Starting server on port {port} with database '{db_path}'...")
        print("Press Ctrl+C to stop the server\n")
        
        start_server(port, db_path)
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False
    
    return True

def main():
    """Main function"""
    print("🔍 Checking system requirements...")
    
    # Check Python version
    if not check_python_version():
        input("Press Enter to exit...")
        return
    
    # Check dependencies
    if not check_dependencies():
        input("Press Enter to exit...")
        return
    
    print("✅ System requirements met\n")
    
    # Start server automatically
    success = start_server_automatically()
    
    if not success:
        print("❌ Failed to start server")
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()
