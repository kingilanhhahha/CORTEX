# Troubleshooting Guide

## White Screen Issue

If you're seeing a white screen when running `npm run dev`, follow these steps:

### 1. Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Look for any error messages in red
4. Check for any warnings in yellow

### 2. Test Basic Setup
1. Navigate to `http://localhost:5173/debug.html` to test basic browser functionality
2. Navigate to `http://localhost:5173/test` to test the React app without authentication

### 3. Common Issues and Solutions

#### Issue: Authentication Loop
**Symptoms:** App redirects to login, then back to home, creating an infinite loop
**Solution:** 
1. Clear browser localStorage: `localStorage.clear()` in console
2. Or visit `/debug.html` and click "Clear Local Storage"

#### Issue: Database Initialization Error
**Symptoms:** Console shows database initialization errors
**Solution:**
1. Check if localStorage is available in your browser
2. Try opening in an incognito/private window
3. Check browser console for specific error messages

#### Issue: Missing Dependencies
**Symptoms:** Console shows module not found errors
**Solution:**
```bash
npm install
npm run dev
```

#### Issue: TypeScript Compilation Errors
**Symptoms:** Console shows TypeScript errors
**Solution:**
1. Check if all required files exist
2. Verify TypeScript configuration
3. Restart the development server

### 4. Debug Steps

1. **Start with Debug Page:**
   - Visit `http://localhost:5173/debug.html`
   - Check if all browser features are working

2. **Test React App:**
   - Visit `http://localhost:5173/test`
   - This bypasses authentication and tests basic React functionality

3. **Check Console Logs:**
   - The app now has extensive console logging
   - Look for messages starting with 🔧, 📊, 🔒, etc.

4. **Clear Browser Data:**
   - Clear localStorage and sessionStorage
   - Try in incognito mode

### 5. Development Server Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 6. Environment Requirements

- Node.js 16+ 
- npm 8+
- Modern browser with ES6 support
- LocalStorage enabled

### 7. Browser Compatibility

The app requires:
- ES6 modules support
- LocalStorage API
- Modern CSS features
- React 18+

### 8. Quick Fixes

If you're still seeing a white screen:

1. **Hard Refresh:** Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Clear Cache:** Clear browser cache and cookies
3. **Try Different Browser:** Test in Chrome, Firefox, or Edge
4. **Check Network:** Ensure no firewall is blocking localhost:5173
5. **Restart Dev Server:** Stop and restart `npm run dev`

### 9. Console Logging

The app now includes extensive console logging to help debug issues:

- 🔧 AuthProvider initialization
- 📊 Database operations
- 🔒 Authentication checks
- 🛣️ Route rendering
- 🧪 Test page functionality

Check the browser console for these emoji-prefixed messages to track the app's startup process.

### 10. Still Having Issues?

If none of the above solutions work:

1. Check the browser console for specific error messages
2. Try the debug page at `/debug.html`
3. Test the basic React app at `/test`
4. Report the specific error messages you see

The most common cause of white screens is authentication issues or missing dependencies. The debug tools should help identify the specific problem. 