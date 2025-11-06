import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Target,
  ArrowLeft,
  Home,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Plus,
  Search,
  School
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db, User, StudentProgress } from '@/lib/database';
import ClassroomManager from '@/components/classroom/ClassroomManager';
import cosmicBackground from '@/assets/cosmic-background.png';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<User[]>([]);
  const [allProgress, setAllProgress] = useState<StudentProgress[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect to login if not authenticated or not a teacher
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'teacher')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Show loading state while AuthContext is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Teacher Dashboard...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadData = async () => {
      if (user?.role === 'teacher') {
        try {
          const teacherStudents = await db.getStudentsForTeacher(user.id);
          const progress = await db.getAllStudentProgress();
          console.log('Loaded progress data:', progress);
          setStudents(teacherStudents);
          setAllProgress(progress);
        } catch (error) {
          console.error('Failed to load teacher data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [user]);

  const reloadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const teacherStudents = await db.getStudentsForTeacher(user.id);
      const progress = await db.getAllStudentProgress();
      setStudents(teacherStudents);
      setAllProgress(progress);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentProgress = (studentId: string) => {
    return allProgress.filter(p => p.studentId === studentId);
  };

  const getAverageScore = (studentId: string) => {
    const progress = getStudentProgress(studentId);
    if (progress.length === 0) return 0;
    const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);
    return Math.round(totalScore / progress.length);
  };

  const getTotalTimeSpent = (studentId: string) => {
    const progress = getStudentProgress(studentId);
    return progress.reduce((sum, p) => sum + p.timeSpent, 0);
  };

  // Helper functions for detailed analysis
  const getOverallSkillMastery = (studentId: string) => {
    const progress = getStudentProgress(studentId);
    const skills = {
      'Restrictions': { correct: 0, total: 0 },
      'LCD Finding': { correct: 0, total: 0 },
      'Solving Process': { correct: 0, total: 0 },
      'Extraneous Solutions': { correct: 0, total: 0 },
      'Factoring': { correct: 0, total: 0 },
      'Algebra': { correct: 0, total: 0 }
    } as Record<string, { correct: number; total: number }>;

    const skillMapping: { [key: string]: string } = {
      'restrictions': 'Restrictions',
      'lcdFinding': 'LCD Finding',
      'solvingProcess': 'Solving Process',
      'extraneousSolutions': 'Extraneous Solutions',
      'factoring': 'Factoring',
      'algebra': 'Algebra'
    };

    // 1) Aggregate from structured skillBreakdown if present
    for (const p of progress) {
      const breakdown = (p as any).skillBreakdown as Record<string, { correct: number; total: number }> | undefined;
      if (breakdown) {
        for (const [k, v] of Object.entries(breakdown)) {
          const display = skillMapping[k];
          if (display && skills[display]) {
            skills[display].correct += Number(v?.correct || 0);
            skills[display].total += Number(v?.total || 0);
          }
        }
      }
    }

    // 2) Heuristic from mistakes text if no breakdown provided
    const hint = (text: string) => {
      const t = text.toLowerCase();
      if (t.includes('restriction') || t.includes('denominator')) return 'Restrictions';
      if (t.includes('lcd')) return 'LCD Finding';
      if (t.includes('extraneous')) return 'Extraneous Solutions';
      if (t.includes('factor')) return 'Factoring';
      if (t.includes('distribute') || t.includes('simplify') || t.includes('first step')) return 'Solving Process';
      return 'Algebra';
    };

    for (const p of progress) {
      if (Array.isArray(p.mistakes)) {
        for (const m of p.mistakes) {
          const bucket = hint(String(m));
          // treat mistakes as incorrect attempts; add to total to reflect exposure
          skills[bucket].total += 1;
        }
      }
      if (Array.isArray(p.equationsSolved)) {
        for (const s of p.equationsSolved) {
          const bucket = hint(String(s));
          skills[bucket].correct += 1;
          skills[bucket].total += 1;
        }
      }
    }

    return Object.entries(skills).map(([name, data]) => ({
      name,
      mastery: data.total > 0 ? Math.max(0, Math.min(100, Math.round((data.correct / data.total) * 100))) : 0,
    }));
  };

  const getAverageTimePerModule = (studentId: string) => {
    const progress = getStudentProgress(studentId);
    if (progress.length === 0) return 0;
    const totalTime = progress.reduce((sum, p) => sum + p.timeSpent, 0);
    return Math.round(totalTime / progress.length);
  };

  const getConsistencyScore = (studentId: string) => {
    const progress = getStudentProgress(studentId);
    if (progress.length < 2) return 100;
    
    const scores = progress.map(p => p.score || 0);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Higher consistency = lower standard deviation
    return Math.max(0, Math.round(100 - (standardDeviation / 10)));
  };

  const getImprovementTrend = (studentId: string) => {
    const progress = getStudentProgress(studentId);
    if (progress.length < 2) return 'Insufficient data';
    
    const sortedProgress = progress.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
    const firstHalf = sortedProgress.slice(0, Math.ceil(sortedProgress.length / 2));
    const secondHalf = sortedProgress.slice(Math.ceil(sortedProgress.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + (p.score || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + (p.score || 0), 0) / secondHalf.length;
    
    const improvement = secondAvg - firstAvg;
    if (improvement > 10) return 'Strong improvement';
    if (improvement > 5) return 'Moderate improvement';
    if (improvement > -5) return 'Stable performance';
    if (improvement > -10) return 'Slight decline';
    return 'Needs attention';
  };

  const getTeacherRecommendations = (studentId: string) => {
    const progress = getStudentProgress(studentId);
    const recommendations = [];
    
    // Analyze skill weaknesses
    const skillMastery = getOverallSkillMastery(studentId);
    skillMastery.forEach(skill => {
      if (skill.mastery < 60) {
        recommendations.push({
          priority: 'high',
          recommendation: `Focus on ${skill.name} - current mastery: ${skill.mastery}%`
        });
      } else if (skill.mastery < 80) {
        recommendations.push({
          priority: 'medium',
          recommendation: `Practice ${skill.name} to improve from ${skill.mastery}%`
        });
      }
    });

    // Analyze time patterns
    const avgTime = getAverageTimePerModule(studentId);
    if (avgTime > 60) {
      recommendations.push({
        priority: 'medium',
        recommendation: 'Student takes longer than average - consider additional support'
      });
    }

    // Analyze consistency
    const consistency = getConsistencyScore(studentId);
    if (consistency < 70) {
      recommendations.push({
        priority: 'high',
        recommendation: 'Inconsistent performance - review study habits and provide structure'
      });
    }

    // Analyze improvement trend
    const trend = getImprovementTrend(studentId);
    if (trend === 'Needs attention') {
      recommendations.push({
        priority: 'high',
        recommendation: 'Performance declining - schedule one-on-one review session'
      });
    }

    // Add positive reinforcement
    const strengths = progress.flatMap(p => p.strengths || []);
    if (strengths.length > 0) {
      recommendations.push({
        priority: 'low',
        recommendation: `Student excels in: ${strengths.slice(0, 2).join(', ')}`
      });
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  };

  const handleGoHome = () => {
    window.history.back();
  };

  const handleAddStudent = async () => {
    try {
      const allStudents = await db.getAllStudents();
      const currentStudentIds = students.map(s => s.id);
      const available = allStudents.filter(s => !currentStudentIds.includes(s.id));
      setAvailableStudents(available);
      setShowAddStudentModal(true);
    } catch (error) {
      console.error('Error loading available students:', error);
    }
  };

  const handleGrantAccess = async (studentId: string) => {
    if (!user) return;
    
    try {
      await db.grantTeacherAccess(user.id, studentId);
      // Reload students
      const teacherStudents = await db.getStudentsForTeacher(user.id);
      setStudents(teacherStudents);
      setShowAddStudentModal(false);
    } catch (error) {
      console.error('Error granting access:', error);
    }
  };

  const handleRecreateDatabase = async () => {
    try {
      await db.forceRecreate();
      // Reload data
      const teacherStudents = await db.getStudentsForTeacher(user!.id);
      const progress = await db.getAllStudentProgress();
      setStudents(teacherStudents);
      setAllProgress(progress);
    } catch (error) {
      console.error('Error recreating database:', error);
    }
  };

  const filteredAvailableStudents = availableStudents.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${cosmicBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          className="p-6 border-b border-border/30 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <Home size={16} />
                Back to Home
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <GraduationCap size={24} className="text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-orbitron font-bold text-xl bg-gradient-primary bg-clip-text text-transparent">
                    Teacher Dashboard
                  </h1>
                  <p className="text-xs text-muted-foreground">Welcome, {user.username}</p>
                </div>
              </div>
            </div>

                         <div className="flex items-center gap-2">
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={reloadData} 
                 className="flex items-center gap-2"
               >
                 Refresh
               </Button>
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={handleRecreateDatabase} 
                 className="flex items-center gap-2"
               >
                 Recreate DB
               </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
             </div>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Overview Stats */}
            <motion.div 
              className="grid md:grid-cols-4 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-card border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <Users size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold text-card-foreground">{students.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-success/20 rounded-lg">
                      <BookOpen size={24} className="text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modules Completed</p>
                      <p className="text-2xl font-bold text-card-foreground">{allProgress.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent/20 rounded-lg">
                      <Clock size={24} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Time</p>
                      <p className="text-2xl font-bold text-card-foreground">
                        {Math.round(allProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60)}h
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-warning/20 rounded-lg">
                      <TrendingUp size={24} className="text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                      <p className="text-2xl font-bold text-card-foreground">
                        {allProgress.length > 0 
                          ? Math.round(allProgress.reduce((sum, p) => sum + (p.score || 0), 0) / allProgress.length)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <Users size={16} />
                  Student Progress
                </TabsTrigger>
                <TabsTrigger value="classrooms" className="flex items-center gap-2">
                  <School size={16} />
                  Classrooms
                </TabsTrigger>
              </TabsList>

              <TabsContent value="students">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-gradient-card border-primary/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <Users size={20} />
                        Student Progress Overview
                      </CardTitle>
                    </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {students.length === 0 ? (
                      <div className="text-center py-12">
                        <Users size={64} className="text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-card-foreground mb-2">No Students Yet</h3>
                        <p className="text-muted-foreground mb-6">
                          Ask students to join your classroom using the join code.
                        </p>
                      </div>
                    ) : (
                      students.map((student) => {
                      const studentProgress = getStudentProgress(student.id);
                      const avgScore = getAverageScore(student.id);
                      const totalTime = getTotalTimeSpent(student.id);
                      
                      return (
                        <motion.div
                          key={student.id}
                          className="p-4 border border-border/30 rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedStudent(student)}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                                {/* Cadet avatar badge */}
                                <span className="text-xs font-orbitron px-2 py-1 rounded bg-black/40 border border-primary/30 text-primary">
                                  {student.cadetAvatar ? student.cadetAvatar.replace('-', ' ') : 'cadet'}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-card-foreground">{student.username}</h3>
                                <p className="text-sm text-muted-foreground">{student.email}</p>
                                {student.cadetAvatar && (
                                  <p className="text-xs text-muted-foreground mt-1">Cadet: <span className="capitalize">{student.cadetAvatar.replace('-', ' ')}</span></p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Modules</p>
                                <p className="font-semibold text-card-foreground">{studentProgress.length}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Avg Score</p>
                                <p className="font-semibold text-card-foreground">{avgScore}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Time</p>
                                <p className="font-semibold text-card-foreground">{Math.round(totalTime / 60)}h</p>
                              </div>
                              <Badge variant={avgScore >= 80 ? "default" : avgScore >= 60 ? "secondary" : "destructive"}>
                                {avgScore >= 80 ? "Excellent" : avgScore >= 60 ? "Good" : "Needs Help"}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Student Detail Modal */}
            {selectedStudent && (
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStudent(null)}
              >
                <motion.div
                  className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-border">
                      <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-card-foreground">{selectedStudent.username}</h2>
                        <p className="text-muted-foreground">{selectedStudent.email}</p>
                          {selectedStudent.cadetAvatar && (
                            <p className="text-xs text-muted-foreground mt-1">Cadet: <span className="capitalize">{selectedStudent.cadetAvatar.replace('-', ' ')}</span></p>
                          )}
                      </div>
                      <Button variant="ghost" onClick={() => setSelectedStudent(null)}>
                        <ArrowLeft size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Target size={20} className="text-primary" />
                          Progress Summary
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Modules:</span>
                            <span className="font-semibold">{getStudentProgress(selectedStudent.id).length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Average Score:</span>
                            <span className="font-semibold">{getAverageScore(selectedStudent.id)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Time:</span>
                            <span className="font-semibold">{Math.round(getTotalTimeSpent(selectedStudent.id) / 60)} hours</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Last Activity:</span>
                            <span className="font-semibold">
                              {getStudentProgress(selectedStudent.id).length > 0 
                                ? new Date(getStudentProgress(selectedStudent.id)[0].completedAt).toLocaleDateString()
                                : 'No activity'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Target size={20} className="text-primary" />
                          Overall Skill Analysis
                        </h3>
                        <div className="space-y-4">
                          {/* Overall Skill Mastery */}
                          <div className="bg-card/30 rounded-lg p-4">
                            <h4 className="font-medium text-card-foreground mb-3">Skill Mastery Overview</h4>
                            <div className="grid grid-cols-2 gap-3">
                              {getOverallSkillMastery(selectedStudent.id).map((skill) => (
                                <div key={skill.name} className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">{skill.name}:</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${
                                          skill.mastery >= 80 ? 'bg-success' : 
                                          skill.mastery >= 60 ? 'bg-warning' : 'bg-destructive'
                                        }`}
                                        style={{ width: `${skill.mastery}%` }}
                                      />
                                    </div>
                                    <span className={`text-xs font-medium ${
                                      skill.mastery >= 80 ? 'text-success' : 
                                      skill.mastery >= 60 ? 'text-warning' : 'text-destructive'
                                    }`}>
                                      {skill.mastery}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Learning Patterns */}
                          <div className="bg-card/30 rounded-lg p-4">
                            <h4 className="font-medium text-card-foreground mb-3">Learning Patterns</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Average Time per Module:</span>
                                <span className="font-medium">{getAverageTimePerModule(selectedStudent.id)} minutes</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Consistency Score:</span>
                                <span className="font-medium">{getConsistencyScore(selectedStudent.id)}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Improvement Trend:</span>
                                <span className="font-medium">{getImprovementTrend(selectedStudent.id)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Recommendations */}
                          <div className="bg-card/30 rounded-lg p-4">
                            <h4 className="font-medium text-card-foreground mb-3">Teacher Recommendations</h4>
                            <div className="space-y-2">
                              {getTeacherRecommendations(selectedStudent.id).map((rec, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                  <div className={`w-2 h-2 rounded-full mt-2 ${
                                    rec.priority === 'high' ? 'bg-destructive' : 
                                    rec.priority === 'medium' ? 'bg-warning' : 'bg-success'
                                  }`} />
                                  <span className="text-muted-foreground">{rec.recommendation}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Student Mistakes Analysis */}
                          <div className="bg-card/30 rounded-lg p-4">
                            <h4 className="font-medium text-card-foreground mb-3 flex items-center gap-2">
                              <AlertCircle size={16} className="text-destructive" />
                              Student Mistakes & Errors
                            </h4>
                            <div className="space-y-4">
                              {/* Recent Mistakes */}
                              <div>
                                <h5 className="text-sm font-medium text-card-foreground mb-2">Recent Mistakes</h5>
                                <div className="space-y-2">
                                  {getStudentProgress(selectedStudent.id).slice(0, 3).map((progress, index) => (
                                    <div key={index} className="bg-destructive/10 rounded-lg p-3">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-medium text-destructive">{progress.moduleName}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(progress.completedAt).toLocaleDateString()}
                                  </span>
                                      </div>
                                      {progress.mistakes && progress.mistakes.length > 0 ? (
                                        <ul className="space-y-1">
                                          {progress.mistakes.slice(0, 3).map((mistake, mistakeIndex) => (
                                            <li key={mistakeIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                                              <div className="w-1 h-1 rounded-full bg-destructive mt-2 flex-shrink-0" />
                                              <span className="truncate">{mistake}</span>
                                            </li>
                                          ))}
                                          {progress.mistakes.length > 3 && (
                                            <li className="text-xs text-muted-foreground italic">
                                              +{progress.mistakes.length - 3} more mistakes
                                            </li>
                                          )}
                                        </ul>
                                      ) : (
                                        <p className="text-xs text-muted-foreground italic">No mistakes recorded</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Common Mistakes Pattern */}
                              <div>
                                <h5 className="text-sm font-medium text-card-foreground mb-2">Common Mistakes Pattern</h5>
                                <div className="space-y-2">
                                  {getStudentProgress(selectedStudent.id).map(progress => 
                                    progress.commonMistakes && progress.commonMistakes.length > 0
                                  ).some(Boolean) ? (
                                    getStudentProgress(selectedStudent.id)
                                      .filter(progress => progress.commonMistakes && progress.commonMistakes.length > 0)
                                      .slice(0, 2)
                                      .map((progress, index) => (
                                        <div key={index} className="bg-warning/10 rounded-lg p-3">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-warning">{progress.moduleName}</span>
                                            <span className="text-xs text-muted-foreground">
                                    {new Date(progress.completedAt).toLocaleDateString()}
                                  </span>
                                          </div>
                                          <ul className="space-y-1">
                                            {progress.commonMistakes!.slice(0, 3).map((mistake, mistakeIndex) => (
                                              <li key={mistakeIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-warning mt-2 flex-shrink-0" />
                                                <span className="truncate">{mistake}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">No common mistake patterns identified yet</p>
                                  )}
                                </div>
                              </div>

                              {/* Areas for Improvement */}
                              <div>
                                <h5 className="text-sm font-medium text-card-foreground mb-2">Areas for Improvement</h5>
                                <div className="space-y-2">
                                  {getStudentProgress(selectedStudent.id).map(progress => 
                                    progress.areasForImprovement && progress.areasForImprovement.length > 0
                                  ).some(Boolean) ? (
                                    getStudentProgress(selectedStudent.id)
                                      .filter(progress => progress.areasForImprovement && progress.areasForImprovement.length > 0)
                                      .slice(0, 1)
                                      .map((progress, index) => (
                                        <div key={index} className="bg-blue-500/10 rounded-lg p-3">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-blue-500">{progress.moduleName}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {new Date(progress.completedAt).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <ul className="space-y-1">
                                            {progress.areasForImprovement!.slice(0, 3).map((area, areaIndex) => (
                                              <li key={areaIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                                                <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                                <span className="truncate">{area}</span>
                                              </li>
                                      ))}
                                    </ul>
                                  </div>
                                      ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">No specific areas for improvement identified yet</p>
                                )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Add Student Modal */}
            {showAddStudentModal && (
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddStudentModal(false)}
              >
                <motion.div
                  className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-card-foreground">Add Students</h2>
                        <p className="text-muted-foreground">Grant access to students to view their progress</p>
                      </div>
                      <Button variant="ghost" onClick={() => setShowAddStudentModal(false)}>
                        <ArrowLeft size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          placeholder="Search students by username or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {filteredAvailableStudents.length === 0 ? (
                        <div className="text-center py-8">
                          <Users size={48} className="text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {searchTerm ? 'No students found matching your search.' : 'No available students to add.'}
                          </p>
                        </div>
                      ) : (
                        filteredAvailableStudents.map((student) => (
                          <motion.div
                            key={student.id}
                            className="p-4 border border-border/30 rounded-lg hover:border-primary/50 transition-colors"
                            whileHover={{ scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                  <Users size={16} className="text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-card-foreground">{student.username}</h3>
                                  <p className="text-sm text-muted-foreground">{student.email}</p>
                                </div>
                              </div>
                              
                              <Button 
                                size="sm"
                                onClick={() => handleGrantAccess(student.id)}
                                className="flex items-center gap-2"
                              >
                                <Plus size={14} />
                                Add
                              </Button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="classrooms">
            <ClassroomManager teacherId={user?.id || ''} />
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard; 