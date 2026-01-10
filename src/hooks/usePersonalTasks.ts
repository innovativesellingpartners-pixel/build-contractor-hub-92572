import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  due_date: string | null;
  category: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonalTaskInput {
  title: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  due_date?: string;
  category?: string;
  source?: string;
}

export interface UpdatePersonalTaskInput {
  id: string;
  title?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  due_date?: string | null;
  category?: string | null;
}

export const usePersonalTasks = (filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['personal_tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('personal_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as 'not_started' | 'in_progress' | 'completed' | 'blocked');
      }
      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority as 'low' | 'medium' | 'high');
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching personal tasks:', error);
        throw error;
      }

      return data as PersonalTask[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (input: CreatePersonalTaskInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('personal_tasks')
        .insert({
          user_id: user.id,
          title: input.title,
          notes: input.notes || null,
          priority: input.priority || 'medium',
          status: input.status || 'not_started',
          due_date: input.due_date || null,
          category: input.category || null,
          source: input.source || 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal_tasks'] });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    },
  });

  const updateTask = useMutation({
    mutationFn: async (input: UpdatePersonalTaskInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('personal_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal_tasks'] });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('personal_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal_tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async (task: PersonalTask) => {
      const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
      const { error } = await supabase
        .from('personal_tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['personal_tasks'] });
      toast.success(newStatus === 'completed' ? 'Task completed!' : 'Task reopened');
    },
    onError: (error) => {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    },
  });

  return {
    tasks,
    isLoading,
    refetch,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  };
};
