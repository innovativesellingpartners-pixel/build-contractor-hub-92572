import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';

export type CallSession = {
  id: string;
  call_sid: string;
  from_number: string;
  to_number: string;
  status: string;
  conversation_history: any;
  ai_summary: string | null;
  outcome: string | null;
  action_taken: string | null;
  created_at: string;
  updated_at: string;
  recording_url: string | null;
  recording_sid: string | null;
  recording_duration: number | null;
  recording_status: string | null;
};

export const useCallSessions = () => {
  const { user } = useAuth();

  const { data: callSessions, isLoading, error, refetch } = useQuery({
    queryKey: ['call-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CallSession[];
    },
    enabled: !!user?.id,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('call_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions',
          filter: `contractor_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Call session update:', payload);
          refetch();
          
          if (payload.eventType === 'INSERT') {
            toast.info('New call received');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  return {
    callSessions: callSessions || [],
    isLoading,
    error,
    refetch,
  };
};
