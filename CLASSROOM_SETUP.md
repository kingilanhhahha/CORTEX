# Classroom System Setup Guide

## Overview
The Math Cosmos Tutor now includes a Google Classroom-like system where teachers can create virtual classrooms with join codes, and students can join either as registered users or as guests.

## Features

### For Teachers:
- **Create Classrooms**: Generate unique 6-character join codes
- **Manage Students**: View all students in each classroom
- **Copy Join Codes**: Easy one-click copying to share with students
- **Remove Students**: Remove students from classrooms
- **Deactivate Classrooms**: Archive inactive classrooms

### For Students:
- **Join with Account**: Registered students can join using their existing account
- **Join as Guest**: No account required - just enter name and join code
- **Guest Mode**: Temporary access for quick participation

## Setup Instructions

### 1. Start the Database Server
```bash
cd math-cosmos-tutor-main/api
python hybrid_db_server.py
```
The server will run on `http://0.0.0.0:5055`

### 2. Set Environment Variables
Create `.env.local` in the project root:
```env
VITE_DB_API=http://YOUR_HOST_IP:5055
VITE_DB_MODE=api-only
```
Replace `YOUR_HOST_IP` with your computer's LAN IP address.

### 3. Restart the Frontend
```bash
npm run dev
# or
yarn dev
```

## How to Use

### For Teachers:

1. **Login as Teacher**
   - Go to the login page
   - Create or login with a teacher account

2. **Access Teacher Dashboard**
   - Navigate to `/teacher-dashboard`
   - Click the "Classrooms" tab

3. **Create a Classroom**
   - Click "Create Classroom"
   - Enter a classroom name
   - Copy the generated join code

4. **Share Join Code**
   - Share the 6-character code with your students
   - Students can join immediately

5. **Manage Students**
   - Click the eye icon to view classroom members
   - Remove students if needed
   - Deactivate classrooms when done

### For Students:

1. **Join as Registered Student**
   - Login with your student account
   - Click "Join Classroom" on the main page
   - Enter the join code from your teacher
   - Click "Join Classroom"

2. **Join as Guest**
   - No login required
   - Click "Join Classroom" on the main page
   - Select "Guest" tab
   - Enter your name and the join code
   - Click "Join as Guest"

## Database Structure

The classroom system adds two new tables:

### `classrooms`
- `id`: Unique classroom identifier
- `name`: Classroom name
- `teacherId`: Teacher who created the classroom
- `joinCode`: 6-character unique join code
- `createdAt`: Creation timestamp
- `isActive`: Whether classroom is active

### `classroom_members`
- `id`: Unique member identifier
- `classroomId`: Classroom they belong to
- `studentId`: Student user ID
- `joinedAt`: When they joined
- `isGuest`: Whether they joined as guest
- `guestName`: Name if joined as guest

## Network Setup

### For LAN Access:
1. **Find your IP address**:
   - Windows: `ipconfig` in CMD
   - Mac/Linux: `ifconfig` in terminal

2. **Configure firewall**:
   - Allow port 5055 for the Flask server
   - Allow port 5173 (or your dev server port)

3. **Test connectivity**:
   - Visit `http://YOUR_IP:5055/api/ping` from other devices
   - Should return JSON response

### Environment Variables for Different Devices:

**Host Computer** (running the server):
```env
VITE_DB_API=http://localhost:5055
VITE_DB_MODE=api-only
```

**Other Devices** (accessing via network):
```env
VITE_DB_API=http://HOST_IP:5055
VITE_DB_MODE=api-only
```

## Troubleshooting

### "Database still different across devices"
1. Check that `VITE_DB_MODE=api-only` is set
2. Verify the Flask server is running
3. Test API connectivity: `http://HOST_IP:5055/api/ping`
4. Clear browser localStorage on all devices
5. Restart the frontend after changing environment variables

### "Can't join classroom"
1. Verify the join code is correct (6 characters)
2. Check that the classroom is still active
3. Ensure you're not already a member
4. Try joining as guest if registered login fails

### "Teacher can't see students"
1. Check that students successfully joined
2. Refresh the classroom members list
3. Verify the teacher has access to the classroom

## Security Notes

- Join codes are 6 characters (uppercase letters + numbers)
- Guest accounts have limited functionality
- All data is stored in the shared SQLite database
- No permanent guest data retention (for privacy)

## Future Enhancements

- Classroom assignments and homework
- Progress tracking per classroom
- Teacher-student messaging
- Classroom announcements
- Assignment due dates
- Grade book integration

