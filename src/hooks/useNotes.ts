import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Note = {
  id: string;
  user_id: string;
  lesson_id: string;
  enrollment_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export const useUserNotes = (lessonId: string, enrollmentId: string) => {
  return useQuery({
    queryKey: ['user-notes', lessonId, enrollmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_lesson_notes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('enrollment_id', enrollmentId)
        .maybeSingle() as any;

      if (error) throw error;
      return data;
    },
    enabled: !!lessonId && !!enrollmentId,
  });
};

export const useSaveNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, enrollmentId, content }: {
      lessonId: string;
      enrollmentId: string;
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_lesson_notes')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          content,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-notes', variables.lessonId, variables.enrollmentId] 
      });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, enrollmentId }: {
      lessonId: string;
      enrollmentId: string;
    }) => {
      const { error } = await supabase
        .from('user_lesson_notes')
        .delete()
        .eq('lesson_id', lessonId)
        .eq('enrollment_id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-notes', variables.lessonId, variables.enrollmentId] 
      });
      toast.success('Note deleted successfully');
    },
  });
};

export const useAllUserNotes = (enrollmentId: string) => {
  return useQuery({
    queryKey: ['all-user-notes', enrollmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_lesson_notes')
        .select(`
          *,
          course_lessons (
            title,
            course_modules (
              title
            )
          )
        `)
        .eq('enrollment_id', enrollmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!enrollmentId,
  });
};

// Auto-save hook with debouncing
export const useAutoSaveNote = (lessonId: string, enrollmentId: string) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { mutate: saveNote } = useSaveNote();

  const saveNoteDebounced = (newContent: string) => {
    if (!newContent.trim()) return;
    
    setIsSaving(true);
    saveNote(
      { lessonId, enrollmentId, content: newContent },
      {
        onSuccess: () => {
          setIsSaving(false);
          toast.success('Note saved!', { duration: 2000 });
        },
        onError: () => {
          setIsSaving(false);
          toast.error('Failed to save note');
        },
      }
    );
  };

  return {
    content,
    setContent,
    isSaving,
    saveNote: saveNoteDebounced,
  };
};