import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Users, 
  Copy, 
  Trash2, 
  Eye, 
  UserPlus,
  Code,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, Classroom, ClassroomMember } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

interface ClassroomManagerProps {
  teacherId: string;
}

export default function ClassroomManager({ teacherId }: ClassroomManagerProps) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [classroomMembers, setClassroomMembers] = useState<ClassroomMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Ensure we use the authenticated teacher id if available
    const id = (user?.role === 'teacher' ? user.id : teacherId) || teacherId;
    if (id) loadClassrooms(id);
  }, [teacherId, user]);

  const loadClassrooms = async (id?: string) => {
    try {
      setIsLoading(true);
      const data = await db.getClassrooms(id || teacherId);
      setClassrooms(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load classrooms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createClassroom = async () => {
    if (!newClassName.trim()) return;
    const id = (user?.role === 'teacher' ? user.id : teacherId) || teacherId;
    if (!id) return;
    
    try {
      setIsLoading(true);
      const classroom = await db.createClassroom(newClassName.trim(), id);
      setClassrooms(prev => [...prev, classroom]);
      setNewClassName('');
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: `Classroom "${classroom.name}" created with join code: ${classroom.joinCode}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create classroom",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassroomMembers = async (classroomId: string) => {
    try {
      const data = await db.getClassroomDetails(classroomId);
      setClassroomMembers(data.members);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load classroom members",
        variant: "destructive",
      });
    }
  };

  const copyJoinCode = (joinCode: string) => {
    navigator.clipboard.writeText(joinCode);
    toast({
      title: "Copied!",
      description: "Join code copied to clipboard",
    });
  };

  const removeMember = async (classroomId: string, studentId: string) => {
    try {
      await db.removeClassroomMember(classroomId, studentId);
      setClassroomMembers(prev => prev.filter(m => m.studentId !== studentId));
      toast({
        title: "Success",
        description: "Student removed from classroom",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove student",
        variant: "destructive",
      });
    }
  };

  const deactivateClassroom = async (classroomId: string) => {
    try {
      await db.deactivateClassroom(classroomId);
      setClassrooms(prev => prev.filter(c => c.id !== classroomId));
      toast({
        title: "Success",
        description: "Classroom deactivated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate classroom",
        variant: "destructive",
      });
    }
  };

  const openMembersDialog = async (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    await loadClassroomMembers(classroom.id);
    setShowMembersDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Classroom Management</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Classroom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Classroom</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="className">Classroom Name</Label>
                <Input
                  id="className"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Enter classroom name"
                />
              </div>
              <Button 
                onClick={createClassroom} 
                disabled={isLoading || !newClassName.trim()}
                className="w-full"
              >
                {isLoading ? "Creating..." : "Create Classroom"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Classrooms</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Classrooms</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {classrooms.filter(c => c.isActive).map((classroom) => (
            <Card key={classroom.id} className="bg-white/10 backdrop-blur-sm border-primary/30">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white">{classroom.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="secondary" className="bg-blue-600 text-white">
                        <Code className="w-3 h-3 mr-1" />
                        {classroom.joinCode}
                      </Badge>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        <Users className="w-3 h-3 mr-1" />
                        {classroom.studentCount || 0} students
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyJoinCode(classroom.joinCode)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openMembersDialog(classroom)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deactivateClassroom(classroom.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
          
          {classrooms.filter(c => c.isActive).length === 0 && (
            <Card className="bg-white/10 backdrop-blur-sm border-primary/30">
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">No active classrooms yet</p>
                <p className="text-sm text-gray-500">Create your first classroom to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="inactive" className="space-y-4">
          {classrooms.filter(c => !c.isActive).map((classroom) => (
            <Card key={classroom.id} className="bg-white/5 backdrop-blur-sm border-gray-600">
              <CardHeader>
                <CardTitle className="text-gray-400">{classroom.name}</CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className="bg-gray-600">
                    <Code className="w-3 h-3 mr-1" />
                    {classroom.joinCode}
                  </Badge>
                  <Badge variant="outline" className="text-gray-400 border-gray-400">
                    Inactive
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
          
          {classrooms.filter(c => !c.isActive).length === 0 && (
            <Card className="bg-white/5 backdrop-blur-sm border-gray-600">
              <CardContent className="text-center py-8">
                <p className="text-gray-400">No inactive classrooms</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedClassroom?.name} - Members
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-600 text-white">
                <Code className="w-3 h-3 mr-1" />
                Join Code: {selectedClassroom?.joinCode}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedClassroom && copyJoinCode(selectedClassroom.joinCode)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {classroomMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {member.isGuest ? member.guestName : member.username}
                      </p>
                      <p className="text-sm text-gray-400">
                        {member.isGuest ? 'Guest Student' : member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.isGuest ? "outline" : "secondary"}>
                      {member.isGuest ? "Guest" : "Registered"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => selectedClassroom && removeMember(selectedClassroom.id, member.studentId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {classroomMembers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">No students have joined yet</p>
                  <p className="text-sm text-gray-500">Share the join code with your students</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
