# 🚀 Quick Installation Reference

## ⚡ One-Command Setup (After Prerequisites)

### Windows
```bash
start-app.bat
```

### macOS/Linux
```bash
python start-app.py
```

---

## 📋 Prerequisites Checklist

- [ ] Python 3.7+ (`python --version`)
- [ ] Node.js 16+ (`node --version`)
- [ ] npm (`npm --version`)

---

## 🔧 Manual Installation

### Backend Setup
```bash
# 1. Create virtual environment (recommended)
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# 2. Install Python packages
pip install -r requirements.txt

# 3. Start backend
python start_backend.py
```

### Frontend Setup
```bash
# 1. Install Node.js packages
npm install

# 2. Start frontend
npm run dev
```

---

## 📦 Required Packages Summary

### Python (Backend)
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

### Node.js (Frontend)
- ~70+ packages automatically installed via `npm install`
- Key frameworks: React, Vite, TypeScript, Tailwind CSS
- See `package.json` for complete list

---

## ✅ Verification

### Backend
```bash
curl http://localhost:5000/api/health
# Should return: {"status": "healthy", "solver_available": true}
```

### Frontend
- Open: http://localhost:5173
- Should load without errors

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | `pip install -r requirements.txt` |
| `npm command not found` | Install Node.js from nodejs.org |
| Port already in use | Kill process or change port in config |
| `pip` not found | Use `python -m pip` instead |

---

## 📚 Full Documentation

See `SETUP_INSTALLATION_GUIDE.md` for complete details.

