import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Plus, Trash2, MapPin, Pencil } from 'lucide-react';
import { format } from 'date-fns';

export interface MeetingFormData {
  title: string;
  meeting_type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  location: string;
  notes: string;
}

interface JobMeetingsSectionProps {
  meetings: MeetingFormData[];
  onAddMeeting: (meeting: MeetingFormData) => void;
  onRemoveMeeting: (index: number) => void;
  onUpdateMeeting?: (index: number, meeting: MeetingFormData) => void;
  jobLocation?: string;
}

const MEETING_TYPES = [
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'walkthrough', label: 'Walkthrough' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'other', label: 'Other' },
];

const DEFAULT_FORM_DATA: MeetingFormData = {
  title: '',
  meeting_type: 'site_visit',
  scheduled_date: '',
  scheduled_time: '09:00',
  duration_minutes: 60,
  location: '',
  notes: '',
};

export function JobMeetingsSection({ meetings, onAddMeeting, onRemoveMeeting, onUpdateMeeting, jobLocation }: JobMeetingsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [sameAsJob, setSameAsJob] = useState(true);
  const [formData, setFormData] = useState<MeetingFormData>({
    ...DEFAULT_FORM_DATA,
    location: jobLocation || '',
  });

  // Update location when sameAsJob changes or jobLocation changes
  useEffect(() => {
    if (sameAsJob && jobLocation && editingIndex === null) {
      setFormData(prev => ({ ...prev, location: jobLocation }));
    }
  }, [sameAsJob, jobLocation, editingIndex]);

  const resetForm = () => {
    setFormData({
      ...DEFAULT_FORM_DATA,
      location: jobLocation || '',
    });
    setSameAsJob(true);
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    if (!formData.title || !formData.scheduled_date) return;
    onAddMeeting(formData);
    resetForm();
  };

  const handleUpdate = () => {
    if (!formData.title || !formData.scheduled_date || editingIndex === null) return;
    if (onUpdateMeeting) {
      onUpdateMeeting(editingIndex, formData);
    }
    resetForm();
  };

  const handleEdit = (index: number) => {
    const meeting = meetings[index];
    setFormData({ ...meeting });
    setSameAsJob(meeting.location === jobLocation);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
  };

  const isEditing = editingIndex !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Calendar className="h-4 w-4" />
          Meetings & Site Visits
        </div>
        {!showForm && (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Schedule Meeting
          </Button>
        )}
      </div>

      {/* Existing meetings list */}
      {meetings.length > 0 && (
        <div className="space-y-2">
          {meetings.map((meeting, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{meeting.title}</span>
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                    {MEETING_TYPES.find(t => t.value === meeting.meeting_type)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {meeting.scheduled_date && format(new Date(meeting.scheduled_date), 'MMM d, yyyy')}
                  </span>
                  {meeting.scheduled_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {meeting.scheduled_time}
                    </span>
                  )}
                  {meeting.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {meeting.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMeeting(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit meeting form */}
      {showForm && (
        <div className="p-4 border rounded-lg bg-card space-y-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            {isEditing ? 'Edit Meeting' : 'New Meeting'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_title">Meeting Title *</Label>
              <Input
                id="meeting_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Initial Site Visit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_type">Type</Label>
              <Select value={formData.meeting_type} onValueChange={(v) => setFormData({ ...formData, meeting_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_date">Date *</Label>
              <Input
                id="meeting_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_time">Time</Label>
              <Input
                id="meeting_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Select value={String(formData.duration_minutes)} onValueChange={(v) => setFormData({ ...formData, duration_minutes: parseInt(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_location">Location</Label>
            {jobLocation && (
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="same_as_job"
                  checked={sameAsJob}
                  onCheckedChange={(checked) => {
                    setSameAsJob(checked === true);
                    if (checked) {
                      setFormData(prev => ({ ...prev, location: jobLocation }));
                    }
                  }}
                />
                <label
                  htmlFor="same_as_job"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Same as job location
                </label>
              </div>
            )}
            <Input
              id="meeting_location"
              value={formData.location}
              onChange={(e) => {
                setFormData({ ...formData, location: e.target.value });
                if (e.target.value !== jobLocation) {
                  setSameAsJob(false);
                }
              }}
              placeholder={sameAsJob ? "Using job address" : "Enter custom location"}
              disabled={sameAsJob && !!jobLocation}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            {isEditing ? (
              <Button type="button" size="sm" onClick={handleUpdate} disabled={!formData.title || !formData.scheduled_date}>
                <Pencil className="h-4 w-4 mr-1" />
                Update Meeting
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={handleAdd} disabled={!formData.title || !formData.scheduled_date}>
                <Plus className="h-4 w-4 mr-1" />
                Add Meeting
              </Button>
            )}
          </div>
        </div>
      )}

      {meetings.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No meetings scheduled. Click "Schedule Meeting" to add one.
        </p>
      )}
    </div>
  );
}
