import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Navigation, Copy, Pencil, FileText, Camera, ClipboardList, Package, 
  Receipt, DollarSign, Calendar, Clock, Info, Briefcase
} from 'lucide-react';
import { useJobs, Job } from '@/hooks/useJobs';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import TasksTab from './job/TasksTab';
import MaterialsTab from './job/MaterialsTab';
import ChangeOrdersTab from './job/ChangeOrdersTab';
import InvoicesTab from './job/InvoicesTab';
import PSFUTab from './job/PSFUTab';
import { useJobPhotos } from '@/hooks/useJobPhotos';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import {
  BlueBackground,
  SectionHeader,
  InfoCard,
  InfoRow,
  ActionButton,
  DetailHeader,
  StatusBadge,
  ActionButtonRow,
  TabNav,
  MoneyDisplay,
  AddressRow,
} from './sections/ProvenJobsTheme';

interface JobDetailViewBlueProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateEstimate?: () => void;
  onEditJob?: (job: Job) => void;
  onDuplicateJob?: (jobId: string) => Promise<Job | undefined>;
}

// Photos Tab Component (simplified for new theme)
function PhotosTabContent({ jobId }: { jobId: string }) {
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
    <div className="p-4 space-y-4">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Photo caption"
          className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          value={photoCaption}
          onChange={(e) => setPhotoCaption(e.target.value)}
        />
        <label className="cursor-pointer">
          <ActionButton variant="secondary" disabled={uploading}>
            {uploading ? '...' : 'Upload'}
          </ActionButton>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photos && photos.length > 0 ? (
          photos.map((photo) => (
            <InfoCard key={photo.id} className="overflow-hidden">
              <img
                src={photo.signed_url || photo.photo_url}
                alt={photo.caption || 'Job photo'}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <div className="p-2">
                {photo.caption && <p className="text-xs text-slate-700 truncate">{photo.caption}</p>}
                <p className="text-xs text-slate-500">
                  {format(new Date(photo.created_at!), 'MMM d, yyyy')}
                </p>
                <button
                  onClick={() => deletePhoto(photo.id!, photo.photo_url)}
                  className="text-xs text-red-500 mt-1 hover:underline"
                >
                  Delete
                </button>
              </div>
            </InfoCard>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-slate-500 text-sm">
            No photos yet. Upload photos to document progress.
          </div>
        )}
      </div>
    </div>
  );
}

