import { useState } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import JobDetailView from '../JobDetailView';
import { AddJobDialog } from '../AddJobDialog';

export default function JobsSection() {
  const { jobs, loading, addJob } = useJobs();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleJobClick = (job: any) => {
    setSelectedJob(job);
    setDetailOpen(true);
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
    <div className="w-full h-full overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Jobs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your active and completed jobs</p>
        </div>
        <AddJobDialog onAdd={addJob} />
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card 
            key={job.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleJobClick(job)}
          >
            <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg truncate">{job.name}</CardTitle>
                  {job.job_number && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{job.job_number}</p>
                  )}
                </div>
                <Badge className={`${getStatusColor(job.status)} shrink-0 text-xs`}>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
              {job.address && (
                <div className="flex items-start gap-2 text-xs sm:text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="line-clamp-2">
                    {job.address}
                    {job.city && `, ${job.city}`}
                    {job.state && `, ${job.state}`}
                  </span>
                </div>
              )}
              {(job.start_date || job.end_date) && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {job.start_date && new Date(job.start_date).toLocaleDateString()}
                    {job.start_date && job.end_date && ' - '}
                    {job.end_date && new Date(job.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {job.total_cost > 0 && (
                <p className="text-base sm:text-lg font-semibold text-primary">
                  ${job.total_cost.toLocaleString()}
                </p>
              )}
            </CardContent>
            </Card>
          ))}
        </div>

        <JobDetailView
          job={selectedJob}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </div>
    </div>
  );
}
