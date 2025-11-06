# 🌐 Local Network Database System

This system allows you to share the math-ai-cosmos database across all devices on your local network. Multiple devices can access the same database simultaneously, creating a shared learning environment.

## 🚀 Features

- **Shared Database**: All devices on the same network access the same database
- **Real-time Sync**: Changes made on one device are immediately available to others
- **Offline Fallback**: Works even when the network is down
- **Cross-Platform**: Works on Windows, Mac, Linux, and mobile devices
- **No Internet Required**: Completely local network solution
- **Secure**: Only accessible within your local network

## 📋 Requirements

- **Python 3.7+** installed on the host machine
- **All devices** must be connected to the same local network (WiFi/LAN)
- **Firewall** must allow connections on the chosen port (default: 8000)

## 🛠️ Setup Instructions

### Step 1: Start the Server (Host Machine)

#### Option A: Using the Batch File (Windows)
1. Double-click `start_local_network_server.bat`
2. The server will start automatically
3. Note the IP address and port shown

#### Option B: Using the Python Script
1. Open terminal/command prompt
2. Navigate to the project directory
3. Run: `python start_local_network_server.py`
4. Follow the prompts to configure the server

#### Option C: Direct Python Command
1. Open terminal/command prompt
2. Navigate to the project directory
3. Run: `python local_network_server.py --port 8000 --db hybrid.db`

### Step 2: Note the Server Information

When the server starts, you'll see output like this:
```
🚀 Local Network Database Server Starting...
📱 Local IP: 192.168.1.100
🌐 Port: 8000
🔗 Access URL: http://192.168.1.100:8000
📊 Database: hybrid.db
```

**Important**: Note the **Local IP** address (e.g., `192.168.1.100`)

### Step 3: Connect from Other Devices

On any device connected to the same network:

1. **Open a web browser**
2. **Navigate to**: `http://[LOCAL_IP]:8000`
   - Example: `http://192.168.1.100:8000`
3. **Test the connection** using the test page

## 📱 Device Compatibility

### ✅ Supported Devices
- **Desktop/Laptop**: Windows, Mac, Linux
- **Mobile**: Android, iPhone, iPad
- **Tablets**: All platforms
- **Smart TVs**: Web browser compatible devices

### 🔌 Connection Methods
- **WiFi**: All devices connected to same WiFi network
- **Ethernet**: Wired network connections
- **Mobile Hotspot**: One device as hotspot, others connect

## 🧪 Testing the System

### Test Page
Open `test_network_database.html` in any browser to test:
- Server connection
- User creation and retrieval
- Classroom management
- Database operations

### API Endpoints
The server provides these REST API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Server status and connected clients |
| `GET` | `/api/users` | Get all users |
| `GET` | `/api/users/{id}` | Get specific user |
| `POST` | `/api/users` | Create new user |
| `GET` | `/api/classrooms` | Get all classrooms |
| `POST` | `/api/classrooms` | Create new classroom |
| `POST` | `/api/classrooms/join` | Join classroom |
| `GET` | `/api/ping` | Simple connection test |

## 🔧 Configuration Options

### Port Configuration
- **Default Port**: 8000
- **Custom Port**: Use `--port` argument
- **Port Range**: 1024-65535 (avoid 80, 443, 8080)

### Database Configuration
- **Default Database**: `hybrid.db`
- **Custom Database**: Use `--db` argument
- **Database Location**: Any path accessible to Python

### Example Commands
```bash
# Custom port
python local_network_server.py --port 9000

# Custom database
python local_network_server.py --db my_database.db

# Both custom
python local_network_server.py --port 9000 --db my_database.db
```

## 🌍 Network Configuration

### Finding Your Local IP
The server automatically detects your local IP address. Common local IP ranges:
- **192.168.1.x** (Most home routers)
- **192.168.0.x** (Some home routers)
- **10.0.0.x** (Business networks)
- **172.16.x.x** (Business networks)

### Firewall Settings
You may need to allow the port through your firewall:

#### Windows
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Add Python or the port number

#### Mac
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add the Python application

#### Linux
```bash
# Ubuntu/Debian
sudo ufw allow 8000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

## 📊 Database Schema

The system automatically creates these tables:

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    lastLogin TEXT NOT NULL,
    cadetAvatar TEXT DEFAULT 'king-sadboi'
);
```

