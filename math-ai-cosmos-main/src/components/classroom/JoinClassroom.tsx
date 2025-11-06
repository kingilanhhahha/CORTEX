import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, 
  LogIn,
  User,
  School
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { getDbConfig } from '@/lib/database';

interface JoinClassroomProps {
  onJoinSuccess?: () => void;
}

export default function JoinClassroom({ onJoinSuccess }: JoinClassroomProps) {
  const [joinCode, setJoinCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  const { user, login, guestLoginLocal } = useAuth();

  const pingHost = async (): Promise<boolean> => {
    try {
      const cfg = getDbConfig();
      if (!cfg.API_BASE) return false;
      const res = await fetch(`${cfg.API_BASE}/api/ping`, { cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleJoinAsStudent = async () => {
    if (!joinCode.trim() || !user) return;
    const code = joinCode.trim().toUpperCase();
    const valid = /^[A-Z0-9]{6}$/.test(code);
    if (!valid) {
      toast({ title: 'Invalid code', description: 'Enter a 6-character code (A–Z, 0–9).', variant: 'destructive' });
      return;
    }
    
    try {
      setIsLoading(true);
      const cfg = getDbConfig();
      if (cfg.DB_MODE === 'api-only') {
        const ok = await pingHost();
        if (!ok) {
          toast({ title: 'Not connected to host', description: 'Cannot reach the classroom server. Check VITE_DB_API and network.', variant: 'destructive' });
          return;
        }
      }
      const result = await db.joinClassroom(code, user.id);
      const teacherName = result.teacher?.username || 'Unknown teacher';
      toast({ title: 'Joined!', description: `Class: ${result.classroom.name} • Teacher: ${teacherName}` });
      setJoinCode('');
      setShowDialog(false);
      onJoinSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Join failed',
        description: error.message || 'Invalid code or server error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinAsGuest = async () => {
    if (!joinCode.trim() || !guestName.trim()) return;
    const code = joinCode.trim().toUpperCase();
    const valid = /^[A-Z0-9]{6}$/.test(code);
    if (!valid) {
      toast({ title: 'Invalid code', description: 'Enter a 6-character code (A–Z, 0–9).', variant: 'destructive' });
      return;
    }
    
    try {
      setIsLoading(true);
      const cfg = getDbConfig();
      if (cfg.DB_MODE === 'api-only') {
        const ok = await pingHost();
        if (!ok) {
          toast({ title: 'Not connected to host', description: 'Cannot reach the classroom server. Check VITE_DB_API and network.', variant: 'destructive' });
          return;
        }
      }
      // Create a local guest session first (offline-friendly)
      await guestLoginLocal(guestName.trim());
      const current = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const guestId = current?.id;
      if (!guestId) {
        throw new Error('Failed to initialize guest session');
      }
      const result = await db.joinClassroom(code, guestId);
      const teacherName = result.teacher?.username || 'Unknown teacher';
      toast({ title: 'Joined as guest!', description: `Class: ${result.classroom.name} • Teacher: ${teacherName}` });
      setJoinCode('');
      setGuestName('');
      setShowDialog(false);
      onJoinSuccess?.();
    } catch (error: any) {
      toast({ title: 'Join failed', description: error.message || 'Invalid code or server error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
            <UserPlus className="w-4 h-4 mr-2" />
            Join Classroom
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <School className="w-5 h-5" />
              Join a Classroom
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue={user ? "student" : "guest"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student" disabled={!user}>
                <LogIn className="w-4 h-4 mr-2" />
                Student
              </TabsTrigger>
              <TabsTrigger value="guest">
                <User className="w-4 h-4 mr-2" />
                Guest
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="student" className="space-y-4">
              {user ? (
                <>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Joining as: <strong>{user.username}</strong>
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="studentJoinCode">Classroom Join Code</Label>
                    <Input
                      id="studentJoinCode"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="Enter 6-digit code (e.g., ABC123)"
                      className="font-mono text-center text-lg tracking-wider"
                      maxLength={6}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleJoinAsStudent} 
                    disabled={isLoading || !joinCode.trim()}
                    className="w-full"
                  >
                    {isLoading ? "Joining..." : "Join Classroom"}
                  </Button>
                </>
              ) : (
                <div className="text-center p-4">
                  <p className="text-gray-500">Please log in to join as a student</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="guest" className="space-y-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>Guest Mode:</strong> No account required, but progress won't be saved permanently
                </p>
              </div>
              
              <div>
                <Label htmlFor="guestName">Your Name</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <Label htmlFor="guestJoinCode">Classroom Join Code</Label>
                <Input
                  id="guestJoinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter 6-digit code (e.g., ABC123)"
                  className="font-mono text-center text-lg tracking-wider"
                  maxLength={6}
                />
              </div>
              
              <Button 
                onClick={handleJoinAsGuest} 
                disabled={isLoading || !joinCode.trim() || !guestName.trim()}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {isLoading ? "Joining..." : "Join as Guest"}
              </Button>
            </TabsContent>
          </Tabs>
          
          <div className="text-center text-xs text-gray-500 mt-4">
            <p>Ask your teacher for the join code</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
