import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/database';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Eye, 
  EyeOff,
  Sparkles,
  Rocket,
  Calculator,
  UserPlus
} from 'lucide-react';
import cosmicBackground from '@/assets/cosmic-background.png';
import { getDbConfig } from '../lib/database';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [apiTest, setApiTest] = useState<any>(null);
  const [guestName, setGuestName] = useState('');

  const { login, register, user, isLoading: authLoading, guestLoginLocal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if user is already logged in - moved before the loading check
  useEffect(() => {
    if (user) {
      if (user.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/rpg'); // Changed to redirect to RPG page as main page
      }
    }
  }, [user, navigate]);

  // Show loading state while AuthContext is initializing
  if (authLoading) {
    console.log('🔄 LoginPage: AuthContext is loading, showing spinner...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Math Cosmos Tutor...</p>
        </div>
      </div>
    );
  }

  console.log('🎯 LoginPage: Rendering login form, authLoading:', authLoading, 'user:', user);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let success = false;

      if (isLogin) {
        success = await login(formData.username, formData.password);
        if (success) {
          toast({
            title: "Welcome back! 🎉",
            description: `Successfully logged in as ${formData.username}`,
          });
          // Navigation will happen automatically via useEffect when user state updates
        } else {
          toast({
            title: "Login failed",
            description: "Invalid username or password. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        const result = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role,
        });
        if (result.success) {
          toast({
            title: "Account created! 🚀",
            description: `Welcome to Math Tutor, ${formData.username}!`,
          });
          // Navigation will happen automatically via useEffect when user state updates
        } else {
          toast({
            title: "Registration failed",
            description: result.error || "Username or email already exists. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure demo accounts exist and login immediately
  const ensureDemoAndLogin = async (type: 'teacher' | 'student') => {
    const demo = type === 'teacher'
      ? { username: 'teacher_demo', password: 'teacher123', email: 'teacher_demo@example.com', role: 'teacher' as const }
      : { username: 'student1', password: 'student123', email: 'student1@example.com', role: 'student' as const };

    let ok = await login(demo.username, demo.password);
    if (!ok) {
      const reg = await register({ username: demo.username, email: demo.email, password: demo.password, role: demo.role });
      if (reg.success) {
        ok = await login(demo.username, demo.password);
      }
    }
    if (ok) {
      toast({ title: 'Logged in', description: `Signed in as ${demo.username}` });
      navigate(type === 'teacher' ? '/teacher-dashboard' : '/rpg');
    } else {
      toast({ title: 'Demo login failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  // Debug function to check database configuration
  const checkDbConfig = async () => {
    const config = getDbConfig();
    setDbStatus(config);
    if (config.API_BASE) {
      try {
        const response = await fetch(`${config.API_BASE}/api/ping`);
        const data = await response.json();
        setApiTest({ success: true, data });
      } catch (error) {
        setApiTest({ success: false, error: (error as Error).message });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${cosmicBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-full mb-4"
            >
              <Calculator size={40} className="text-primary-foreground" />
            </motion.div>
            <h1 className="font-orbitron font-bold text-3xl bg-gradient-primary bg-clip-text text-transparent mb-2">
              Math Cosmos Tutor
            </h1>
            <p className="text-muted-foreground">
              Explore the universe of mathematics
            </p>
          </div>

          {/* Quick Access: Guest only (no codes) */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="text-sm font-medium text-card-foreground">Quick Access</div>
              <div className="text-xs text-muted-foreground">No account needed</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex gap-2">
                <Input 
                  placeholder="Enter name (optional)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    await guestLoginLocal(guestName);
                    navigate('/rpg');
                  }}
                  className="whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Continue as Guest
                </Button>
              </div>
            </div>
          </div>

          {/* Debug Section */}
          <div className="mb-4">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-blue-300 hover:text-blue-100 mb-2"
            >
              {showDebug ? 'Hide' : 'Show'} Database Debug Info
            </button>
            {showDebug && (
              <div className="bg-black/20 rounded p-3 text-xs text-green-300 mb-4">
                <div className="mb-2">
                  <strong>Current Config:</strong>
                  <pre className="mt-1 text-xs">
                    {JSON.stringify(dbStatus || getDbConfig(), null, 2)}
                  </pre>
                </div>
                <button
                  onClick={checkDbConfig}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2"
                >
                  Test API
                </button>
                {apiTest && (
                  <div className="mt-2">
                    <strong>API Test Result:</strong>
                    <pre className="mt-1 text-xs">
                      {JSON.stringify(apiTest, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <Card className="bg-gradient-card border-primary/30 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-orbitron text-xl text-card-foreground">
                {isLogin ? 'Welcome Back' : 'Join the Journey'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {isLogin ? 'Sign in to continue your learning adventure' : 'Create your account to start exploring'}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Debug info */}
              <div className="text-xs text-muted-foreground text-center">
                Debug: AuthLoading={authLoading ? 'true' : 'false'}, User={user ? user.username : 'null'}
              </div>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center">Try demo accounts (auto-setup):</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => ensureDemoAndLogin('teacher')}
                  >
                    <GraduationCap size={12} className="mr-1" />
                    Teacher Demo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => ensureDemoAndLogin('student')}
                  >
                    <BookOpen size={12} className="mr-1" />
                    Student Demo
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">I am a:</Label>
                    <RadioGroup value={role} onValueChange={(value: 'student' | 'teacher') => setRole(value)}>
                      <div className="grid grid-cols-2 gap-3">
                        <Label
                          htmlFor="student"
                          className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            role === 'student' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value="student" id="student" className="sr-only" />
                          <BookOpen size={16} className="text-primary" />
                          <span className="text-sm font-medium">Student</span>
                        </Label>
                        <Label
                          htmlFor="teacher"
                          className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            role === 'teacher' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value="teacher" id="teacher" className="sr-only" />
                          <GraduationCap size={16} className="text-primary" />
                          <span className="text-sm font-medium">Teacher</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles size={16} />
                    </motion.div>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <Rocket size={16} className="ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <Button
                  variant="link"
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ username: '', email: '', password: '' });
                  }}
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage; 