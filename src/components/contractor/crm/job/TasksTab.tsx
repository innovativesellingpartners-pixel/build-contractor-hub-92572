import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Trash2, List, CalendarDays } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useCrewMembers } from '@/hooks/useCrewMembers';
import { format } from 'date-fns';
import JobScheduleView from './JobScheduleView';

interface TasksTabProps {
  jobId: string;
}

export default function TasksTab({ jobId }: TasksTabProps) {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks(jobId);
  const { crewMembers } = useCrewMembers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const [formData, setFormData] = useState<Task>({
    job_id: jobId,
    description: '',
    status: 'not_started',
    notes: '',
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'blocked':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      in_progress: 'default',
      blocked: 'destructive',
      not_started: 'secondary',
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const handleSubmit = () => {
    if (editingTask) {
      updateTask({ ...formData, id: editingTask.id! });
    } else {
      createTask(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      job_id: jobId,
      description: '',
      status: 'not_started',
      notes: '',
    });
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData(task);
    setIsDialogOpen(true);
  };

  const handleMarkStart = (task: Task) => {
    updateTask({
      ...task,
      id: task.id!,
      status: 'in_progress',
      actual_start: new Date().toISOString(),
    });
  };

  const handleMarkComplete = (task: Task) => {
    updateTask({
      ...task,
      id: task.id!,
      status: 'completed',
      actual_end: new Date().toISOString(),
    });
  };

  if (isLoading) return <div className="p-4">Loading tasks...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks & Schedule</h3>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 ${viewMode === 'timeline' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <JobScheduleView
          tasks={tasks || []}
          crewMembers={crewMembers?.map(m => ({ id: m.id!, name: m.name })) || []}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{task.description}</h4>
                          {getStatusBadge(task.status)}
                        </div>
                        {task.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{task.notes}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {task.scheduled_start && (
                            <span>Start: {format(new Date(task.scheduled_start), 'MMM d, h:mm a')}</span>
                          )}
                          {task.scheduled_end && (
                            <span>End: {format(new Date(task.scheduled_end), 'MMM d, h:mm a')}</span>
                          )}
                          {task.actual_start && (
                            <span>Started: {format(new Date(task.actual_start), 'MMM d, h:mm a')}</span>
                          )}
                          {task.actual_end && (
                            <span>Completed: {format(new Date(task.actual_end), 'MMM d, h:mm a')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {task.status === 'not_started' && (
                        <Button size="sm" onClick={() => handleMarkStart(task)}>
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button size="sm" onClick={() => handleMarkComplete(task)}>
                          Complete
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(task)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTask(task.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No tasks yet. Add your first task to get started.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Dates moved up for prominence */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_start" className="font-semibold">Start Date *</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  value={formData.scheduled_start?.slice(0, 16)}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                  className="border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_end" className="font-semibold">End Date *</Label>
                <Input
                  id="scheduled_end"
                  type="datetime-local"
                  value={formData.scheduled_end?.slice(0, 16)}
                  onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                  className="border-primary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_crew">Crew Member</Label>
                <Select
                  value={formData.assigned_crew_member_id}
                  onValueChange={(value) => setFormData({ ...formData, assigned_crew_member_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crew member" />
                  </SelectTrigger>
                  <SelectContent>
                    {crewMembers?.map((member) => (
                      <SelectItem key={member.id} value={member.id!}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingTask ? 'Update' : 'Create'} Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
