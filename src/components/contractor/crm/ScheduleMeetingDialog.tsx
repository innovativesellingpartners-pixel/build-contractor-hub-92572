import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PredictiveInput } from '@/components/ui/predictive-input';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { useFormMemory } from '@/hooks/useFormMemory';
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  Briefcase, 
  Users, 
  Mail, 
  X, 
  Plus, 
  Loader2, 
  Send,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs, Job } from '@/hooks/useJobs';
import { cn } from '@/lib/utils';

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialDate?: Date;
}

const MEETING_TYPES = [
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'estimate_walkthrough', label: 'Estimate Walkthrough' },
  { value: 'project_kickoff', label: 'Project Kickoff' },
  { value: 'progress_review', label: 'Progress Review' },
  { value: 'final_inspection', label: 'Final Inspection' },
  { value: 'other', label: 'Other' },
];

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
];

export function ScheduleMeetingDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  initialDate 
}: ScheduleMeetingDialogProps) {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const formMemory = useFormMemory('schedule_meeting');
  
  const [step, setStep] = useState<'date' | 'details'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobSearchOpen, setJobSearchOpen] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [meetingType, setMeetingType] = useState('site_visit');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');

  // Get suggestions from memory
  const titleSuggestions = formMemory.getSuggestions('title', title);
  const locationSuggestions = formMemory.getSuggestions('location', location);
  const recipientSuggestions = formMemory.getSuggestions('recipients', newRecipient);

  // Reset form when dialog opens - use memory defaults
  useEffect(() => {
    if (open) {
      setStep('date');
      setSelectedDate(initialDate || undefined);
      setTitle('');
      // Use most frequent meeting type from memory, fallback to site_visit
      const rememberedType = formMemory.getMostFrequent('meetingType');
      setMeetingType(rememberedType || 'site_visit');
      // Use most frequent time from memory, fallback to 09:00
      const rememberedTime = formMemory.getMostFrequent('time');
      setSelectedTime(rememberedTime || '09:00');
      // Use most frequent duration from memory, fallback to 60
      const rememberedDuration = formMemory.getMostFrequent('duration');
      setDuration(rememberedDuration ? parseInt(rememberedDuration) : 60);
      setLocation('');
      setNotes('');
      setSelectedJobId('');
      setRecipients([]);
      setNewRecipient('');
    }
  }, [open, initialDate]);

  // Auto-fill location when job is selected
  useEffect(() => {
    if (selectedJobId) {
      const job = jobs.find(j => j.id === selectedJobId);
      if (job) {
        const jobAddress = [job.address, job.city, job.state, job.zip_code].filter(Boolean).join(', ');
        if (jobAddress && !location) {
          setLocation(jobAddress);
        }
      }
    }
  }, [selectedJobId, jobs]);

  const getSelectedJob = () => jobs.find(j => j.id === selectedJobId);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setStep('details');
    }
  };

  const handleAddRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    if (!email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (recipients.includes(email)) {
      toast.error('This email is already added');
      return;
    }
    
    setRecipients([...recipients, email]);
    // Remember email for future suggestions
    formMemory.recordValue('recipients', email);
    setNewRecipient('');
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSubmit = async () => {
    if (!selectedDate || !title.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        return;
      }

      const selectedJob = getSelectedJob();
      const startDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      // Build event title with job number if linked
      let eventTitle = title;
      if (selectedJob?.job_number) {
        eventTitle = `${selectedJob.job_number} - ${title} - ${selectedJob.name}`;
      }

      // Save meeting to database if linked to a job
      if (selectedJobId) {
        await supabase.from('job_meetings').insert({
          job_id: selectedJobId,
          user_id: user?.id,
          title: title,
          meeting_type: meetingType,
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          scheduled_time: selectedTime,
          duration_minutes: duration,
          location: location || undefined,
          notes: notes || undefined,
        });
      }

      // Create calendar event
      const { error: calError } = await supabase.functions.invoke('create-calendar-event', {
        body: {
          jobId: selectedJobId || undefined,
          jobName: eventTitle,
          description: notes || undefined,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          location: location || undefined,
          attendees: recipients.length > 0 ? recipients : undefined,
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (calError) {
        console.warn('Calendar event creation failed:', calError);
      }

      // Send email invitations to recipients
      if (recipients.length > 0) {
        for (const email of recipients) {
          await supabase.functions.invoke('send-meeting-invite', {
            body: {
              recipientEmail: email,
              meetingTitle: eventTitle,
              meetingDate: format(selectedDate, 'EEEE, MMMM d, yyyy'),
              meetingTime: format(startDateTime, 'h:mm a'),
              duration: duration,
              location: location || 'TBD',
              notes: notes || undefined,
              jobNumber: selectedJob?.job_number || undefined,
            },
            headers: { Authorization: `Bearer ${session.access_token}` }
          }).catch(err => {
            console.warn(`Failed to send invite to ${email}:`, err);
          });
        }
      }

      // Record values to form memory for future predictions
      formMemory.recordValues({
        title: title.trim(),
        meetingType: meetingType,
        time: selectedTime,
        duration: duration.toString(),
        location: location.trim(),
      });

      toast.success(
        recipients.length > 0 
          ? `Meeting scheduled and ${recipients.length} invite(s) sent` 
          : 'Meeting scheduled successfully'
      );
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error scheduling meeting:', error);
      toast.error(error.message || 'Failed to schedule meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Schedule Meeting
          </DialogTitle>
          <DialogDescription>
            {step === 'date' 
              ? 'Select a date for your meeting' 
              : `Meeting on ${selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}`
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-2">
          {step === 'date' ? (
            <div className="flex justify-center py-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className="rounded-md border pointer-events-auto"
              />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Meeting Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <PredictiveInput
                  id="title"
                  placeholder="e.g., Site Inspection, Project Kickoff"
                  value={title}
                  onChange={setTitle}
                  suggestions={titleSuggestions}
                  autoCapitalize={true}
                />
              </div>

              {/* Meeting Type */}
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <Select value={meetingType} onValueChange={setMeetingType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time
                  </Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>
                          {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Link to Job */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Link to Job (Optional)
                </Label>
                <Popover open={jobSearchOpen} onOpenChange={setJobSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={jobSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedJobId ? (
                        <span className="truncate">
                          {getSelectedJob()?.job_number} - {getSelectedJob()?.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Search jobs...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-popover" align="start">
                    <Command>
                      <CommandInput placeholder="Search by job number or name..." />
                      <CommandList>
                        <CommandEmpty>No jobs found.</CommandEmpty>
                        <CommandGroup>
                          {selectedJobId && (
                            <CommandItem
                              value="clear"
                              onSelect={() => {
                                setSelectedJobId('');
                                setJobSearchOpen(false);
                              }}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Clear selection
                            </CommandItem>
                          )}
                          {jobs.map((job) => (
                            <CommandItem
                              key={job.id}
                              value={`${job.job_number || ''} ${job.name}`}
                              onSelect={() => {
                                setSelectedJobId(job.id);
                                setJobSearchOpen(false);
                              }}
                            >
                              <span className="font-medium">{job.job_number}</span>
                              <span className="ml-2 text-muted-foreground truncate">{job.name}</span>
                              <Check className={cn("ml-auto h-4 w-4", selectedJobId === job.id ? "opacity-100" : "opacity-0")} />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <AddressAutocomplete
                  value={location}
                  onChange={setLocation}
                  placeholder="Meeting address or location"
                  showGpsButton={true}
                />
              </div>

              {/* Recipients */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Send Invite To (Optional)
                </Label>
                <div className="flex gap-2">
                  <PredictiveInput
                    type="email"
                    placeholder="recipient@email.com"
                    value={newRecipient}
                    onChange={setNewRecipient}
                    suggestions={recipientSuggestions}
                    autoCapitalize={false}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleAddRecipient}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {recipients.map(email => (
                      <Badge 
                        key={email} 
                        variant="secondary" 
                        className="flex items-center gap-1 pr-1"
                      >
                        <Mail className="h-3 w-3" />
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(email)}
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional meeting details or agenda..."
                  value={notes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNotes(val.charAt(0).toUpperCase() + val.slice(1));
                  }}
                  rows={3}
                />
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'details' && (
            <Button 
              variant="outline" 
              onClick={() => setStep('date')}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          {step === 'details' && (
            <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {recipients.length > 0 ? 'Schedule & Send' : 'Schedule Meeting'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
