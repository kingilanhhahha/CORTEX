import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { db, getDbConfig } from '@/lib/database';
import { School, Lock, User, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClassroomGateProps {
  enabled?: boolean;
}

export default function ClassroomGate({ enabled = true }: ClassroomGateProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [needsGate, setNeedsGate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkMembership = async () => {
      if (!enabled || !user) return;
      // Guests skip the gate
      const isGuest = user.username?.startsWith('guest_');
      if (isGuest) {
        setNeedsGate(false);
        return;
      }
      try {
        const classes = await db.getClassroomsForStudent(user.id);
        setNeedsGate(classes.length === 0);
      } catch {
        setNeedsGate(true);
      }
    };
    checkMembership();
  }, [user, enabled]);

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    const code = joinCode.trim().toUpperCase();
    const valid = /^[A-Z0-9]{6}$/.test(code);
    if (!valid) {
      toast({ title: 'Invalid code', description: 'Enter a 6-character code (A–Z, 0–9).', variant: 'destructive' });
      return;
    }
    try {
      setIsLoading(true);
      // In api-only mode, require connectivity; in hybrid/offline, allow local join
      const cfg = getDbConfig();
      if (cfg.DB_MODE === 'api-only') {
        if (!cfg.API_BASE) {
          toast({ title: 'Not connected to host', description: 'Cannot reach the classroom server. Check VITE_DB_API and network.', variant: 'destructive' });
          return;
        }
        const ping = await fetch(`${cfg.API_BASE}/api/ping`, { cache: 'no-store' });
        if (!ping.ok) {
          toast({ title: 'Not connected to host', description: 'Cannot reach the classroom server. Check VITE_DB_API and network.', variant: 'destructive' });
          return;
        }
      }
      const result = await db.joinClassroom(code, user.id);
      const teacherName = result.teacher?.username || 'Unknown teacher';
      toast({ title: 'Class joined!', description: `Class: ${result.classroom.name} • Teacher: ${teacherName}` });
      setNeedsGate(false);
    } catch (e: any) {
      toast({ title: 'Join failed', description: e.message || 'Invalid code', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {needsGate && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-background border border-primary/30 rounded-2xl p-6 w-full max-w-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <School className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-card-foreground">Enter Class Code</h2>
                <p className="text-sm text-muted-foreground">Ask your teacher for the 6-character code</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="code">Class Code</Label>
              <Input
                id="code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="ABC123"
                className="font-mono text-center text-lg tracking-wider"
                maxLength={6}
              />
              <Button onClick={handleJoin} disabled={isLoading || joinCode.trim().length < 4} className="w-full">
                {isLoading ? 'Joining...' : 'Join Class'}
                <Rocket className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
