import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, db } from '@/lib/database';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  guestLoginLocal: (displayName?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔧 AuthProvider: Starting initialization...');
      const timeoutId = setTimeout(() => {
        console.log('⚠️ AuthProvider: Initialization timeout, forcing completion');
        setIsLoading(false);
      }, 3000);

      try {
        console.log('📊 AuthProvider: Initializing database...');
        await db.init();
        console.log('📊 AuthProvider: Database initialized successfully');
        console.log('📝 AuthProvider: Initializing sample data...');
        await db.initializeSampleData();
        console.log('📝 AuthProvider: Sample data initialized successfully');
        const storedUser = localStorage.getItem('currentUser');
        console.log('🔍 AuthProvider: Checking for stored user session...', storedUser ? 'Found' : 'Not found');
        if (storedUser) {
          console.log('👤 AuthProvider: Found stored user session');
          try {
            const userData = JSON.parse(storedUser);
            console.log('👤 AuthProvider: Parsed user data:', userData);
            setUser(userData);
          } catch (parseError) {
            console.error('❌ AuthProvider: Failed to parse stored user data:', parseError);
            localStorage.removeItem('currentUser');
          }
        } else {
          console.log('👤 AuthProvider: No stored user session found');
        }
        console.log('✅ AuthProvider: Initialization complete');
      } catch (error) {
        console.error('❌ AuthProvider: Failed to initialize:', error);
      } finally {
        clearTimeout(timeoutId);
        console.log('🏁 AuthProvider: Setting isLoading to false');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('🚨 AuthProvider: Emergency fallback - forcing loading to false');
        setIsLoading(false);
      }
    }, 1000);
    return () => clearTimeout(fallbackTimeout);
  }, [isLoading]);

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('🔐 AuthProvider: Attempting login for username:', username);
    try {
      const user = await db.getUserByUsername(username);
      if (user && user.password === password) {
        console.log('✅ AuthProvider: Login successful for user:', username);
        await db.updateLastLogin(user.id);
        setUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
      } else {
        console.log('❌ AuthProvider: Login failed - invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('❌ AuthProvider: Login error:', error);
      return false;
    }
  };

  const guestLoginLocal = async (displayName?: string): Promise<boolean> => {
    const safeName = (displayName || 'Guest').trim().replace(/\s+/g, '_');
    const guestUser: User = {
      id: 'guest_' + Date.now(),
      username: `guest_${safeName}_${Math.floor(Math.random() * 9000) + 1000}`,
      email: `guest_${Date.now()}@guest.local`,
      password: 'guest_password',
      role: 'student',
      createdAt: new Date(),
      lastLogin: new Date(),
      cadetAvatar: undefined,
    };
    setUser(guestUser);
    localStorage.setItem('currentUser', JSON.stringify(guestUser));
    return true;
  };

  const logout = () => {
    console.log('🚪 AuthProvider: Logging out user');
    setUser(null);
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<{ success: boolean; error?: string }> => {
    console.log('📝 AuthProvider: Attempting registration for user:', userData.username);
    try {
      const newUser = await db.createUser(userData);
      console.log('✅ AuthProvider: Registration successful for user:', userData.username);
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      return { success: true };
    } catch (error) {
      console.error('❌ AuthProvider: Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    isLoading,
    guestLoginLocal,
  };

  console.log('🔄 AuthProvider: Rendering with state - user:', user, 'isLoading:', isLoading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 