### Classrooms Table
```sql
CREATE TABLE classrooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    teacherId TEXT NOT NULL,
    joinCode TEXT UNIQUE NOT NULL,
    createdAt TEXT NOT NULL,
    isActive BOOLEAN DEFAULT 1,
    studentCount INTEGER DEFAULT 0
);
```

### Classroom Members Table
```sql
CREATE TABLE classroom_members (
    id TEXT PRIMARY KEY,
    classroomId TEXT NOT NULL,
    studentId TEXT NOT NULL,
    joinedAt TEXT NOT NULL,
    isGuest BOOLEAN DEFAULT 0,
    username TEXT,
    email TEXT
);
```

## 🔒 Security Considerations

### Network Security
- **Local Network Only**: Server is only accessible within your local network
- **No Internet Exposure**: Database is not accessible from the internet
- **Firewall Protection**: Use your router's firewall for additional security

### Data Security
- **No Authentication**: Basic system without user authentication
- **Shared Access**: All devices on network can access the database
- **Data Privacy**: Consider data sensitivity in shared environments

## 🚨 Troubleshooting

### Common Issues

#### 1. "Connection Refused" Error
**Cause**: Server not running or wrong port
**Solution**: 
- Check if server is running
- Verify port number
- Check firewall settings

#### 2. "Cannot Connect" from Other Devices
**Cause**: Wrong IP address or network issues
**Solution**:
- Verify local IP address
- Ensure devices are on same network
- Check router settings

#### 3. "Port Already in Use" Error
**Cause**: Another service using the port
**Solution**:
- Use different port: `--port 8001`
- Stop conflicting service
- Check what's using the port

#### 4. Database Errors
**Cause**: Corrupted database or permission issues
**Solution**:
- Check database file permissions
- Verify database path
- Create new database if needed

### Debug Commands

#### Check Server Status
```bash
# Test local connection
curl http://localhost:8000/api/ping

# Check server status
curl http://localhost:8000/api/status
```

#### Network Diagnostics
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
# or
ip addr
```

#### Port Testing
```bash
# Test if port is open
telnet localhost 8000

# Check what's using a port
netstat -an | grep 8000
```

## 📈 Performance Tips

### Optimization
- **Database Location**: Use SSD for better performance
- **Network Speed**: Ensure good WiFi/LAN connection
- **Concurrent Users**: Limit to reasonable number (10-50 users)

### Monitoring
- **Log Files**: Check `local_network_server.log`
- **Server Status**: Use `/api/status` endpoint
- **Performance**: Monitor response times

## 🔄 Integration with Math-AI-Cosmos

### Frontend Integration
The system is designed to work with the existing math-ai-cosmos frontend:

1. **Update API Base URL**: Change from remote API to local network server
2. **Database Sync**: All devices automatically sync through the shared database
3. **Offline Mode**: Falls back to localStorage when server unavailable

### Configuration Changes
```typescript
// In your frontend code, change:
const API_BASE = 'http://192.168.1.100:8000'; // Your local IP

// Instead of:
const API_BASE = 'https://remote-server.com';
```

## 📚 Advanced Usage

### Custom API Endpoints
Add new endpoints by modifying `local_network_server.py`:

```python
elif self.path == '/api/custom':
    # Your custom logic here
    self.send_json_response({'message': 'Custom endpoint'})
```

### Database Migrations
Handle database schema changes:

```python
def migrate_database(self):
    """Run database migrations"""
    # Add new tables or modify existing ones
    pass
```

### Load Balancing
For high-traffic scenarios, run multiple server instances on different ports.

## 🆘 Support

### Getting Help
1. **Check Logs**: Review `local_network_server.log`
2. **Test Connection**: Use the test page
3. **Verify Network**: Ensure devices are on same network
4. **Check Firewall**: Verify port access

### Common Solutions
- **Restart Server**: Stop and restart the server
- **Check Network**: Verify WiFi/LAN connection
- **Clear Browser Cache**: Clear browser data
- **Try Different Port**: Use `--port` argument

## 🎯 Use Cases

### Educational Environments
- **Classrooms**: Multiple students accessing same lessons
- **Study Groups**: Shared progress tracking
- **Tutoring Sessions**: Real-time collaboration

### Home Networks
- **Family Learning**: Multiple family members
- **Device Sharing**: Access from phone, tablet, computer
- **Offline Learning**: Continue when internet is down

### Business/Enterprise
- **Training Sessions**: Employee training programs
- **Conference Rooms**: Shared presentations
- **Collaborative Learning**: Team-based education

---

**🎉 You're now ready to create a shared learning environment across all your devices!**

