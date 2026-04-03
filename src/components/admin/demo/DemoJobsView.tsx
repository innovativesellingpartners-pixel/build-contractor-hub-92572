import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Calendar, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDemoData } from '@/hooks/useDemoData';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const statusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'in_progress': return 'info';
    case 'completed': return 'success';
    case 'on_hold': return 'warning';
    case 'cancelled': return 'destructive';
    default: return 'outline';
  }
};

export const DemoJobsView = () => {
  const { data: jobs = [], isLoading } = useDemoData<any>('jobs');

  const totalContractValue = jobs.reduce((sum: number, j: any) => sum + (j.contract_value || 0), 0);
  const activeJobs = jobs.filter((j: any) => j.job_status === 'in_progress');
  const completedJobs = jobs.filter((j: any) => j.job_status === 'completed');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">Jobs & Projects</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{jobs.length}</p>
            <p className="text-xs text-muted-foreground">Total Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{activeJobs.length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completedJobs.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">${totalContractValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Contract Value</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          jobs.map((job: any) => (
            <Card key={job.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-4 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="font-medium truncate">{job.project_name}</p>
                      <Badge variant={statusVariant(job.job_status)} className="text-[10px]">
                        {job.job_status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {job.job_number && <span className="font-mono">{job.job_number}</span>}
                      {job.city && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.city}, {job.state}</span>
                      )}
                      {job.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(job.start_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {(job.contract_value || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
