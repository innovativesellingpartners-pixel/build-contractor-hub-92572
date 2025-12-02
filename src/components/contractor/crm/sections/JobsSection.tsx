import { useState } from 'react';
import { useJobs, Job } from '@/hooks/useJobs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Home, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      // Update selected job to the new one and open detail view
      setSelectedJob(newJob);
      setDetailOpen(true);
    }
    return newJob;
  };

  const handleUpdateJob = async (id: string, updates: Partial<Job>) => {
    const updatedJob = await updateJob(id, updates);
    // Update selected job if it's the one being edited
    if (selectedJob?.id === id) {
      setSelectedJob(updatedJob);
    }
    return updatedJob;
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

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
          {jobs.map((job) => (
            <Card 
              key={job.id} 
              className="hover:shadow-lg transition-shadow w-full"
            >
              <CardContent className="p-4 sm:p-4 space-y-2">
                <div 
                  className="cursor-pointer"
                  onClick={() => handleJobClick(job)}
                >
                  <h3 className="font-semibold text-sm sm:text-base break-words">{job.name}</h3>
                  {job.job_number && (
                    <p className="text-xs text-muted-foreground">Job #{job.job_number}</p>
                  )}
                  {(job.city || job.state) && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      <span className="break-words">
                        {job.city}{job.city && job.state && ', '}{job.state}
                      </span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateJob(job.id);
                    }}
                    aria-label="Duplicate job"
                    title="Duplicate job"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
