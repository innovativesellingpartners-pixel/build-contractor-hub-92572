import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { CalendarIcon, Clock, MapPin, Loader2, FileText, Users, Mail, X, Plus } from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  provider: string;
  calendar_email?: string;
  calendarId?: string;
  // When editing a locally-stored meeting (user_meetings) that was synced to an external calendar,
  // this holds the external provider event ID so we can update it in-place.
  calendarEventId?: string;
  // Optional linkage for title formatting when recreating synced events
  jobId?: string;
  // Lead ID if meeting is linked to a lead
  leadId?: string;
  isLocal?: boolean;
  attendees?: Array<{ email: string; responseStatus?: string }>;
}

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onSuccess?: () => void;
}

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
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

export function EditEventDialog({ open, onOpenChange, event, onSuccess }: EditEventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  
  // Track original recipients to identify newly added ones
  const [originalRecipients, setOriginalRecipients] = useState<string[]>([]);

  // Parse event data when dialog opens or event changes
  useEffect(() => {
    if (open && event) {
      setTitle(event.summary || '');
      setLocation(event.location || '');
      setDescription(event.description || '');
      
      // Parse existing attendees and store as original recipients
      const existingRecipients = event.attendees && Array.isArray(event.attendees)
        ? event.attendees.map(a => a.email).filter(Boolean)
        : [];
      
      setRecipients(existingRecipients);
      setOriginalRecipients(existingRecipients); // Store original for comparison
      setNewRecipient('');
      
      const startStr = event.start?.dateTime || event.start?.date;
      const endStr = event.end?.dateTime || event.end?.date;
      
      if (startStr) {
        try {
          const startDate = parseISO(startStr);
          setSelectedDate(startDate);
          
          // Check if all-day event
          if (!event.start?.dateTime) {
            setIsAllDay(true);
            setSelectedTime('09:00');
            setDuration(60);
          } else {
            setIsAllDay(false);
            // Extract time
            const hours = startDate.getHours().toString().padStart(2, '0');
            const minutes = startDate.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            
            // Find closest time slot
            const closestSlot = TIME_SLOTS.reduce((prev, curr) => {
              const prevDiff = Math.abs(parseTimeToMinutes(prev) - parseTimeToMinutes(timeStr));
              const currDiff = Math.abs(parseTimeToMinutes(curr) - parseTimeToMinutes(timeStr));
              return currDiff < prevDiff ? curr : prev;
            });
            setSelectedTime(closestSlot);
            
            // Calculate duration
            if (endStr) {
              const endDate = parseISO(endStr);
              const durationMins = differenceInMinutes(endDate, startDate);
              
              // Find closest duration option
              const closestDuration = DURATION_OPTIONS.reduce((prev, curr) => {
                const prevDiff = Math.abs(prev.value - durationMins);
                const currDiff = Math.abs(curr.value - durationMins);
                return currDiff < prevDiff ? curr : prev;
              });
              setDuration(closestDuration.value);
            }
          }
        } catch (e) {
          console.error('Error parsing event date:', e);
        }
      }
    }
  }, [open, event]);

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
    setNewRecipient('');
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRecipient();
    }
  };

  const parseTimeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleSubmit = async () => {
    if (!event || !title.trim()) {
      toast.error('Please enter an event title');
      return;
    }

    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        return;
      }

      // Build start and end dates
      let startDateTime: Date;
      let endDateTime: Date;
      
      if (isAllDay) {
        // For all-day events, just use the date
        startDateTime = new Date(selectedDate);
        startDateTime.setHours(0, 0, 0, 0);
        endDateTime = new Date(selectedDate);
        endDateTime.setHours(23, 59, 59, 999);
      } else {
        startDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
        endDateTime = new Date(startDateTime.getTime() + duration * 60000);
      }

      // Identify newly added recipients (not in original list)
      const newlyAddedRecipients = recipients.filter(r => !originalRecipients.includes(r));
      // Identify existing recipients who should get updates
      const existingRecipients = recipients.filter(r => originalRecipients.includes(r));
      
      // Check if this is a local meeting (from user_meetings table)
      if (event.isLocal || event.provider === 'local') {
        // Update local meeting in database
        const { error: dbError } = await supabase
          .from('user_meetings')
          .update({
            title: title,
            notes: description || null,
            location: location || null,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
          })
          .eq('id', event.id);

        if (dbError) throw dbError;

        // If this meeting is linked to a lead, update the lead's last_contact_date
        if (event.leadId) {
          await supabase
            .from('leads')
            .update({
              last_contact_date: new Date().toISOString(),
            })
            .eq('id', event.leadId);
        }

        // IMPORTANT: For synced meetings, we must delete the original external event and
        // recreate it at the new time to guarantee the old slot becomes available.
        // Some provider scenarios can leave the old instance behind when “updating”, causing
        // stale busy blocks in the availability grid.
        if (event.calendarEventId && (event.provider === 'google' || event.provider === 'outlook')) {
          // 1) Delete the old external event
          const { error: calDeleteError } = await supabase.functions.invoke('delete-calendar-event', {
            body: {
              eventId: event.calendarEventId,
              provider: event.provider,
              calendarEmail: event.calendar_email,
            },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (calDeleteError) throw calDeleteError;

          // 2) Create a new external event at the new time
          const { data: calCreateData, error: calCreateError } = await supabase.functions.invoke('create-calendar-event', {
            body: {
              jobId: event.jobId || undefined,
              jobName: title,
              description: description || undefined,
              startDate: startDateTime.toISOString(),
              endDate: endDateTime.toISOString(),
              location: location || undefined,
              attendees: recipients.length > 0 ? recipients : undefined,
              sendInvites: recipients.length > 0,
            },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          if (calCreateError) throw calCreateError;

          const newEventId: string | undefined = calCreateData?.results?.[0]?.eventId;
          const newProvider: string | undefined = calCreateData?.results?.[0]?.provider;

          if (newEventId) {
            // 3) Persist the new external event ID so future edits/delete target the right one
            const { error: meetingUpdateError } = await supabase
              .from('user_meetings')
              .update({
                calendar_event_id: newEventId,
                provider: newProvider || event.provider,
              })
              .eq('id', event.id);

            if (meetingUpdateError) throw meetingUpdateError;
          }
        }

        // Send UPDATED invites to existing recipients (they need the new details)
        // Use Promise.allSettled to ensure ALL recipients get their invites
        if (existingRecipients.length > 0) {
          console.log(`Sending updates to ${existingRecipients.length} existing recipients:`, existingRecipients);
          
          const updatePromises = existingRecipients.map(email =>
            supabase.functions.invoke('send-meeting-invite', {
              body: {
                recipientEmail: email,
                meetingTitle: title,
                meetingDate: format(selectedDate, 'EEEE, MMMM d, yyyy'),
                meetingTime: format(startDateTime, 'h:mm a'),
                duration: duration,
                location: location || 'TBD',
                notes: description || undefined,
                startDateTime: startDateTime.toISOString(),
                endDateTime: endDateTime.toISOString(),
                isUpdate: true,
              },
              headers: { Authorization: `Bearer ${session.access_token}` }
            })
          );
          
          const updateResults = await Promise.allSettled(updatePromises);
          updateResults.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.warn(`Failed to send update to ${existingRecipients[index]}:`, result.reason);
            }
          });
        }

        // Send NEW invites to newly added recipients
        if (newlyAddedRecipients.length > 0) {
          console.log(`Sending invites to ${newlyAddedRecipients.length} new recipients:`, newlyAddedRecipients);
          
          const newInvitePromises = newlyAddedRecipients.map(email =>
            supabase.functions.invoke('send-meeting-invite', {
              body: {
                recipientEmail: email,
                meetingTitle: title,
                meetingDate: format(selectedDate, 'EEEE, MMMM d, yyyy'),
                meetingTime: format(startDateTime, 'h:mm a'),
                duration: duration,
                location: location || 'TBD',
                notes: description || undefined,
                startDateTime: startDateTime.toISOString(),
                endDateTime: endDateTime.toISOString(),
                isUpdate: false,
              },
              headers: { Authorization: `Bearer ${session.access_token}` }
            })
          );
          
          const newResults = await Promise.allSettled(newInvitePromises);
          newResults.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.warn(`Failed to send invite to ${newlyAddedRecipients[index]}:`, result.reason);
            }
          });
        }
      } else {
        // Update external calendar event with attendees
        // Google/Outlook APIs handle sending updates to all attendees via sendUpdates=all
        const { error } = await supabase.functions.invoke('update-calendar-event', {
          body: {
            eventId: event.id,
            provider: event.provider,
            calendarEmail: event.calendar_email,
            calendarId: event.calendarId,
            summary: title,
            description: description || undefined,
            location: location || undefined,
            startDate: startDateTime.toISOString(),
            endDate: endDateTime.toISOString(),
            attendees: recipients.length > 0 ? recipients : undefined,
          },
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (error) throw error;
      }

      // Build success message based on what happened
      let successMessage = 'Event updated successfully';
      if (newlyAddedRecipients.length > 0 && existingRecipients.length > 0) {
        successMessage = `Event updated, invites sent to ${newlyAddedRecipients.length} new recipient(s) and updates sent to ${existingRecipients.length} existing recipient(s)`;
      } else if (newlyAddedRecipients.length > 0) {
        successMessage = `Event updated, invites sent to ${newlyAddedRecipients.length} new recipient(s)`;
      } else if (existingRecipients.length > 0) {
        successMessage = `Event updated, updates sent to ${existingRecipients.length} recipient(s)`;
      }

      toast.success(successMessage);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error(error.message || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Edit Event
          </DialogTitle>
          <DialogDescription>
            Update the details of your calendar event
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4 py-4">
            {/* Event Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Event Title *</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Site Inspection, Project Meeting"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time and Duration - only show for non-all-day events */}
            {!isAllDay && (
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
            )}

            {/* All-day indicator */}
            {isAllDay && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                This is an all-day event
              </div>
            )}

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <AddressAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="Event location or address"
                showGpsButton={true}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </Label>
              <Textarea
                placeholder="Add notes or details about this event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Recipients/Attendees */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients
              </Label>
              
              {/* Existing Recipients */}
              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {recipients.map((email) => (
                    <Badge 
                      key={email} 
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      <Mail className="h-3 w-3" />
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Add New Recipient */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={handleAddRecipient}
                  disabled={!newRecipient.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add email addresses to send calendar invitations
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !selectedDate}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
