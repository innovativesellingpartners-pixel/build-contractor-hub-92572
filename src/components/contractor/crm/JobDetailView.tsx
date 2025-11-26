import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  MapPin, Clock, TrendingUp, AlertCircle, CheckCircle, Edit, Briefcase, Users, Calculator, Navigation 
} from 'lucide-react';
import { useJobs, Job } from '@/hooks/useJobs';
import { useJobPhotos } from '@/hooks/useJobPhotos';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import TasksTab from './job/TasksTab';
import MaterialsTab from './job/MaterialsTab';
import ChangeOrdersTab from './job/ChangeOrdersTab';
import InvoicesTab from './job/InvoicesTab';
import { JobFinancialSummary } from './JobFinancialSummary';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface JobDetailViewProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvertToCustomer?: () => void;
}

// Photos Tab Component
function PhotosTab({ jobId }: { jobId: string }) {
  const { photos, uploading, uploadPhoto, deletePhoto } = useJobPhotos(jobId);
  const [photoCaption, setPhotoCaption] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadPhoto(file, photoCaption);
      setPhotoCaption('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Job Photos</h3>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Photo caption"
            className="px-3 py-2 border rounded-md text-sm"
            value={photoCaption}
            onChange={(e) => setPhotoCaption(e.target.value)}
          />
          <label className="cursor-pointer">
            <Button disabled={uploading} asChild>
              <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos && photos.length > 0 ? (
          photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <img
                src={photo.signed_url || photo.photo_url}
                alt={photo.caption || 'Job photo'}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  console.error('Failed to load photo:', photo.id);
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <CardContent className="p-3">
                {photo.caption && <p className="text-sm">{photo.caption}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(photo.created_at!), 'MMM d, yyyy')}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => deletePhoto(photo.id!, photo.photo_url)}
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              No photos yet. Upload photos to document job progress.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Daily Logs Tab Component
function DailyLogsTab({ jobId }: { jobId: string }) {
  const { logs, addLog, deleteLog } = useDailyLogs(jobId);
  const [isAdding, setIsAdding] = useState(false);
  const [newLog, setNewLog] = useState({
    log_date: new Date().toISOString().split('T')[0],
    weather: '',
    crew_count: '',
    hours_worked: '',
    work_completed: '',
    materials_used: '',
    equipment_used: '',
    notes: '',
  });

  const handleAddLog = async () => {
    await addLog({
      log_date: newLog.log_date,
      weather: newLog.weather,
      crew_count: parseInt(newLog.crew_count) || undefined,
      hours_worked: parseFloat(newLog.hours_worked) || undefined,
      work_completed: newLog.work_completed,
      materials_used: newLog.materials_used,
      equipment_used: newLog.equipment_used,
      notes: newLog.notes,
    });
    setNewLog({
      log_date: new Date().toISOString().split('T')[0],
      weather: '',
      crew_count: '',
      hours_worked: '',
      work_completed: '',
      materials_used: '',
      equipment_used: '',
      notes: '',
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Daily Logs</h3>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : 'Add Log'}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="px-3 py-2 border rounded-md"
                value={newLog.log_date}
                onChange={(e) => setNewLog({ ...newLog, log_date: e.target.value })}
              />
              <input
                type="text"
                placeholder="Weather"
                className="px-3 py-2 border rounded-md"
                value={newLog.weather}
                onChange={(e) => setNewLog({ ...newLog, weather: e.target.value })}
              />
              <input
                type="number"
                placeholder="Crew Count"
                className="px-3 py-2 border rounded-md"
                value={newLog.crew_count}
                onChange={(e) => setNewLog({ ...newLog, crew_count: e.target.value })}
              />
              <input
                type="number"
                step="0.5"
                placeholder="Hours Worked"
                className="px-3 py-2 border rounded-md"
                value={newLog.hours_worked}
                onChange={(e) => setNewLog({ ...newLog, hours_worked: e.target.value })}
              />
            </div>
            <textarea
              placeholder="Work Completed"
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              value={newLog.work_completed}
              onChange={(e) => setNewLog({ ...newLog, work_completed: e.target.value })}
            />
            <textarea
              placeholder="Materials Used"
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              value={newLog.materials_used}
              onChange={(e) => setNewLog({ ...newLog, materials_used: e.target.value })}
            />
            <textarea
              placeholder="Equipment Used"
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              value={newLog.equipment_used}
              onChange={(e) => setNewLog({ ...newLog, equipment_used: e.target.value })}
            />
            <textarea
              placeholder="Notes"
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              value={newLog.notes}
              onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
            />
            <Button onClick={handleAddLog} className="w-full">
              Save Log
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {logs && logs.length > 0 ? (
          logs.map((log) => (
            <Card key={log.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">
                    {format(new Date(log.log_date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteLog(log.id!)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {log.weather && <p><strong>Weather:</strong> {log.weather}</p>}
                {log.crew_count && <p><strong>Crew:</strong> {log.crew_count} people</p>}
                {log.hours_worked && <p><strong>Hours:</strong> {log.hours_worked}</p>}
                {log.work_completed && <p><strong>Work Completed:</strong> {log.work_completed}</p>}
                {log.materials_used && <p><strong>Materials:</strong> {log.materials_used}</p>}
                {log.equipment_used && <p><strong>Equipment:</strong> {log.equipment_used}</p>}
                {log.notes && <p><strong>Notes:</strong> {log.notes}</p>}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No daily logs yet. Add logs to track daily progress.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function JobDetailView({ job, open, onOpenChange, onConvertToCustomer }: JobDetailViewProps) {
  const { updateJob } = useJobs();
  const { user } = useAuth();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>(job?.status || 'scheduled');
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  if (!job) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-green-500';
      case 'on_hold':
        return 'bg-gray-500';
      case 'inspection_pending':
        return 'bg-orange-500';
      case 'completed':
        return 'bg-teal-500';
      case 'closed':
        return 'bg-slate-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'closed':
        return <CheckCircle className="h-5 w-5" />;
      case 'on_hold':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const handleStatusUpdate = () => {
    updateJob(job.id!, { status: jobStatus as any });
    setIsEditingStatus(false);
  };

  const handleConvertToCustomer = async () => {
    if (!job || !user) return;

    try {
      const customerData = {
        user_id: user.id,
        name: job.name,
        email: '',
        phone: '',
        address: job.address || '',
        city: job.city || '',
        state: job.state || '',
        zip_code: job.zip_code || '',
        customer_type: 'residential' as const,
        notes: job.notes || '',
        job_id: job.id,
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
        .eq('id', job.id);

      toast.success('Job converted to customer successfully');
      setConvertDialogOpen(false);
      onOpenChange(false);
      if (onConvertToCustomer) onConvertToCustomer();
    } catch (error: any) {
      toast.error('Failed to convert job to customer: ' + error.message);
    }
  };

  const isOverBudget = (job.total_cost || 0) > 0; // Simplified for now
  const isDelayed = job.end_date && new Date() > new Date(job.end_date) && 
                   job.status !== 'completed';

  const getFullAddress = () => {
    const parts = [job.address, job.city, job.state, job.zip_code].filter(Boolean);
    return parts.join(', ');
  };

  const handleNavigate = () => {
    const address = getFullAddress();
    if (!address) {
      toast.error('No address available for this job');
      return;
    }
    
    // Use geo: URL for mobile devices, opens default navigation app
    const encodedAddress = encodeURIComponent(address);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For iOS and Android, use platform-specific URL schemes
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const url = isIOS 
        ? `maps://maps.apple.com/?q=${encodedAddress}`
        : `geo:0,0?q=${encodedAddress}`;
      window.location.href = url;
    } else {
      // For desktop, open Google Maps in new tab
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-7xl h-[90vh] p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold mb-1">{job.name}</DialogTitle>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="font-medium">{job.job_number}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isDelayed && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Delayed
                </Badge>
              )}
              <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                    <Users className="h-4 w-4" />
                    <span>Convert to Customer</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Convert Job to Customer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will create a new customer record from this job and mark the job as converted. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConvertToCustomer}>Convert</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {isEditingStatus ? (
                <div className="flex items-center gap-2">
                  <Select value={jobStatus} onValueChange={(value) => setJobStatus(value)}>
                    <SelectTrigger className="w-[120px] sm:w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleStatusUpdate}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingStatus(false)}>Cancel</Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className={`${getStatusColor(job.status)} text-white hover:opacity-90 hidden sm:flex`}
                  onClick={() => {
                    setJobStatus(job.status);
                    setIsEditingStatus(true);
                  }}
                >
                  {getStatusIcon(job.status)}
                  <span className="ml-2 capitalize">{job.status.replace('_', ' ')}</span>
                  <Edit className="h-3 w-3 ml-2" />
                </Button>
              )}
            </div>
          </div>
          
          {getFullAddress() && (
            <Button
              onClick={handleNavigate}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2 h-12"
            >
              <Navigation className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{getFullAddress()}</span>
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${(job.total_cost || 0).toFixed(0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Start Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {job.start_date ? format(new Date(job.start_date), 'MMM d, yyyy') : 'Not set'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">End Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {job.end_date ? format(new Date(job.end_date), 'MMM d, yyyy') : 'Not set'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="px-4 sm:px-6 py-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs sm:text-sm">Tasks</TabsTrigger>
                <TabsTrigger value="materials" className="text-xs sm:text-sm">Materials</TabsTrigger>
                <TabsTrigger value="change-orders" className="text-xs sm:text-sm">Changes</TabsTrigger>
                <TabsTrigger value="invoices" className="hidden sm:inline-flex">Invoices</TabsTrigger>
                <TabsTrigger value="photos" className="hidden sm:inline-flex">Photos</TabsTrigger>
                <TabsTrigger value="logs" className="hidden sm:inline-flex">Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {job.description && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                          <p className="text-sm">{job.description}</p>
                        </div>
                      )}
                      {job.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                          <p className="text-sm text-muted-foreground">{job.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {job.address && <p className="text-sm">{job.address}</p>}
                      {(job.city || job.state) && (
                        <p className="text-sm">
                          {job.city}{job.city && job.state && ', '}{job.state} {job.zip_code}
                        </p>
                      )}
                      {!job.address && !job.city && !job.state && (
                        <p className="text-sm text-muted-foreground">No location specified</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="financials" className="mt-4">
                <JobFinancialSummary 
                  jobId={job.id!} 
                  estimatedCost={job.total_cost || 0}
                  actualCost={0}
                />
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <TasksTab jobId={job.id!} />
              </TabsContent>

              <TabsContent value="materials" className="mt-4">
                <MaterialsTab jobId={job.id!} />
              </TabsContent>

              <TabsContent value="change-orders" className="mt-4">
                <ChangeOrdersTab jobId={job.id!} />
              </TabsContent>

              <TabsContent value="invoices" className="mt-4">
                <InvoicesTab jobId={job.id!} customerId={job.customer_id} />
              </TabsContent>

              <TabsContent value="photos" className="mt-4">
                <PhotosTab jobId={job.id!} />
              </TabsContent>

              <TabsContent value="logs" className="mt-4">
                <DailyLogsTab jobId={job.id!} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
