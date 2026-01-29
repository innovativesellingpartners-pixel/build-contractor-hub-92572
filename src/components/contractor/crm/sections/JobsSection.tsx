import { useState, useEffect } from 'react';
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
import { PredictiveSearch } from '../PredictiveSearch';
import { SwipeToArchive } from '@/components/ui/swipe-to-archive';
import { CrmNavHeader } from '../CrmNavHeader';

interface JobsSectionProps {
  onSectionChange?: (section: string) => void;
  initialJobId?: string | null;
  onClearInitialJob?: () => void;
}

export default function JobsSection({ onSectionChange, initialJobId, onClearInitialJob }: JobsSectionProps) {
  const { jobs, loading, addJob, updateJob, refreshJobs, duplicateJob, archiveJob } = useJobs();
  const { createEstimateAsync } = useEstimates();
  const { customers } = useCustomers();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Handle initial job ID to auto-open the detail view
  useEffect(() => {
    if (initialJobId && jobs && jobs.length > 0) {
      const job = jobs.find(j => j.id === initialJobId);
      if (job) {
        setSelectedJob(job);
        setDetailOpen(true);
        // Clear the initial job ID after opening
        onClearInitialJob?.();
      }
    }
  }, [initialJobId, jobs, onClearInitialJob]);

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

      const newEstimate = await createEstimateAsync(estimateData);
      toast.success('Estimate created for job!');
      
      // Close the job detail view
      setDetailOpen(false);
      
      // Navigate to the specific estimate to open it directly
      if (onSectionChange && newEstimate?.id) {
        onSectionChange(`estimate:${newEstimate.id}`);
      } else if (onSectionChange) {
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
        {/* Navigation Header */}
        <CrmNavHeader
          back
          dashboard
          onBack={() => onSectionChange?.('dashboard')}
          onDashboard={() => onSectionChange?.('dashboard')}
          sectionLabel="Jobs"
        />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Jobs</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your active and completed jobs</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <AddJobDialog 
              onAdd={addJob} 
              onJobCreated={(job) => {
                setSelectedJob(job);
                setDetailOpen(true);
              }}
            />
          </div>
        </div>

        {/* Predictive Search */}
        <PredictiveSearch
          items={jobs}
          placeholder="Search jobs by name, number, or location..."
          getLabel={(job) => job.name}
          getSublabel={(job) => [job.job_number && `#${job.job_number}`, job.city, job.state].filter(Boolean).join(' • ')}
          filterFn={(job, query) => {
            const q = query.toLowerCase();
            return (
              job.name.toLowerCase().includes(q) ||
              job.job_number?.toLowerCase().includes(q) ||
              job.address?.toLowerCase().includes(q) ||
              job.city?.toLowerCase().includes(q) ||
              job.state?.toLowerCase().includes(q) ||
              job.status?.toLowerCase().includes(q)
            );
          }}
          onSelect={handleJobClick}
        />

        {/* Horizontal List */}
        <div className="space-y-3">
          {jobs.map((job) => {
            const customer = job.customer_id ? customers?.find(c => c.id === job.customer_id) : null;
            const customerName = customer?.name || job.name;
            
            // Format name as "Last, First" if it contains a space
            const nameParts = customerName.trim().split(' ');
            const formattedName = nameParts.length > 1 
              ? `${nameParts[nameParts.length - 1]}, ${nameParts.slice(0, -1).join(' ')}`
              : customerName;
            
            // Build display: Job Number + Last, First
            const displayLabel = job.job_number 
              ? `#${job.job_number} - ${formattedName}`
              : formattedName;
            
            return (
              <SwipeToArchive 
                key={job.id} 
                onArchive={() => archiveJob(job.id)}
              >
                <HorizontalRowCard onClick={() => handleJobClick(job)}>
                  {/* Avatar */}
                  <RowAvatar 
                    initials={customerName.substring(0, 2).toUpperCase()} 
                    icon={<Briefcase className="h-5 w-5 text-primary" />} 
                  />

                  {/* Info */}
                  <RowContent>
                    <RowTitleLine>
                      <h3 className="font-semibold text-sm sm:text-base break-words">
                        {displayLabel}
                      </h3>
                      <Badge className={`${getStatusColor(job.status)} text-white text-xs`}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </RowTitleLine>
                    
                    <RowMetaLine>
                      {(job.city || job.state) && (
                        <span className="flex items-center gap-1">
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
              </SwipeToArchive>
            );
          })}

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
          onArchiveJob={archiveJob}
          onSectionChange={onSectionChange}
        />

        <EditJobDialog
          job={editingJob}
          open={editOpen}
          onOpenChange={handleCloseEditDialog}
          onUpdate={handleUpdateJob}
          onJobUpdated={(job) => {
            setSelectedJob(job);
            setDetailOpen(true);
          }}
        />
      </div>
    </div>
  );
}
