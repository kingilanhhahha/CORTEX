import { db } from './database';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'legendary';
  status: 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered';
  xpReward: number;
  estimatedTime: string;
  category: string;
  prerequisites: string[];
  content: {
    theory: string;
    examples: string[];
    exercises: string[];
    solutions: string[];
  };
  position: { x: number; y: number };
  planetType: 'forest' | 'crystal' | 'volcanic' | 'ice' | 'desert' | 'nebula';
  connections: string[];
}

export interface LessonProgress {
  lessonId: string;
  studentId: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered';
  score?: number;
  timeSpent: number;
  completedAt?: Date;
  mistakes: string[];
  attempts: number;
  lastAttempt?: Date;
}

export class LessonManager {
  private static instance: LessonManager;
  private lessons: Lesson[] = [];

  private constructor() {
    this.initializeLessons();
  }

  public static getInstance(): LessonManager {
    if (!LessonManager.instance) {
      LessonManager.instance = new LessonManager();
    }
    return LessonManager.instance;
  }

  private initializeLessons(): void {
    this.lessons = [
      {
        id: 'intro-rational',
        title: 'Introduction to Rational Equations',
        description: 'Begin your journey in the Nebula of Numbers. Learn the fundamentals of rational equations.',
        difficulty: 'beginner',
        status: 'available',
        xpReward: 150,
        estimatedTime: '15 min',
        category: 'rational-equations',
        prerequisites: [],
        content: {
          theory: 'Rational equations are equations that contain rational expressions. A rational expression is a fraction where both the numerator and denominator are polynomials.',
          examples: [
            'x/(x+2) = 3',
            '(x+1)/(x-1) = 2',
            '1/x + 1/(x+1) = 1'
          ],
          exercises: [
            'Solve: x/(x+3) = 2',
            'Solve: (x-1)/(x+2) = 1/2',
            'Solve: 1/x + 1/(x+2) = 1/3'
          ],
          solutions: [
            'x = 6',
            'x = 4',
            'x = 3 or x = -2'
          ]
        },
        position: { x: 20, y: 60 },
        planetType: 'forest',
        connections: ['basic-solving']
      },
      {
        id: 'basic-solving',
        title: 'Solving Simple Rational Equations',
        description: 'Navigate the Crystal Caves of Calculation. Master basic solving techniques.',
        difficulty: 'beginner',
        status: 'locked',
        xpReward: 200,
        estimatedTime: '20 min',
        category: 'rational-equations',
        prerequisites: ['intro-rational'],
        content: {
          theory: 'To solve rational equations, we use cross-multiplication and then solve the resulting polynomial equation. Always check for extraneous solutions!',
          examples: [
            'x/(x+1) = 2 → x = 2(x+1) → x = 2x + 2 → -x = 2 → x = -2',
            '(x+2)/(x-1) = 3 → x+2 = 3(x-1) → x+2 = 3x-3 → -2x = -5 → x = 5/2'
          ],
          exercises: [
            'Solve: x/(x+4) = 3',
            'Solve: (x+3)/(x-2) = 2',
            'Solve: 2x/(x+1) = 1'
          ],
          solutions: [
            'x = -6',
            'x = 7',
            'x = 1'
          ]
        },
        position: { x: 40, y: 40 },
        planetType: 'crystal',
        connections: ['rational-inequalities']
      },
      {
        id: 'rational-inequalities',
        title: 'Rational Inequalities',
        description: 'Explore the Volcanic Plains of Variables. Understand inequality relationships.',
        difficulty: 'intermediate',
        status: 'locked',
        xpReward: 250,
        estimatedTime: '25 min',
        category: 'rational-inequalities',
        prerequisites: ['basic-solving'],
        content: {
          theory: 'Rational inequalities require finding critical points and testing intervals. The sign of a rational expression changes at zeros of the numerator and undefined points (zeros of the denominator).',
          examples: [
            'x/(x+2) > 0 → Critical points: x = 0, x = -2 → Solution: x < -2 or x > 0',
            '(x-1)/(x+3) ≤ 2 → Rewrite as (x-1)/(x+3) - 2 ≤ 0 → (-x-7)/(x+3) ≤ 0'
          ],
          exercises: [
            'Solve: x/(x-1) > 0',
            'Solve: (x+2)/(x-3) ≤ 1',
            'Solve: 1/x ≥ 2'
          ],
          solutions: [
            'x < 0 or x > 1',
            'x < 3 or x ≥ 5',
            '0 < x ≤ 1/2'
          ]
        },
        position: { x: 60, y: 30 },
        planetType: 'volcanic',
        connections: ['complex-equations', 'graphing-challenge']
      },
      {
        id: 'complex-equations',
        title: 'Complex Rational Equations',
        description: 'Venture into the Ice Moons of Infinity. Tackle advanced equation systems.',
        difficulty: 'advanced',
        status: 'locked',
        xpReward: 350,
        estimatedTime: '30 min',
        category: 'rational-equations',
        prerequisites: ['rational-inequalities'],
        content: {
          theory: 'Complex rational equations may have multiple fractions, require finding LCD, and often result in higher-degree polynomial equations. Always check for extraneous solutions!',
          examples: [
            '1/x + 1/(x+1) = 1 → LCD = x(x+1) → (x+1) + x = x(x+1) → 2x+1 = x²+x → x²-x-1 = 0',
            'x/(x+2) + 2/(x-1) = 3 → LCD = (x+2)(x-1) → x(x-1) + 2(x+2) = 3(x+2)(x-1)'
          ],
          exercises: [
            'Solve: 1/x + 1/(x+2) = 1/3',
            'Solve: x/(x+1) + 1/(x-1) = 2',
            'Solve: 2/(x+1) + 3/(x-2) = 1'
          ],
          solutions: [
            'x = 3 or x = -2',
            'x = 2',
            'x = 1 or x = 4'
          ]
        },
        position: { x: 80, y: 50 },
        planetType: 'ice',
        connections: ['mastery-challenge']
      },
      {
        id: 'graphing-challenge',
        title: 'Graphing Rational Functions',
        description: 'Journey through the Desert of Derivatives. Visualize function behaviors.',
        difficulty: 'intermediate',
        status: 'locked',
        xpReward: 300,
        estimatedTime: '25 min',
        category: 'graphing',
        prerequisites: ['rational-inequalities'],
        content: {
          theory: 'Rational functions have vertical asymptotes at zeros of the denominator, horizontal asymptotes based on degrees, and holes at common zeros of numerator and denominator.',
          examples: [
            'f(x) = (x+1)/(x-2) → Vertical asymptote: x = 2, Horizontal asymptote: y = 1',
            'f(x) = (x²-1)/(x-1) → Hole at x = 1, Simplified: f(x) = x+1 for x ≠ 1'
          ],
          exercises: [
            'Graph: f(x) = x/(x+3)',
            'Graph: f(x) = (x²-4)/(x-2)',
            'Graph: f(x) = (x+1)/(x²-1)'
          ],
          solutions: [
            'Vertical asymptote: x = -3, Horizontal asymptote: y = 1',
            'Hole at x = 2, Simplified: f(x) = x+2 for x ≠ 2',
            'Vertical asymptotes: x = 1, x = -1, Horizontal asymptote: y = 0'
          ]
        },
        position: { x: 45, y: 70 },
        planetType: 'desert',
        connections: ['mastery-challenge']
      },
      {
        id: 'mastery-challenge',
        title: 'The Nebula Nexus',
        description: 'Face the ultimate test in the Cosmic Convergence. Prove your mastery of all concepts.',
        difficulty: 'legendary',
        status: 'locked',
        xpReward: 500,
        estimatedTime: '45 min',
        category: 'mastery',
        prerequisites: ['complex-equations', 'graphing-challenge'],
        content: {
          theory: 'This is the ultimate challenge combining all concepts: solving complex rational equations, analyzing inequalities, and understanding graphical behavior.',
          examples: [
            'Solve and graph: (x²-4)/(x-2) > x+1',
            'Find all solutions: 1/x + 1/(x+1) + 1/(x+2) = 1',
            'Analyze: f(x) = (x³-1)/(x²-1)'
          ],
          exercises: [
            'Solve: (x+1)/(x-1) + (x-1)/(x+1) = 2',
            'Graph and solve: (x²-9)/(x-3) ≤ x+3',
            'Find domain and range: f(x) = (x²+1)/(x²-4)'
          ],
          solutions: [
            'x = 0',
            'x ≤ -3 or x = 3',
            'Domain: x ≠ ±2, Range: y ≥ 1/4'
          ]
        },
        position: { x: 75, y: 80 },
        planetType: 'nebula',
        connections: []
      }
    ];
  }

