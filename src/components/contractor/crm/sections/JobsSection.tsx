import { useState } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Users, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import JobDetailView from '../JobDetailView';
import { AddJobDialog } from '../AddJobDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface JobsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function JobsSection({ onSectionChange }: JobsSectionProps) {
  const { jobs, loading, addJob, refreshJobs } = useJobs();
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [jobToConvert, setJobToConvert] = useState<any>(null);

  const handleJobClick = (job: any) => {
    setSelectedJob(job);
    setDetailOpen(true);
  };

  const handleConvertToCustomer = async () => {
    if (!jobToConvert || !user) return;

    try {
      const customerData = {
        user_id: user.id,
        name: jobToConvert.name,
        email: '',
        phone: '',
        address: jobToConvert.address || '',
        city: jobToConvert.city || '',
        state: jobToConvert.state || '',
        zip_code: jobToConvert.zip_code || '',
        customer_type: 'residential' as const,
        notes: jobToConvert.notes || '',
        job_id: jobToConvert.id,
      };

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (customerError) throw customerError;

      await supabase
        .from('jobs')
        .update({
          converted_at: new Date().toISOString(),
          converted_to_customer_id: newCustomer.id,
        })
        .eq('id', jobToConvert.id);

      toast.success('Job converted to customer successfully');
      setConvertDialogOpen(false);
      setJobToConvert(null);
      refreshJobs();
      if (onSectionChange) onSectionChange('customers');
    } catch (error: any) {
      toast.error('Failed to convert job to customer: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-500',
      in_progress: 'bg-yellow-500',
      completed: 'bg-green-500',
      on_hold: 'bg-orange-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="p-6">Loading jobs...</div>;
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Jobs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your active and completed jobs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onSectionChange?.('dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Contractor Hub</span>
          </Button>
          <AddJobDialog onAdd={addJob} />
        </div>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card 
            key={job.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleJobClick(job)}
          >
            <CardContent className="p-3 sm:p-4 space-y-1.5">
              <h3 className="font-semibold text-sm sm:text-base truncate">{job.name}</h3>
              {job.job_number && (
                <p className="text-xs text-muted-foreground">Job #{job.job_number}</p>
              )}
              {(job.city || job.state) && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span className="truncate">
                    {job.city}{job.city && job.state && ', '}{job.state}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        </div>

        <JobDetailView
          job={selectedJob}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onConvertToCustomer={() => {
            refreshJobs();
            if (onSectionChange) onSectionChange('customers');
          }}
        />

        <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Convert Job to Customer?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a new customer record from this job and mark the job as converted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setJobToConvert(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConvertToCustomer}>Convert</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
