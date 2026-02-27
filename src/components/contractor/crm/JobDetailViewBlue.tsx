import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Navigation, Copy, Pencil, FileText, Camera, ClipboardList, Package, 
  Receipt, DollarSign, Calendar, Clock, Info, Briefcase, Upload, X, StickyNote, Archive, FilePlus, Phone, Mail, User, RefreshCw, MessageSquare, CheckSquare, Square, FileImage, BarChart3, Target, Star
} from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import { PhotoReportDialog } from './job/PhotoReportDialog';
import { cn } from '@/lib/utils';
import { useJobs, Job } from '@/hooks/useJobs';
import { useCustomers } from '@/hooks/useCustomers';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import TasksTab from './job/TasksTab';
import MaterialsTab from './job/MaterialsTab';
import ChangeOrdersTab from './job/ChangeOrdersTab';
import InvoicesTab from './job/InvoicesTab';
import PSFUTab from './job/PSFUTab';
import JobProfitabilityTab from './job/JobProfitabilityTab';
import JobBudgetTracker from './job/JobBudgetTracker';
import SendReviewRequestDialog from './SendReviewRequestDialog';
import GeneratePortalLinkDialog from './GeneratePortalLinkDialog';
import { useJobPhotos, JobPhoto } from '@/hooks/useJobPhotos';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { ImageViewer } from '@/components/ui/image-viewer';
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
  onArchiveJob?: (jobId: string) => Promise<Job | void>;
  onSectionChange?: (section: string) => void;
}

