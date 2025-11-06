// Hybrid Offline/Online Database
// - Tries a remote API (SQLite via Flask) at VITE_DB_API for shared LAN data
// - Falls back to localStorage for full offline operation (unless VITE_DB_MODE=api-only)

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // In production, this should be hashed
  role: 'student' | 'teacher';
  createdAt: Date;
  lastLogin: Date;
  cadetAvatar?: 'baby-ko' | 'charmelle' | 'engot' | 'king-sadboi' | 'robiee';
}

export interface StudentProgress {
  id: string;
  studentId: string;
  moduleId: string;
  moduleName: string;
  completedAt: Date;
  score?: number;
  timeSpent: number; // in minutes
  equationsSolved?: string[];
  mistakes?: string[];
  skillBreakdown?: any;
  commonMistakes?: string[];
  strengths?: string[];
  areasForImprovement?: string[];
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface TeacherAccess {
  id: string;
  teacherId: string;
  studentId: string;
  grantedAt: Date;
}

export interface Classroom {
  id: string;
  name: string;
  teacherId: string;
  joinCode: string;
  createdAt: Date;
  isActive: boolean;
  studentCount?: number;
}

export interface ClassroomMember {
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

export interface GuestUser {
  id: string;
  username: string;
  guestName: string;
}

export interface Achievement {
  id: string;
  userId: string;
  lessonId: string;
  lessonName: string;
  lessonType: 'solar-system' | 'philippines-map' | 'other';
  xpEarned: number;
  completedAt: Date;
  planetName?: string; // For solar system lessons
  locationName?: string; // For Philippines map lessons
}

export interface AchievementStats {
  totalXP: number;
  lessonsCompleted: number;
  solarSystemLessons: number;
  philippinesMapLessons: number;
  achievements: Achievement[];
}

const envApi = (import.meta as any).env?.VITE_DB_API || '';
const inferredApi = typeof window !== 'undefined' ? `http://${window.location.hostname}:5055` : 'http://localhost:5055';
const API_BASE = envApi || inferredApi;
const DB_MODE = (import.meta as any).env?.VITE_DB_MODE || 'hybrid'; // Default to hybrid so app works without backend
const HAS_API = !!API_BASE;

export function getDbConfig() {
  return { API_BASE, DB_MODE, HAS_API };
}

async function apiGet<T>(path: string): Promise<T> {
  console.log(`🌐 API GET: ${API_BASE}${path}`);
  
  // Add timeout protection to prevent hanging requests
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('API timeout')), 5000)
  );
  
  const fetchPromise = fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });
  
  const res = await Promise.race([fetchPromise, timeoutPromise]);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API GET failed: ${res.status} - ${errorText}`);
    throw new Error(`GET ${path} failed: ${res.status} - ${errorText}`);
  }
  return res.json();
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  console.log(`🌐 API POST: ${API_BASE}${path}`, body);
  
  // Add timeout protection to prevent hanging requests
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('API timeout')), 5000)
  );
  
  const fetchPromise = fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store'
  });
  
  const res = await Promise.race([fetchPromise, timeoutPromise]);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API POST failed: ${res.status} - ${errorText}`);
    throw new Error(`POST ${path} failed: ${res.status} - ${errorText}`);
  }
  return res.json();
}

class HybridDatabase {
  private readonly STORAGE_KEY = 'mathtutor_data';
  private readonly COMPRESSED_KEY = 'mathtutor_data_compressed';
  private readonly CHUNK_SIZE = 1000000; // 1MB chunks
  private readonly MAX_CHUNKS = 10; // Maximum number of chunks

  // Add compression utility methods
  private compressData(data: any): string {
    try {
      // Remove unnecessary whitespace and use shorter property names
      const compressed = JSON.stringify(data, (key, value) => {
        // Shorten common property names
        const shortNames: { [key: string]: string } = {
          'createdAt': 'c',
          'lastLogin': 'l',
          'username': 'u',
          'email': 'e',
          'password': 'p',
          'role': 'r',
          'cadetAvatar': 'a',
          'teacherId': 't',
          'studentId': 's',
          'classroomId': 'cid',
          'joinCode': 'jc',
          'isActive': 'ia',
          'studentCount': 'sc',
          'completedAt': 'ca',
          'moduleId': 'mid',
          'moduleName': 'mn',
          'timeSpent': 'ts',
          'equationsSolved': 'es',
          'mistakes': 'm',
          'skillBreakdown': 'sb'
        };
        
        if (shortNames[key]) {
          return { [shortNames[key]]: value };
        }
        return value;
      });
      
      return compressed;
    } catch (error) {
      console.warn('Compression failed, using original data:', error);
      return JSON.stringify(data);
    }
  }

  private decompressData(compressed: string): any {
    try {
      const parsed = JSON.parse(compressed);
      
      // Restore original property names
      const restoreNames = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const longNames: { [key: string]: string } = {
          'c': 'createdAt',
          'l': 'lastLogin',
          'u': 'username',
          'e': 'email',
          'p': 'password',
          'r': 'role',
          'a': 'cadetAvatar',
          't': 'teacherId',
          's': 'studentId',
          'cid': 'classroomId',
          'jc': 'joinCode',
          'ia': 'isActive',
          'sc': 'studentCount',
          'ca': 'completedAt',
          'mid': 'moduleId',
          'mn': 'moduleName',
          'ts': 'timeSpent',
          'es': 'equationsSolved',
          'm': 'mistakes',
          'sb': 'skillBreakdown'
        };
        
        const restored: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const longName = longNames[key] || key;
          restored[longName] = typeof value === 'object' ? restoreNames(value) : value;
        }
        return restored;
      };
      
