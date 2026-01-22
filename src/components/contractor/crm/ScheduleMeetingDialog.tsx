import { useState, useEffect, useCallback } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  ChevronsUpDown,
  AlertTriangle,
  Plug,
  ChevronLeft,
  CalendarDays
} from 'lucide-react';
import { format, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs, Job } from '@/hooks/useJobs';
import { useContractorProfile } from '@/hooks/useContractorProfile';
import { cn } from '@/lib/utils';

interface CalendarConnection {
  id: string;
  provider: string;
  calendar_email: string;
}

interface LeadData {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  company?: string | null;
  project_type?: string | null;
}

interface DayEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  source: 'calendar' | 'local';
}

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialDate?: Date;
  leadData?: LeadData;
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
  initialDate,
  leadData
}: ScheduleMeetingDialogProps) {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const { profile: contractorProfile } = useContractorProfile();
  const formMemory = useFormMemory('schedule_meeting');
  
  const [step, setStep] = useState<'date' | 'day-view' | 'details'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobSearchOpen, setJobSearchOpen] = useState(false);
  
  // Calendar connection state
  const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  
  // Day view state
  const [dayEvents, setDayEvents] = useState<DayEvent[]>([]);
  const [loadingDayEvents, setLoadingDayEvents] = useState(false);
  
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
  
  // Derived state
  const hasCalendarConnection = calendarConnections.length > 0;
  const connectedCalendarEmail = calendarConnections[0]?.calendar_email;

  // Fetch calendar connections when dialog opens
  useEffect(() => {
    const fetchConnections = async () => {
      if (!user || !open) return;
      
      setLoadingConnections(true);
      try {
        const { data, error } = await supabase
          .from('calendar_connections')
          .select('id, provider, calendar_email')
          .eq('user_id', user.id);
        
        if (!error && data) {
          setCalendarConnections(data);
        }
      } catch (err) {
        console.error('Error fetching calendar connections:', err);
      } finally {
        setLoadingConnections(false);
      }
    };
    
    fetchConnections();
  }, [user, open]);

  // Reset form when dialog opens - use memory defaults or lead data
  useEffect(() => {
    if (open) {
      setStep('date');
      setSelectedDate(initialDate || undefined);
      
      // Pre-populate from lead data if available
      if (leadData) {
        setTitle(`Site Visit - ${leadData.name}`);
        setMeetingType('site_visit');
        
        // Build address from lead data
        const leadAddress = [leadData.address, leadData.city, leadData.state, leadData.zip_code]
          .filter(Boolean)
          .join(', ');
        setLocation(leadAddress);
        
        // Add lead email as recipient if available
        if (leadData.email) {
          setRecipients([leadData.email]);
        } else {
          setRecipients([]);
        }
        
        // Add notes with lead info
        const notesParts = [];
        if (leadData.company) notesParts.push(`Company: ${leadData.company}`);
        if (leadData.project_type) notesParts.push(`Project Type: ${leadData.project_type}`);
        if (leadData.phone) notesParts.push(`Phone: ${leadData.phone}`);
        setNotes(notesParts.join('\n'));
      } else {
        setTitle('');
        // Use most frequent meeting type from memory, fallback to site_visit
        const rememberedType = formMemory.getMostFrequent('meetingType');
        setMeetingType(rememberedType || 'site_visit');
        setLocation('');
        setNotes('');
        setRecipients([]);
      }
      
      // Use most frequent time from memory, fallback to 09:00
      const rememberedTime = formMemory.getMostFrequent('time');
      setSelectedTime(rememberedTime || '09:00');
      // Use most frequent duration from memory, fallback to 60
      const rememberedDuration = formMemory.getMostFrequent('duration');
      setDuration(rememberedDuration ? parseInt(rememberedDuration) : 60);
      setSelectedJobId('');
      setNewRecipient('');
    }
  }, [open, initialDate, leadData]);

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

  // Fetch events for a specific day
  const fetchDayEvents = useCallback(async (date: Date) => {
    if (!user) return;
    
    setLoadingDayEvents(true);
    setDayEvents([]);
    
    const events: DayEvent[] = [];
    const dateStart = startOfDay(date);
    const dateEnd = endOfDay(date);
    
    try {
      // Fetch local meetings from user_meetings table
      const { data: localMeetings, error: localError } = await supabase
        .from('user_meetings')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', dateStart.toISOString())
        .lte('start_time', dateEnd.toISOString());
      
      if (!localError && localMeetings) {
        for (const meeting of localMeetings) {
          events.push({
            id: meeting.id,
            title: meeting.title,
            startTime: new Date(meeting.start_time),
            endTime: new Date(meeting.end_time),
            location: meeting.location || undefined,
            source: 'local'
          });
        }
      }
      
      // Fetch external calendar events if connected
      if (hasCalendarConnection) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: calData, error: calError } = await supabase.functions.invoke('fetch-calendar-events', {
              headers: { Authorization: `Bearer ${session.access_token}` }
            });
            
            if (!calError && calData?.events) {
              for (const event of calData.events) {
                const eventStart = event.start?.dateTime || event.start?.date;
                const eventEnd = event.end?.dateTime || event.end?.date;
                
                if (!eventStart) continue;
                
                const startDate = new Date(eventStart);
                
                // Only include events for the selected day
                if (isSameDay(startDate, date)) {
                  // Skip if already exists locally (based on calendar_event_id match)
                  const isDuplicate = localMeetings?.some(lm => lm.calendar_event_id === event.id);
                  if (isDuplicate) continue;
                  
                  events.push({
                    id: event.id,
                    title: event.summary || 'Busy',
                    startTime: startDate,
                    endTime: eventEnd ? new Date(eventEnd) : new Date(startDate.getTime() + 60 * 60000),
                    location: event.location,
                    source: 'calendar'
                  });
                }
              }
            }
          }
        } catch (calErr) {
          console.warn('Failed to fetch calendar events:', calErr);
        }
      }
      
      // Sort by start time
      events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      setDayEvents(events);
    } catch (err) {
      console.error('Error fetching day events:', err);
    } finally {
      setLoadingDayEvents(false);
    }
  }, [user, hasCalendarConnection]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      fetchDayEvents(date);
      setStep('day-view');
    }
  };

  const handleSelectTimeSlot = (time: string) => {
    setSelectedTime(time);
    setStep('details');
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

  // Handle connecting to Google Calendar
  const handleConnectCalendar = async () => {
    setConnectingCalendar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        return;
      }

      const { data, error } = await supabase.functions.invoke('google-oauth-init', {
        body: { type: 'calendar' },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Connect error:', error);
      toast.error(error.message || 'Failed to start calendar connection');
      setConnectingCalendar(false);
    }
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

      // ALWAYS save meeting to user_meetings table first (guaranteed local save)
      const { data: meetingData, error: meetingError } = await supabase
        .from('user_meetings')
        .insert({
          user_id: user?.id,
          job_id: selectedJobId || null,
          title: title,
          meeting_type: meetingType,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location: location || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (meetingError) {
        console.error('Failed to save meeting:', meetingError);
        toast.error('Failed to save meeting');
        return;
      }

      // Also save to job_meetings if linked to a job (for backward compatibility)
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

      // Attempt calendar sync - if connected, invites come from contractor's calendar
      let calendarEventId: string | null = null;
      let calendarProvider: string | null = null;
      let invitesSentViaCalendar = false;
      
      try {
        const { data: calResponse, error: calError } = await supabase.functions.invoke('create-calendar-event', {
          body: {
            jobId: selectedJobId || undefined,
            jobName: eventTitle,
            description: notes || undefined,
            startDate: startDateTime.toISOString(),
            endDate: endDateTime.toISOString(),
            location: location || undefined,
            // Pass attendees to Google/Outlook API so invites come from contractor's calendar
            attendees: recipients.length > 0 ? recipients : undefined,
            // Only send invites via calendar if contractor has calendar connected
            sendInvites: hasCalendarConnection && recipients.length > 0,
          },
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (!calError && calResponse?.results?.[0]?.eventId) {
          calendarEventId = calResponse.results[0].eventId;
          calendarProvider = calResponse.results[0].provider;
          invitesSentViaCalendar = calResponse.results[0].attendeesInvited > 0;
          
          // Update meeting with external calendar event ID
          await supabase
            .from('user_meetings')
            .update({
              calendar_event_id: calendarEventId,
              provider: calendarProvider,
            })
            .eq('id', meetingData.id);
        }
      } catch (calSyncError) {
        console.warn('Calendar sync failed (meeting still saved locally):', calSyncError);
      }

      // Send email invitations
      // If calendar is connected, Google/Outlook APIs send invites via the calendar
      // Only send email fallback invites if calendar sync failed or no calendar connected
      if (recipients.length > 0 && !invitesSentViaCalendar) {
        console.log('Calendar not connected or sync failed - sending email invites as fallback');
        console.log(`Sending invites to ${recipients.length} recipients:`, recipients);
        
        // Use Promise.allSettled to ensure ALL recipients get invites even if some fail
        const invitePromises = recipients.map(email => 
          supabase.functions.invoke('send-meeting-invite', {
            body: {
              recipientEmail: email,
              meetingTitle: eventTitle,
              meetingDate: format(selectedDate, 'EEEE, MMMM d, yyyy'),
              meetingTime: format(startDateTime, 'h:mm a'),
              duration: duration,
              location: location || 'TBD',
              notes: notes || undefined,
              jobNumber: selectedJob?.job_number || undefined,
              startDateTime: startDateTime.toISOString(),
              endDateTime: endDateTime.toISOString(),
            },
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
        );
        
        const results = await Promise.allSettled(invitePromises);
        
        // Log results for debugging
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            console.log(`Successfully sent invite to ${recipients[index]}`);
          } else {
            console.warn(`Failed to send invite to ${recipients[index]}:`, result.reason);
          }
        });
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;
        
        if (failCount > 0) {
          console.warn(`${failCount} of ${recipients.length} invites failed`);
        }
      }

      // Send SMS notifications if we have phone data from lead or job/customer
      let smsPhone: string | null = null;
      let smsRecipientName: string | null = null;
      
      if (leadData?.phone) {
        smsPhone = leadData.phone;
        smsRecipientName = leadData.name || 'Customer';
      } else if (selectedJob?.customer_id) {
        // Get customer phone from the job's linked customer
        try {
          const { data: customerData } = await supabase
            .from('customers')
            .select('phone, name')
            .eq('id', selectedJob.customer_id)
            .single();
          
          if (customerData?.phone) {
            smsPhone = customerData.phone;
            smsRecipientName = customerData.name || selectedJob.name || 'Customer';
          }
        } catch (custErr) {
          console.warn('Could not fetch customer phone:', custErr);
        }
      }
      
      let smsSent = false;
      if (smsPhone) {
        try {
          console.log('Sending SMS meeting reminder to:', smsPhone);
          await supabase.functions.invoke('send-meeting-sms', {
            body: {
              meetingId: meetingData.id,
              recipientPhone: smsPhone,
              recipientName: smsRecipientName,
              meetingTitle: eventTitle,
              meetingDate: format(selectedDate, 'EEEE, MMMM d, yyyy'),
              meetingTime: format(startDateTime, 'h:mm a'),
              location: location || undefined,
              contractorName: contractorProfile?.company_name || contractorProfile?.contact_name,
              contractorPhone: contractorProfile?.phone,
            },
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          smsSent = true;
          console.log('SMS meeting reminders scheduled successfully');
        } catch (smsError) {
          console.warn('Failed to send SMS reminders:', smsError);
          // Don't fail the meeting creation if SMS fails
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

      // Show appropriate success message
      let successMsg = 'Meeting scheduled successfully';
      if (recipients.length > 0) {
        if (invitesSentViaCalendar) {
          successMsg = `Meeting scheduled! ${recipients.length} invite(s) sent from your calendar (${connectedCalendarEmail})`;
        } else {
          successMsg = `Meeting scheduled! ${recipients.length} invite(s) sent via email`;
        }
      }
      if (smsSent) {
        successMsg += ' • SMS reminders scheduled';
      }
      toast.success(successMsg);
      
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
              : step === 'day-view'
              ? `Your schedule for ${selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}`
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
          ) : step === 'day-view' ? (
            <div className="py-4 space-y-4">
              {/* Day Schedule Header */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>Select an available time slot to schedule your meeting</span>
              </div>
              
              {loadingDayEvents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading schedule...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Time slots with busy indicators */}
                  {TIME_SLOTS.map((time) => {
                    const slotTime = new Date(`${format(selectedDate!, 'yyyy-MM-dd')}T${time}`);
                    const slotEnd = new Date(slotTime.getTime() + 30 * 60000); // 30 min slot
                    
                    // Check if this slot overlaps with any event
                    const overlappingEvent = dayEvents.find(event => {
                      return slotTime < event.endTime && slotEnd > event.startTime;
                    });
                    
                    const isBusy = !!overlappingEvent;
                    
                    return (
                      <div
                        key={time}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                          isBusy 
                            ? "bg-muted/50 border-muted cursor-not-allowed"
                            : "hover:bg-accent hover:border-accent-foreground/20 cursor-pointer"
                        )}
                        onClick={() => !isBusy && handleSelectTimeSlot(time)}
                      >
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <Clock className={cn("h-4 w-4", isBusy ? "text-muted-foreground" : "text-primary")} />
                          <span className={cn("font-medium", isBusy && "text-muted-foreground")}>
                            {format(slotTime, 'h:mm a')}
                          </span>
                        </div>
                        
                        {isBusy ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {overlappingEvent?.source === 'calendar' ? 'Calendar' : 'Meeting'}
                            </Badge>
                            <span className="text-sm text-muted-foreground truncate">
                              {overlappingEvent?.title}
                            </span>
                            {overlappingEvent?.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {overlappingEvent.location}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex-1">
                            <span className="text-sm text-green-600 dark:text-green-400">Available</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Quick info about existing events */}
              {!loadingDayEvents && dayEvents.length > 0 && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-2">Scheduled for this day:</p>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div key={event.id} className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}</span>
                        <span className="font-medium">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!loadingDayEvents && dayEvents.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No meetings scheduled for this day</p>
                  <p className="text-xs">All time slots are available</p>
                </div>
              )}
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

              {/* Recipients & Calendar Connection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Send Invite To (Optional)
                </Label>
                
                {/* Calendar Connection Status */}
                {!loadingConnections && (
                  hasCalendarConnection ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 rounded-md px-3 py-1.5">
                      <Check className="h-3 w-3" />
                      <span>Invites will be sent from: <strong>{connectedCalendarEmail}</strong></span>
                    </div>
                  ) : recipients.length > 0 ? (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-sm">Calendar not connected</AlertTitle>
                      <AlertDescription className="text-xs">
                        Invites will be sent via email only, but won't appear to come from your calendar.
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 ml-1 text-xs"
                          onClick={handleConnectCalendar}
                          disabled={connectingCalendar}
                        >
                          {connectingCalendar ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Plug className="h-3 w-3 mr-1" />
                          )}
                          Connect Calendar
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : null
                )}
                
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
          {step === 'day-view' && (
            <Button 
              variant="outline" 
              onClick={() => setStep('date')}
              className="mr-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Change Date
            </Button>
          )}
          {step === 'details' && (
            <Button 
              variant="outline" 
              onClick={() => setStep('day-view')}
              disabled={isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
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