// Photos Tab Component with camera support, image viewer, notes, refresh, first photo requirement, and photo report
function PhotosTabContent({ jobId, jobName, customerName }: { jobId: string; jobName?: string; customerName?: string }) {
  const { photos, uploading, uploadPhoto, deletePhoto, updatePhotoCaption, refreshPhotos, uploadPhotoAsFirst } = useJobPhotos(jobId);
  const [photoCaption, setPhotoCaption] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Notes editing state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<JobPhoto | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  
  // First photo prompt state
  const [showFirstPhotoPrompt, setShowFirstPhotoPrompt] = useState(false);
  const [hasShownFirstPhotoPrompt, setHasShownFirstPhotoPrompt] = useState(false);
  const [pendingFirstPhoto, setPendingFirstPhoto] = useState<File | null>(null);

  // Multi-select for photo report
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const selectedPhoto = selectedPhotoIndex >= 0 && photos ? photos[selectedPhotoIndex] : null;

  // Show first photo prompt when tab opens and no photos exist
  useEffect(() => {
    if (photos && photos.length === 0 && !hasShownFirstPhotoPrompt) {
      setShowFirstPhotoPrompt(true);
      setHasShownFirstPhotoPrompt(true);
    }
  }, [photos, hasShownFirstPhotoPrompt]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // If this is the first photo (no photos exist yet), prompt for confirmation
    if (photos && photos.length === 0 && !pendingFirstPhoto) {
      setPendingFirstPhoto(files[0]);
      setShowFirstPhotoPrompt(true);
      return;
    }
    
    for (const file of Array.from(files)) {
      await uploadPhoto(file, photoCaption);
    }
    setPhotoCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleConfirmFirstPhoto = async () => {
    setShowFirstPhotoPrompt(false);
    if (pendingFirstPhoto) {
      await uploadPhotoAsFirst(pendingFirstPhoto, 'Front of Property');
      setPendingFirstPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } else {
      // User tapped "Take Front Photo" from initial prompt
      cameraInputRef.current?.click();
    }
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setViewerOpen(true);
  };

  const handlePrevious = () => {
    if (selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNext = () => {
    if (photos && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handleEditNotes = (photo: JobPhoto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingPhoto(photo);
    setEditingNotes(photo.caption || '');
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!editingPhoto) return;
    await updatePhotoCaption(editingPhoto.id, editingNotes);
    setNotesDialogOpen(false);
    setEditingPhoto(null);
  };

  const handleDelete = async (photo: JobPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this photo?')) {
      await deletePhoto(photo.id, photo.photo_url);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPhotos();
    setIsRefreshing(false);
    toast.success('Photos refreshed');
  };

  // Multi-select handlers
  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectedPhotos(new Set());
    }
    setSelectMode(!selectMode);
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const selectAll = () => {
    if (photos) {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  const deselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const handleCreateReport = () => {
    setReportDialogOpen(true);
  };

  const handlePhotoGridClick = (index: number, photo: JobPhoto) => {
    if (selectMode) {
      togglePhotoSelection(photo.id);
    } else {
      handlePhotoClick(index);
    }
  };

  const reportPhotos = selectMode && selectedPhotos.size > 0 && photos
    ? photos.filter(p => selectedPhotos.has(p.id))
    : photos || [];
  return (
    <div className="p-4 space-y-4">
      {/* First Photo Requirement Dialog */}
      <Dialog open={showFirstPhotoPrompt} onOpenChange={setShowFirstPhotoPrompt}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <Camera className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold">First Photo Required</h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>The first photo for this job should be the front of the property with the address visible.</strong>
              </p>
              <p className="text-sm text-amber-700 mt-2">
                This helps verify the job location for documentation purposes and ensures accurate record-keeping.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowFirstPhotoPrompt(false);
                  setPendingFirstPhoto(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  if (cameraInputRef.current) cameraInputRef.current.value = '';
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                onClick={handleConfirmFirstPhoto}
              >
                <Camera className="w-4 h-4 mr-2" />
                {pendingFirstPhoto ? 'Confirm Photo' : 'Take Front Photo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Select/Report buttons */}
      {photos && photos.length > 0 && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={selectMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectMode}
            className="flex-1"
          >
            {selectMode ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4 mr-1" />
                Select Photos
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCreateReport}
            className="flex-1"
          >
            <FileImage className="h-4 w-4 mr-1" />
            Photo Report
          </Button>
        </div>
      )}

      {/* Selection controls when in select mode */}
      {selectMode && photos && photos.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedPhotos.size} of {photos.length} selected
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Photo caption (optional)"
          className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          value={photoCaption}
          onChange={(e) => setPhotoCaption(e.target.value)}
        />
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 bg-muted hover:bg-muted/80 rounded-md disabled:opacity-50"
          title="Refresh photos"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          Take Photo
        </button>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePhotoUpload}
        disabled={uploading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoUpload}
        disabled={uploading}
      />

      <div className="grid grid-cols-2 gap-3">
        {photos && photos.length > 0 ? (
          photos.map((photo, index) => (
            <div 
              key={photo.id} 
              className={cn(
                "relative group cursor-pointer",
                selectMode && selectedPhotos.has(photo.id) && "ring-2 ring-primary ring-offset-2 rounded-lg"
              )}
              onClick={() => handlePhotoGridClick(index, photo)}
            >
              <InfoCard className="overflow-hidden">
                <img
                  src={photo.signed_url || photo.photo_url}
                  alt={photo.caption || 'Job photo'}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="p-2">
                  {photo.caption && <p className="text-xs text-muted-foreground truncate">{photo.caption}</p>}
                  <p className="text-xs text-muted-foreground/70">
                    {format(new Date(photo.created_at!), 'MMM d, yyyy')}
                  </p>
                </div>
              </InfoCard>
              
              {/* Selection checkbox overlay */}
              {selectMode && (
                <div 
                  className="absolute top-2 left-2 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhotoSelection(photo.id);
                  }}
                >
                  {selectedPhotos.has(photo.id) ? (
                    <CheckSquare className="h-6 w-6 text-primary bg-white rounded" />
                  ) : (
                    <Square className="h-6 w-6 text-muted-foreground bg-white/80 rounded" />
                  )}
                </div>
              )}

              {/* Delete button - only show when not in select mode */}
              {!selectMode && (
                <button
                  onClick={(e) => handleDelete(photo, e)}
                  className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Notes button - only show when not in select mode */}
              {!selectMode && (
                <button
                  onClick={(e) => handleEditNotes(photo, e)}
                  className={`absolute top-2 left-2 p-1.5 rounded-full transition-opacity ${
                    photo.caption 
                      ? 'bg-primary text-primary-foreground opacity-100' 
                      : 'bg-muted/90 text-muted-foreground opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
                  }`}
                  title={photo.caption ? 'Edit notes' : 'Add notes'}
                >
                  <StickyNote className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
            No photos yet. Upload or take photos to document progress.
          </div>
        )}
      </div>

      {/* Create report button when photos are selected */}
      {selectMode && selectedPhotos.size > 0 && (
        <Button 
          className="w-full" 
          onClick={handleCreateReport}
        >
          <FileImage className="h-4 w-4 mr-2" />
          Create Report with {selectedPhotos.size} Photo{selectedPhotos.size !== 1 ? 's' : ''}
        </Button>
      )}

      {/* Image Viewer with navigation */}
      {selectedPhoto && (
        <ImageViewer
          src={selectedPhoto.signed_url || selectedPhoto.photo_url}
          alt={selectedPhoto.caption || 'Job photo'}
          open={viewerOpen}
          onOpenChange={(open) => {
            setViewerOpen(open);
            if (!open) setSelectedPhotoIndex(-1);
          }}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={selectedPhotoIndex > 0}
          hasNext={photos ? selectedPhotoIndex < photos.length - 1 : false}
          currentIndex={selectedPhotoIndex}
          totalCount={photos?.length || 0}
          caption={selectedPhoto.caption}
          onEditCaption={() => handleEditNotes(selectedPhoto)}
        />
      )}

      {/* Photo Report Dialog */}
      <PhotoReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        photos={reportPhotos}
        jobName={jobName}
        customerName={customerName}
      />

      {/* Notes Edit Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Photo Notes
            </h3>
            {editingPhoto && (
              <>
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  <img
                    src={editingPhoto.signed_url || editingPhoto.photo_url}
                    alt="Photo preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    placeholder="Add notes about this photo..."
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background resize-none"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNotes}>
                    Save Notes
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Daily Logs Tab (simplified)
function LogsTabContent({ jobId, jobName }: { jobId: string; jobName: string }) {
  const { logs, addLog, deleteLog } = useDailyLogs(jobId);
  const [isAdding, setIsAdding] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
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
      <div className="flex justify-end gap-2">
        {logs && logs.length > 0 && (
          <ActionButton variant="secondary" onClick={() => setShowSendDialog(true)}>
            <Mail className="h-4 w-4 mr-1" /> Send Logs
          </ActionButton>
        )}
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

export default function JobDetailViewBlue({ job, open, onOpenChange, onCreateEstimate, onEditJob, onDuplicateJob, onArchiveJob, onSectionChange }: JobDetailViewBlueProps) {
  const { updateJob, refreshJobs } = useJobs();
  const { customers, refreshCustomers } = useCustomers();
  const { user } = useAuth();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showTravelDialog, setShowTravelDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showPortalLinkDialog, setShowPortalLinkDialog] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState('15');
  const [isSendingETA, setIsSendingETA] = useState(false);
  
  // Find the customer associated with this job
  const customer = job?.customer_id ? customers.find(c => c.id === job.customer_id) : null;
  const [isArchiving, setIsArchiving] = useState(false);
  
  // Pull to refresh functionality
  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshJobs(), refreshCustomers()]);
    toast.success('Refreshed!');
  }, [refreshJobs, refreshCustomers]);
  
  const { isRefreshing, pullDistance, handlers, containerRef } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });
  
  // Persist activeTab in sessionStorage to maintain state across refreshes
  const storageKey = job ? `job-detail-tab-${job.id}` : 'job-detail-tab';
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(storageKey) || 'info';
    }
    return 'info';
  });
  
  // Update sessionStorage when activeTab changes
  useEffect(() => {
    if (job && open) {
      sessionStorage.setItem(storageKey, activeTab);
    }
  }, [activeTab, job, open, storageKey]);
  
  // Clean up sessionStorage when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && job) {
      sessionStorage.removeItem(storageKey);
    }
    onOpenChange(newOpen);
  };

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

  const handleArchiveJob = async () => {
    if (!job || !onArchiveJob) return;
    setIsArchiving(true);
    try {
      await onArchiveJob(job.id!);
      toast.success('Job archived!');
      onOpenChange(false);
    } catch (error) {
      // Error handled in useJobs
    } finally {
      setIsArchiving(false);
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
    // Show travel dialog to optionally send ETA message
    setShowTravelDialog(true);
  };

  const openMaps = () => {
    const address = getFullAddress();
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    const mapsUrl = isIOS 
      ? `https://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendETAAndNavigate = async () => {
    if (!customer?.phone) {
      toast.error('No customer phone number available');
      openMaps();
      setShowTravelDialog(false);
      return;
    }

    setIsSendingETA(true);
    try {
      const { error } = await supabase.functions.invoke('send-meeting-sms', {
        body: {
          phoneNumber: customer.phone,
          message: `Hi ${customer.name}, I'm on my way! Estimated arrival: ${etaMinutes} minutes.`,
          type: 'en_route'
        }
      });

      if (error) throw error;
      toast.success(`"On my way" message sent to ${customer.name}`);
    } catch (error: any) {
      console.error('Error sending ETA:', error);
      toast.error('Message could not be sent, but navigating anyway');
    } finally {
      setIsSendingETA(false);
      openMaps();
      setShowTravelDialog(false);
    }
  };

  const handleSkipAndNavigate = () => {
    openMaps();
    setShowTravelDialog(false);
  };

  const handleStatusChange = (newStatus: string) => {
    updateJob(job.id!, { status: newStatus as any });
    toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
  };

  const tabs = [
    { id: 'info', label: 'INFO', icon: <Info className="w-4 h-4" /> },
    { id: 'profitability', label: 'P&L', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'budget', label: 'BUDGET', icon: <Target className="w-4 h-4" /> },
    { id: 'tasks', label: 'TASKS', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'materials', label: 'MATERIALS', icon: <Package className="w-4 h-4" /> },
    { id: 'changes', label: 'CHANGES', icon: <FileText className="w-4 h-4" /> },
    { id: 'invoices', label: 'INVOICES', icon: <Receipt className="w-4 h-4" /> },
    { id: 'photos', label: 'PHOTOS', icon: <Camera className="w-4 h-4" /> },
    { id: 'logs', label: 'LOGS', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="w-full h-full max-w-full max-h-full rounded-none border-0 p-0 overflow-hidden bg-background fixed inset-0 translate-x-0 translate-y-0 top-0 left-0"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <BlueBackground className="h-full flex flex-col overflow-hidden pb-0 sm:pb-0">
          {/* Header */}
          <DetailHeader
            title={job.name}
            subtitle={job.job_number || undefined}
            onBack={() => handleOpenChange(false)}
            onDashboard={onSectionChange ? () => { onSectionChange('dashboard'); handleOpenChange(false); } : undefined}
            rightContent={
              <div className="flex gap-2">
                {onArchiveJob && (
                  <button 
                    onClick={handleArchiveJob} 
                    disabled={isArchiving} 
                    className="p-2 hover:bg-sky-600 rounded"
                    title="Archive Job"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                )}
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

          {/* Content - extra bottom padding to clear nav bar with pull-to-refresh */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto pb-32 relative"
            onTouchStart={handlers.onTouchStart}
            onTouchMove={handlers.onTouchMove}
            onTouchEnd={handlers.onTouchEnd}
            style={{ 
              transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : 'none',
              transition: isRefreshing ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            <PullToRefreshIndicator 
              pullDistance={pullDistance} 
              isRefreshing={isRefreshing} 
              threshold={80}
            />

            {/* Action Buttons - scrolls with content */}
            <ActionButtonRow className="flex-wrap">
              {/* Convert to Estimate - Top priority action */}
              {onCreateEstimate && (
                <ActionButton 
                  variant="primary" 
                  onClick={onCreateEstimate}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  CREATE ESTIMATE
                </ActionButton>
              )}
              <ActionButton 
                variant="secondary" 
                onClick={() => setActiveTab('invoices')} 
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                CREATE INVOICE
              </ActionButton>
              {getFullAddress() && (
                <ActionButton variant="muted" onClick={handleNavigate} className="flex-1 flex items-center justify-center gap-2">
                  <Navigation className="w-4 h-4" />
                  START TRAVEL
                </ActionButton>
              )}
              <ActionButton 
                variant="muted" 
                onClick={() => setActiveTab('changes')} 
                className="flex-1 flex items-center justify-center gap-2"
              >
                <FilePlus className="w-4 h-4" />
                CHANGE ORDER
              </ActionButton>
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
              {(job.status === 'completed' || job.job_status === 'completed') && (
                <ActionButton variant="muted" onClick={() => setShowReviewDialog(true)} className="flex-1 flex items-center justify-center gap-2">
                  <Star className="w-4 h-4" />
                  REQUEST REVIEW
                </ActionButton>
              )}
              <ActionButton variant="muted" onClick={() => setShowPortalLinkDialog(true)} className="flex-1 flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                PORTAL LINK
              </ActionButton>
            </ActionButtonRow>

            {/* Tab Navigation */}
            <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

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

                {/* Customer Contact */}
                {customer && (
                  <>
                    <SectionHeader>CUSTOMER CONTACT</SectionHeader>
                    <InfoCard className="rounded-none">
                      <InfoRow 
                        label="Name" 
                        value={
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {customer.name}
                          </span>
                        } 
                      />
                      {customer.phone && (
                        <InfoRow 
                          label="Phone" 
                          value={
                            <a 
                              href={`tel:${customer.phone}`} 
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <Phone className="w-4 h-4" />
                              {customer.phone}
                            </a>
                          } 
                        />
                      )}
                      {customer.email && (
                        <InfoRow 
                          label="Email" 
                          value={
                            <a 
                              href={`mailto:${customer.email}`} 
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <Mail className="w-4 h-4" />
                              {customer.email}
                            </a>
                          } 
                        />
                      )}
                      {customer.company && (
                        <InfoRow label="Company" value={customer.company} />
                      )}
                    </InfoCard>
                  </>
                )}
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

            {activeTab === 'profitability' && (
              <div className="p-4">
                <JobProfitabilityTab job={job} />
              </div>
            )}

            {activeTab === 'budget' && (
              <div className="p-4">
                <JobBudgetTracker job={job} />
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
              <PhotosTabContent jobId={job.id!} jobName={job.name} customerName={customer?.name} />
            )}

            {activeTab === 'logs' && (
              <LogsTabContent jobId={job.id!} jobName={job.name} />
            )}
          </div>
        </BlueBackground>
      </DialogContent>

      {/* Start Travel ETA Dialog */}
      <Dialog open={showTravelDialog} onOpenChange={setShowTravelDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Start Travel</h3>
                <p className="text-sm text-muted-foreground">Send an "On my way" message?</p>
              </div>
            </div>

            {customer?.phone ? (
              <>
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <p className="text-sm">
                    Send a message to <strong>{customer?.name}</strong> at <strong>{customer?.phone}</strong> with your ETA.
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">ETA:</label>
                    <select 
                      value={etaMinutes}
                      onChange={(e) => setEtaMinutes(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm bg-background"
                    >
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="20">20 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSkipAndNavigate}
                    className="flex-1"
                  >
                    Skip & Navigate
                  </Button>
                  <Button
                    onClick={handleSendETAAndNavigate}
                    disabled={isSendingETA}
                    className="flex-1"
                  >
                    {isSendingETA ? 'Sending...' : 'Send & Navigate'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  No phone number available for this customer. You can still navigate to the job site.
                </p>
                <Button onClick={handleSkipAndNavigate} className="w-full">
                  <Navigation className="w-4 h-4 mr-2" />
                  Open Maps
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Request Dialog */}
      <SendReviewRequestDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        jobId={job.id!}
        jobName={job.name}
        customerName={customer?.name}
        customerPhone={customer?.phone}
      />

      {/* Portal Link Dialog */}
      <GeneratePortalLinkDialog
        open={showPortalLinkDialog}
        onOpenChange={setShowPortalLinkDialog}
        jobId={job.id!}
        customerId={job.customer_id}
        customerPhone={customer?.phone}
        customerEmail={customer?.email}
      />
    </Dialog>
  );
}
