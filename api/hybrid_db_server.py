from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import uuid
import random
import string
from datetime import datetime
import sys
import json

# Add the parent directory to the path to import the rational function calculator
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the rational function calculator
try:
    from yessss import RationalFunctionCalculator
    CALCULATOR_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Rational function calculator not available: {e}")
    CALCULATOR_AVAILABLE = False

DB_PATH = os.path.join(os.path.dirname(__file__), 'hybrid.db')

app = Flask(__name__)
CORS(app)

SCHEMA = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        lastLogin TEXT NOT NULL,
        cadetAvatar TEXT
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS teacher_access (
        id TEXT PRIMARY KEY,
        teacherId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        grantedAt TEXT NOT NULL
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS student_progress (
        id TEXT PRIMARY KEY,
        studentId TEXT NOT NULL,
        moduleId TEXT NOT NULL,
        moduleName TEXT NOT NULL,
        completedAt TEXT NOT NULL,
        score INTEGER,
        timeSpent INTEGER,
        payload TEXT
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS classrooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        teacherId TEXT NOT NULL,
        joinCode TEXT UNIQUE NOT NULL,
        createdAt TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        FOREIGN KEY (teacherId) REFERENCES users (id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS classroom_members (
        id TEXT PRIMARY KEY,
        classroomId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        joinedAt TEXT NOT NULL,
        isGuest BOOLEAN DEFAULT 0,
        guestName TEXT,
        FOREIGN KEY (classroomId) REFERENCES classrooms (id),
        FOREIGN KEY (studentId) REFERENCES users (id)
    );
    """
]

def now_iso() -> str:
    return datetime.utcnow().isoformat() + 'Z'

def generate_join_code():
    """Generate a 6-character join code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = connect()
    cur = conn.cursor()
    for s in SCHEMA:
        cur.execute(s)
    
    # --- BEGIN ADD: progress table bootstrap ---
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS user_progress (
            user_id TEXT PRIMARY KEY,
            module_id TEXT NOT NULL,
            section_id TEXT NOT NULL,
            slide_index INTEGER NOT NULL,
            progress_pct REAL NOT NULL,
            updated_at TEXT NOT NULL
        );
        """
    )
    # --- END ADD ---
    
    conn.commit()
    conn.close()

@app.route('/api/ping', methods=['GET'])
def ping():
    """Test endpoint to verify API is running"""
    return jsonify({
        'status': 'ok',
        'message': 'Database API is running',
        'timestamp': datetime.now().isoformat(),
        'db_path': os.path.abspath(DB_PATH)
    })

# Users
@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users"""
    conn = connect()
    cur = conn.cursor()
    cur.execute('SELECT * FROM users ORDER BY createdAt DESC')
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route('/api/users/by-username/<username>', methods=['GET'])
def get_user_by_username(username):
    conn = connect()
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE username = ?', (username,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return jsonify(None)
    return jsonify(dict(row))

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user_by_id(user_id):
    """Get user by ID"""
    conn = connect()
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(dict(row))


@app.route('/api/users/register', methods=['POST'])
def register_user():
    data = request.get_json(force=True)
    required = ['username', 'email', 'password', 'role']
    if not all(k in data for k in required):
        return jsonify({ 'error': 'missing fields' }), 400

    conn = connect()
    cur = conn.cursor()

    # enforce uniques
    cur.execute('SELECT 1 FROM users WHERE username = ? OR email = ?', (data['username'], data['email']))
    if cur.fetchone():
        conn.close()
        return jsonify({ 'error': 'Username or email already exists' }), 409

    user_id = 'id_' + uuid.uuid4().hex
    created = now_iso()
    last = created
    cur.execute('''
        INSERT INTO users (id, username, email, password, role, createdAt, lastLogin, cadetAvatar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, data['username'], data['email'], data['password'], data['role'], created, last, data.get('cadetAvatar')))
    conn.commit()

    cur.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    row = cur.fetchone()
    conn.close()
    return jsonify(dict(row))


@app.route('/api/users/update-last-login', methods=['POST'])
def update_last_login():
    data = request.get_json(force=True)
    user_id = data.get('userId')
    if not user_id:
        return jsonify({ 'error': 'userId required' }), 400
    conn = connect()
    cur = conn.cursor()
    cur.execute('UPDATE users SET lastLogin = ? WHERE id = ?', (now_iso(), user_id))
    conn.commit()
    conn.close()
    return jsonify({ 'ok': True })


# Teacher access
@app.route('/api/teacher-access/<teacher_id>', methods=['GET'])
def get_teacher_access(teacher_id):
    conn = connect()
    cur = conn.cursor()
    cur.execute('SELECT * FROM teacher_access WHERE teacherId = ?', (teacher_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)


@app.route('/api/teacher-access', methods=['POST'])
def grant_access():
    data = request.get_json(force=True)
    required = ['teacherId', 'studentId']
    if not all(k in data for k in required):
        return jsonify({ 'error': 'missing fields' }), 400

    conn = connect()
    cur = conn.cursor()
    cur.execute('SELECT 1 FROM teacher_access WHERE teacherId = ? AND studentId = ?', (data['teacherId'], data['studentId']))
    if not cur.fetchone():
        cur.execute('INSERT INTO teacher_access (id, teacherId, studentId, grantedAt) VALUES (?, ?, ?, ?)',
                    ('id_' + uuid.uuid4().hex, data['teacherId'], data['studentId'], now_iso()))
        conn.commit()
    conn.close()
    return jsonify({ 'ok': True })


@app.route('/api/students/for-teacher/<teacher_id>', methods=['GET'])
def students_for_teacher(teacher_id):
    conn = connect()
    cur = conn.cursor()
    cur.execute('''
        SELECT u.* FROM users u
        JOIN teacher_access a ON a.studentId = u.id
        WHERE a.teacherId = ? AND u.role = 'student'
    ''', (teacher_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route('/api/students/for-teacher-v2/<teacher_id>', methods=['GET'])
def students_for_teacher_v2(teacher_id):
    """Return distinct students who are members of any classroom owned by the teacher."""
    conn = connect()
    cur = conn.cursor()
    cur.execute('''
        SELECT DISTINCT u.* FROM users u
        JOIN classroom_members cm ON cm.studentId = u.id
        JOIN classrooms c ON c.id = cm.classroomId
        WHERE c.teacherId = ? AND u.role = 'student' AND c.isActive = 1
    ''', (teacher_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)


# Student progress
@app.route('/api/progress/by-student/<student_id>', methods=['GET'])
def get_progress(student_id):
    conn = connect()
    cur = conn.cursor()
    cur.execute('SELECT * FROM student_progress WHERE studentId = ?', (student_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)


@app.route('/api/progress', methods=['POST'])
def create_progress():
    data = request.get_json(force=True)
    required = ['studentId', 'moduleId', 'moduleName', 'completedAt']
    if not all(k in data for k in required):
        return jsonify({ 'error': 'missing fields' }), 400
    conn = connect()
    cur = conn.cursor()
    cur.execute('INSERT INTO student_progress (id, studentId, moduleId, moduleName, completedAt, score, timeSpent, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                ('id_' + uuid.uuid4().hex, data['studentId'], data['moduleId'], data['moduleName'], data['completedAt'], data.get('score'), data.get('timeSpent'), data.get('payload')))
    conn.commit()
    conn.close()
    return jsonify({ 'ok': True })

@app.route('/api/progress/batch', methods=['POST'])
def batch_progress():
    """Batch save progress, achievements, and lesson completion for better performance"""
    data = request.get_json(force=True)
    required = ['user_id', 'progress_updates']
    if not all(k in data for k in required):
        return jsonify({ 'error': 'missing fields' }), 400
    
    try:
        conn = connect()
        cur = conn.cursor()
        
        # Save progress updates
        for progress in data['progress_updates']:
            cur.execute('''
                INSERT OR REPLACE INTO user_progress 
                (user_id, module_id, section_id, slide_index, progress_pct, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                progress['user_id'],
                progress['module_id'],
                progress['section_id'],
                progress['slide_index'],
                progress['progress_pct'],
                now_iso()
            ))
        
        # Save achievements if any
        if 'achievements' in data:
            for achievement in data['achievements']:
                cur.execute('''
                    INSERT INTO achievements 
                    (id, userId, lessonId, lessonName, lessonType, xpEarned, completedAt, planetName)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    'id_' + uuid.uuid4().hex,
                    achievement['userId'],
                    achievement['lessonId'],
                    achievement['lessonName'],
                    achievement['lessonType'],
                    achievement['xpEarned'],
                    now_iso(),
                    achievement.get('planetName')
                ))
        
        # Save lesson completion if any
        if 'lesson_completion' in data:
            lesson = data['lesson_completion']
            cur.execute('''
                INSERT INTO student_progress 
                (id, studentId, moduleId, moduleName, completedAt, score, timeSpent, payload)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                'id_' + uuid.uuid4().hex,
                data['user_id'],
                lesson['lessonId'],
                lesson['lessonName'],
                now_iso(),
                lesson['score'],
                lesson['timeSpent'],
                json.dumps({
                    'equationsSolved': lesson.get('equationsSolved', []),
                    'mistakes': lesson.get('mistakes', []),
                    'skillBreakdown': lesson.get('skillBreakdown', {})
                })
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({ 
            'success': True, 
            'message': 'Batch progress saved successfully',
            'progress_count': len(data['progress_updates']),
            'achievements_count': len(data.get('achievements', [])),
            'lesson_completed': 'lesson_completion' in data
        })
        
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        return jsonify({ 'error': f'Database error: {str(e)}' }), 500

# Classroom endpoints
@app.route('/api/classrooms', methods=['GET'])
def list_classrooms():
    """Get all classrooms for a teacher"""
    teacher_id = request.args.get('teacherId')
    if not teacher_id:
        return jsonify({'error': 'teacherId required'}), 400
    
    conn = connect()
    cur = conn.cursor()
    cur.execute('''
        SELECT c.*, COUNT(cm.id) as studentCount 
        FROM classrooms c 
        LEFT JOIN classroom_members cm ON c.id = cm.classroomId 
        WHERE c.teacherId = ? AND c.isActive = 1
        GROUP BY c.id
    ''', (teacher_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route('/api/classrooms', methods=['POST'])
def create_classroom():
    """Create a new classroom"""
    data = request.get_json(force=True)
    required = ['name', 'teacherId']
    if not all(k in data for k in required):
        return jsonify({'error': 'missing fields'}), 400
    # Validate teacher exists
    conn = connect()
    cur = conn.cursor()
    cur.execute('SELECT 1 FROM users WHERE id = ? AND role = "teacher"', (data['teacherId'],))
    if not cur.fetchone():
        conn.close()
        return jsonify({'error': 'invalid teacherId'}), 400
    
    # Generate unique join code
    # conn & cur already created above
    join_code = generate_join_code()
    while True:
        cur.execute('SELECT 1 FROM classrooms WHERE joinCode = ?', (join_code,))
        if not cur.fetchone():
            break
        join_code = generate_join_code()
    
    classroom_id = 'id_' + uuid.uuid4().hex
    created = now_iso()
    
    cur.execute('''
        INSERT INTO classrooms (id, name, teacherId, joinCode, createdAt)
        VALUES (?, ?, ?, ?, ?)
    ''', (classroom_id, data['name'], data['teacherId'], join_code, created))
    conn.commit()
    
    cur.execute('SELECT * FROM classrooms WHERE id = ?', (classroom_id,))
    row = cur.fetchone()
    conn.close()
    return jsonify(dict(row))

@app.route('/api/classrooms/<classroom_id>', methods=['GET'])
def get_classroom(classroom_id):
    """Get classroom details with members"""
    conn = connect()
    cur = conn.cursor()
    
    # Get classroom info
    cur.execute('SELECT * FROM classrooms WHERE id = ?', (classroom_id,))
    classroom = cur.fetchone()
    if not classroom:
        conn.close()
        return jsonify({'error': 'Classroom not found'}), 404
    
    # Get members
    cur.execute('''
        SELECT cm.*, u.username, u.email, u.cadetAvatar
        FROM classroom_members cm
        LEFT JOIN users u ON cm.studentId = u.id
        WHERE cm.classroomId = ?
        ORDER BY cm.joinedAt
    ''', (classroom_id,))
    members = [dict(r) for r in cur.fetchall()]
    
    conn.close()
    return jsonify({
        'classroom': dict(classroom),
        'members': members
    })

@app.route('/api/classrooms/join', methods=['POST'])
def join_classroom():
    """Join a classroom with code (for registered students)"""
    data = request.get_json(force=True)
    required = ['joinCode', 'studentId']
    if not all(k in data for k in required):
        return jsonify({'error': 'missing fields'}), 400
    
    conn = connect()
    cur = conn.cursor()
    
    # Find classroom by join code
    cur.execute('SELECT * FROM classrooms WHERE joinCode = ? AND isActive = 1', (data['joinCode'],))
    classroom = cur.fetchone()
    if not classroom:
        conn.close()
        return jsonify({'error': 'Invalid join code'}), 404
    
    # Check if already a member
    cur.execute('SELECT 1 FROM classroom_members WHERE classroomId = ? AND studentId = ?', 
                (classroom['id'], data['studentId']))
    if cur.fetchone():
        # Still ensure teacher_access exists
        cur.execute('SELECT 1 FROM teacher_access WHERE teacherId = ? AND studentId = ?', (classroom['teacherId'], data['studentId']))
        if not cur.fetchone():
            cur.execute('INSERT INTO teacher_access (id, teacherId, studentId, grantedAt) VALUES (?, ?, ?, ?)',
                        ('id_' + uuid.uuid4().hex, classroom['teacherId'], data['studentId'], now_iso()))
            conn.commit()
        # include teacher info
        cur.execute('SELECT id, username, email FROM users WHERE id = ?', (classroom['teacherId'],))
        teacher = cur.fetchone()
        conn.close()
        return jsonify({'ok': True, 'classroom': dict(classroom), 'teacher': dict(teacher) if teacher else None})
    
    # Add member
    member_id = 'id_' + uuid.uuid4().hex
    joined = now_iso()
    cur.execute('''
        INSERT INTO classroom_members (id, classroomId, studentId, joinedAt, isGuest)
        VALUES (?, ?, ?, ?, 0)
    ''', (member_id, classroom['id'], data['studentId'], joined))
    
    # Auto-grant teacher access mapping for dashboard visibility
    cur.execute('SELECT 1 FROM teacher_access WHERE teacherId = ? AND studentId = ?', (classroom['teacherId'], data['studentId']))
    if not cur.fetchone():
        cur.execute('INSERT INTO teacher_access (id, teacherId, studentId, grantedAt) VALUES (?, ?, ?, ?)',
                    ('id_' + uuid.uuid4().hex, classroom['teacherId'], data['studentId'], now_iso()))
    
    conn.commit()
    # include teacher info
    cur.execute('SELECT id, username, email FROM users WHERE id = ?', (classroom['teacherId'],))
    teacher = cur.fetchone()
    conn.close()
    
    return jsonify({'ok': True, 'classroom': dict(classroom), 'teacher': dict(teacher) if teacher else None})

@app.route('/api/classrooms/join-guest', methods=['POST'])
def join_classroom_guest():
    """Join a classroom as guest (no account needed)"""
    data = request.get_json(force=True)
    required = ['joinCode', 'guestName']
    if not all(k in data for k in required):
        return jsonify({'error': 'missing fields'}), 400
    
    conn = connect()
    cur = conn.cursor()
    
    # Find classroom by join code
    cur.execute('SELECT * FROM classrooms WHERE joinCode = ? AND isActive = 1', (data['joinCode'],))
    classroom = cur.fetchone()
    if not classroom:
        conn.close()
        return jsonify({'error': 'Invalid join code'}), 404
    
    # Create guest user account
    guest_id = 'id_' + uuid.uuid4().hex
    guest_username = f"guest_{data['guestName'].replace(' ', '_')}_{random.randint(1000, 9999)}"
    guest_email = f"{guest_username}@guest.local"
    created = now_iso()
    
    cur.execute('''
        INSERT INTO users (id, username, email, password, role, createdAt, lastLogin)
        VALUES (?, ?, ?, ?, 'student', ?, ?)
    ''', (guest_id, guest_username, guest_email, 'guest_password', created, created))
    
    # Add as classroom member
    member_id = 'id_' + uuid.uuid4().hex
    joined = now_iso()
    cur.execute('''
        INSERT INTO classroom_members (id, classroomId, studentId, joinedAt, isGuest, guestName)
        VALUES (?, ?, ?, ?, 1, ?)
    ''', (member_id, classroom['id'], guest_id, joined, data['guestName']))

    # Auto-grant teacher access mapping
    cur.execute('SELECT 1 FROM teacher_access WHERE teacherId = ? AND studentId = ?', (classroom['teacherId'], guest_id))
    if not cur.fetchone():
        cur.execute('INSERT INTO teacher_access (id, teacherId, studentId, grantedAt) VALUES (?, ?, ?, ?)',
                    ('id_' + uuid.uuid4().hex, classroom['teacherId'], guest_id, now_iso()))
    
    conn.commit()
    # include teacher info
    cur.execute('SELECT id, username, email FROM users WHERE id = ?', (classroom['teacherId'],))
    teacher = cur.fetchone()
    conn.close()
    
    return jsonify({
        'ok': True, 
        'classroom': dict(classroom),
        'teacher': dict(teacher) if teacher else None,
        'guestUser': {
            'id': guest_id,
            'username': guest_username,
            'guestName': data['guestName']
        }
    })

@app.route('/api/classrooms/<classroom_id>/members', methods=['GET'])
def get_classroom_members(classroom_id):
    """Get all members of a classroom"""
    conn = connect()
    cur = conn.cursor()
    cur.execute('''
        SELECT cm.*, u.username, u.email, u.cadetAvatar
        FROM classroom_members cm
        LEFT JOIN users u ON cm.studentId = u.id
        WHERE cm.classroomId = ?
        ORDER BY cm.joinedAt
    ''', (classroom_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)

@app.route('/api/classrooms/<classroom_id>/remove-member', methods=['POST'])
def remove_classroom_member(classroom_id):
    """Remove a student from classroom"""
    data = request.get_json(force=True)
    student_id = data.get('studentId')
    if not student_id:
        return jsonify({'error': 'studentId required'}), 400
    
    conn = connect()
    cur = conn.cursor()
    cur.execute('DELETE FROM classroom_members WHERE classroomId = ? AND studentId = ?', 
                (classroom_id, student_id))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/classrooms/<classroom_id>/deactivate', methods=['POST'])
def deactivate_classroom(classroom_id):
    """Deactivate a classroom"""
    conn = connect()
    cur = conn.cursor()
    cur.execute('UPDATE classrooms SET isActive = 0 WHERE id = ?', (classroom_id,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/classrooms/by-student/<student_id>', methods=['GET'])
def get_classrooms_by_student(student_id):
    """Return classrooms that a student belongs to"""
    conn = connect()
    cur = conn.cursor()
    cur.execute('''
        SELECT c.* FROM classrooms c
        INNER JOIN classroom_members cm ON c.id = cm.classroomId
        WHERE cm.studentId = ? AND c.isActive = 1
    ''', (student_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)


# --- BEGIN ADD: progress endpoints ---
@app.route('/api/user-progress/<user_id>', methods=['GET'])
def get_user_progress(user_id):
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute("SELECT user_id, module_id, section_id, slide_index, progress_pct, updated_at FROM user_progress WHERE user_id = ?", (user_id,))
        row = c.fetchone()
        if not row:
            return jsonify({
                "user_id": user_id,
                "module_id": None,
                "section_id": None,
                "slide_index": 0,
                "progress_pct": 0,
                "updated_at": None
            })
        return jsonify({
            "user_id": row[0],
            "module_id": row[1],
            "section_id": row[2],
            "slide_index": row[3],
            "progress_pct": row[4],
            "updated_at": row[5]
        })

@app.route('/api/user-progress/upsert', methods=['POST'])
def upsert_user_progress():
    data = request.get_json(force=True)
    now = datetime.utcnow().isoformat()
    required = ['user_id', 'module_id', 'section_id', 'slide_index', 'progress_pct']
    if not all(k in data for k in required):
        return jsonify({"error": "missing fields"}), 400
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute(
            """
            INSERT INTO user_progress (user_id, module_id, section_id, slide_index, progress_pct, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                module_id=excluded.module_id,
                section_id=excluded.section_id,
                slide_index=excluded.slide_index,
                progress_pct=excluded.progress_pct,
                updated_at=excluded.updated_at
            """,
            (data['user_id'], data['module_id'], data['section_id'], int(data['slide_index']), float(data['progress_pct']), now)
        )
        conn.commit()
    return jsonify({"ok": True, "updated_at": now})
# --- END ADD ---

# --- BEGIN ADD: Rational Function Calculator Endpoints ---
@app.route('/api/rational-function/analyze', methods=['POST'])
def analyze_rational_function():
    """Analyze a rational function and return step-by-step solution"""
    if not CALCULATOR_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Rational function calculator not available'
        }), 503
    
    try:
        data = request.get_json(force=True)
        function_str = data.get('function', '').strip()
        
        if not function_str:
            return jsonify({
                'success': False,
                'error': 'No function provided'
            }), 400
        
        # Create calculator instance
        calculator = RationalFunctionCalculator()
        
        # Capture the output by redirecting stdout
        import io
        from contextlib import redirect_stdout
        
        output = io.StringIO()
        with redirect_stdout(output):
            calculator.analyze_rational_function(function_str)
        
        analysis_output = output.getvalue()
        
        return jsonify({
            'success': True,
            'function': function_str,
            'analysis': analysis_output,
            'message': 'Analysis completed successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/rational-function/domain', methods=['POST'])
def find_domain():
    """Find the domain of a rational function"""
    if not CALCULATOR_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Rational function calculator not available'
        }), 503
    
    try:
        data = request.get_json(force=True)
        function_str = data.get('function', '').strip()
        
        if not function_str:
            return jsonify({
                'success': False,
                'error': 'No function provided'
            }), 400
        
        # Create calculator instance
        calculator = RationalFunctionCalculator()
        
        try:
            numerator, denominator = calculator.parse_function(function_str)
            domain_restrictions = calculator.find_domain(denominator)
            
            return jsonify({
                'success': True,
                'domain_restrictions': [str(r) for r in domain_restrictions],
                'domain': f"(-∞, ∞) excluding {', '.join([str(r) for r in domain_restrictions])}" if domain_restrictions else "(-∞, ∞)"
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error finding domain: {str(e)}'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/rational-function/zeros', methods=['POST'])
def find_zeros():
    """Find the zeros of a rational function"""
    if not CALCULATOR_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Rational function calculator not available'
        }), 503
    
    try:
        data = request.get_json(force=True)
        function_str = data.get('function', '').strip()
        
        if not function_str:
            return jsonify({
                'success': False,
                'error': 'No function provided'
            }), 400
        
        # Create calculator instance
        calculator = RationalFunctionCalculator()
        
        try:
            numerator, denominator = calculator.parse_function(function_str)
            common_factors, simplified_num, simplified_den = calculator.find_common_factors(numerator, denominator)
            zeros = calculator.find_zeros(simplified_num, common_factors)
            
            return jsonify({
                'success': True,
                'zeros': [str(z) for z in zeros],
                'common_factors': [str(cf) for cf in common_factors],
                'simplified_numerator': str(simplified_num),
                'simplified_denominator': str(simplified_den)
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error finding zeros: {str(e)}'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/rational-function/asymptotes', methods=['POST'])
def find_asymptotes():
    """Find asymptotes of a rational function"""
    if not CALCULATOR_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Rational function calculator not available'
        }), 503
    
    try:
        data = request.get_json(force=True)
        function_str = data.get('function', '').strip()
        
        if not function_str:
            return jsonify({
                'success': False,
                'error': 'No function provided'
            }), 400
        
        # Create calculator instance
        calculator = RationalFunctionCalculator()
        
        try:
            numerator, denominator = calculator.parse_function(function_str)
            common_factors, simplified_num, simplified_den = calculator.find_common_factors(numerator, denominator)
            
            vertical_asymptotes = calculator.find_vertical_asymptotes(denominator, common_factors)
            horizontal_asymptote = calculator.find_horizontal_asymptote(numerator, denominator)
            oblique_asymptote = calculator.find_oblique_asymptote(numerator, denominator)
            
            return jsonify({
                'success': True,
                'vertical_asymptotes': [str(va) for va in vertical_asymptotes],
                'horizontal_asymptote': horizontal_asymptote,
                'oblique_asymptote': str(oblique_asymptote) if oblique_asymptote else None
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Error finding asymptotes: {str(e)}'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/api/rational-function/health', methods=['GET'])
def rational_function_health():
    """Health check for rational function calculator"""
    return jsonify({
        'status': 'healthy',
        'rational_function_calculator_available': CALCULATOR_AVAILABLE,
        'message': 'Rational function calculator integration status'
    })
# --- END ADD ---


if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', '5055'))
    host = os.environ.get('HOST', '0.0.0.0')
    print(f"Hybrid DB server running on http://{host}:{port}")
    app.run(host=host, port=port)