  public getAllLessons(): Lesson[] {
    return this.lessons;
  }

  public getLessonById(id: string): Lesson | undefined {
    return this.lessons.find(lesson => lesson.id === id);
  }

  public getLessonsByCategory(category: string): Lesson[] {
    return this.lessons.filter(lesson => lesson.category === category);
  }

  public getAvailableLessons(studentId: string): Promise<Lesson[]> {
    return this.getStudentProgress(studentId).then(progress => {
      return this.lessons.map(lesson => {
        const lessonProgress = progress.find(p => p.lessonId === lesson.id);
        const prerequisitesMet = this.checkPrerequisites(lesson, progress);
        
        let status: Lesson['status'] = 'locked';
        
        if (lessonProgress?.status === 'mastered') {
          status = 'mastered';
        } else if (lessonProgress?.status === 'completed') {
          status = 'completed';
        } else if (lessonProgress?.status === 'in-progress') {
          status = 'in-progress';
        } else if (prerequisitesMet) {
          status = 'available';
        }
        
        return { ...lesson, status };
      });
    });
  }

  private checkPrerequisites(lesson: Lesson, progress: LessonProgress[]): boolean {
    if (lesson.prerequisites.length === 0) return true;
    
    return lesson.prerequisites.every(prereqId => {
      const prereqProgress = progress.find(p => p.lessonId === prereqId);
      return prereqProgress?.status === 'completed' || prereqProgress?.status === 'mastered';
    });
  }

