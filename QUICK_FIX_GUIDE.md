# Quick Fix Guide - Classroom Join Issues

## Problem
- Students can't join classrooms properly
- Teacher dashboard shows 0 students even after joins
- "Unknown teacher" appears in join responses
- New accounts don't appear in teacher dashboard

## Solution Steps

### 1. Start the Backend Server
```bash
# Navigate to the api directory
cd math-cosmos-tutor-main/api

# Start the Flask server
python hybrid_db_server.py
```

The server should start on `http://localhost:5055`

### 2. Test the Backend
Open `test_api.html` in your browser to verify the backend is working:
- Click "Run All Tests" to test all endpoints
- Verify that teacher creation, classroom creation, and student joining work

### 3. Check Environment Variables
Make sure your frontend is configured to use the API:
- The database client defaults to `api-only` mode
- API base URL defaults to `http://localhost:5055`
- No `.env` file needed unless you want to override defaults

### 4. Verify Database Schema
The backend automatically creates the database schema on startup. Check that `hybrid.db` exists in the `api` directory.

### 5. Test the Complete Flow
1. Create a teacher account
2. Create a classroom (get the join code)
3. Create a student account
4. Have the student join using the classroom code
5. Check the teacher dashboard for the student

## Debugging

### Check Browser Console
Open browser dev tools and look for:
- API connection errors
- Database initialization messages
- Join request/response logs

### Check Backend Logs
The Flask server will show:
- Incoming requests
- Database operations
- Any errors

### Common Issues
1. **Backend not running**: Start the Flask server first
2. **CORS issues**: Backend has CORS enabled for localhost
3. **Database not initialized**: Backend auto-creates schema on startup
4. **Port conflicts**: Make sure port 5055 is available

## Files Modified
- `api/hybrid_db_server.py`: Added missing `/api/users` endpoint
- `src/lib/database.ts`: Improved error handling and logging
- `test_api.html`: Created for testing backend connectivity
- `start_backend.bat`: Windows batch file to start backend

## Expected Behavior
After fixes:
- Students can join classrooms with valid codes
- Teacher dashboard shows real student counts
- Join success shows actual teacher name
- New accounts appear immediately in teacher dashboard


