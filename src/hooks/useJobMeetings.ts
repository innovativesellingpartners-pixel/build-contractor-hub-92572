import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface JobMeeting {
  id: string;
  job_id: string;
  user_id: string;
  title: string;
  meeting_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  duration_minutes?: number;
  location?: string;
  notes?: string;
  calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

export function useJobMeetings(jobId?: string) {
  const [meetings, setMeetings] = useState<JobMeeting[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMeetings = useCallback(async () => {
    if (!jobId) {
      setMeetings([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_meetings')
        .select('*')
        .eq('job_id', jobId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setMeetings((data || []) as JobMeeting[]);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const addMeeting = async (
    meetingData: Omit<JobMeeting, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    jobName?: string,
    jobLocation?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('job_meetings')
        .insert({
          ...meetingData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create calendar event
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const startDateTime = new Date(`${meetingData.scheduled_date}T${meetingData.scheduled_time || '09:00'}`);
        const endDateTime = new Date(startDateTime.getTime() + (meetingData.duration_minutes || 60) * 60000);
        
        supabase.functions.invoke('create-calendar-event', {
          body: {
            jobId: meetingData.job_id,
            jobName: `${meetingData.title}${jobName ? ` - ${jobName}` : ''}`,
            startDate: startDateTime.toISOString(),
            endDate: endDateTime.toISOString(),
            location: meetingData.location || jobLocation || '',
          },
          headers: { Authorization: `Bearer ${session.access_token}` }
        }).then(({ error: calError }) => {
          if (calError) console.error('Calendar sync error:', calError);
        });
      }

      setMeetings(prev => [...prev, data as JobMeeting].sort((a, b) => 
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      ));
      
      toast({ title: 'Meeting scheduled', description: 'Meeting added and synced to calendar' });
      return data as JobMeeting;
    } catch (error: any) {
      console.error('Error adding meeting:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('job_meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      toast({ title: 'Meeting deleted' });
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return { meetings, loading, fetchMeetings, addMeeting, deleteMeeting };
}
