import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { LocationAutocomplete, AddressData } from '@/components/ui/location-autocomplete';
import { FileText, MapPin, DollarSign, Camera, CalendarDays, Save, X } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { JobMeetingsSection, MeetingFormData } from './JobMeetingsSection';
import { useJobMeetings } from '@/hooks/useJobMeetings';
import { JobPhotosSection } from './job/JobPhotosSection';
import { AIScopeNotes } from './AIScopeNotes';

interface EditJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Job>) => Promise<any>;
  onJobUpdated?: (job: Job) => void;
}

export function EditJobDialog({ job, open, onOpenChange, onUpdate, onJobUpdated }: EditJobDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'scheduled' as Job['status'],
    start_date: '',
    end_date: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    total_cost: '',
    notes: '',
    contract_value: '',
  });
  const [newMeetings, setNewMeetings] = useState<MeetingFormData[]>([]);
  const { meetings: existingMeetings, addMeeting, deleteMeeting, loading: meetingsLoading } = useJobMeetings(job?.id);

  useEffect(() => {
    if (job) {
      setFormData({
        name: job.name || '',
        description: job.description || '',
        status: job.status || 'scheduled',
        start_date: job.start_date || '',
        end_date: job.end_date || '',
        address: job.address || '',
        city: job.city || '',
        state: job.state || '',
        zip_code: job.zip_code || '',
        total_cost: job.total_cost ? String(job.total_cost) : '',
        notes: job.notes || '',
        contract_value: job.contract_value ? String(job.contract_value) : '',
      });
      setNewMeetings([]);
    }
  }, [job]);

  const handleAddNewMeeting = (meeting: MeetingFormData) => {
    setNewMeetings(prev => [...prev, meeting]);
  };

  const handleRemoveNewMeeting = (index: number) => {
    setNewMeetings(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateNewMeeting = (index: number, meeting: MeetingFormData) => {
    setNewMeetings(prev => prev.map((m, i) => i === index ? meeting : m));
  };

  const jobLocation = [formData.address, formData.city, formData.state, formData.zip_code].filter(Boolean).join(', ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    
    try {
      const updatedJob = await onUpdate(job.id!, {
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip_code: formData.zip_code || undefined,
        total_cost: parseFloat(formData.total_cost) || 0,
        notes: formData.notes || undefined,
        contract_value: parseFloat(formData.contract_value) || 0,
      });
      
      for (const meeting of newMeetings) {
        await addMeeting({
          job_id: job.id!,
          title: meeting.title,
          meeting_type: meeting.meeting_type,
          scheduled_date: meeting.scheduled_date,
          scheduled_time: meeting.scheduled_time,
          duration_minutes: meeting.duration_minutes,
          location: meeting.location || jobLocation,
          notes: meeting.notes,
        }, job.name, jobLocation, job.job_number);
      }
      
      onOpenChange(false);
      if (updatedJob && onJobUpdated) {
        onJobUpdated(updatedJob);
      }
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full max-h-full rounded-none border-0 overflow-hidden flex flex-col fixed inset-0 translate-x-0 translate-y-0 top-0 left-0 p-0">
        {/* Sticky header */}
        <div className="flex-shrink-0 bg-card border-b px-4 py-3 md:px-6 md:py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg md:text-xl font-bold">Edit Job</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">Job #{job.job_number}</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="gap-1.5">
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button type="submit" form="edit-job-form" size="sm" className="gap-1.5">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
        
        <form id="edit-job-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-4 md:px-6 md:py-6 space-y-5">
            
            {/* Basic Information Card */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Basic Information</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Title *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Smith Kitchen Renovation"
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Brief description of the work"
                    className="resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                    <SearchableSelect
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as Job['status'] })}
                      placeholder="Select status..."
                      searchPlaceholder="Search..."
                      options={[
                        { value: 'scheduled', label: 'Scheduled' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'on_hold', label: 'On Hold' },
                        { value: 'cancelled', label: 'Cancelled' },
                      ]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Location</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Street Address</Label>
                  <LocationAutocomplete
                    value={formData.address}
                    onChange={(value) => setFormData({ ...formData, address: value })}
                    onAddressSelect={(data) => {
                      setFormData(prev => ({
                        ...prev,
                        address: data.address1,
                        city: data.city,
                        state: data.state,
                        zip_code: data.postalCode,
                      }));
                    }}
                    placeholder="Start typing an address..."
                  />
                </div>
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-3 space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">City</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-9" />
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">State</Label>
                    <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} maxLength={2} className="h-9" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Zip</Label>
                    <Input value={formData.zip_code} onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })} className="h-9" />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Card */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Financial</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Contract Value</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.contract_value}
                        onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                        placeholder="0.00"
                        className="h-9 pl-6"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Est. Budget</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.total_cost}
                        onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                        placeholder="0.00"
                        className="h-9 pl-6"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Target Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Meetings Card */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Meetings & Site Visits</span>
              </div>
              <div className="p-4 space-y-3">
                <JobMeetingsSection
                  meetings={newMeetings}
                  onAddMeeting={handleAddNewMeeting}
                  onRemoveMeeting={handleRemoveNewMeeting}
                  onUpdateMeeting={handleUpdateNewMeeting}
                  jobLocation={jobLocation}
                />
                {existingMeetings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Previously Scheduled:</p>
                    {existingMeetings.map((meeting) => (
                      <div key={meeting.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{meeting.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded shrink-0">
                              {meeting.meeting_type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(meeting.scheduled_date).toLocaleDateString()} {meeting.scheduled_time && `at ${meeting.scheduled_time}`}
                          </p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => deleteMeeting(meeting.id)} className="text-destructive hover:text-destructive h-7 text-xs shrink-0">
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Photos Card */}
            {job?.id && (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
                  <Camera className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Photos</span>
                </div>
                <div className="p-4">
                  <JobPhotosSection jobId={job.id} />
                </div>
              </div>
            )}

            {/* Notes */}
            <AIScopeNotes
              notes={formData.notes}
              onNotesChange={(notes) => setFormData({ ...formData, notes })}
              label="Job Notes"
              placeholder="Record your walk-around or type notes about site conditions, customer requests, and scope details"
            />

            {/* Bottom save bar for mobile */}
            <div className="flex justify-end gap-2 pt-2 pb-4 md:hidden">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gap-1.5">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
