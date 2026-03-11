import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface QuizQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[] | null;
  correct_answer?: string; // Optional - only available to admins
  order_index: number;
  points: number;
}

export interface UserQuizAnswer {
  id: string;
  user_id: string;
  enrollment_id: string;
  lesson_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  answered_at: string;
}

export const useQuizQuestions = (lessonId: string) => {
  return useQuery({
    queryKey: ['quiz-questions', lessonId],
    queryFn: async () => {
      if (!lessonId) return [];

      // Use safe view that excludes correct_answer column
      const { data, error } = await supabase
        .from('quiz_questions_safe')
        .select('id, lesson_id, question_text, question_type, options, order_index, points, created_at, updated_at')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as QuizQuestion[];
    },
    enabled: !!lessonId,
  });
};

export const useUserQuizAnswers = (enrollmentId: string, lessonId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-quiz-answers', enrollmentId, lessonId, user?.id],
    queryFn: async () => {
      if (!user?.id || !enrollmentId || !lessonId) return [];

      const { data, error } = await supabase
        .from('user_quiz_answers')
        .select('*')
        .eq('user_id', user.id)
        .eq('enrollment_id', enrollmentId)
        .eq('lesson_id', lessonId);

      if (error) throw error;
      return data as UserQuizAnswer[];
    },
    enabled: !!user?.id && !!enrollmentId && !!lessonId,
  });
};

export const useSubmitQuizAnswer = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      lessonId,
      questionId,
      userAnswer,
    }: {
      enrollmentId: string;
      lessonId: string;
      questionId: string;
      userAnswer: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Validate answer server-side
      const { data: validationResult, error: validationError } = await supabase.functions.invoke('validate-quiz-answer', {
        body: { questionId, userAnswer }
      });

      if (validationError) throw validationError;
      const isCorrect = validationResult?.isCorrect || false;

      const { data, error } = await supabase
        .from('user_quiz_answers')
        .upsert({
          user_id: user.id,
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          question_id: questionId,
          user_answer: userAnswer,
          is_correct: isCorrect,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, isCorrect };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-quiz-answers'] });
      if (data.isCorrect) {
        toast.success('Correct answer! ✓');
      } else {
        toast.error('Incorrect answer. Try again!');
      }
    },
    onError: (error) => {
      toast.error('Failed to submit answer: ' + error.message);
    },
  });
};
