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
import { getDbConfig } from '../lib/database';
import cortexLogo from '@/cortex  logo.png';

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
        navigate('/student'); // Redirect students to drawing solver
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
          <p className="text-muted-foreground">Initializing CORTEX...</p>
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
      navigate(type === 'teacher' ? '/teacher-dashboard' : '/student');
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
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: `url('/login page pic.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/45 to-background/65" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center mb-4 relative"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
                style={{ width: '200px', height: '200px', margin: '0 auto' }}
              />
              <img 
                src={cortexLogo} 
                alt="CORTEX Logo" 
                className="w-48 h-48 md:w-56 md:h-56 relative z-10 drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.6)) drop-shadow(0 0 40px rgba(236, 72, 153, 0.4))'
                }}
              />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-cyan-300/80 font-medium text-sm tracking-wider uppercase"
              style={{ textShadow: '0 0 10px rgba(96, 165, 250, 0.5)' }}
            >
              // Neural Interface Activated //
            </motion.p>
          </div>

          {/* Quick Access: Guest only (no codes) */}
          <div className="relative bg-black/30 backdrop-blur-sm border-2 border-cyan-500/30 rounded-lg p-4 mb-6 overflow-hidden"
            style={{
              boxShadow: '0 0 20px rgba(96, 165, 250, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.1)'
            }}
          >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
              <div className="text-sm font-orbitron font-bold text-cyan-300">[ QUICK ACCESS ]</div>
              <div className="text-xs text-cyan-500/70 font-mono">[ No account ]</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex gap-2">
                <Input 
                  placeholder="Enter name (optional)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="bg-black/40 border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 text-cyan-50 placeholder:text-cyan-500/50 font-mono"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    await guestLoginLocal(guestName);
                    navigate('/student');
                  }}
                  className="whitespace-nowrap border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 font-mono"
                  style={{
                    boxShadow: '0 0 10px rgba(96, 165, 250, 0.3)'
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Guest Mode
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

          <Card className="relative bg-black/40 backdrop-blur-md border-2 overflow-hidden"
            style={{
              borderImage: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8), rgba(59, 130, 246, 0.8)) 1',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(236, 72, 153, 0.2), inset 0 0 40px rgba(59, 130, 246, 0.1)'
            }}
          >
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-50 animate-pulse" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-60" />
            
            <CardHeader className="text-center pb-4 relative z-10 border-b border-cyan-500/20">
              <CardTitle className="font-orbitron text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2"
                style={{ textShadow: '0 0 15px rgba(139, 92, 246, 0.5)' }}
              >
                {isLogin ? '> SYSTEM ACCESS <' : '> NEW USER INITIALIZATION <'}
              </CardTitle>
              <p className="text-sm text-cyan-300/70 font-mono">
                {isLogin ? '[ Authenticate to proceed ]' : '[ Register new identity ]'}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
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
                  <Label htmlFor="username" className="text-sm font-mono text-cyan-300/80 flex items-center gap-2">
                    <span className="text-cyan-500">/</span> Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="pl-10 bg-black/40 border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 text-cyan-50 placeholder:text-cyan-500/50 font-mono"
                      required
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-mono text-cyan-300/80 flex items-center gap-2">
                      <span className="text-cyan-500">/</span> Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 bg-black/40 border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 text-cyan-50 placeholder:text-cyan-500/50 font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-mono text-cyan-300/80 flex items-center gap-2">
                    <span className="text-cyan-500">/</span> Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10 bg-black/40 border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/50 text-cyan-50 placeholder:text-cyan-500/50 font-mono"
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
                    <Label className="text-sm font-mono text-cyan-300/80 flex items-center gap-2">
                      <span className="text-cyan-500">/</span> I am a:
                    </Label>
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
                  className="w-full relative overflow-hidden font-orbitron font-bold text-lg py-6 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8))',
                    border: '2px solid transparent',
                    borderImage: 'linear-gradient(135deg, rgba(96, 165, 250, 0.8), rgba(236, 72, 153, 0.8)) 1',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                  }}
                  disabled={isLoading}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.8), 0 0 50px rgba(236, 72, 153, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-white/20 to-cyan-500/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="relative z-10"
                    >
                      <Sparkles size={20} className="text-white" />
                    </motion.div>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isLogin ? '> ACCESS GRANTED <' : '> INITIALIZE <'}
                      <Rocket size={18} />
                    </span>
                  )}
                </Button>
              </form>

              <div className="text-center relative z-10">
                <Button
                  variant="link"
                  className="text-sm text-cyan-400/70 hover:text-cyan-300 font-mono transition-all"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ username: '', email: '', password: '' });
                  }}
                >
                  {isLogin ? "[ New user? Register ]" : "[ Existing user? Login ]"}
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