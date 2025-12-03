import { useState } from 'react';
import { useJobs, Job } from '@/hooks/useJobs';
import { MapPin, Home, Copy, Eye, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import JobDetailView from '../JobDetailView';
import { AddJobDialog } from '../AddJobDialog';
import { EditJobDialog } from '../EditJobDialog';

interface JobsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function JobsSection({ onSectionChange }: JobsSectionProps) {
  const { jobs, loading, addJob, updateJob, refreshJobs, duplicateJob } = useJobs();
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

  const handleDuplicateJob = async (jobId: string): Promise<Job | undefined> => {
    const newJob = await duplicateJob(jobId);
    if (newJob) {
      setSelectedJob(newJob);
      setDetailOpen(true);
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
            <Button variant="outline" size="sm" onClick={() => onSectionChange?.('dashboard')}>
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Contractor Hub</span>
            </Button>
            <AddJobDialog onAdd={addJob} />
          </div>
        </div>

        {/* Horizontal List */}
        <div className="space-y-2">
          {jobs.map((job) => (
            <div 
              key={job.id} 
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleJobClick(job)}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate">{job.name}</h3>
                  <Badge className={`${getStatusColor(job.status)} text-white text-xs shrink-0`}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {job.job_number && <span>#{job.job_number}</span>}
                  {(job.city || job.state) && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3" />
                      {job.city}{job.city && job.state && ', '}{job.state}
                    </span>
                  )}
                </div>
                {job.contract_value && job.contract_value > 0 && (
                  <p className="text-xs font-medium text-primary mt-0.5">
                    ${job.contract_value.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
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
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateJob(job.id);
                  }}
                  className="hidden sm:flex"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateJob(job.id);
                  }}
                  className="sm:hidden h-8 w-8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {jobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No jobs yet. Create your first job to get started.
            </div>
          )}
        </div>

        <JobDetailView
          job={selectedJob}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onCreateEstimate={() => {
            refreshJobs();
            if (onSectionChange) onSectionChange('estimates');
          }}
          onEditJob={handleEditJob}
          onDuplicateJob={handleDuplicateJob}
        />

        <EditJobDialog
          job={editingJob}
          open={editOpen}
          onOpenChange={setEditOpen}
          onUpdate={handleUpdateJob}
        />
      </div>
    </div>
  );
}