  public async getStudentProgress(studentId: string): Promise<LessonProgress[]> {
    try {
      const allProgress = await db.getAllStudentProgress();
      return allProgress.filter(progress => progress.studentId === studentId);
    } catch (error) {
      console.error('Error fetching student progress:', error);
      return [];
    }
  }

  public async updateLessonProgress(
    studentId: string, 
    lessonId: string, 
    status: LessonProgress['status'],
    score?: number,
    mistakes: string[] = []
  ): Promise<void> {
    try {
      const existingProgress = await this.getStudentProgress(studentId);
      const currentProgress = existingProgress.find(p => p.lessonId === lessonId);
      
      const updatedProgress: LessonProgress = {
        lessonId,
        studentId,
        status,
        score,
        timeSpent: currentProgress?.timeSpent || 0,
        completedAt: status === 'completed' || status === 'mastered' ? new Date() : currentProgress?.completedAt,
        mistakes: [...(currentProgress?.mistakes || []), ...mistakes],
        attempts: (currentProgress?.attempts || 0) + 1,
        lastAttempt: new Date()
      };

      // Update in database
      await db.saveStudentProgress({
        studentId,
        moduleId: lessonId,
        moduleName: this.getLessonById(lessonId)?.title || lessonId,
        completedAt: updatedProgress.completedAt,
        score: updatedProgress.score,
        timeSpent: updatedProgress.timeSpent,
        equationsSolved: [],
        mistakes: updatedProgress.mistakes,
        skillBreakdown: {
          restrictions: { correct: 1, total: 1 },
          lcdFinding: { correct: 1, total: 1 },
          solvingProcess: { correct: 1, total: 1 },
          extraneousSolutions: { correct: 1, total: 1 },
          factoring: { correct: 1, total: 1 },
          algebra: { correct: 1, total: 1 }
        }
      });

      console.log(`Progress updated for lesson ${lessonId}: ${status}`);
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  }

  public calculateXP(studentId: string): Promise<number> {
    return this.getStudentProgress(studentId).then(progress => {
      return progress.reduce((total, p) => {
        const lesson = this.getLessonById(p.lessonId);
        if (p.status === 'completed' || p.status === 'mastered') {
          return total + (lesson?.xpReward || 0);
        }
        return total;
      }, 0);
    });
  }

  public calculateLevel(xp: number): number {
    // Simple level calculation: every 100 XP = 1 level
    return Math.floor(xp / 100) + 1;
  }

  public getNextLesson(studentId: string): Promise<Lesson | null> {
    return this.getAvailableLessons(studentId).then(lessons => {
      const availableLesson = lessons.find(lesson => lesson.status === 'available');
      return availableLesson || null;
    });
  }

  public getRecommendedLesson(studentId: string): Promise<Lesson | null> {
    return this.getAvailableLessons(studentId).then(lessons => {
      // Find in-progress lesson first
      const inProgress = lessons.find(lesson => lesson.status === 'in-progress');
      if (inProgress) return inProgress;
      
      // Then find available lesson
      const available = lessons.find(lesson => lesson.status === 'available');
      if (available) return available;
      
      // Finally, find next locked lesson
      const locked = lessons.find(lesson => lesson.status === 'locked');
      return locked || null;
    });
  }
}

export const lessonManager = LessonManager.getInstance(); 