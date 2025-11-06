# 🌐 Network Access Guide

## How to Access from Other Devices

### Step 1: Find Your Computer's IP Address

#### On Windows:
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.0.x.x)

#### On Mac/Linux:
```bash
ifconfig
# or
ip addr
```

### Step 2: Start the Servers

**Option A: Use the Network Startup Script (Recommended)**
```bash
# Windows: Double-click start-network.bat
# This will start all 3 servers automatically
```

**Option B: Manual Start**
1. **Start Database Server (for login/registration):**
   ```bash
   cd math-cosmos-tutor-main/api
   python hybrid_db_server.py
   ```

2. **Start Solver Server (for equation solving):**
   ```bash
   cd math-cosmos-tutor-main/api
   python solver.py
   ```

3. **Start Frontend Server:**
   ```bash
   cd math-cosmos-tutor-main
   npm run dev
   ```

### Step 3: Access from Other Devices

Replace `YOUR_IP_ADDRESS` with your actual IP address (e.g., 192.168.1.100):

- **Frontend (Main App)**: `http://YOUR_IP_ADDRESS:5173`
- **Database API**: `http://YOUR_IP_ADDRESS:5055` (for login/registration)
- **Solver API**: `http://YOUR_IP_ADDRESS:5000` (for equation solving)

### Example:
If your IP address is `192.168.1.100`:
- Frontend: `http://192.168.1.100:5173`
- Database: `http://192.168.1.100:5055`
- Solver: `http://192.168.1.100:5000`

## Troubleshooting

### Can't Access from Other Devices?

1. **Check Firewall Settings:**
   - Windows: Allow ports 5000, 5055, and 5173 through Windows Firewall
   - Mac: Allow incoming connections for the application

2. **Check Router Settings:**
   - Make sure both devices are on the same network
   - Some routers block local network communication

3. **Test Connection:**
   ```bash
   # From another device, test if ports are accessible
   ping YOUR_IP_ADDRESS
   ```

4. **Check Server Status:**
   - Database health check: `http://YOUR_IP_ADDRESS:5055/api/ping`
   - Solver health check: `http://YOUR_IP_ADDRESS:5000/api/health`
   - Should return: `{"status": "ok"}` and `{"status": "healthy"}` respectively

### Common Issues

1. **"Connection Refused"**
   - Make sure all three servers are running (Database:5055, Solver:5000, Frontend:5173)
   - Check if ports are not blocked by firewall

2. **"Page Not Found"**
   - Verify you're using the correct IP address
   - Make sure both devices are on the same network

3. **"CORS Error"**
   - The backend is already configured with CORS headers
   - This should work automatically

## Quick Test

1. Start both servers
2. Find your IP address
3. From another device, visit: `http://YOUR_IP_ADDRESS:5173`
4. You should see the login page
5. Try creating an account or logging in

## Security Note

This configuration allows access from any device on your local network. For production use, consider:
- Using HTTPS
- Implementing proper authentication
- Restricting access to specific IP ranges
