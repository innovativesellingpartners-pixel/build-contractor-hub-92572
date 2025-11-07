import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MapPin, ExternalLink, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export const AdminJobs = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:user_id (
            contact_name,
            company_name
          ),
          leads:lead_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredJobs = jobs?.filter(job =>
    job.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-500',
      in_progress: 'bg-yellow-500',
      on_hold: 'bg-orange-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">All Jobs</h2>
          <p className="text-muted-foreground">View and manage all jobs across the platform</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredJobs?.length || 0} Total Jobs
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by name, number, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Details</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs?.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{job.name}</div>
                      <div className="text-sm text-muted-foreground">{job.job_number}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {(job.profiles as any)?.company_name || (job.profiles as any)?.contact_name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {job.city && job.state ? `${job.city}, ${job.state}` : job.address || '-'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {job.budget_amount && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {job.budget_amount.toLocaleString()}
                        </div>
                      )}
                      {job.actual_cost && (
                        <div className="text-muted-foreground">
                          Actual: ${job.actual_cost.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="space-y-1">
                      {job.scheduled_start_date && (
                        <div>Start: {format(new Date(job.scheduled_start_date), 'MMM d')}</div>
                      )}
                      {job.scheduled_end_date && (
                        <div className="text-muted-foreground">
                          End: {format(new Date(job.scheduled_end_date), 'MMM d')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(job.leads as any)?.name ? (
                      <Badge variant="outline">From Lead</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">Direct</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredJobs || filteredJobs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No jobs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
