import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MeetingFormData } from '@/components/contractor/crm/JobMeetingsSection';

export interface Job {
  id: string;
  user_id: string;
  customer_id?: string;
  opportunity_id?: string;
  job_number?: string;
  name: string;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string;
  end_date?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  original_estimate_id?: string;
  contract_value?: number;
  change_orders_total?: number;
  total_contract_value?: number;
  payments_collected?: number;
  expenses_total?: number;
  profit?: number;
}

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data || []) as Job[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching jobs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const addJob = async (jobData: Omit<Job, 'id' | 'user_id' | 'job_number' | 'created_at' | 'updated_at'>, meetings?: MeetingFormData[]) => {
    if (!user) return;

    try {
      // Generate job number
      const { data: jobNumber } = await supabase.rpc('generate_job_number');
      
      const { data, error } = await supabase
        .from('jobs')
        .insert([{ ...jobData, user_id: user.id, job_number: jobNumber }])
        .select()
        .single();

      if (error) throw error;

      const newJob = data as Job;
      setJobs([newJob, ...jobs]);
      
      const jobLocation = [newJob.address, newJob.city, newJob.state, newJob.zip_code].filter(Boolean).join(', ');
      
      // Get session for calendar events
      const { data: { session } } = await supabase.auth.getSession();
      
      // Save meetings and create calendar events for each
      if (meetings && meetings.length > 0 && session) {
        for (const meeting of meetings) {
          // Save meeting to database
          await supabase.from('job_meetings').insert({
            job_id: newJob.id,
            user_id: user.id,
            title: meeting.title,
            meeting_type: meeting.meeting_type,
            scheduled_date: meeting.scheduled_date,
            scheduled_time: meeting.scheduled_time,
            duration_minutes: meeting.duration_minutes,
            location: meeting.location || jobLocation,
            notes: meeting.notes,
          });
          
          // Create calendar event for the meeting
          const startDateTime = new Date(`${meeting.scheduled_date}T${meeting.scheduled_time || '09:00'}`);
          const endDateTime = new Date(startDateTime.getTime() + (meeting.duration_minutes || 60) * 60000);
          
          supabase.functions.invoke('create-calendar-event', {
            body: {
              jobId: newJob.id,
              jobName: `${newJob.job_number || ''} - ${meeting.title} - ${newJob.name}`.replace(/^[\s-]+/, ''),
              startDate: startDateTime.toISOString(),
              endDate: endDateTime.toISOString(),
              location: meeting.location || jobLocation,
            },
            headers: { Authorization: `Bearer ${session.access_token}` }
          }).catch(err => console.log('Calendar sync error:', err));
        }
      }

      toast({
        title: 'Job added',
        description: meetings?.length ? `Job created with ${meetings.length} meeting(s) scheduled` : 'New job has been added successfully',
      });
      return newJob;
    } catch (error: any) {
      toast({
        title: 'Error adding job',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateJob = async (id: string, updates: Partial<Job>) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setJobs(jobs.map(job => job.id === id ? data as Job : job));
      toast({
        title: 'Job updated',
        description: 'Job has been updated successfully',
      });
      return data as Job;
    } catch (error: any) {
      toast({
        title: 'Error updating job',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteJob = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJobs(jobs.filter(job => job.id !== id));
      toast({
        title: 'Job deleted',
        description: 'Job has been deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting job',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const duplicateJob = async (id: string) => {
    if (!user) return;

    try {
      const jobToDuplicate = jobs.find(job => job.id === id);
      if (!jobToDuplicate) throw new Error('Job not found');

      // Generate new job number
      const { data: jobNumber } = await supabase.rpc('generate_job_number');

      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          user_id: user.id,
          job_number: jobNumber,
          name: `${jobToDuplicate.name} (Copy)`,
          description: jobToDuplicate.description,
          status: 'scheduled',
          start_date: jobToDuplicate.start_date,
          end_date: jobToDuplicate.end_date,
          address: jobToDuplicate.address,
          city: jobToDuplicate.city,
          state: jobToDuplicate.state,
          zip_code: jobToDuplicate.zip_code,
          total_cost: jobToDuplicate.total_cost,
          notes: jobToDuplicate.notes,
          contract_value: jobToDuplicate.contract_value,
        }])
        .select()
        .single();

      if (error) throw error;

      const newJob = data as Job;
      setJobs([newJob, ...jobs]);
      
      // Create calendar event for duplicated job (non-blocking) - pass auth token
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          supabase.functions.invoke('create-calendar-event', {
            body: {
              jobId: newJob.id,
              jobName: `${newJob.job_number || ''} - ${newJob.name}`.replace(/^[\s-]+/, ''),
              description: newJob.description,
              startDate: newJob.start_date,
              endDate: newJob.end_date,
              address: newJob.address,
              city: newJob.city,
              state: newJob.state,
            },
            headers: { Authorization: `Bearer ${session.access_token}` }
          }).then(({ error: calError }) => {
            if (calError) {
              console.log('Calendar event creation skipped or failed:', calError);
            }
          });
        }
      });
      
      toast({
        title: 'Job duplicated',
        description: 'Job has been duplicated successfully',
      });
      return newJob;
    } catch (error: any) {
      toast({
        title: 'Error duplicating job',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    jobs,
    loading,
    addJob,
    updateJob,
    deleteJob,
    duplicateJob,
    refreshJobs: fetchJobs,
  };
};