// Daily Logs Tab (simplified)
function LogsTabContent({ jobId }: { jobId: string }) {
  const { logs, addLog, deleteLog } = useDailyLogs(jobId);
  const [isAdding, setIsAdding] = useState(false);
  const [newLog, setNewLog] = useState({
    log_date: new Date().toISOString().split('T')[0],
    weather: '',
    crew_count: '',
    hours_worked: '',
    work_completed: '',
  });

  const handleAddLog = async () => {
    await addLog({
      log_date: newLog.log_date,
      weather: newLog.weather,
      crew_count: parseInt(newLog.crew_count) || undefined,
      hours_worked: parseFloat(newLog.hours_worked) || undefined,
      work_completed: newLog.work_completed,
    });
    setNewLog({
      log_date: new Date().toISOString().split('T')[0],
      weather: '',
      crew_count: '',
      hours_worked: '',
      work_completed: '',
    });
    setIsAdding(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-end">
        <ActionButton variant="secondary" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : 'Add Log'}
        </ActionButton>
      </div>

      {isAdding && (
        <InfoCard className="p-4 space-y-3 rounded-md">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              className="px-3 py-2 border border-border rounded-md text-sm bg-background"
              value={newLog.log_date}
              onChange={(e) => setNewLog({ ...newLog, log_date: e.target.value })}
            />
            <input
              type="text"
              placeholder="Weather"
              className="px-3 py-2 border border-border rounded-md text-sm bg-background"
              value={newLog.weather}
              onChange={(e) => setNewLog({ ...newLog, weather: e.target.value })}
            />
            <input
              type="number"
              placeholder="Crew"
              className="px-3 py-2 border border-border rounded-md text-sm bg-background"
              value={newLog.crew_count}
              onChange={(e) => setNewLog({ ...newLog, crew_count: e.target.value })}
            />
            <input
              type="number"
              step="0.5"
              placeholder="Hours"
              className="px-3 py-2 border border-border rounded-md text-sm bg-background"
              value={newLog.hours_worked}
              onChange={(e) => setNewLog({ ...newLog, hours_worked: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Work Completed"
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
            rows={2}
            value={newLog.work_completed}
            onChange={(e) => setNewLog({ ...newLog, work_completed: e.target.value })}
          />
          <ActionButton variant="success" fullWidth onClick={handleAddLog}>
            Save Log
          </ActionButton>
        </InfoCard>
      )}

      <div className="space-y-3">
        {logs && logs.length > 0 ? (
          logs.map((log) => (
            <InfoCard key={log.id}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-slate-800">
                    {format(new Date(log.log_date), 'EEEE, MMM d')}
                  </p>
                  <button
                    onClick={() => deleteLog(log.id!)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {log.weather && <p><span className="text-muted-foreground">Weather:</span> {log.weather}</p>}
                  {log.crew_count && <p><span className="text-muted-foreground">Crew:</span> {log.crew_count}</p>}
                  {log.hours_worked && <p><span className="text-muted-foreground">Hours:</span> {log.hours_worked}</p>}
                </div>
                {log.work_completed && (
                  <p className="text-sm mt-2 text-slate-600">{log.work_completed}</p>
                )}
              </div>
            </InfoCard>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            No daily logs yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default function JobDetailViewBlue({ job, open, onOpenChange, onCreateEstimate, onEditJob, onDuplicateJob }: JobDetailViewBlueProps) {
  const { updateJob } = useJobs();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicateJob = async () => {
    if (!job || !onDuplicateJob) return;
    setIsDuplicating(true);
    try {
      const newJob = await onDuplicateJob(job.id!);
      if (newJob) {
        toast.success('Job duplicated!');
        onOpenChange(false);
        setTimeout(() => {
          if (onEditJob) onEditJob(newJob);
        }, 300);
      }
    } catch (error) {
      // Error handled in useJobs
    } finally {
      setIsDuplicating(false);
    }
  };

  if (!job) return null;

  const getFullAddress = () => {
    const parts = [job.address, job.city, job.state, job.zip_code].filter(Boolean);
    return parts.join(', ');
  };

  const handleNavigate = () => {
    const address = getFullAddress();
    if (!address) {
      toast.error('No address available');
      return;
    }
    const encodedAddress = encodeURIComponent(address);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const url = isIOS 
        ? `maps://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`
        : `google.navigation:q=${encodedAddress}`;
      window.location.href = url;
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateJob(job.id!, { status: newStatus as any });
    toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
  };

  const tabs = [
    { id: 'info', label: 'INFO', icon: <Info className="w-4 h-4" /> },
    { id: 'tasks', label: 'TASKS', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'materials', label: 'MATERIALS', icon: <Package className="w-4 h-4" /> },
    { id: 'changes', label: 'CHANGES', icon: <FileText className="w-4 h-4" /> },
    { id: 'invoices', label: 'INVOICES', icon: <Receipt className="w-4 h-4" /> },
    { id: 'photos', label: 'PHOTOS', icon: <Camera className="w-4 h-4" /> },
    { id: 'logs', label: 'LOGS', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl h-[90vh] sm:h-[95vh] p-0 overflow-hidden bg-background border-0 sm:border">
        <BlueBackground className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <DetailHeader
            title={job.name}
            subtitle={job.job_number || undefined}
            onBack={() => onOpenChange(false)}
            rightContent={
              <div className="flex gap-2">
                {onEditJob && (
                  <button onClick={() => onEditJob(job)} className="p-2 hover:bg-sky-600 rounded">
                    <Pencil className="w-5 h-5" />
                  </button>
                )}
                {onDuplicateJob && (
                  <button onClick={handleDuplicateJob} disabled={isDuplicating} className="p-2 hover:bg-sky-600 rounded">
                    <Copy className="w-5 h-5" />
                  </button>
                )}
              </div>
            }
          />

          {/* Action Buttons */}
          <ActionButtonRow>
            {getFullAddress() && (
              <ActionButton variant="primary" onClick={handleNavigate} className="flex-1 flex items-center justify-center gap-2">
                <Navigation className="w-4 h-4" />
                START TRAVEL
              </ActionButton>
            )}
            {job.status === 'scheduled' && (
              <ActionButton variant="success" onClick={() => handleStatusChange('in_progress')} className="flex-1">
                START JOB
              </ActionButton>
            )}
            {job.status === 'in_progress' && (
              <ActionButton variant="success" onClick={() => handleStatusChange('completed')} className="flex-1">
                COMPLETE
              </ActionButton>
            )}
          </ActionButtonRow>

          {/* Tab Navigation */}
          <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'info' && (
              <div className="space-y-0">
                {/* Job Information */}
                <SectionHeader>INFORMATION</SectionHeader>
                <InfoCard className="rounded-none">
                  <InfoRow label="Job Name" value={job.name} />
                  <InfoRow label="Job Number" value={job.job_number} />
                  <InfoRow 
                    label="Status" 
                    value={<StatusBadge status={job.status} />} 
                  />
                  {job.description && <InfoRow label="Description" value={job.description} />}
                </InfoCard>

                {/* Location */}
                {getFullAddress() && (
                  <>
                    <SectionHeader>LOCATION</SectionHeader>
                    <InfoCard className="rounded-none">
                      <AddressRow address={getFullAddress()} onNavigate={handleNavigate} />
                    </InfoCard>
                  </>
                )}

                {/* Dates */}
                <SectionHeader>JOB DATES</SectionHeader>
                <InfoCard className="rounded-none">
                  <InfoRow 
                    label="Start Date" 
                    value={job.start_date ? format(new Date(job.start_date), 'MMM d, yyyy') : null} 
                  />
                  <InfoRow 
                    label="End Date" 
                    value={job.end_date ? format(new Date(job.end_date), 'MMM d, yyyy') : null} 
                  />
                  <InfoRow 
                    label="Created" 
                    value={job.created_at ? format(new Date(job.created_at), 'MMM d, yyyy') : null} 
                  />
                </InfoCard>

                {/* Financial Summary */}
                <SectionHeader>FINANCIAL SUMMARY</SectionHeader>
                <InfoCard className="rounded-none">
                  <div className="grid grid-cols-2 gap-4 p-4">
                    <MoneyDisplay amount={job.contract_value} label="Contract Value" />
                    <MoneyDisplay amount={job.total_cost} label="Total Cost" />
                    <MoneyDisplay amount={job.payments_collected} label="Payments Collected" />
                    <MoneyDisplay amount={job.profit} label="Profit" />
                  </div>
                  <InfoRow label="Change Orders" value={`$${(job.change_orders_total || 0).toFixed(2)}`} />
                  <InfoRow label="Expenses" value={`$${(job.expenses_total || 0).toFixed(2)}`} />
                </InfoCard>

                {/* Notes */}
                {job.notes && (
                  <>
                    <SectionHeader>NOTES</SectionHeader>
                    <InfoCard className="rounded-none">
                      <div className="p-4">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{job.notes}</p>
                      </div>
                    </InfoCard>
                  </>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="p-4">
                <TasksTab jobId={job.id!} />
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="p-4">
                <MaterialsTab jobId={job.id!} />
              </div>
            )}

            {activeTab === 'changes' && (
              <div className="p-4">
                <ChangeOrdersTab jobId={job.id!} />
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="p-4">
                <InvoicesTab jobId={job.id!} customerId={job.customer_id} />
              </div>
            )}

            {activeTab === 'photos' && (
              <PhotosTabContent jobId={job.id!} />
            )}

            {activeTab === 'logs' && (
              <LogsTabContent jobId={job.id!} />
            )}
          </div>
        </BlueBackground>
      </DialogContent>
    </Dialog>
  );
}
