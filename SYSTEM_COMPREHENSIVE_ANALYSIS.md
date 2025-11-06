# Math AI Cosmos - Comprehensive System Analysis

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Frontend Structure](#frontend-structure)
4. [Backend Services](#backend-services)
5. [Lessons & Educational Content](#lessons--educational-content)
6. [Components & Features](#components--features)
7. [API Endpoints](#api-endpoints)
8. [Database & Storage](#database--storage)
9. [Testing Infrastructure](#testing-infrastructure)
10. [Utilities & Helpers](#utilities--helpers)

---

## 🎯 System Overview

**Math AI Cosmos** is an interactive educational platform that teaches rational equations through a space-themed RPG game. Students progress through planets (lessons) in the solar system, learning math concepts while earning XP, achievements, and progressing through levels.

### Key Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State Management**: React Context API (Auth, Player, Music)
- **Math Rendering**: KaTeX (react-katex)
- **Animations**: Framer Motion
- **Backend**: Flask (Python) with multiple microservices
- **Database**: Hybrid (SQLite via Flask API + localStorage fallback)
- **Math Processing**: SymPy (Python)

---

## 🏗️ Architecture

### Frontend Architecture
```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root component with routing
├── contexts/             # React Context providers
│   ├── AuthContext.tsx    # Authentication state
│   ├── PlayerContext.tsx  # Player stats, XP, progress
│   └── MusicContext.tsx  # Background music control
├── pages/                # Route pages
├── components/            # Reusable components
├── lib/                   # Core utilities
│   ├── database.ts       # Database abstraction layer
│   └── lessonManager.ts  # Lesson management
└── utils/                 # Helper functions
```

### Backend Architecture
```
api/
├── hybrid_db_server.py        # Main database server (port 5055)
├── drawing_solver_api.py      # OCR & drawing solver (port 5001)
├── solver.py                  # Equation solver service
├── rational_function_solver.py # Rational function analyzer
└── FINAL_SOLVING_CALCULATOR.py # Core solving engine
```

---

## 📱 Frontend Structure

### Pages (Routes)

#### 1. **LoginPage** (`/`, `/login`)
- User authentication (login/register)
- Guest login support
- Character avatar selection
- Database initialization

#### 2. **Index** (`/index`)
- Main hub after login
- Shows dialogue/introduction
- Navigation to RPG hub or lessons
- Progress overview

#### 3. **RPGIndex** (`/rpg`)
- Solar system map hub
- Planet navigation (8 planets = 8 lessons)
- Player stats display (XP, level, stardust, relics)
- Quest map visualization
- Progress tracking

#### 4. **Planet Lessons** (8 lessons)
Each planet represents a lesson topic:

- **MercuryLesson** (`/mercury-lesson`)
  - Topic: Basic Concepts Review
  - Focus: Introduction to rational equations
  - Sections: Theory, examples, interactive quizzes
  - Audio narration support
  
- **VenusLesson** (`/venus-lesson`)
  - Topic: Introduction to Rational Equations
  - Focus: Foundations of rational equation solving
  
- **EarthLesson** (`/earth-lesson`)
  - Topic: Core Rational Equations
  - Focus: Core skills in rational equation manipulation
  
- **MarsLesson** (`/mars-lesson`)
  - Topic: Rational Inequalities
  - Focus: Solving rational inequalities
  - Skills tracked: solving process, quadratic equations, restrictions, LCD application
  
- **JupiterLesson** (`/jupiter-lesson`)
  - Topic: Advanced Problem Types
  - Focus: Complex rational equations
  - Techniques: Multiple fractions, LCD finding
  
- **SaturnLesson** (`/saturn-lesson`)
  - Topic: Mastery Challenges
  - Focus: Ring-based problems and advanced challenges
  
- **UranusLesson** (`/uranus-lesson`)
  - Topic: Creative Applications
  - Focus: Real-world scenarios
  
- **NeptuneLesson** (`/neptune-lesson`)
  - Topic: Final Assessments
  - Focus: Comprehensive evaluations

#### 5. **Philippines Map Lessons** (`/philippines-map`)
- Region-based lessons
- Real-world Philippine landmarks as lesson contexts

**Philippines Map Lesson Pages:**
- **RiceTerracesPolynomial** (`/lesson/rice-terraces`)
  - Topic: Polynomial Functions
  - Location: Rice Terraces
  - XP Reward: 200
  
- **ChocolateHillsRational** (`/lesson/chocolate-hills`)
  - Topic: Rational Functions
  - Location: Chocolate Hills
  
- **CagsawaDomain** (`/lesson/cagsawa-domain`)
  - Topic: Domain Analysis
  - Location: Cagsawa Ruins
  
- **PalawanRestrictions** (`/lesson/palawan-restrictions`)
  - Topic: Restrictions in Rational Equations
  - Location: Palawan Underground
  
- **TaalGraphs** (`/lesson/taal-graphs`)
  - Topic: Graphing Rational Functions
  - Location: Taal Volcano
  
- **CalaguasZeros** (`/lesson/calaguas-zeros`)
  - Topic: Finding Zeros
  - Location: Calaguas Islands

#### 6. **Calculator Tools**
- **DrawingSolverPage** (`/drawing-solver`, `/student`)
  - Drawing-based equation input
  - OCR processing of handwritten math
  - Real-time equation solving
  - Background: Space video game theme with BACKGROUND COSMOS.mp4
  
- **RationalEquationSolver** (`/solver`)
  - Text-based equation solver
  - Step-by-step solutions
  
- **TutorCalculatorPanel** (`/calculator`)
  - Interactive calculator with math keyboard
  - Supports pretty input and SymPy input modes
  
- **QuantumRationalSolverPage** (`/quantum-solver`)
  - Advanced rational function solver

#### 7. **Teacher Dashboard** (`/teacher-dashboard`)
- View all students
- Monitor student progress
- Classroom management
- Progress analytics

#### 8. **TestPage** (`/test`)
- Testing and debugging interface

---

## 🔧 Components & Features

### Calculator Components (`src/components/calculator/`)

1. **DrawingSolver.tsx** (2008 lines)
   - Main drawing canvas for equation input
   - OCR integration for handwritten math
   - Multiple solution modes:
     - Raw explanation
     - Solution process
     - Shortcut (LaTeX)
   - Equation history tracking
   - Solution checker for student work
   - Rational function analysis mode
   - Features:
     - Brush size/color controls
     - Drawing tips/tutorial
     - Download/upload drawings
     - Manual equation correction
     - Smart correction suggestions

2. **MathKeyboard.tsx**
   - Virtual math keyboard
   - Supports "pretty" and "sympy" input modes
   - Fraction builder
   - Exponent helpers
   - Symbol insertion

3. **SimpleMathKeyboard.tsx**
   - Simplified keyboard interface

4. **LaTeXKeyboard.tsx**
   - LaTeX-specific input keyboard

5. **FractionBuilder.tsx**
   - Visual fraction construction tool

6. **SimpleEquationBuilder.tsx**
   - Simple equation input builder

7. **RationalEquationSolver.tsx**
   - Rational equation solving interface

8. **QuantumRationalSolver.tsx**
   - Quantum-themed rational solver

9. **TutorCalculatorPanel.tsx**
   - Main calculator panel with multiple input methods

### RPG Components (`src/components/rpg/`)

1. **SolarSystem.tsx**
   - Interactive solar system visualization
   - Planet click navigation

2. **QuestMap.tsx**
   - Visual quest/lesson map
   - Shows lesson connections

3. **CosmicNPC.tsx**
   - NPC character interactions

4. **HolographicCard.tsx**
   - Holographic-style card component

5. **RPGHeader.tsx**
   - RPG interface header with stats

6. **BackgroundMusic.tsx**
   - Background music player (spacebgm.m4a)

7. **SolutionChecker.tsx**
   - Student solution verification

8. **AchievementDisplay.tsx**
   - Achievement showcase

9. **CosmicBackground.tsx**
   - Animated cosmic background

### Character Components (`src/components/character/`)

1. **CharacterBox.tsx**
   - Character display container

2. **CharacterSelect.tsx**
   - Character selection interface

3. **DialogueBox.tsx**
   - Dialogue/conversation display

**Available Characters:**
- baby-ko
- charmelle (CHARMELLE_SUIT.png)
- chriselle (CHRISELLE.png)
- king (KING.png, KING_SUIT.png)
- jeremiah (Jeremiah_Uniform.png, JEREMIAH_SUIT.png)
- marisse (MARISSE_SUIT-.png)
- robiee (robiee.png)
- lolo (lolo.png)

**Audio Files:**
- Lesson narration audio (Mercury lesson voices)
- Character dialogue audio
- Background music

### Lesson Components (`src/components/lesson/`)

1. **LessonCard.tsx**
   - Lesson display card

2. **LessonHeader.tsx**
   - Lesson page header

3. **LessonNavigation.tsx**
   - Navigation between lesson sections

### Classroom Components (`src/components/classroom/`)

1. **ClassroomManager.tsx**
   - Classroom management interface

2. **JoinClassroom.tsx**
   - Student classroom joining interface

3. **ClassroomGate.tsx**
   - Classroom access control

---

## 🌐 Backend Services

### 1. **hybrid_db_server.py** (Port 5055)
**Purpose**: Main database server with hybrid online/offline support

**Endpoints:**
- `GET /api/ping` - Health check
- `POST /api/users/register` - User registration
- `GET /api/users` - Get all users
- `GET /api/users/by-username/<username>` - Get user by username
- `POST /api/users/update-last-login` - Update last login time
- `GET /api/progress/by-student/<studentId>` - Get student progress
- `POST /api/progress` - Save student progress
- `POST /api/progress/batch` - Batch save progress
- `GET /api/user-progress/<userId>` - Get user progress
- `POST /api/user-progress/upsert` - Upsert progress
- `GET /api/students/for-teacher/<teacherId>` - Get teacher's students
- `GET /api/students/for-teacher-v2/<teacherId>` - Get teacher's students (v2)
- `POST /api/teacher-access` - Grant teacher access
- `GET /api/teacher-access/<teacherId>` - Get teacher access list
- `GET /api/classrooms?teacherId=<id>` - Get classrooms
- `POST /api/classrooms` - Create classroom
- `GET /api/classrooms/<classroomId>` - Get classroom details
- `POST /api/classrooms/join` - Join classroom
- `POST /api/classrooms/join-guest` - Join as guest
- `POST /api/classrooms/<classroomId>/remove-member` - Remove member
- `POST /api/classrooms/<classroomId>/deactivate` - Deactivate classroom
- `GET /api/classrooms/by-student/<studentId>` - Get student's classrooms
- `GET /achievements/<userId>` - Get user achievements
- `POST /achievements` - Save achievement

**Database**: SQLite (`hybrid.db`)

### 2. **drawing_solver_api.py** (Port 5001)
**Purpose**: OCR processing and drawing-based equation solving

**Endpoints:**
- `POST /api/ocr/process` - Process uploaded image through OCR
  - Returns: `latex_raw`, `sympy_out`, `pretty`, `solutions`, `error`, `warning`
- `POST /api/solver/solve` - Solve equation
  - Body: `{ equation: string, detailLevel: 'raw' | 'process' | 'shortcut' }`
  - Returns: `solution`, `steps[]`, `latex`, `mode`
- `POST /api/solver/check` - Check student solution
  - Body: `{ equation: string, studentAnswer: string, studentSteps: string[] }`
  - Returns: Detailed checking results with feedback
- `POST /api/rational-function/analyze` - Analyze rational function
  - Body: `{ function: string }`
  - Returns: `raw_output`, `graph` (base64), `analysis`

**Dependencies:**
- `lcd.py` - OCR processing module
- `olol_hahahaa.py` - Equation solver
- `solution_analysis.py` - Solution checker
- `yessss.py` - Rational function calculator

### 3. **solver.py**
**Purpose**: Basic equation solving service

**Endpoints:**
- `POST /api/solve` - Solve equation
- `POST /api/validate` - Validate equation

**Dependencies:**
- `FINAL_SOLVING_CALCULATOR.py` - Core solving engine

### 4. **rational_function_solver.py**
**Purpose**: Rational function analysis

**Endpoints:**
- `POST /api/rational-function/analyze` - Analyze function
- `POST /api/rational-function/validate` - Validate function

**Dependencies:**
- `yessss.py` - RationalFunctionCalculator class

---

## 📚 Lessons & Educational Content

### Solar System Lessons (8 Planets)

#### Mercury - Basic Concepts Review
- **Sections**: Introduction, Key Components, Steps to Solve, Why Study
- **Audio Files**: 14 audio narration files
- **Topics**: 
  - What is a rational equation
  - Key components (numerator, denominator, restrictions)
  - Steps to solve rational equations
  - Why study rational equations
- **Interactive Elements**: Quizzes, questions with feedback

#### Venus - Introduction to Rational Equations
- **Focus**: Foundations of rational equation solving
- **Content**: Theory, examples, exercises

#### Earth - Core Rational Equations
- **Focus**: Core skills in rational equation manipulation
- **Content**: Step-by-step solving techniques

#### Mars - Rational Inequalities
- **Focus**: Solving rational inequalities
- **Skills Tracked**:
  - Solving process
  - Quadratic equations
  - Restrictions
  - LCD application
  - Factoring
  - Algebra
- **Content**: Critical points, interval testing, inequality relationships

#### Jupiter - Advanced Problem Types
- **Focus**: Complex rational equations
- **Content**: Multiple fractions, LCD finding, higher-degree polynomials

#### Saturn - Mastery Challenges
- **Focus**: Ring-based problems and advanced challenges
- **Content**: Comprehensive problem solving

#### Uranus - Creative Applications
- **Focus**: Real-world applications
- **Content**: Applied problem solving

#### Neptune - Final Assessments
- **Focus**: Comprehensive evaluations
- **Content**: Mastery assessment

### Philippines Map Lessons (6 Locations)

1. **Rice Terraces - Polynomial Functions**
   - XP Reward: 200
   - Location: Rice Terraces
   - Topic: Polynomial functions

2. **Chocolate Hills - Rational Functions**
   - Location: Chocolate Hills
   - Topic: Rational function analysis

3. **Cagsawa - Domain Analysis**
   - Location: Cagsawa Ruins
   - Topic: Domain of rational functions

4. **Palawan - Restrictions**
   - Location: Palawan Underground
   - Topic: Restrictions in rational equations

5. **Taal - Graphs**
   - Location: Taal Volcano
   - Topic: Graphing rational functions

6. **Calaguas - Zeros**
   - Location: Calaguas Islands
   - Topic: Finding zeros of rational functions

---

## 🗄️ Database & Storage

### Database Schema

#### User Table
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  password: string; // Should be hashed in production
  role: 'student' | 'teacher';
  createdAt: Date;
  lastLogin: Date;
  cadetAvatar?: 'baby-ko' | 'charmelle' | 'engot' | 'king-sadboi' | 'robiee';
}
```

#### StudentProgress Table
```typescript
interface StudentProgress {
  id: string;
  studentId: string;
  moduleId: string;        // e.g., 'mercury', 'venus', etc.
  moduleName: string;
  completedAt: Date;
  score?: number;
  timeSpent: number;       // in minutes
  equationsSolved?: string[];
  mistakes?: string[];
  skillBreakdown?: any;
  commonMistakes?: string[];
  strengths?: string[];
  areasForImprovement?: string[];
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
}
```

#### Classroom Table
```typescript
interface Classroom {
  id: string;
  name: string;
  teacherId: string;
  joinCode: string;        // 6-character uppercase code
  createdAt: Date;
  isActive: boolean;
  studentCount?: number;
}
```

#### ClassroomMember Table
```typescript
interface ClassroomMember {
  id: string;
  classroomId: string;
  studentId: string;
  joinedAt: Date;
  isGuest: boolean;
  guestName?: string;
  username?: string;
  email?: string;
  cadetAvatar?: string;
}
```

#### Achievement Table
```typescript
interface Achievement {
  id: string;
  userId: string;
  lessonId: string;
  lessonName: string;
  lessonType: 'solar-system' | 'philippines-map' | 'other';
  xpEarned: number;
  completedAt: Date;
  planetName?: string;     // For solar system lessons
  locationName?: string;   // For Philippines map lessons
}
```

### Storage Modes

1. **Hybrid Mode** (default)
   - Tries remote API first
   - Falls back to localStorage if API unavailable
   - Syncs when connection restored

2. **API-Only Mode**
   - Requires backend connection
   - No localStorage fallback
   - Set via `VITE_DB_MODE=api-only`

3. **Offline Mode**
   - Pure localStorage
   - No API calls
   - Set via `VITE_DB_MODE=offline`

### Progress Tracking

**Progress Payload Structure:**
```typescript
interface ProgressPayload {
  user_id: string;
  module_id: string;       // e.g., 'mercury', 'venus'
  section_id: string;     // e.g., 'S1', 'S2'
  slide_index: number;     // 0-based slide index
  progress_pct: number;   // 0-100
}
```

**Offline Queue**: FIFO queue stored in localStorage for syncing when online

---

## 🧪 Testing Infrastructure

### Python Tests

1. **test_backend_connection.py**
   - Tests backend API connectivity

2. **test_rational.py**
   - Tests rational equation solving

3. **test_rational_integration.py**
   - Integration tests for rational solver

4. **test_quantum_solver.py**
   - Tests quantum solver functionality

5. **test_latex_output.py**
   - Tests LaTeX conversion

6. **test_ocr_fix.py**
   - Tests OCR processing fixes

7. **test_bracket_fix.py**
   - Tests bracket parsing fixes

8. **test_new_bracket_fix.py**
   - Tests new bracket parsing

9. **test_raw_format.py**
   - Tests raw format conversion

10. **test_integration.py**
    - General integration tests

### HTML Test Pages

1. **test-backend.html**
   - Backend API testing interface

2. **test_api.html**
   - API endpoint testing

3. **test-latex.html**
   - LaTeX rendering tests

4. **test_rational_calculator.html**
   - Rational calculator UI tests

5. **test_simple_builder.html**
   - Simple equation builder tests

6. **test_venus_lesson.html**
   - Venus lesson page tests

7. **test_latex_rendering.html**
   - LaTeX rendering visualization

### JavaScript Tests

1. **test_progress_api.js**
   - Progress API testing

2. **test_latex_conversion.js**
   - LaTeX conversion testing

---

## 🛠️ Utilities & Helpers

### Math Utilities (`src/utils/`)

1. **simpleToSympy.ts**
   - Converts human-friendly math input to SymPy format
   - Handles: fractions, exponents, sqrt, unicode symbols
   - Functions:
     - `simpleToSympy(input: string): string`
     - `simpleToLatex(input: string): string`

2. **simpleToLatex.ts**
   - Converts to LaTeX for rendering

3. **latexToSympy.ts**
   - Converts LaTeX to SymPy

4. **sympyToLatex.ts**
   - Converts SymPy to LaTeX

5. **latexConverter.ts**
   - General LaTeX conversion utilities

### Core Libraries (`src/lib/`)

1. **database.ts** (1039 lines)
   - Hybrid database abstraction layer
   - Functions:
     - User management (create, get, update)
     - Progress tracking (save, get, batch)
     - Classroom management
     - Achievement tracking
     - Offline sync queue

2. **lessonManager.ts** (389 lines)
   - Lesson management singleton
   - Lesson definitions
   - Progress tracking
   - XP calculation
   - Prerequisite checking

### Hooks (`src/hooks/`)

1. **use-mobile.tsx**
   - Mobile device detection

2. **use-toast.ts**
   - Toast notification hook

3. **useConversationAudio.ts**
   - Audio playback for conversations

---

## 🎮 Game Mechanics

### Player Stats

- **Level**: Based on XP (1 level per 100 XP initially, scales with level)
- **XP**: Experience points earned from lessons
- **Stardust**: Currency earned from level-ups
- **Relics**: Achievement rewards

### XP System

- **Mercury Lesson**: Base XP + quiz bonuses
- **Planet Lessons**: Varies by difficulty
- **Philippines Lessons**: 200 XP for Rice Terraces
- **Level Up Formula**: `500 + (level - 1) * 250` XP per level

### Progress System

- **Module-based**: Each planet is a module
- **Section-based**: Lessons have multiple sections
- **Slide-based**: Sections contain multiple slides
- **Percentage**: Overall progress calculated from completed sections

### Achievement System

- **Solar System Lessons**: Achievement for each planet completed
- **Philippines Map Lessons**: Achievement for each location
- **XP Rewards**: Varies by lesson
- **Stats Tracking**: Total XP, lessons completed, by type

---

## 🔐 Authentication & User Management

### User Roles

1. **Student**
   - Access to lessons
   - Progress tracking
   - Classroom joining
   - Guest login support

2. **Teacher**
   - Access to teacher dashboard
   - View student progress
   - Create/manage classrooms
   - Grant access to students

### Authentication Flow

1. **Login**
   - Username/password authentication
   - Session stored in localStorage
   - Last login timestamp updated

2. **Registration**
   - Username, email, password, role
   - Avatar selection
   - Automatic login after registration

3. **Guest Login**
   - Temporary user creation
   - No password required
   - Progress saved locally

---

## 🎨 UI Components (shadcn/ui)

50+ pre-built components including:
- Button, Input, Textarea
- Card, Dialog, Alert
- Tabs, Accordion, Collapsible
- Progress, Badge, Avatar
- Table, Select, Checkbox
- And many more...

---

## 📊 Performance Optimizations

1. **Offline Queue**: Batched progress updates
2. **Debouncing**: Progress saves debounced (1 second)
3. **Lazy Loading**: Components loaded on demand
4. **Caching**: localStorage for offline support
5. **Timeout Protection**: API calls have 5-second timeout
6. **Polling**: Gentle 5-second polling for progress sync

---

## 🚀 Deployment

### Development
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Services
```bash
python start_backend.py           # Start database server (port 5055)
python start_drawing_solver.py   # Start drawing solver (port 5001)
python start_quantum_solver.py   # Start quantum solver
```

### Environment Variables
- `VITE_DB_API`: Database API base URL
- `VITE_DB_MODE`: `hybrid` | `api-only` | `offline`
- `VITE_DRAWING_API_BASE`: Drawing solver API base URL

---

## 📝 Key Features Summary

1. **Interactive Lessons**: 8 planet lessons + 6 Philippines map lessons
2. **Drawing Solver**: OCR-based handwritten equation solving
3. **Multiple Calculators**: Text, drawing, and keyboard input
4. **Progress Tracking**: Detailed progress per module/section/slide
5. **Achievement System**: XP, achievements, levels
6. **Classroom Management**: Teacher-student interactions
7. **Offline Support**: Hybrid online/offline database
8. **Audio Narration**: Voice-guided lessons
9. **Solution Checking**: AI-powered student solution verification
10. **Rational Function Analysis**: Advanced function analysis with graphs

---

## 🔍 File Count Summary

- **Frontend Pages**: 27 TypeScript/React files
- **Components**: 100+ component files
- **Backend Services**: 5 Python Flask servers
- **Test Files**: 22 Python tests, 26 HTML tests, 2 JS tests
- **Utilities**: 4 TypeScript utility files
- **Audio Files**: 23+ MP3/M4A files
- **Images**: 50+ PNG/JPG/WEBP files

---

*Last Updated: System scan completed*
*Total Lines of Code: ~50,000+ (estimated)*