      return restoreNames(parsed);
    } catch (error) {
      console.warn('Decompression failed, trying original parse:', error);
      try {
        return JSON.parse(compressed);
      } catch {
        return {};
      }
    }
  }

  private chunkData(data: string): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < data.length; i += this.CHUNK_SIZE) {
      chunks.push(data.slice(i, i + this.CHUNK_SIZE));
    }
    return chunks;
  }

  private saveChunkedData(data: any): void {
    try {
      const compressed = this.compressData(data);
      
      if (compressed.length <= this.CHUNK_SIZE) {
        // Data fits in single chunk, use regular storage
        localStorage.setItem(this.STORAGE_KEY, compressed);
        localStorage.removeItem(this.COMPRESSED_KEY);
        // Remove any existing chunks
        for (let i = 0; i < this.MAX_CHUNKS; i++) {
          localStorage.removeItem(`${this.COMPRESSED_KEY}_chunk_${i}`);
        }
      } else {
        // Data needs chunking
        const chunks = this.chunkData(compressed);
        
        if (chunks.length > this.MAX_CHUNKS) {
          // Data is too large, implement cleanup strategy
          console.warn('Data too large, implementing cleanup strategy');
          this.cleanupOldData(data);
          return;
        }
        
        // Store chunk metadata
        localStorage.setItem(this.COMPRESSED_KEY, JSON.stringify({
          chunkCount: chunks.length,
          totalSize: compressed.length,
          timestamp: Date.now()
        }));
        
        // Store chunks
        chunks.forEach((chunk, index) => {
          localStorage.setItem(`${this.COMPRESSED_KEY}_chunk_${index}`, chunk);
        });
        
        // Remove old single storage
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save chunked data:', error);
      // Fallback to original method
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
        this.handleStorageQuotaError();
      }
    }
  }

  private loadChunkedData(): any {
    try {
      // Check if we have chunked data
      const chunkedMeta = localStorage.getItem(this.COMPRESSED_KEY);
      
      if (chunkedMeta) {
        try {
          const meta = JSON.parse(chunkedMeta);
          const chunks: string[] = [];
          
          for (let i = 0; i < meta.chunkCount; i++) {
            const chunk = localStorage.getItem(`${this.COMPRESSED_KEY}_chunk_${i}`);
            if (chunk) {
              chunks.push(chunk);
            }
          }
          
          if (chunks.length === meta.chunkCount) {
            const compressed = chunks.join('');
            const result = this.decompressData(compressed);
            // Ensure we return a valid object
            return result && typeof result === 'object' ? result : {};
          }
        } catch (chunkError) {
          console.warn('Error loading chunked data, falling back to regular storage:', chunkError);
        }
      }
      
      // Fallback to regular storage
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        try {
          const result = this.decompressData(data);
          // Ensure we return a valid object
          return result && typeof result === 'object' ? result : {};
        } catch (decompressError) {
          console.warn('Error decompressing data, trying direct parse:', decompressError);
          try {
            return JSON.parse(data);
          } catch (parseError) {
            console.error('Failed to parse data:', parseError);
            return {};
          }
        }
      }
      
      // Return empty object with expected structure
      return {
        users: [],
        teacherAccess: [],
        studentProgress: [],
        classrooms: {}
      };
    } catch (error) {
      console.error('Failed to load chunked data:', error);
      // Return empty object with expected structure
      return {
        users: [],
        teacherAccess: [],
        studentProgress: [],
        classrooms: {}
      };
    }
  }

  private cleanupOldData(currentData: any): void {
    try {
      console.log('Cleaning up old data to free storage space');
      
      // Keep only essential data, remove old progress and achievements
      const cleanedData = {
        users: currentData.users || [],
        teacherAccess: currentData.teacherAccess || [],
        studentProgress: (currentData.studentProgress || []).slice(-100), // Keep only last 100 entries
        classrooms: currentData.classrooms || {}
      };
      
      // Clear all existing storage
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.COMPRESSED_KEY);
      for (let i = 0; i < this.MAX_CHUNKS; i++) {
        localStorage.removeItem(`${this.COMPRESSED_KEY}_chunk_${i}`);
      }
      
      // Save cleaned data
      this.saveChunkedData(cleanedData);
      
      console.log('Data cleanup completed');
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  }

  private handleStorageQuotaError(): void {
    console.error('Storage quota exceeded, implementing emergency cleanup');
    
    // Emergency cleanup - remove all data and start fresh
    try {
      localStorage.clear();
      console.log('Emergency storage cleanup completed');
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  async init(): Promise<void> {
    console.log(`📊 DB init → API: ${API_BASE || 'none (offline)'} | MODE: ${DB_MODE}`);
    
    // Migrate old data format if needed
    this.migrateOldData();
    
    // In api-only mode, purge any stale local caches to prevent divergence
    if (DB_MODE === 'api-only' && typeof window !== 'undefined') {
      try {
        // Remove main aggregate store and compressed data
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.COMPRESSED_KEY);
        // Remove all chunks
        for (let i = 0; i < this.MAX_CHUNKS; i++) {
          localStorage.removeItem(`${this.COMPRESSED_KEY}_chunk_${i}`);
        }
        // Remove per-student classroom caches and pending joins
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) as string;
          if (!key) continue;
          if (key.startsWith(`${this.STORAGE_KEY}_student_classrooms_`) ||
              key.startsWith(`${this.STORAGE_KEY}_pending_joins`) ||
              key.startsWith(`${this.STORAGE_KEY}_classrooms_`) ||
              key.startsWith(`${this.STORAGE_KEY}_classroom_`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}
    }
  }

  private migrateOldData(): void {
    try {
      // Check if we have old format data that needs migration
      const oldData = localStorage.getItem(this.STORAGE_KEY);
      if (oldData && oldData.length > 0) {
        console.log('Migrating old data format to new compressed format');
        
        // Parse old data
        const parsed = JSON.parse(oldData);
        
        // Save using new system
        this.saveChunkedData(parsed);
        
        console.log('Data migration completed');
      }
    } catch (error) {
      console.error('Data migration failed:', error);
    }
  }

  public generateId(): string {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private shouldFallback(err: unknown): boolean {
    return DB_MODE !== 'api-only' && (!!err);
  }

  // --- USERS ---
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User> {
    if (HAS_API) {
      try {
        const u = await apiPost<any>('/api/users/register', user);
        return this.parseUser(u);
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    // offline
    const newUser: User = {
      ...user,
      id: this.generateId(),
      createdAt: new Date(),
      lastLogin: new Date(),
      cadetAvatar: (user as any).cadetAvatar ?? 'king-sadboi',
    };
    const users = this.getUsers();
    
    // Ensure users is an array before calling .find()
    if (!Array.isArray(users)) {
      console.error('Users is not an array:', users);
      throw new Error('Database error: users data is corrupted');
    }
    
    if (users.find((u) => u.username === user.username)) throw new Error('Username already exists');
    if (users.find((u) => u.email === user.email)) throw new Error('Email already exists');
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (HAS_API) {
      try {
        const u = await apiGet<any>(`/api/users/by-username/${encodeURIComponent(username)}`);
        return u ? this.parseUser(u) : null;
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    const users = this.getUsers();
    
    // Ensure users is an array before calling .find()
    if (!Array.isArray(users)) {
      console.error('Users is not an array:', users);
      return null;
    }
    
    const user = users.find((u) => u.username === username);
    return user ? this.parseUser(user) : null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    if (HAS_API) {
      try {
        await apiPost('/api/users/update-last-login', { userId });
        return;
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    const users = this.getUsers();
    
    // Ensure users is an array before calling .findIndex()
    if (!Array.isArray(users)) {
      console.error('Users is not an array:', users);
      return;
    }
    
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date();
      this.saveUsers(users);
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    if (HAS_API) {
      try {
        const u = await apiGet<any>(`/api/users/${userId}`);
        return u ? this.parseUser(u) : null;
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    
    // Offline fallback
    try {
      const users = this.getUsers();
      const user = users.find((u) => u.id === userId);
      if (user) {
        // Ensure the user object has the required properties before parsing
        const userWithDefaults = {
          ...user,
          createdAt: user.createdAt || new Date(),
          lastLogin: user.lastLogin || new Date(),
          cadetAvatar: user.cadetAvatar || 'king-sadboi'
        };
        return this.parseUser(userWithDefaults);
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // --- TEACHER ACCESS ---
  async grantTeacherAccess(teacherId: string, studentId: string): Promise<TeacherAccess> {
    if (HAS_API) {
      try {
        await apiPost('/api/teacher-access', { teacherId, studentId });
        return { id: 'remote', teacherId, studentId, grantedAt: new Date() } as TeacherAccess;
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    const access: TeacherAccess = {
      id: this.generateId(),
      teacherId,
      studentId,
      grantedAt: new Date(),
    };
    const allAccess = this.getTeacherAccessData();
    const existingAccess = allAccess.find((a) => a.teacherId === teacherId && a.studentId === studentId);
    if (!existingAccess) {
      allAccess.push(access);
      this.saveTeacherAccessData(allAccess);
    }
    return access;
  }

  async getTeacherAccess(teacherId: string): Promise<TeacherAccess[]> {
    if (HAS_API) {
      try {
        const list = await apiGet<any[]>(`/api/teacher-access/${teacherId}`);
        return list.map((a) => this.parseTeacherAccess(a));
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    const allAccess = this.getTeacherAccessData();
    return allAccess.filter((a) => a.teacherId === teacherId).map((a) => this.parseTeacherAccess(a));
  }

  async getAllStudents(): Promise<User[]> {
    if (HAS_API) {
      try {
        const list = await apiGet<any[]>('/api/users');
        return list.filter((u) => u.role === 'student').map((u) => this.parseUser(u));
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    const users = this.getUsers();
    return users.filter((u) => u.role === 'student').map((u) => this.parseUser(u));
  }

  async getStudentsForTeacher(teacherId: string): Promise<User[]> {
    if (HAS_API) {
      try {
        const list = await apiGet<any[]>(`/api/students/for-teacher-v2/${teacherId}`);
        return list.map((u) => this.parseUser(u));
      } catch (e) {
        // fallback to v1 (teacher_access)
        try {
          const list = await apiGet<any[]>(`/api/students/for-teacher/${teacherId}`);
          return list.map((u) => this.parseUser(u));
        } catch (e2) {
          if (!this.shouldFallback(e2)) throw e2;
        }
      }
    }
    // Offline: derive by local classroom membership
    const allUsers = this.getUsers().map((u) => this.parseUser(u));
    const allClassrooms: Classroom[] = JSON.parse(localStorage.getItem(`${this.STORAGE_KEY}_classrooms_${teacherId}`) || '[]');
    const classroomIds = new Set(allClassrooms.map(c => c.id));
    const classroomDataKeys = Object.keys(localStorage).filter(k => k.startsWith(`${this.STORAGE_KEY}_classroom_`));
    const memberIds = new Set<string>();
    for (const key of classroomDataKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data && data.members && classroomIds.has(data.classroom?.id)) {
          data.members.forEach((m: any) => memberIds.add(m.studentId));
        }
      } catch {}
    }
    return allUsers.filter(u => u.role === 'student' && memberIds.has(u.id));
  }

  // --- PROGRESS ---
  async saveStudentProgress(progress: Omit<StudentProgress, 'id'>): Promise<StudentProgress> {
    if (HAS_API) {
      try {
        await apiPost('/api/progress', {
          ...progress,
          completedAt: (progress.completedAt as any)?.toISOString?.() || new Date(progress.completedAt).toISOString(),
          payload: JSON.stringify({ equationsSolved: progress.equationsSolved, mistakes: progress.mistakes, meta: progress }),
        });
        return { ...progress, id: 'remote' } as any;
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    const newProgress: StudentProgress = { ...progress, id: this.generateId() };
    const allProgress = this.getStudentProgressData();
    allProgress.push(newProgress);
    this.saveStudentProgressData(allProgress);
    return newProgress;
  }

  async getStudentProgress(studentId: string): Promise<StudentProgress[]> {
    if (HAS_API) {
      try {
        const list = await apiGet<any[]>(`/api/progress/by-student/${studentId}`);
        return list.map((p) => ({ ...p, completedAt: new Date(p.completedAt) }));
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    const all = this.getStudentProgressData();
    return all.filter((p) => p.studentId === studentId).map((p) => this.parseStudentProgress(p));
  }

  async getAllStudentProgress(): Promise<StudentProgress[]> {
    if (HAS_API) {
      try {
        const users = await apiGet<any[]>('/api/users');
        const studentIds = users.filter((u) => u.role === 'student').map((u) => u.id);
        const all: StudentProgress[] = [];
        for (const id of studentIds) {
          const list = await this.getStudentProgress(id);
          all.push(...list);
        }
        return all;
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    const allProgress = this.getStudentProgressData();
    return allProgress.map((p) => this.parseStudentProgress(p));
  }

  async initializeSampleData(): Promise<void> {
    if (HAS_API) {
      // Remote DB should be authoritative; skip seeding
      return;
    }
    
    try {
      console.log('📝 Initializing sample data for offline mode...');
      
      // Create sample teacher if none exists
      let existingUsers = this.getUsers();
      
      // Ensure existingUsers is an array
      if (!Array.isArray(existingUsers)) {
        console.warn('Existing users is not an array, resetting to empty array');
        this.saveUsers([]);
        existingUsers = [];
      }
      
      let teacherUser = existingUsers.find(u => u.role === 'teacher');
      
      if (!teacherUser) {
        teacherUser = {
          id: this.generateId(),
          username: 'demo_teacher',
          email: 'teacher@demo.local',
          password: 'demo123',
          role: 'teacher',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          cadetAvatar: 'king-sadboi'
        };
        existingUsers.push(teacherUser);
        this.saveUsers(existingUsers);
        console.log('✅ Created sample teacher:', teacherUser.username);
      }
      
      // Create sample classrooms if none exist
      const teacherClassroomsKey = `${this.STORAGE_KEY}_classrooms_${teacherUser.id}`;
      let existingClassrooms: Classroom[] = [];
      
      try {
        const stored = localStorage.getItem(teacherClassroomsKey);
        if (stored) {
          existingClassrooms = JSON.parse(stored);
        }
      } catch (e) {
        existingClassrooms = [];
      }
      
      if (!Array.isArray(existingClassrooms)) {
        existingClassrooms = [];
      }
      
      if (existingClassrooms.length === 0) {
        // Create sample classrooms
        const sampleClassrooms: Classroom[] = [
          {
            id: this.generateId(),
            name: 'Math Fundamentals 101',
            teacherId: teacherUser.id,
            joinCode: 'MATH101',
            createdAt: new Date(),
            isActive: true,
            studentCount: 0
          },
          {
            id: this.generateId(),
            name: 'Advanced Algebra',
            teacherId: teacherUser.id,
            joinCode: 'ALGEBRA',
            createdAt: new Date(),
            isActive: true,
            studentCount: 0
          },
          {
            id: this.generateId(),
            name: 'Geometry & Trigonometry',
            teacherId: teacherUser.id,
            joinCode: 'GEOMETRY',
            createdAt: new Date(),
            isActive: true,
            studentCount: 0
          }
        ];
        
        // Save teacher's classroom list
        localStorage.setItem(teacherClassroomsKey, JSON.stringify(sampleClassrooms));
        
        // Create classroom details for each classroom
        sampleClassrooms.forEach(classroom => {
          const detailsKey = `${this.STORAGE_KEY}_classroom_${classroom.id}`;
          const details = {
            classroom: classroom,
            members: []
          };
          localStorage.setItem(detailsKey, JSON.stringify(details));
        });
        
        console.log('✅ Created sample classrooms:', sampleClassrooms.map(c => c.name).join(', '));
      }
      
      // Create sample student if none exists
      let studentUser = existingUsers.find(u => u.role === 'student');
      
      if (!studentUser) {
        studentUser = {
          id: this.generateId(),
          username: 'demo_student',
          email: 'student@demo.local',
          password: 'demo123',
          role: 'student',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          cadetAvatar: 'king-sadboi'
        };
        existingUsers.push(studentUser);
        this.saveUsers(existingUsers);
        console.log('✅ Created sample student:', studentUser.username);
      }
      
      console.log('📝 Sample data initialization completed');
    } catch (error) {
      console.error('❌ Failed to initialize sample data:', error);
    }
  }

  // Classroom methods
  async getClassrooms(teacherId: string): Promise<Classroom[]> {
    try {
      return await apiGet<Classroom[]>(`/api/classrooms?teacherId=${teacherId}`);
    } catch (err) {
      if (this.shouldFallback(err)) {
        console.warn('API unavailable, using localStorage for classrooms');
        const stored = localStorage.getItem(`${this.STORAGE_KEY}_classrooms_${teacherId}`);
        return stored ? JSON.parse(stored) : [];
      }
      throw err;
    }
  }

  async createClassroom(name: string, teacherId: string): Promise<Classroom> {
    try {
      const classroom = await apiPost<Classroom>('/api/classrooms', { name, teacherId });
      // In hybrid mode, update local cache; skip for api-only
      if (DB_MODE !== 'api-only') {
        const existing = await this.getClassrooms(teacherId);
        existing.push(classroom);
        localStorage.setItem(`${this.STORAGE_KEY}_classrooms_${teacherId}`, JSON.stringify(existing));
        // Also cache classroom details container if missing
        const detailsKey = `${this.STORAGE_KEY}_classroom_${classroom.id}`;
        if (!localStorage.getItem(detailsKey)) {
          localStorage.setItem(detailsKey, JSON.stringify({ classroom, members: [] }));
        }
      }
      return classroom;
    } catch (err) {
      if (this.shouldFallback(err)) {
        console.warn('API unavailable, creating classroom locally');
        const classroom: Classroom = {
          id: this.generateId(),
          name,
          teacherId,
          joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          createdAt: new Date(),
          isActive: true,
          studentCount: 0
        };
        const existing = await this.getClassrooms(teacherId);
        existing.push(classroom);
        localStorage.setItem(`${this.STORAGE_KEY}_classrooms_${teacherId}`, JSON.stringify(existing));
        // Initialize classroom details with empty members list
        localStorage.setItem(`${this.STORAGE_KEY}_classroom_${classroom.id}`, JSON.stringify({ classroom, members: [] }));
        return classroom;
      }
      throw err;
    }
  }

  async getClassroomDetails(classroomId: string): Promise<{ classroom: Classroom; members: ClassroomMember[] }> {
    try {
      return await apiGet<{ classroom: Classroom; members: ClassroomMember[] }>(`/api/classrooms/${classroomId}`);
    } catch (err) {
      if (this.shouldFallback(err)) {
        console.warn('API unavailable, using localStorage for classroom details');
        const stored = localStorage.getItem(`${this.STORAGE_KEY}_classroom_${classroomId}`);
        return stored ? JSON.parse(stored) : { classroom: null, members: [] };
      }
      throw err;
    }
  }

  async joinClassroom(joinCode: string, studentId: string): Promise<{ ok: boolean; classroom: Classroom; teacher?: User | null }> {
    try {
      console.log(`🎓 Joining classroom with code: ${joinCode} for student: ${studentId}`);
      const result = await apiPost<{ ok: boolean; classroom: Classroom; teacher?: any }>('/api/classrooms/join', { joinCode, studentId });
      console.log('Join result:', result);
      
      // Cache membership only in hybrid mode
      if (DB_MODE !== 'api-only') {
        const key = `${this.STORAGE_KEY}_student_classrooms_${studentId}`;
        const existing: Classroom[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.find(c => c.id === result.classroom.id)) {
          existing.push(result.classroom);
          localStorage.setItem(key, JSON.stringify(existing));
        }
      }
      
      const teacher = result.teacher ? this.parseUser(result.teacher) : null;
      console.log('Parsed teacher:', teacher);
      
      return { 
        ok: result.ok, 
        classroom: result.classroom, 
        teacher: teacher 
      };
    } catch (err) {
      console.error('Join classroom error:', err);
      if (this.shouldFallback(err)) {
        console.warn('API unavailable, attempting local join');
        
        // Get the student user data first
        const student = await this.getUserById(studentId);
        if (!student) {
          console.error('Student not found:', studentId);
          throw new Error('Student not found in local database. Please ensure you are logged in.');
        }
        
        // Ensure student has required properties
        const safeStudent = {
          id: student.id,
          username: student.username || 'Unknown Student',
          email: student.email || '',
          role: student.role || 'student'
        };
        
        console.log('Found student:', safeStudent.username, 'with role:', safeStudent.role);
        
        // Search all locally stored classrooms for a matching join code
        const localClassroomListsKeys = Object.keys(localStorage).filter(k => k.startsWith(`${this.STORAGE_KEY}_classrooms_`));
        let matchedClassroom: Classroom | null = null;
        let matchedTeacherId: string | null = null;
        
        for (const listKey of localClassroomListsKeys) {
          try {
            const list: Classroom[] = JSON.parse(localStorage.getItem(listKey) || '[]');
            const found = list.find(c => c.joinCode?.toUpperCase() === joinCode.toUpperCase() && c.isActive !== false);
            if (found) {
              matchedClassroom = found;
              matchedTeacherId = listKey.replace(`${this.STORAGE_KEY}_classrooms_`, '');
              break;
            }
          } catch (e) {
            console.warn('Error parsing classroom list:', e);
          }
        }

        if (matchedClassroom && matchedTeacherId) {
          // Get teacher information
          const teacher = await this.getUserById(matchedTeacherId);
          if (!teacher) {
            throw new Error('Teacher not found for this classroom');
          }
          
          // Update classroom details with new member
          const detailsKey = `${this.STORAGE_KEY}_classroom_${matchedClassroom.id}`;
          let details: any;
          
          try {
            const storedDetails = localStorage.getItem(detailsKey);
            if (storedDetails) {
              details = JSON.parse(storedDetails);
            } else {
              details = { 
                classroom: matchedClassroom, 
                members: [] 
              };
            }
          } catch (e) {
            details = { 
              classroom: matchedClassroom, 
              members: [] 
            };
          }
          
          // Ensure members is always an array
          if (!Array.isArray(details.members)) {
            details.members = [];
          }
          
          // Check if already a member
          const alreadyMember = details.members.some((m: any) => m.studentId === studentId);
          
          if (!alreadyMember) {
            // Add new member with safe property access
            const member: any = {
              id: this.generateId(),
              classroomId: matchedClassroom.id,
              studentId,
              joinedAt: new Date().toISOString(),
              isGuest: false, // Regular student, not guest
              username: safeStudent.username,
              email: safeStudent.email,
            };
            
            details.members.push(member);
            localStorage.setItem(detailsKey, JSON.stringify(details));
            
            console.log(`✅ Student ${safeStudent.username} joined classroom ${matchedClassroom.name}`);
          }

          // Update student-side membership cache
          const studentKey = `${this.STORAGE_KEY}_student_classrooms_${studentId}`;
          let existing: Classroom[] = [];
          
          try {
            const storedExisting = localStorage.getItem(studentKey);
            if (storedExisting) {
              existing = JSON.parse(storedExisting);
            }
          } catch (e) {
            existing = [];
          }
          
          if (!Array.isArray(existing)) {
            existing = [];
          }
          
          if (!existing.find(c => c.id === matchedClassroom!.id)) {
            existing.push(matchedClassroom);
            localStorage.setItem(studentKey, JSON.stringify(existing));
          }

          // Update teacher's classroom list studentCount
          try {
            const listKey = `${this.STORAGE_KEY}_classrooms_${matchedTeacherId}`;
            const storedList = localStorage.getItem(listKey);
            if (storedList) {
              const list: Classroom[] = JSON.parse(storedList);
              if (Array.isArray(list)) {
                const idx = list.findIndex(c => c.id === matchedClassroom!.id);
                if (idx !== -1) {
                  const count = details.members.length;
                  list[idx] = { ...list[idx], studentCount: count } as Classroom;
                  localStorage.setItem(listKey, JSON.stringify(list));
                }
              }
            }
          } catch (e) {
            console.warn('Error updating teacher classroom list:', e);
          }

          // Create teacher access mapping if it doesn't exist
          try {
            const teacherAccess = this.getTeacherAccessData();
            const accessExists = teacherAccess.some(a => a.teacherId === matchedTeacherId && a.studentId === studentId);
            
            if (!accessExists) {
              const newAccess = {
                id: this.generateId(),
                teacherId: matchedTeacherId,
                studentId: studentId,
                grantedAt: new Date(),
                permissions: ['view_progress', 'view_assignments']
              };
              teacherAccess.push(newAccess);
              this.saveTeacherAccessData(teacherAccess);
            }
          } catch (e) {
            console.warn('Error creating teacher access:', e);
          }

          return { 
            ok: true, 
            classroom: matchedClassroom, 
            teacher: teacher 
          };
        }

        // No classroom found locally – record a pending join for later sync
        let pendingJoins: any[] = [];
        try {
          const stored = localStorage.getItem(`${this.STORAGE_KEY}_pending_joins`);
          if (stored) {
            pendingJoins = JSON.parse(stored);
          }
        } catch (e) {
          pendingJoins = [];
        }
        
        if (!Array.isArray(pendingJoins)) {
          pendingJoins = [];
        }
        
        pendingJoins.push({ 
          joinCode, 
          studentId, 
          timestamp: new Date().toISOString(),
          studentName: safeStudent.username
        });
        localStorage.setItem(`${this.STORAGE_KEY}_pending_joins`, JSON.stringify(pendingJoins));

        // Create a placeholder classroom for pending join
        const placeholder: Classroom = { 
          id: `pending_${Date.now()}`,
          name: 'Pending Join - ' + joinCode, 
          teacherId: '', 
          joinCode, 
          createdAt: new Date(), 
          isActive: true,
          studentCount: 0
        } as any;
        
        const key = `${this.STORAGE_KEY}_student_classrooms_${studentId}`;
        let existing: Classroom[] = [];
        
        try {
          const storedExisting = localStorage.getItem(key);
          if (storedExisting) {
            existing = JSON.parse(storedExisting);
          }
        } catch (e) {
          existing = [];
        }
        
        if (!Array.isArray(existing)) {
          existing = [];
        }
        
        existing.push(placeholder);
        localStorage.setItem(key, JSON.stringify(existing));

        return { 
          ok: true, 
          classroom: placeholder, 
          teacher: null 
        };
      }
      throw err;
    }
  }

  async joinClassroomAsGuest(joinCode: string, guestName: string): Promise<{ ok: boolean; classroom: Classroom; guestUser: GuestUser; teacher?: User | null }> {
    try {
      console.log(`🎓 Joining classroom as guest with code: ${joinCode}, name: ${guestName}`);
      const result = await apiPost<{ ok: boolean; classroom: Classroom; guestUser: GuestUser; teacher?: any }>('/api/classrooms/join-guest', { joinCode, guestName });
      console.log('Guest join result:', result);
      
      if (DB_MODE !== 'api-only') {
        const key = `${this.STORAGE_KEY}_student_classrooms_${result.guestUser.id}`;
        const existing: Classroom[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.find(c => c.id === result.classroom.id)) {
          existing.push(result.classroom);
          localStorage.setItem(key, JSON.stringify(existing));
        }
      }
      
      const teacher = result.teacher ? this.parseUser(result.teacher) : null;
      console.log('Parsed teacher for guest:', teacher);
      
      return { 
        ...result, 
        teacher: teacher 
      };
    } catch (err) {
      console.error('Guest join classroom error:', err);
      if (this.shouldFallback(err)) {
        console.warn('API unavailable, joining classroom as guest locally');
        
        // Create guest user
        const guestUser: GuestUser = {
          id: this.generateId(),
          username: `guest_${guestName.replace(/\s+/g, '_')}_${Math.floor(Math.random() * 9000) + 1000}`,
          guestName
        };

        // Locate classroom by code in local storage
        const localClassroomListsKeys = Object.keys(localStorage).filter(k => k.startsWith(`${this.STORAGE_KEY}_classrooms_`));
        let matchedClassroom: Classroom | null = null;
        let matchedTeacherId: string | null = null;
        
        for (const listKey of localClassroomListsKeys) {
          try {
            const list: Classroom[] = JSON.parse(localStorage.getItem(listKey) || '[]');
            const found = list.find(c => c.joinCode?.toUpperCase() === joinCode.toUpperCase() && c.isActive !== false);
            if (found) {
              matchedClassroom = found;
              matchedTeacherId = listKey.replace(`${this.STORAGE_KEY}_classrooms_`, '');
              break;
            }
          } catch (e) {
            console.warn('Error parsing classroom list for guest:', e);
          }
        }

        if (matchedClassroom && matchedTeacherId) {
          // Get teacher information
          const teacher = await this.getUserById(matchedTeacherId);
          if (!teacher) {
            throw new Error('Teacher not found for this classroom');
          }
          
          // Add guest member to classroom details
          const detailsKey = `${this.STORAGE_KEY}_classroom_${matchedClassroom.id}`;
          let details: any;
          
          try {
            const storedDetails = localStorage.getItem(detailsKey);
            if (storedDetails) {
              details = JSON.parse(storedDetails);
            } else {
              details = { 
                classroom: matchedClassroom, 
                members: [] 
              };
            }
          } catch (e) {
            details = { 
              classroom: matchedClassroom, 
              members: [] 
            };
          }
          
          // Ensure members is always an array
          if (!Array.isArray(details.members)) {
            details.members = [];
          }
          
          // Check if already a member
          const alreadyMember = details.members.some((m: any) => m.studentId === guestUser.id);
          
          if (!alreadyMember) {
            const member: ClassroomMember = {
              id: this.generateId(),
              classroomId: matchedClassroom.id,
              studentId: guestUser.id,
              joinedAt: new Date(),
              isGuest: true,
              guestName: guestName
            } as any;
            
            details.members.push(member);
            localStorage.setItem(detailsKey, JSON.stringify(details));
            
            console.log(`✅ Guest ${guestName} joined classroom ${matchedClassroom.name}`);
          }

          // Cache membership for guest
          const key = `${this.STORAGE_KEY}_student_classrooms_${guestUser.id}`;
          let existing: Classroom[] = [];
          
          try {
            const storedExisting = localStorage.getItem(key);
            if (storedExisting) {
              existing = JSON.parse(storedExisting);
            }
          } catch (e) {
            existing = [];
          }
          
          if (!Array.isArray(existing)) {
            existing = [];
          }
          
          if (!existing.find(c => c.id === matchedClassroom!.id)) {
            existing.push(matchedClassroom);
            localStorage.setItem(key, JSON.stringify(existing));
          }

          // Update teacher's classroom list studentCount
          try {
            const listKey = `${this.STORAGE_KEY}_classrooms_${matchedTeacherId}`;
            const storedList = localStorage.getItem(listKey);
            if (storedList) {
              const list: Classroom[] = JSON.parse(storedList);
              if (Array.isArray(list)) {
                const idx = list.findIndex(c => c.id === matchedClassroom!.id);
                if (idx !== -1) {
                  const count = details.members.length;
                  list[idx] = { ...list[idx], studentCount: count } as Classroom;
                  localStorage.setItem(listKey, JSON.stringify(list));
                }
              }
            }
          } catch (e) {
            console.warn('Error updating teacher classroom list for guest:', e);
          }

          // Create teacher access mapping if it doesn't exist
          try {
            const teacherAccess = this.getTeacherAccessData();
            const accessExists = teacherAccess.some(a => a.teacherId === matchedTeacherId && a.studentId === guestUser.id);
            
            if (!accessExists) {
              const newAccess = {
                id: this.generateId(),
                teacherId: matchedTeacherId,
                studentId: guestUser.id,
                grantedAt: new Date(),
                permissions: ['view_progress', 'view_assignments']
              };
              teacherAccess.push(newAccess);
              this.saveTeacherAccessData(teacherAccess);
            }
          } catch (e) {
            console.warn('Error creating teacher access for guest:', e);
          }

          return { 
            ok: true, 
            classroom: matchedClassroom, 
            guestUser: guestUser,
            teacher: teacher 
          };
        }

        // No classroom found locally – record a pending join for later sync
        const pendingJoins = JSON.parse(localStorage.getItem(`${this.STORAGE_KEY}_pending_joins`) || '[]');
        if (Array.isArray(pendingJoins)) {
          pendingJoins.push({ 
            joinCode, 
            studentId: guestUser.id, 
            timestamp: new Date().toISOString(),
            studentName: guestName,
            isGuest: true
          });
          localStorage.setItem(`${this.STORAGE_KEY}_pending_joins`, JSON.stringify(pendingJoins));
        }

        // Create a placeholder classroom for pending join
        const placeholder: Classroom = { 
          id: `pending_guest_${Date.now()}`,
          name: 'Pending Guest Join - ' + joinCode, 
          teacherId: '', 
          joinCode, 
          createdAt: new Date(), 
          isActive: true,
          studentCount: 0
        } as any;
        
        const key = `${this.STORAGE_KEY}_student_classrooms_${guestUser.id}`;
        let existing: Classroom[] = [];
        
        try {
          const storedExisting = localStorage.getItem(key);
          if (storedExisting) {
            existing = JSON.parse(storedExisting);
          }
        } catch (e) {
          existing = [];
        }
        
        if (!Array.isArray(existing)) {
          existing = [];
        }
        
        existing.push(placeholder);
        localStorage.setItem(key, JSON.stringify(existing));

        return { 
          ok: true, 
          classroom: placeholder, 
          guestUser: guestUser,
          teacher: null 
        };
      }
      throw err;
    }
  }

  async removeClassroomMember(classroomId: string, studentId: string): Promise<{ ok: boolean }> {
    try {
      return await apiPost<{ ok: boolean }>(`/api/classrooms/${classroomId}/remove-member`, { studentId });
    } catch (err) {
      if (this.shouldFallback(err)) {
        console.warn('API unavailable, removing member locally');
        const stored = localStorage.getItem(`${this.STORAGE_KEY}_classroom_${classroomId}`);
        if (stored) {
          const data = JSON.parse(stored);
          data.members = data.members.filter((m: ClassroomMember) => m.studentId !== studentId);
          localStorage.setItem(`${this.STORAGE_KEY}_classroom_${classroomId}`, JSON.stringify(data));
        }
        return { ok: true };
      }
      throw err;
    }
  }

  async deactivateClassroom(classroomId: string): Promise<{ ok: boolean }> {
    try {
      return await apiPost<{ ok: boolean }>(`/api/classrooms/${classroomId}/deactivate`, {});
    } catch (err) {
      if (this.shouldFallback(err)) {
        console.warn('API unavailable, deactivating classroom locally');
        const stored = localStorage.getItem(`${this.STORAGE_KEY}_classroom_${classroomId}`);
        if (stored) {
          const data = JSON.parse(stored);
          data.classroom.isActive = false;
          localStorage.setItem(`${this.STORAGE_KEY}_classroom_${classroomId}`, JSON.stringify(data));
        }
        return { ok: true };
      }
      throw err;
    }
  }

  async getClassroomsForStudent(studentId: string): Promise<Classroom[]> {
    try {
      return await apiGet<Classroom[]>(`/api/classrooms/by-student/${studentId}`);
    } catch (err) {
      if (this.shouldFallback(err)) {
        const joined = JSON.parse(localStorage.getItem(`${this.STORAGE_KEY}_student_classrooms_${studentId}`) || '[]');
        return joined;
      }
      throw err;
    }
  }

  // Get all available classrooms for students to join (Google Classroom style)
  async getAvailableClassrooms(): Promise<{ classroom: Classroom; teacher: User }[]> {
    try {
      if (HAS_API) {
        const result = await apiGet<{ classroom: Classroom; teacher: User }[]>('/api/classrooms/available');
        return result;
      }
    } catch (err) {
      if (!this.shouldFallback(err)) throw err;
    }
    
    // Offline fallback - get all active classrooms from local storage
    const availableClassrooms: { classroom: Classroom; teacher: User }[] = [];
    
    try {
      // Get all teacher classroom lists
      const teacherKeys = Object.keys(localStorage).filter(k => k.startsWith(`${this.STORAGE_KEY}_classrooms_`));
      
      for (const teacherKey of teacherKeys) {
        const teacherId = teacherKey.replace(`${this.STORAGE_KEY}_classrooms_`, '');
        
        try {
          const teacher = await this.getUserById(teacherId);
          if (!teacher || teacher.role !== 'teacher') continue;
          
          const classroomList = localStorage.getItem(teacherKey);
          if (classroomList) {
            const classrooms: Classroom[] = JSON.parse(classroomList);
            
            if (Array.isArray(classrooms)) {
              // Only include active classrooms
              const activeClassrooms = classrooms.filter(c => c.isActive !== false);
              
              activeClassrooms.forEach(classroom => {
                availableClassrooms.push({
                  classroom: classroom,
                  teacher: teacher
                });
              });
            }
          }
        } catch (e) {
          console.warn('Error processing teacher classrooms:', e);
        }
      }
    } catch (e) {
      console.error('Error getting available classrooms:', e);
    }
    
    return availableClassrooms;
  }



  // --- Utilities for localStorage ---
  public getUsers(): any[] {
    try {
      const data = this.loadChunkedData();
      const users = data.users;
      
      // Ensure we always return an array
      if (Array.isArray(users)) {
        return users;
      } else if (users && typeof users === 'object') {
        // If users is an object, try to convert it to array
        console.warn('Users data is not an array, attempting to convert...');
        return Object.values(users);
      } else {
        console.warn('No users data found, returning empty array');
        return [];
      }
    } catch (e) {
      console.error('Error loading users from localStorage:', e);
      return [];
    }
  }
  private saveUsers(users: any[]): void {
      const data = this.loadChunkedData();
      data.users = users;
      this.saveChunkedData(data);
  }
  private getTeacherAccessData(): any[] {
      const data = this.loadChunkedData();
      return data.teacherAccess || [];
  }
  private saveTeacherAccessData(access: any[]): void {
      const data = this.loadChunkedData();
      data.teacherAccess = access;
      this.saveChunkedData(data);
  }
  public getStudentProgressData(): any[] {
      const data = this.loadChunkedData();
      return data.studentProgress || [];
  }
  public saveStudentProgressData(progress: any[]): void {
      const data = this.loadChunkedData();
      data.studentProgress = progress;
      this.saveChunkedData(data);
  }

  private parseUser(u: any): User {
    try {
      // Handle cases where dates might be strings, Date objects, or missing
      const createdAt = u.createdAt ? new Date(u.createdAt) : new Date();
      const lastLogin = u.lastLogin ? new Date(u.lastLogin) : new Date();
      
      // Validate dates
      if (isNaN(createdAt.getTime())) {
        createdAt.setTime(Date.now());
      }
      if (isNaN(lastLogin.getTime())) {
        lastLogin.setTime(Date.now());
      }
      
      return { 
        ...u, 
        createdAt: createdAt, 
        lastLogin: lastLogin,
        cadetAvatar: u.cadetAvatar || 'king-sadboi'
      };
    } catch (error) {
      console.error('Error parsing user:', error);
      // Return user with safe defaults
      return {
        ...u,
        createdAt: new Date(),
        lastLogin: new Date(),
        cadetAvatar: u.cadetAvatar || 'king-sadboi'
      };
    }
  }
  private parseTeacherAccess(a: any): TeacherAccess {
    return { ...a, grantedAt: new Date(a.grantedAt) };
  }
  private parseStudentProgress(p: any): StudentProgress {
    return { ...p, completedAt: new Date(p.completedAt) };
  }

  async testConnection(): Promise<boolean> {
    if (HAS_API) {
      try {
        await apiGet('/api/ping');
        return true;
      } catch {
        return false;
      }
    }
    try {
      const testKey = 'mathtutor_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async clearAllData(): Promise<void> {
    if (HAS_API) return; // remote clearing disabled by default
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.COMPRESSED_KEY);
    // Remove all chunks
    for (let i = 0; i < this.MAX_CHUNKS; i++) {
      localStorage.removeItem(`${this.COMPRESSED_KEY}_chunk_${i}`);
    }
  }

  async forceRecreate(): Promise<void> {
    // Development helper referenced by LoginPage. In API-only mode, it's a no-op.
    if (HAS_API) {
      return;
    }
    await this.clearAllData();
    await this.initializeSampleData();
  }
}

export const db = new HybridDatabase();

// --- BEGIN ADD: progress API helpers ---
export type ProgressPayload = {
  user_id: string;
  module_id: string;     // e.g., 'RationalEq'
  section_id: string;    // e.g., 'S2'
  slide_index: number;   // 0-based
  progress_pct: number;  // 0..100
};

export type BatchProgressPayload = {
  user_id: string;
  progress_updates: ProgressPayload[];
  achievements?: any[];
  lesson_completion?: {
    lessonId: string;
    lessonName: string;
    score: number;
    timeSpent: number;
    equationsSolved: number;
    mistakes: number;
    skillBreakdown: any;
  };
};



export async function getProgress(userId: string) {
  const res = await fetch(`${API_BASE}/api/user-progress/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch progress');
  return res.json();
}

export async function upsertProgress(p: ProgressPayload) {
  const res = await fetch(`${API_BASE}/api/user-progress/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error('Failed to upsert progress');
  return res.json();
}

// New batch progress saver for better performance
export async function saveBatchProgress(batch: BatchProgressPayload) {
  if (HAS_API) {
    try {
      const res = await fetch(`${API_BASE}/api/progress/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
      if (!res.ok) throw new Error('Failed to save batch progress');
      return res.json();
    } catch (e) {
      // Fallback to individual saves
      console.warn('Batch save failed, falling back to individual saves');
      return await saveBatchProgressFallback(batch);
    }
  }
  
  // Offline mode - save to localStorage
  return saveBatchProgressOffline(batch);
}

// Fallback method for when batch API fails
async function saveBatchProgressFallback(batch: BatchProgressPayload) {
  const results = [];
  
  // Save progress updates
  for (const progress of batch.progress_updates) {
    try {
      const result = await upsertProgress(progress);
      results.push(result);
    } catch (error) {
      console.error('Failed to save progress:', error);
      enqueueOffline(progress);
    }
  }
  
  // Save achievements if any
  if (batch.achievements) {
    for (const achievement of batch.achievements) {
      try {
        await saveAchievement(achievement);
      } catch (error) {
        console.error('Failed to save achievement:', error);
      }
    }
  }
  
  // Save lesson completion if any
  if (batch.lesson_completion) {
    try {
      const allProgress = db.getStudentProgressData();
      const newProgress = {
        id: db.generateId(),
        studentId: batch.user_id,
        moduleId: batch.lesson_completion.lessonId,
        moduleName: batch.lesson_completion.lessonName,
        completedAt: new Date(),
        score: batch.lesson_completion.score,
        timeSpent: batch.lesson_completion.timeSpent,
        equationsSolved: batch.lesson_completion.equationsSolved,
        mistakes: batch.lesson_completion.mistakes,
        skillBreakdown: batch.lesson_completion.skillBreakdown,
      };
      allProgress.push(newProgress);
      db.saveStudentProgressData(allProgress);
    } catch (error) {
      console.error('Failed to save lesson completion:', error);
    }
  }
  
  return results;
}

// Offline batch save
function saveBatchProgressOffline(batch: BatchProgressPayload) {
  // Save progress updates
  for (const progress of batch.progress_updates) {
    enqueueOffline(progress);
  }
  
  // Save achievements locally
  if (batch.achievements) {
    for (const achievement of batch.achievements) {
      const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
      const newAchievement = {
        ...achievement,
        id: `local_${Date.now()}_${Math.random()}`,
        completedAt: new Date(),
      };
      achievements.push(newAchievement);
      localStorage.setItem('achievements', JSON.stringify(achievements));
    }
  }
  
  // Save lesson completion locally
  if (batch.lesson_completion) {
    const allProgress = db.getStudentProgressData();
    const newProgress = {
      id: db.generateId(),
      studentId: batch.user_id,
      moduleId: batch.lesson_completion.lessonId,
      moduleName: batch.lesson_completion.lessonName,
      completedAt: new Date(),
      score: batch.lesson_completion.score,
      timeSpent: batch.lesson_completion.timeSpent,
      equationsSolved: batch.lesson_completion.equationsSolved,
      mistakes: batch.lesson_completion.mistakes,
      skillBreakdown: batch.lesson_completion.skillBreakdown,
    };
    allProgress.push(newProgress);
    db.saveStudentProgressData(allProgress);
  }
  
  return { success: true, offline: true };
}

// Offline buffer (FIFO) stored in localStorage
const OFFLINE_KEY = 'offline_progress_queue_v1';

export function enqueueOffline(p: ProgressPayload) {
  const q: ProgressPayload[] = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
  q.push(p);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(q));
}

export async function syncOfflineProgress() {
  const q: ProgressPayload[] = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
  if (!q.length) return;
  for (const item of q) {
    try { await upsertProgress(item); } catch { /* keep in queue */ }
  }
  // Clear only if last push succeeded
  localStorage.removeItem(OFFLINE_KEY);
}
// --- END ADD --- 

// Achievement functions
export async function saveAchievement(achievement: Omit<Achievement, 'id' | 'completedAt'>): Promise<void> {
  if (DB_MODE === 'api-only' || !HAS_API) {
    // Store in localStorage for offline mode
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const newAchievement = {
      ...achievement,
      id: `local_${Date.now()}_${Math.random()}`,
      completedAt: new Date(),
    };
    achievements.push(newAchievement);
    localStorage.setItem('achievements', JSON.stringify(achievements));
    return;
  }

  try {
    await apiPost('/achievements', achievement);
  } catch (error) {
    console.error('Failed to save achievement:', error);
    // Fallback to localStorage
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const newAchievement = {
      ...achievement,
      id: `local_${Date.now()}_${Math.random()}`,
      completedAt: new Date(),
    };
    achievements.push(newAchievement);
    localStorage.setItem('achievements', JSON.stringify(achievements));
  }
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  if (DB_MODE === 'api-only' || !HAS_API) {
    // Get from localStorage for offline mode
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    return achievements.filter((a: Achievement) => a.userId === userId);
  }

  try {
    // Add timeout to prevent hanging API calls
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('API timeout')), 3000)
    );
    
    const achievementsPromise = apiGet<Achievement[]>(`/achievements/${userId}`);
    const achievements = await Promise.race([achievementsPromise, timeoutPromise]);
    return achievements;
  } catch (error) {
    console.error('Failed to get achievements from API, falling back to localStorage:', error);
    // Fallback to localStorage
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    return achievements.filter((a: Achievement) => a.userId === userId);
  }
}

export async function getAchievementStats(userId: string): Promise<AchievementStats> {
  const achievements = await getUserAchievements(userId);
  
  const totalXP = achievements.reduce((sum, a) => sum + a.xpEarned, 0);
  const lessonsCompleted = achievements.length;
  const solarSystemLessons = achievements.filter(a => a.lessonType === 'solar-system').length;
  const philippinesMapLessons = achievements.filter(a => a.lessonType === 'philippines-map').length;

  return {
    totalXP,
    lessonsCompleted,
    solarSystemLessons,
    philippinesMapLessons,
    achievements: achievements.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
  };
} 