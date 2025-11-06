# 🚀 MathVerse - One-Click Launcher

## Quick Start

### Option 1: Windows Batch File (Recommended)
1. **Double-click** `start-app.bat`
2. Wait for servers to start
3. Browser will open automatically

### Option 2: Python Script
1. **Double-click** `start-app.py`
2. Wait for servers to start
3. Browser will open automatically

## What Happens When You Run It

1. **Checks Dependencies**
   - ✅ Python (Flask, SymPy)
   - ✅ Node.js and npm
   - ✅ Installs missing packages automatically

2. **Starts Backend Server**
   - 🔬 Flask API on http://localhost:5000
   - 🧮 Math equation solver

3. **Starts Frontend Server**
   - ⚛️ React app on http://localhost:5173
   - 🎨 Beautiful UI with Simple Equation Builder

4. **Opens Browser**
   - 🌐 Automatically opens http://localhost:5173
   - 🎯 Ready to use!

## 🎯 New Features

### ✨ Simple Equation Builder (Default Mode)
- **No LaTeX knowledge required**
- **Click-and-build interface**
- **Perfect for touchscreen LCD**

### 🔧 How to Use
1. Click **"Left Side"** to build left side of equation
2. Click **numbers, variables, operators** to build expression
3. Use **"Add Fraction"** for easy fraction creation
4. Click **"Right Side"** to build right side
5. Click **"Solve Equation"** for step-by-step solution

### 📊 Easy Fraction Creation
- Click **"Add Fraction"** button
- Build **numerator (top)** step by step
- Build **denominator (bottom)** step by step
- See **live preview** of your fraction

## 🛠️ Troubleshooting

### If Nothing Shows Up:
1. **Check if ports are in use:**
   - Close other applications using ports 5000 or 5173
   - Or restart your computer

2. **Check if dependencies are installed:**
   - Python: https://python.org
   - Node.js: https://nodejs.org

3. **Manual start:**
   ```bash
   # Terminal 1 - Backend
   cd math-cosmos-tutor-main
   python api/solver.py
   
   # Terminal 2 - Frontend
   cd math-cosmos-tutor-main
   npm run dev
   ```

### If You Get Errors:
1. **Python errors:** Run `pip install flask sympy`
2. **Node.js errors:** Run `npm install`
3. **Port errors:** Wait a moment and try again

## 🎨 Available Input Modes

1. **Simple Builder** (Default) - Easy click interface
2. **Keyboard Input** - Traditional text input
3. **LaTeX Keyboard** - Advanced LaTeX input

## 🌟 Features

- **Step-by-step equation building**
- **Easy fraction creation**
- **Live preview of equations**
- **Touch-friendly interface**
- **Clean LaTeX output**
- **Error-free input**
- **Professional mathematical rendering**

## 📱 Perfect for Touchscreen LCD

- **Large buttons** easy to tap
- **Clear visual feedback**
- **No typing required**
- **Step-by-step guidance**
- **Error prevention**

---

**🎉 Enjoy your new easy-to-use math equation solver!** 