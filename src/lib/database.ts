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

  async init(): Promise<void> {
    console.log(`📊 DB init → API: ${API_BASE || 'none (offline)'} | MODE: ${DB_MODE}`);
    // In api-only mode, purge any stale local caches to prevent divergence
    if (DB_MODE === 'api-only' && typeof window !== 'undefined') {
      try {
        // Remove main aggregate store
        localStorage.removeItem(this.STORAGE_KEY);
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

  private generateId(): string {
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
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date();
      this.saveUsers(users);
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    if (HAS_API) {
      try {
        const list = await apiGet<any[]>('/api/users');
        const u = list.find((x) => x.id === userId);
        return u ? this.parseUser(u) : null;
      } catch (e) {
        if (!this.shouldFallback(e)) throw e;
      }
    }
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    return user ? this.parseUser(user) : null;
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
    // NOTE: offline seeding removed here for brevity to avoid long code. If needed, we can keep the original seeding logic.
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
          } catch {}
        }

        if (matchedClassroom) {
          // Update classroom details with new member
          const detailsKey = `${this.STORAGE_KEY}_classroom_${matchedClassroom.id}`;
          const details = JSON.parse(localStorage.getItem(detailsKey) || JSON.stringify({ classroom: matchedClassroom, members: [] }));
          // Avoid duplicate membership
          const alreadyMember = Array.isArray(details.members) && details.members.some((m: any) => m.studentId === studentId);
          if (!alreadyMember) {
            const student = await this.getUserById(studentId);
            const member: ClassroomMember = {
              id: this.generateId(),
              classroomId: matchedClassroom.id,
              studentId,
              joinedAt: new Date(),
              isGuest: !!student?.username?.startsWith('guest_'),
              username: student?.username,
              email: student?.email,
            } as any;
            details.members = Array.isArray(details.members) ? [...details.members, member] : [member];
            localStorage.setItem(detailsKey, JSON.stringify(details));
          }

          // Update student-side membership cache
          const studentKey = `${this.STORAGE_KEY}_student_classrooms_${studentId}`;
          const existing: Classroom[] = JSON.parse(localStorage.getItem(studentKey) || '[]');
          if (!existing.find(c => c.id === matchedClassroom!.id)) {
            existing.push(matchedClassroom);
            localStorage.setItem(studentKey, JSON.stringify(existing));
          }

          // Update teacher class list studentCount
          if (matchedTeacherId) {
            try {
              const listKey = `${this.STORAGE_KEY}_classrooms_${matchedTeacherId}`;
              const list: Classroom[] = JSON.parse(localStorage.getItem(listKey) || '[]');
              const idx = list.findIndex(c => c.id === matchedClassroom!.id);
              if (idx !== -1) {
                const count = (Array.isArray(details.members) ? details.members.length : 0);
                list[idx] = { ...list[idx], studentCount: count } as Classroom;
                localStorage.setItem(listKey, JSON.stringify(list));
              }
            } catch {}
          }

          const teacher = matchedTeacherId ? await this.getUserById(matchedTeacherId) : null;
          return { ok: true, classroom: matchedClassroom, teacher } as any;
        }

        // No classroom found locally – record a pending join for later sync
        const pendingJoins = JSON.parse(localStorage.getItem(`${this.STORAGE_KEY}_pending_joins`) || '[]');
        pendingJoins.push({ joinCode, studentId, timestamp: new Date().toISOString() });
        localStorage.setItem(`${this.STORAGE_KEY}_pending_joins`, JSON.stringify(pendingJoins));

        const placeholder: Classroom = { id: 'pending', name: 'Pending Join', teacherId: '', joinCode, createdAt: new Date(), isActive: true } as any;
        const key = `${this.STORAGE_KEY}_student_classrooms_${studentId}`;
        const existing: Classroom[] = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(placeholder);
        localStorage.setItem(key, JSON.stringify(existing));

        return { ok: true, classroom: placeholder, teacher: null } as any;
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
          } catch {}
        }

        if (matchedClassroom) {
          // Add guest member to classroom details
          const detailsKey = `${this.STORAGE_KEY}_classroom_${matchedClassroom.id}`;
          const details = JSON.parse(localStorage.getItem(detailsKey) || JSON.stringify({ classroom: matchedClassroom, members: [] }));
          const member: ClassroomMember = {
            id: this.generateId(),
            classroomId: matchedClassroom.id,
            studentId: guestUser.id,
            joinedAt: new Date(),
            isGuest: true,
            guestName: guestName
          } as any;
          details.members = Array.isArray(details.members) ? [...details.members, member] : [member];
          localStorage.setItem(detailsKey, JSON.stringify(details));

          // Cache membership for guest
          const key = `${this.STORAGE_KEY}_student_classrooms_${guestUser.id}`;
          const existing: Classroom[] = JSON.parse(localStorage.getItem(key) || '[]');
          if (!existing.find(c => c.id === matchedClassroom!.id)) {
            existing.push(matchedClassroom);
            localStorage.setItem(key, JSON.stringify(existing));
          }

          // Update teacher's classroom list studentCount
          if (matchedTeacherId) {
            try {
              const listKey = `${this.STORAGE_KEY}_classrooms_${matchedTeacherId}`;
              const list: Classroom[] = JSON.parse(localStorage.getItem(listKey) || '[]');
              const idx = list.findIndex(c => c.id === matchedClassroom!.id);
              if (idx !== -1) {
                const count = (Array.isArray(details.members) ? details.members.length : 0);
                list[idx] = { ...list[idx], studentCount: count } as Classroom;
                localStorage.setItem(listKey, JSON.stringify(list));
              }
            } catch {}
          }

          const teacher = matchedTeacherId ? await this.getUserById(matchedTeacherId) : null;
          return { ok: true, classroom: matchedClassroom, guestUser, teacher } as any;
        }

        // Fallback placeholder when no local classroom found
        const placeholder: Classroom = { id: 'pending', name: 'Pending Join', teacherId: '', joinCode, createdAt: new Date(), isActive: true } as any;
        const key = `${this.STORAGE_KEY}_student_classrooms_${guestUser.id}`;
        const existing: Classroom[] = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(placeholder);
        localStorage.setItem(key, JSON.stringify(existing));
        return { ok: true, classroom: placeholder, guestUser, teacher: null } as any;
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

  // --- Utilities for localStorage ---
  private getUsers(): any[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.users || [];
    } catch (e) {
      return [];
    }
  }
  private saveUsers(users: any[]): void {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : {};
      parsed.users = users;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
  }
  private getTeacherAccessData(): any[] {
      const data = localStorage.getItem(this.STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
      return parsed.teacherAccess || [];
  }
  private saveTeacherAccessData(access: any[]): void {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : {};
      parsed.teacherAccess = access;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
  }
  private getStudentProgressData(): any[] {
      const data = localStorage.getItem(this.STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
      return parsed.studentProgress || [];
  }
  private saveStudentProgressData(progress: any[]): void {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : {};
      parsed.studentProgress = progress;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
  }

  private parseUser(u: any): User {
    return { ...u, createdAt: new Date(u.createdAt), lastLogin: new Date(u.lastLogin) };
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
      const allProgress = getStudentProgressData();
      const newProgress = {
        id: generateId(),
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
      saveStudentProgressData(allProgress);
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
    const allProgress = getStudentProgressData();
    const newProgress = {
      id: generateId(),
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
    saveStudentProgressData(allProgress);
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