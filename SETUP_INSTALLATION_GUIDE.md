# 📦 Complete Installation Guide - Math AI Cosmos

This guide provides a comprehensive list of all packages and dependencies needed to run both the backend and frontend of the Math AI Cosmos system.

## 🎯 System Overview

The Math AI Cosmos system consists of:
- **Backend**: Python Flask API server (port 5000)
- **Frontend**: React + TypeScript + Vite application (port 5173)
- **Database**: SQLite (included with Python)

---

## 📋 Prerequisites

### Required Software

1. **Python 3.7+** (Python 3.8+ recommended)
   - Download: https://www.python.org/downloads/
   - Verify: `python --version` or `python3 --version`

2. **Node.js 16+** (Node.js 18+ recommended) and npm
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`
   - Alternative: Use nvm (Node Version Manager) for easier version management

3. **Git** (optional, for cloning repository)
   - Download: https://git-scm.com/downloads

---

## 🔧 Backend Installation

### Step 1: Navigate to Project Directory
```bash
cd math-ai-cosmos-main
```

### Step 2: Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Python Dependencies

#### Core Backend Dependencies
```bash
pip install -r requirements.txt
```

**Required Python Packages:**
- `flask==2.3.3` - Web framework for API server
- `flask-cors==4.0.0` - Cross-Origin Resource Sharing support
- `sympy==1.12` - Symbolic mathematics library
- `pillow==10.0.1` - Image processing (PIL)
- `numpy==1.24.3` - Numerical computing
- `matplotlib==3.7.2` - Plotting and visualization
- `latex2sympy2==1.8.3` - LaTeX to SymPy conversion
- `requests>=2.31.0` - HTTP library for API calls

#### Additional Backend Dependencies (if using drawing solver)
The drawing solver (`lcd.py`) requires:
- `latex2sympy2==1.8.3` (already in requirements.txt)
- `Pillow==10.0.1` (already in requirements.txt)

**Note:** SQLite3 is included with Python standard library - no additional installation needed.

### Step 4: Verify Backend Installation
```bash
python start_backend.py
```

Or manually:
```bash
cd api
python solver.py
```

You should see:
```
🔬 Rational Equation Solver Backend
========================================
✅ Solver file found
✅ Dependencies checked
🌐 Starting server on http://localhost:5000
```

---

## 🎨 Frontend Installation

### Step 1: Navigate to Project Root
```bash
cd math-ai-cosmos-main
```

### Step 2: Install Node.js Dependencies
```bash
npm install
```

This will install all dependencies listed in `package.json`.

### Step 3: Frontend Dependencies Overview

#### Core Dependencies (Production)
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "vite": "^5.4.1",
  "typescript": "^5.5.3"
}
```

#### UI Framework & Components
- **Radix UI**: Complete UI component library
  - `@radix-ui/react-*` (20+ components)
- **shadcn/ui**: Component system built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **framer-motion**: Animation library
- **lucide-react**: Icon library

#### Math & Formula Rendering
- `katex`: "^0.16.9" - Fast math typesetting
- `react-katex`: "^3.0.1" - React wrapper for KaTeX

#### 3D Graphics (for visualizations)
- `three`: "0.160.0" - 3D graphics library
- `@react-three/fiber`: "8.15.16" - React renderer for Three.js
- `@react-three/drei`: "9.114.6" - Useful helpers for react-three-fiber

#### Forms & Validation
- `react-hook-form`: "^7.53.0" - Form management
- `zod`: "^3.23.8" - Schema validation
- `@hookform/resolvers`: "^3.9.0" - Form resolvers

#### Data & State Management
- `@tanstack/react-query`: "^5.56.2" - Data fetching and caching
- `date-fns`: "^3.6.0" - Date utility library

#### Other Utilities
- `clsx`: "^2.1.1" - Conditional className utility
- `tailwind-merge`: "^2.5.2" - Merge Tailwind classes
- `sonner`: "^1.5.0" - Toast notifications
- `recharts`: "^2.12.7" - Chart library
- `react-confetti`: "^6.4.0" - Confetti animation
- `react-type-animation`: "^3.2.0" - Typing animation
- `next-themes`: "^0.3.0" - Theme management

