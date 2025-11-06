import { useJobs } from '@/hooks/useJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function JobsSection() {
  const { jobs, loading } = useJobs();

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage your active and completed jobs</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Job
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{job.name}</CardTitle>
                  {job.job_number && (
                    <p className="text-sm text-muted-foreground">{job.job_number}</p>
                  )}
                </div>
                <Badge className={getStatusColor(job.status)}>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>
                    {job.address}
                    {job.city && `, ${job.city}`}
                    {job.state && `, ${job.state}`}
                  </span>
                </div>
              )}
              {(job.start_date || job.end_date) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {job.start_date && new Date(job.start_date).toLocaleDateString()}
                    {job.start_date && job.end_date && ' - '}
                    {job.end_date && new Date(job.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {job.total_cost > 0 && (
                <p className="text-lg font-semibold text-primary">
                  ${job.total_cost.toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
