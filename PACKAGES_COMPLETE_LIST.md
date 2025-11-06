# 📦 Complete Package List - Math AI Cosmos

This document lists ALL packages required to run the Math AI Cosmos system.

---

## 🐍 Python Backend Packages

### Main Requirements File (`requirements.txt`)
**Use this file for installation:**
```bash
pip install -r requirements.txt
```

**Complete List:**
```
flask==2.3.3           # Web framework for API server
flask-cors==4.0.0       # Cross-Origin Resource Sharing support
sympy==1.12             # Symbolic mathematics library
pillow==10.0.1          # Image processing (PIL)
numpy==1.24.3           # Numerical computing
matplotlib==3.7.2       # Plotting and visualization
latex2sympy2==1.8.3     # LaTeX to SymPy conversion
requests>=2.31.0        # HTTP library for API calls
```

### Additional Python Packages (Included in Standard Library)
- `sqlite3` - Database (Python standard library)
- `os`, `sys`, `json`, `datetime`, `uuid`, `base64`, `io`, `tempfile` - Python standard library

### Optional/Module-Specific Dependencies
These are imported conditionally in various modules:
- `lcd.py` requires: `latex2sympy2`, `Pillow` (already in requirements.txt)
- `drawing_solver_api.py` requires: `PIL` (Pillow), `matplotlib` (already in requirements.txt)
- `hybrid_db_server.py` requires: `sqlite3` (standard library)

---

## 📦 Node.js Frontend Packages

### Installation Command
```bash
npm install
```

### Production Dependencies (from `package.json`)

#### Core Framework
- `react`: `^18.3.1` - UI library
- `react-dom`: `^18.3.1` - React DOM renderer
- `react-router-dom`: `^6.26.2` - Routing
- `vite`: `^5.4.1` - Build tool (dev dependency)

#### UI Components (Radix UI)
- `@radix-ui/react-accordion`: `^1.2.0`
- `@radix-ui/react-alert-dialog`: `^1.1.1`
- `@radix-ui/react-aspect-ratio`: `^1.1.0`
- `@radix-ui/react-avatar`: `^1.1.0`
- `@radix-ui/react-checkbox`: `^1.1.1`
- `@radix-ui/react-collapsible`: `^1.1.0`
- `@radix-ui/react-context-menu`: `^2.2.1`
- `@radix-ui/react-dialog`: `^1.1.2`
- `@radix-ui/react-dropdown-menu`: `^2.1.1`
- `@radix-ui/react-hover-card`: `^1.1.1`
- `@radix-ui/react-label`: `^2.1.0`
- `@radix-ui/react-menubar`: `^1.1.1`
- `@radix-ui/react-navigation-menu`: `^1.2.0`
- `@radix-ui/react-popover`: `^1.1.1`
- `@radix-ui/react-progress`: `^1.1.0`
- `@radix-ui/react-radio-group`: `^1.2.0`
- `@radix-ui/react-scroll-area`: `^1.1.0`
- `@radix-ui/react-select`: `^2.1.1`
- `@radix-ui/react-separator`: `^1.1.0`
- `@radix-ui/react-slider`: `^1.2.0`
- `@radix-ui/react-slot`: `^1.1.0`
- `@radix-ui/react-switch`: `^1.1.0`
- `@radix-ui/react-tabs`: `^1.1.0`
- `@radix-ui/react-toast`: `^1.2.1`
- `@radix-ui/react-toggle`: `^1.1.0`
- `@radix-ui/react-toggle-group`: `^1.1.0`
- `@radix-ui/react-tooltip`: `^1.1.4`

#### Styling & UI
- `tailwindcss`: `^3.4.11` - CSS framework (dev)
- `tailwind-merge`: `^2.5.2` - Merge Tailwind classes
- `tailwindcss-animate`: `^1.0.7` - Tailwind animations
- `framer-motion`: `^12.23.11` - Animation library
- `class-variance-authority`: `^0.7.1` - Component variants
- `clsx`: `^2.1.1` - Conditional className utility
- `next-themes`: `^0.3.0` - Theme management

#### Math Rendering
- `katex`: `^0.16.9` - Fast math typesetting
- `react-katex`: `^3.0.1` - React wrapper for KaTeX

#### 3D Graphics
- `three`: `0.160.0` - 3D graphics library
- `@react-three/fiber`: `8.15.16` - React renderer for Three.js
- `@react-three/drei`: `9.114.6` - Helpers for react-three-fiber

