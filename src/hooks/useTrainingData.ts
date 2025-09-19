import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CourseWithModules {
  id: string;
  title: string;
  description: string;
  category_id: string;
  difficulty_level: string;
  duration_minutes: number;
  is_published: boolean;
  created_at: string;
  training_categories: { name: string } | null;
  course_modules: Array<{
    id: string;
    title: string;
    description: string;
    order_index: number;
      course_lessons: Array<{
        id: string;
        title: string;
        description: string;
        content: string | null;
        lesson_type: string;
        video_url: string | null;
        pdf_url: string | null;
        duration_minutes: number | null;
        order_index: number;
        is_required: boolean;
      }>;
  }>;
}

export interface UserEnrollment {
  id: string;
  course_id: string;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  progress_percentage: number;
  time_spent_minutes: number;
}

export const useTrainingCourses = () => {
  return useQuery({
    queryKey: ['training-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select(`
          *,
          training_categories(name),
          course_modules(
            id,
            title,
            description,
            order_index,
            course_lessons(
              id,
              title,
              description,
              content,
              lesson_type,
              video_url,
              pdf_url,
              duration_minutes,
              order_index,
              is_required
            )
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CourseWithModules[];
    },
  });
};

export const useUserEnrollments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_course_enrollments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserEnrollment[];
    },
    enabled: !!user?.id,
  });
};

export const useEnrollInCourse = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      toast.success('Successfully enrolled in course!');
    },
    onError: (error) => {
      toast.error('Failed to enroll in course: ' + error.message);
    },
  });
};

export const useUpdateLessonProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      lessonId, 
      enrollmentId, 
      isCompleted, 
      videoProgressSeconds,
      timeSpentMinutes 
    }: {
      lessonId: string;
      enrollmentId: string;
      isCompleted: boolean;
      videoProgressSeconds?: number;
      timeSpentMinutes?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: any = {
        user_id: user.id,
        lesson_id: lessonId,
        enrollment_id: enrollmentId,
        is_completed: isCompleted,
      };

      if (isCompleted) {
        updateData.completed_at = new Date().toISOString();
      }

      if (videoProgressSeconds !== undefined) {
        updateData.video_progress_seconds = videoProgressSeconds;
      }

      if (timeSpentMinutes !== undefined) {
        updateData.time_spent_minutes = timeSpentMinutes;
      }

      const { data, error } = await supabase
        .from('user_lesson_progress')
        .upsert(updateData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['lesson-progress'] });
    },
  });
};

export const useLessonProgress = (enrollmentId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lesson-progress', enrollmentId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!enrollmentId,
  });
};

export const useUserCertificates = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-certificates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_certificates')
        .select(`
          *,
          training_courses(title)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};