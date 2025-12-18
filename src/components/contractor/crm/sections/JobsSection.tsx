import { useState } from 'react';
import { useJobs, Job } from '@/hooks/useJobs';
import { useEstimates } from '@/hooks/useEstimates';
import { useCustomers } from '@/hooks/useCustomers';
import { MapPin, Home, Copy, Eye, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import JobDetailViewBlue from '../JobDetailViewBlue';
import { AddJobDialog } from '../AddJobDialog';
import { EditJobDialog } from '../EditJobDialog';
import { HorizontalRowCard, RowAvatar, RowContent, RowTitleLine, RowMetaLine, RowAmount, RowActions } from './HorizontalRowCard';

interface JobsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function JobsSection({ onSectionChange }: JobsSectionProps) {
  const { jobs, loading, addJob, updateJob, refreshJobs, duplicateJob } = useJobs();
  const { createEstimateAsync } = useEstimates();
  const { customers } = useCustomers();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setDetailOpen(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setEditOpen(true);
  };

  // When closing edit dialog, return to detail view
  const handleCloseEditDialog = (open: boolean) => {
    if (!open) {
      setEditOpen(false);
      // Refresh the job and reopen detail view if we have a selected job
      if (selectedJob) {
        const updatedJob = jobs.find(j => j.id === selectedJob.id);
        if (updatedJob) {
          setSelectedJob(updatedJob);
        }
        setDetailOpen(true);
      }
    } else {
      setEditOpen(open);
    }
  };

  const handleDuplicateJob = async (jobId: string): Promise<Job | undefined> => {
    const newJob = await duplicateJob(jobId);
    if (newJob) {
      // Open the new job in edit mode immediately
      setDetailOpen(false);
      setEditingJob(newJob);
      setEditOpen(true);
    }
    return newJob;
  };

  const handleUpdateJob = async (id: string, updates: Partial<Job>) => {
    const updatedJob = await updateJob(id, updates);
    if (selectedJob?.id === id) {
      setSelectedJob(updatedJob);
    }
    return updatedJob;
  };

  const handleCreateEstimateFromJob = async () => {
    if (!selectedJob) return;
    
    try {
      const customer = selectedJob.customer_id ? customers?.find(c => c.id === selectedJob.customer_id) : null;
      const fullAddress = [selectedJob.address, selectedJob.city, selectedJob.state, selectedJob.zip_code].filter(Boolean).join(', ');
      
      const estimateData = {
        title: `Estimate for ${selectedJob.name}`,
        job_id: selectedJob.id,
        customer_id: selectedJob.customer_id || undefined,
        client_name: customer?.name || selectedJob.name,
        client_email: customer?.email || undefined,
        client_phone: customer?.phone || undefined,
        client_address: fullAddress || undefined,
        site_address: fullAddress || undefined,
        project_name: selectedJob.name,
        status: 'draft' as const,
        total_amount: selectedJob.contract_value || 0,
      };

      await createEstimateAsync(estimateData);
      toast.success('Estimate created for job!');
      
      if (onSectionChange) {
        onSectionChange('estimates');
      }
    } catch (error: any) {
      toast.error('Failed to create estimate: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-500',
      in_progress: 'bg-yellow-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
      on_hold: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="p-6">Loading jobs...</div>;
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-24 sm:pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full sm:max-w-7xl sm:mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Jobs</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your active and completed jobs</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <AddJobDialog onAdd={addJob} />
          </div>
        </div>

        {/* Horizontal List */}
        <div className="space-y-3">
          {jobs.map((job) => (
            <HorizontalRowCard key={job.id} onClick={() => handleJobClick(job)}>
              {/* Avatar */}
              <RowAvatar 
                initials="" 
                icon={<Briefcase className="h-5 w-5 text-primary" />} 
              />

              {/* Info */}
              <RowContent>
                <RowTitleLine>
                  <h3 className="font-semibold text-sm sm:text-base truncate max-w-[200px]">
                    {job.name}
                  </h3>
                  <Badge className={`${getStatusColor(job.status)} text-white text-xs`}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </RowTitleLine>
                
                <RowMetaLine>
                  {job.job_number && <span className="font-medium">#{job.job_number}</span>}
                  {(job.city || job.state) && (
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {job.city}{job.city && job.state && ', '}{job.state}
                    </span>
                  )}
                </RowMetaLine>
              </RowContent>

              {/* Amount */}
              {job.contract_value && job.contract_value > 0 ? (
                <RowAmount amount={job.contract_value} />
              ) : (
                <div className="min-w-[100px]" />
              )}

              {/* Actions */}
              <RowActions>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJobClick(job);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateJob(job.id);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
              </RowActions>
            </HorizontalRowCard>
          ))}

          {jobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No jobs yet. Create your first job to get started.
            </div>
          )}
        </div>

        <JobDetailViewBlue
          job={selectedJob}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onCreateEstimate={handleCreateEstimateFromJob}
          onEditJob={handleEditJob}
          onDuplicateJob={handleDuplicateJob}
        />

        <EditJobDialog
          job={editingJob}
          open={editOpen}
          onOpenChange={handleCloseEditDialog}
          onUpdate={handleUpdateJob}
        />
      </div>
    </div>
  );
}