#### Dev Dependencies
- `@vitejs/plugin-react-swc`: "^3.5.0" - Vite React plugin
- `eslint`: "^9.9.0" - Code linting
- `tailwindcss`: "^3.4.11" - CSS framework
- `postcss`: "^8.4.47" - CSS processing
- `autoprefixer`: "^10.4.20" - CSS vendor prefixes
- `concurrently`: "^9.2.0" - Run multiple commands
- `wait-on`: "^8.0.4" - Wait for resources

### Step 4: Verify Frontend Installation
```bash
npm run dev
```

You should see:
```
VITE v5.4.1  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## 🚀 Quick Start (Both Backend & Frontend)

### Option 1: Using Startup Script (Recommended)
```bash
# Windows
start-app.bat

# macOS/Linux
python start-app.py
```

This will:
1. Check and install missing dependencies
2. Start backend server (port 5000)
3. Start frontend server (port 5173)
4. Open browser automatically

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
python start_backend.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## 📊 Complete Package List Summary

### Python Backend Packages
```
flask==2.3.3
flask-cors==4.0.0
sympy==1.12
pillow==10.0.1
numpy==1.24.3
matplotlib==3.7.2
latex2sympy2==1.8.3
requests>=2.31.0
```

### Node.js Frontend Packages

**Total: ~70+ packages** (including dependencies)

**Key Production Dependencies:**
- React ecosystem (react, react-dom, react-router-dom)
- UI components (Radix UI, shadcn/ui)
- Styling (Tailwind CSS, framer-motion)
- Math rendering (katex, react-katex)
- 3D graphics (three, @react-three/fiber)
- Forms (react-hook-form, zod)
- Utilities (date-fns, clsx, tailwind-merge)

**Key Dev Dependencies:**
- Build tools (Vite, TypeScript)
- Linting (ESLint)
- CSS processing (PostCSS, Autoprefixer)

---

## 🔍 Verification Checklist

After installation, verify:

### Backend
- [ ] Python 3.7+ installed
- [ ] All packages from `requirements.txt` installed
- [ ] Backend starts on `http://localhost:5000`
- [ ] Health check works: `curl http://localhost:5000/api/health`

### Frontend
- [ ] Node.js 16+ installed
- [ ] All packages from `package.json` installed (`node_modules` folder exists)
- [ ] Frontend starts on `http://localhost:5173`
- [ ] No build errors in console
- [ ] Application loads in browser

### Integration
- [ ] Backend API accessible from frontend
- [ ] CORS configured correctly
- [ ] Database file (`hybrid.db`) can be created/accessed

---

## 🛠️ Troubleshooting

### Python Issues

**Problem:** `ModuleNotFoundError`
```bash
# Solution: Install missing package
pip install <package-name>

# Or reinstall all requirements
pip install -r requirements.txt
```

**Problem:** `pip` command not found
```bash
# Use python -m pip instead
python -m pip install -r requirements.txt
```

### Node.js Issues

**Problem:** `npm` command not found
- Install Node.js from https://nodejs.org/
- Or use a Node version manager (nvm)

**Problem:** `npm install` fails
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Port already in use
```bash
# Windows: Find and kill process on port 5000 or 5173
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill
lsof -ti:5173 | xargs kill
```

### Virtual Environment Issues

**Problem:** Packages installed globally instead of in venv
```bash
# Make sure virtual environment is activated
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# Verify (should show path to .venv)
which python
```

---

## 📝 Additional Notes

### Database
- SQLite database is created automatically at `api/hybrid.db`
- No additional database setup required
- Database schema is created on first run

### Environment Variables
- No environment variables required for basic setup
- Backend runs on `localhost:5000` by default
- Frontend runs on `localhost:5173` by default

### File Structure
```
math-ai-cosmos-main/
├── api/                    # Backend Python files
│   ├── solver.py          # Main API server
│   ├── requirements.txt    # Python dependencies
│   └── hybrid.db          # SQLite database (auto-created)
├── src/                    # Frontend React source
├── public/                 # Static assets
├── package.json           # Node.js dependencies
├── requirements.txt       # Python dependencies (root)
└── start-app.py          # Startup script
```

---

## 🎉 Success!

Once everything is installed and running:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- API Health Check: http://localhost:5000/api/health

**For detailed API documentation, see `BACKEND_STARTUP.md`**
**For quick start guide, see `QUICK_START.md`**

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check console/terminal for error messages
4. Ensure ports 5000 and 5173 are not in use by other applications




