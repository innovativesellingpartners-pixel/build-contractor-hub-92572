import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, MapPin, DollarSign } from 'lucide-react';
import { Job } from '@/hooks/useJobs';
import { JobMeetingsSection, MeetingFormData } from './JobMeetingsSection';
import { useJobMeetings } from '@/hooks/useJobMeetings';

interface EditJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Job>) => Promise<any>;
}

export function EditJobDialog({ job, open, onOpenChange, onUpdate }: EditJobDialogProps) {
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
    total_cost: '0',
    notes: '',
    contract_value: '0',
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
        total_cost: String(job.total_cost || 0),
        notes: job.notes || '',
        contract_value: String(job.contract_value || 0),
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
      await onUpdate(job.id!, {
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
      
      // Save new meetings
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
        }, job.name, jobLocation);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>Update job details - Job #{job.job_number}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <FileText className="h-4 w-4" />
              Basic Information
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Job Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Smith Kitchen Renovation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the work to be done"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: Job['status']) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <MapPin className="h-4 w-4" />
              Location
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="grid grid-cols-6 gap-4">
              <div className="space-y-2 col-span-3">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="San Francisco"
                />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  maxLength={2}
                  placeholder="CA"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="zip_code">Zip Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  placeholder="94105"
                />
              </div>
            </div>
          </div>

          {/* Financial */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <DollarSign className="h-4 w-4" />
              Financial
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_value">Contract Value</Label>
                <Input
                  id="contract_value"
                  type="number"
                  step="0.01"
                  value={formData.contract_value}
                  onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_cost">Estimated Budget</Label>
                <Input
                  id="total_cost"
                  type="number"
                  step="0.01"
                  value={formData.total_cost}
                  onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_date">Target Completion</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Meetings & Site Visits */}
          <div className="space-y-4">
            <JobMeetingsSection
              meetings={newMeetings}
              onAddMeeting={handleAddNewMeeting}
              onRemoveMeeting={handleRemoveNewMeeting}
              onUpdateMeeting={handleUpdateNewMeeting}
              jobLocation={jobLocation}
            />
            
            {/* Existing scheduled meetings */}
            {existingMeetings.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Previously Scheduled:</p>
                {existingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{meeting.title}</span>
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                          {meeting.meeting_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(meeting.scheduled_date).toLocaleDateString()} {meeting.scheduled_time && `at ${meeting.scheduled_time}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMeeting(meeting.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional information about this job"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
