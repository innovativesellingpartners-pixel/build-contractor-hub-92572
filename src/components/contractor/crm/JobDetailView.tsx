import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  MapPin, Clock, TrendingUp, AlertCircle, CheckCircle, Edit, Briefcase, FileText, Calculator, Navigation, Copy, Pencil, Mail
} from 'lucide-react';
import { useJobs, Job } from '@/hooks/useJobs';
import { useJobPhotos } from '@/hooks/useJobPhotos';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import TasksTab from './job/TasksTab';
import MaterialsTab from './job/MaterialsTab';
import ChangeOrdersTab from './job/ChangeOrdersTab';
import InvoicesTab from './job/InvoicesTab';
import PSFUTab from './job/PSFUTab';
import SendLogsDialog from './job/SendLogsDialog';
import { JobFinancialSummary } from './JobFinancialSummary';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface JobDetailViewProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateEstimate?: () => void;
  onEditJob?: (job: Job) => void;
  onDuplicateJob?: (jobId: string) => Promise<Job | undefined>;
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
function DailyLogsTab({ jobId, jobName }: { jobId: string; jobName: string }) {
  const { logs, addLog, deleteLog } = useDailyLogs(jobId);
  const [showSendDialog, setShowSendDialog] = useState(false);
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
        <div className="flex gap-2">
          {logs && logs.length > 0 && (
            <Button variant="outline" onClick={() => setShowSendDialog(true)}>
              <Mail className="h-4 w-4 mr-1" /> Send Logs
            </Button>
          )}
          <Button onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? 'Cancel' : 'Add Log'}
          </Button>
        </div>
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

      <SendLogsDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        logs={logs || []}
        jobId={jobId}
        jobName={jobName}
      />
    </div>
  );
}

export default function JobDetailView({ job, open, onOpenChange, onCreateEstimate, onEditJob, onDuplicateJob }: JobDetailViewProps) {
  const { updateJob } = useJobs();
  const { user } = useAuth();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>(job?.status || 'scheduled');
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicateJob = async () => {
    if (!job || !onDuplicateJob) return;
    setIsDuplicating(true);
    try {
      const newJob = await onDuplicateJob(job.id!);
      if (newJob) {
        toast.success('Job duplicated! Opening the new job...');
        // Close current dialog and open the new job
        onOpenChange(false);
        // Small delay to allow dialog to close before opening new one
        setTimeout(() => {
          if (onEditJob) onEditJob(newJob);
        }, 300);
      }
    } catch (error) {
      // Error toast already handled in useJobs
    } finally {
      setIsDuplicating(false);
    }
  };

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

  const handleCreateEstimate = async () => {
    if (!job || !user) return;

    try {
      const fullAddress = [job.address, job.city, job.state, job.zip_code].filter(Boolean).join(', ');
      
      const { data: newEstimate, error: estimateError } = await supabase
        .from('estimates')
        .insert([{
          user_id: user.id,
          job_id: job.id,
          customer_id: job.customer_id,
          title: `Estimate for ${job.name}`,
          project_name: job.name,
          project_address: fullAddress || null,
          site_address: fullAddress || null,
          status: 'draft',
          total_amount: job.contract_value || job.total_cost || 0,
        }])
        .select()
        .single();

      if (estimateError) throw estimateError;

      toast.success('Estimate created successfully');
      setConvertDialogOpen(false);
      onOpenChange(false);
      if (onCreateEstimate) onCreateEstimate();
    } catch (error: any) {
      toast.error('Failed to create estimate: ' + error.message);
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
    
    // Use directions URL to start navigation directly
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Always use window.open to keep the app running in the background
    // Use Google Maps URL which works universally and opens in new tab/app
    const mapsUrl = isIOS 
      ? `https://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-7xl h-[calc(100vh-5rem)] sm:h-[90vh] top-[45%] sm:top-[50%] p-0">
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
                    <FileText className="h-4 w-4" />
                    <span>Create Estimate</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Create Estimate for this Job?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will create a new estimate linked to this job. You can add line items and details to the estimate next.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCreateEstimate}>Create Estimate</AlertDialogAction>
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
              {onEditJob && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => onEditJob(job)}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Job</span>
                </Button>
              )}
              {onDuplicateJob && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleDuplicateJob}
                  disabled={isDuplicating}
                >
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">{isDuplicating ? 'Duplicating...' : 'Duplicate'}</span>
                </Button>
              )}
            </div>
          </div>
          
          {getFullAddress() && (
            <Button
              onClick={handleNavigate}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 h-12 text-base justify-center"
            >
              <Navigation className="h-5 w-5 flex-shrink-0" />
              <span>START TRAVEL</span>
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="px-3 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-muted/30">
            <Card className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${(job.total_cost || 0).toFixed(0)}</div>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Start Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {job.start_date ? format(new Date(job.start_date), 'MMM d, yyyy') : 'Not set'}
                </div>
              </CardContent>
            </Card>
            <Card className="w-full">
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

          <div className="px-3 sm:px-6 py-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 gap-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm px-2">Overview</TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs sm:text-sm px-2">Tasks</TabsTrigger>
                <TabsTrigger value="materials" className="text-xs sm:text-sm px-2">Materials</TabsTrigger>
                <TabsTrigger value="change-orders" className="text-xs sm:text-sm px-2">Changes</TabsTrigger>
                <TabsTrigger value="psfu" className="text-xs sm:text-sm px-2">PSFU</TabsTrigger>
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
                <DailyLogsTab jobId={job.id!} jobName={job.name} />
              </TabsContent>

              <TabsContent value="psfu" className="mt-4">
                <PSFUTab jobId={job.id!} customerId={job.customer_id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
