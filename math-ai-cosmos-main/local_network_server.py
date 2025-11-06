#!/usr/bin/env python3
"""
Local Network Database Server
Shares the math-ai-cosmos database across all devices on the same local network.
This allows multiple devices to access the same database simultaneously.
"""

import json
import sqlite3
import threading
import time
import uuid
import os
import socket
import pickle
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('local_network_server.log'),
        logging.StreamHandler()
    ]
)

class LocalNetworkDatabase:
    def __init__(self, db_path="hybrid.db"):
        self.db_path = db_path
        self.connections = set()
        self.lock = threading.Lock()
        self.initialize_database()
        
    def initialize_database(self):
        """Initialize the database with required tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create users table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        username TEXT UNIQUE NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        role TEXT NOT NULL,
                        createdAt TEXT NOT NULL,
                        lastLogin TEXT NOT NULL,
                        cadetAvatar TEXT DEFAULT 'king-sadboi'
                    )
                ''')
                
                # Create classrooms table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS classrooms (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        teacherId TEXT NOT NULL,
                        joinCode TEXT UNIQUE NOT NULL,
                        createdAt TEXT NOT NULL,
                        isActive BOOLEAN DEFAULT 1,
                        studentCount INTEGER DEFAULT 0
                    )
                ''')
                
                # Create classroom_members table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS classroom_members (
                        id TEXT PRIMARY KEY,
                        classroomId TEXT NOT NULL,
                        studentId TEXT NOT NULL,
                        joinedAt TEXT NOT NULL,
                        isGuest BOOLEAN DEFAULT 0,
                        username TEXT,
                        email TEXT,
                        FOREIGN KEY (classroomId) REFERENCES classrooms (id),
                        FOREIGN KEY (studentId) REFERENCES users (id)
                    )
                ''')
                
                # Create teacher_access table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS teacher_access (
                        id TEXT PRIMARY KEY,
                        teacherId TEXT NOT NULL,
                        studentId TEXT NOT NULL,
                        grantedAt TEXT NOT NULL,
                        permissions TEXT DEFAULT 'view_progress,view_assignments',
                        FOREIGN KEY (teacherId) REFERENCES users (id),
                        FOREIGN KEY (studentId) REFERENCES users (id)
                    )
                ''')
                
                # Create student_progress table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS student_progress (
                        id TEXT PRIMARY KEY,
                        studentId TEXT NOT NULL,
                        moduleId TEXT NOT NULL,
                        moduleName TEXT NOT NULL,
                        timeSpent INTEGER DEFAULT 0,
                        equationsSolved INTEGER DEFAULT 0,
                        mistakes INTEGER DEFAULT 0,
                        skillBreakdown TEXT,
                        completedAt TEXT,
                        FOREIGN KEY (studentId) REFERENCES users (id)
                    )
                ''')
                
                conn.commit()
                logging.info("Database initialized successfully")
                
        except Exception as e:
            logging.error(f"Error initializing database: {e}")
    
    def get_connection(self):
        """Get a database connection"""
        return sqlite3.connect(self.db_path)
    
    def execute_query(self, query, params=None, fetch=False):
        """Execute a database query with proper error handling"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                if fetch:
                    return cursor.fetchall()
                else:
                    conn.commit()
                    return cursor.rowcount
        except Exception as e:
            logging.error(f"Database query error: {e}")
            raise
    
    def add_connection(self, client_info):
        """Add a new client connection"""
        with self.lock:
            self.connections.add(client_info)
            logging.info(f"New client connected: {client_info}")
    
    def remove_connection(self, client_info):
        """Remove a client connection"""
        with self.lock:
            self.connections.discard(client_info)
            logging.info(f"Client disconnected: {client_info}")
    
    def get_connected_clients(self):
        """Get list of connected clients"""
        with self.lock:
            return list(self.connections)

class DatabaseAPIHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, database=None, **kwargs):
        self.database = database
        super().__init__(*args, **kwargs)
    
    def log_message(self, format, *args):
        """Custom logging for HTTP requests"""
        logging.info(f"{self.client_address[0]} - {format % args}")
    
    def send_json_response(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        try:
            if self.path == '/api/status':
                # Return server status and connected clients
                status = {
                    'status': 'running',
                    'timestamp': datetime.now().isoformat(),
                    'connected_clients': len(self.database.get_connected_clients()),
                    'database_path': self.database.db_path
                }
                self.send_json_response(status)
                
            elif self.path == '/api/users':
                # Get all users
                query = "SELECT * FROM users"
                users = self.database.execute_query(query, fetch=True)
                user_list = []
                for user in users:
                    user_dict = {
                        'id': user[0],
                        'username': user[1],
                        'email': user[2],
                        'role': user[4],
                        'createdAt': user[5],
                        'lastLogin': user[6],
                        'cadetAvatar': user[7]
                    }
                    user_list.append(user_dict)
                self.send_json_response(user_list)
                
            elif self.path.startswith('/api/users/'):
                # Get specific user by ID
                user_id = self.path.split('/')[-1]
                query = "SELECT * FROM users WHERE id = ?"
                users = self.database.execute_query(query, (user_id,), fetch=True)
                if users:
                    user = users[0]
                    user_dict = {
                        'id': user[0],
                        'username': user[1],
                        'email': user[2],
                        'role': user[4],
                        'createdAt': user[5],
                        'lastLogin': user[6],
                        'cadetAvatar': user[7]
                    }
                    self.send_json_response(user_dict)
                else:
                    self.send_json_response({'error': 'User not found'}, 404)
                    
            elif self.path == '/api/classrooms':
                # Get all classrooms
                query = "SELECT * FROM classrooms WHERE isActive = 1"
                classrooms = self.database.execute_query(query, fetch=True)
                classroom_list = []
                for classroom in classrooms:
                    classroom_dict = {
                        'id': classroom[0],
                        'name': classroom[1],
                        'teacherId': classroom[2],
                        'joinCode': classroom[3],
                        'createdAt': classroom[4],
                        'isActive': bool(classroom[5]),
                        'studentCount': classroom[6]
                    }
                    classroom_list.append(classroom_dict)
                self.send_json_response(classroom_list)
                
            elif self.path == '/api/ping':
                # Simple ping endpoint
                self.send_json_response({'pong': True, 'timestamp': datetime.now().isoformat()})
                
            else:
                self.send_json_response({'error': 'Endpoint not found'}, 404)
                
        except Exception as e:
            logging.error(f"GET request error: {e}")
            self.send_json_response({'error': str(e)}, 500)
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if self.path == '/api/users':
                # Create new user
                user_id = str(uuid.uuid4())
                query = """
                    INSERT INTO users (id, username, email, password, role, createdAt, lastLogin, cadetAvatar)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """
                now = datetime.now().isoformat()
                params = (
                    user_id,
                    data.get('username'),
                    data.get('email'),
                    data.get('password'),
                    data.get('role', 'student'),
                    now,
                    now,
                    data.get('cadetAvatar', 'king-sadboi')
                )
                
                self.database.execute_query(query, params)
                
                # Return the created user
                user = {
                    'id': user_id,
                    'username': data.get('username'),
                    'email': data.get('email'),
                    'role': data.get('role', 'student'),
                    'createdAt': now,
                    'lastLogin': now,
                    'cadetAvatar': data.get('cadetAvatar', 'king-sadboi')
                }
                self.send_json_response(user, 201)
                
            elif self.path == '/api/classrooms':
                # Create new classroom
                classroom_id = str(uuid.uuid4())
                query = """
                    INSERT INTO classrooms (id, name, teacherId, joinCode, createdAt, isActive, studentCount)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """
                now = datetime.now().isoformat()
                params = (
                    classroom_id,
                    data.get('name'),
                    data.get('teacherId'),
                    data.get('joinCode'),
                    now,
                    True,
                    0
                )
                
                self.database.execute_query(query, params)
                
                # Return the created classroom
                classroom = {
                    'id': classroom_id,
                    'name': data.get('name'),
                    'teacherId': data.get('teacherId'),
                    'joinCode': data.get('joinCode'),
                    'createdAt': now,
                    'isActive': True,
                    'studentCount': 0
                }
                self.send_json_response(classroom, 201)
                
            elif self.path == '/api/classrooms/join':
                # Join classroom
                join_code = data.get('joinCode')
                student_id = data.get('studentId')
                
                # Find classroom by join code
                query = "SELECT * FROM classrooms WHERE joinCode = ? AND isActive = 1"
                classrooms = self.database.execute_query(query, (join_code,), fetch=True)
                
                if not classrooms:
                    self.send_json_response({'error': 'Classroom not found'}, 404)
                    return
                
                classroom = classrooms[0]
                classroom_id = classroom[0]
                
                # Check if already a member
                check_query = "SELECT * FROM classroom_members WHERE classroomId = ? AND studentId = ?"
                existing = self.database.execute_query(check_query, (classroom_id, student_id), fetch=True)
                
                if existing:
                    self.send_json_response({'error': 'Already a member of this classroom'}, 400)
                    return
                
                # Add member
                member_id = str(uuid.uuid4())
                member_query = """
                    INSERT INTO classroom_members (id, classroomId, studentId, joinedAt, isGuest, username, email)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """
                
                # Get user info
                user_query = "SELECT username, email FROM users WHERE id = ?"
                users = self.database.execute_query(user_query, (student_id,), fetch=True)
                username = users[0][0] if users else 'Unknown'
                email = users[0][1] if users else ''
                
                now = datetime.now().isoformat()
                member_params = (
                    member_id,
                    classroom_id,
                    student_id,
                    now,
                    False,
                    username,
                    email
                )
                
                self.database.execute_query(member_query, member_params)
                
                # Update student count
                update_query = "UPDATE classrooms SET studentCount = studentCount + 1 WHERE id = ?"
                self.database.execute_query(update_query, (classroom_id,))
                
                # Return success
                result = {
                    'ok': True,
                    'classroom': {
                        'id': classroom[0],
                        'name': classroom[1],
                        'teacherId': classroom[2],
                        'joinCode': classroom[3],
                        'createdAt': classroom[4],
                        'isActive': bool(classroom[5]),
                        'studentCount': classroom[6] + 1
                    }
                }
                self.send_json_response(result)
                
            else:
                self.send_json_response({'error': 'Endpoint not found'}, 404)
                
        except Exception as e:
            logging.error(f"POST request error: {e}")
            self.send_json_response({'error': str(e)}, 500)

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Threaded HTTP server to handle multiple concurrent requests"""
    allow_reuse_address = True

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        # Connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            return local_ip
    except Exception:
        # Fallback to localhost
        return "127.0.0.1"

def start_server(port=8000, db_path="hybrid.db"):
    """Start the local network database server"""
    try:
        # Initialize database
        database = LocalNetworkDatabase(db_path)
        
        # Create server
        server = ThreadedHTTPServer(('0.0.0.0', port), 
                                  lambda *args, **kwargs: DatabaseAPIHandler(*args, database=database, **kwargs))
        
        local_ip = get_local_ip()
        
        print(f"🚀 Local Network Database Server Starting...")
        print(f"📱 Local IP: {local_ip}")
        print(f"🌐 Port: {port}")
        print(f"🔗 Access URL: http://{local_ip}:{port}")
        print(f"📊 Database: {db_path}")
        print(f"📋 API Endpoints:")
        print(f"   GET  /api/status      - Server status")
        print(f"   GET  /api/users       - Get all users")
        print(f"   GET  /api/users/{id}  - Get specific user")
        print(f"   GET  /api/classrooms  - Get all classrooms")
        print(f"   POST /api/users       - Create user")
        print(f"   POST /api/classrooms  - Create classroom")
        print(f"   POST /api/classrooms/join - Join classroom")
        print(f"\n💡 Other devices on the same network can connect using:")
        print(f"   http://{local_ip}:{port}")
        print(f"\n⏹️  Press Ctrl+C to stop the server")
        
        logging.info(f"Server starting on {local_ip}:{port}")
        
        # Start server
        server.serve_forever()
        
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped by user")
        logging.info("Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        logging.error(f"Error starting server: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Local Network Database Server")
    parser.add_argument("--port", type=int, default=8000, help="Port to run server on (default: 8000)")
    parser.add_argument("--db", default="hybrid.db", help="Database file path (default: hybrid.db)")
    
    args = parser.parse_args()
    
    start_server(args.port, args.db)