#### Forms & Validation
- `react-hook-form`: `^7.53.0` - Form management
- `zod`: `^3.23.8` - Schema validation
- `@hookform/resolvers`: `^3.9.0` - Form resolvers

#### Data & State
- `@tanstack/react-query`: `^5.56.2` - Data fetching and caching
- `date-fns`: `^3.6.0` - Date utility library

#### Utilities
- `lucide-react`: `^0.462.0` - Icon library
- `sonner`: `^1.5.0` - Toast notifications
- `recharts`: `^2.12.7` - Chart library
- `react-confetti`: `^6.4.0` - Confetti animation
- `react-type-animation`: `^3.2.0` - Typing animation
- `cmdk`: `^1.0.0` - Command menu
- `embla-carousel-react`: `^8.3.0` - Carousel component
- `input-otp`: `^1.2.4` - OTP input component
- `react-day-picker`: `^8.10.1` - Date picker
- `react-resizable-panels`: `^2.1.3` - Resizable panels
- `vaul`: `^0.9.3` - Drawer component

### Development Dependencies

#### Build Tools
- `typescript`: `^5.5.3` - TypeScript compiler
- `@vitejs/plugin-react-swc`: `^3.5.0` - Vite React plugin
- `vite`: `^5.4.1` - Build tool

#### Type Definitions
- `@types/node`: `^22.5.5`
- `@types/react`: `^18.3.3`
- `@types/react-dom`: `^18.3.0`

#### Linting & Code Quality
- `eslint`: `^9.9.0` - Code linting
- `@eslint/js`: `^9.9.0` - ESLint JavaScript plugin
- `eslint-plugin-react-hooks`: `^5.1.0-rc.0` - React hooks linting
- `eslint-plugin-react-refresh`: `^0.4.9` - React refresh linting
- `typescript-eslint`: `^8.0.1` - TypeScript ESLint plugin
- `globals`: `^15.9.0` - ESLint globals

#### CSS Processing
- `postcss`: `^8.4.47` - CSS processing
- `autoprefixer`: `^10.4.20` - CSS vendor prefixes
- `@tailwindcss/typography`: `^0.5.15` - Typography plugin

#### Development Utilities
- `concurrently`: `^9.2.0` - Run multiple commands
- `wait-on`: `^8.0.4` - Wait for resources
- `lovable-tagger`: `^1.1.7` - Component tagging (dev tool)
- `electron-packager`: `^17.1.2` - Electron packaging (optional)

---

## 📊 Summary Statistics

### Python Packages
- **Total**: 8 packages (from requirements.txt)
- **Core**: 5 packages (Flask, SymPy, NumPy, Pillow, matplotlib)
- **Specialized**: 3 packages (latex2sympy2, requests, flask-cors)

### Node.js Packages
- **Production Dependencies**: ~50 packages
- **Development Dependencies**: ~20 packages
- **Total (including sub-dependencies)**: ~70+ packages
- **Total Size**: ~200-300 MB (after `npm install`)

---

## 🔄 Installation Commands Summary

### Backend
```bash
# Install all Python packages
pip install -r requirements.txt

# Or install individually
pip install flask==2.3.3 flask-cors==4.0.0 sympy==1.12 pillow==10.0.1 numpy==1.24.3 matplotlib==3.7.2 latex2sympy2==1.8.3 requests>=2.31.0
```

### Frontend
```bash
# Install all Node.js packages
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install
```

---

## ✅ Verification Commands

### Check Python Packages
```bash
pip list | grep -E "flask|sympy|numpy|pillow|matplotlib|latex2sympy"
```

### Check Node.js Packages
```bash
npm list --depth=0
```

---

## 📝 Notes

1. **Virtual Environment**: Highly recommended for Python to avoid conflicts
2. **Node Version**: Node.js 16+ required, 18+ recommended
3. **Python Version**: Python 3.7+ required, 3.8+ recommended
4. **Package Managers**: 
   - Python: pip (comes with Python)
   - Node.js: npm (comes with Node.js), or yarn/pnpm
5. **Dependencies**: Some packages have sub-dependencies installed automatically
6. **Database**: SQLite3 is included with Python - no separate installation needed

---

**Last Updated**: Based on current `requirements.txt` and `package.json` files

