import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Send, Mail, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  job_id: string;
  contractor_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  status: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  color: string | null;
}

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  event_type: string;
  status: string;
  is_all_day: boolean;
  start_time: string;
  end_time: string;
}

const defaultFormData: EventFormData = {
  title: '',
  description: '',
  event_date: format(new Date(), 'yyyy-MM-dd'),
  event_type: 'work',
  status: 'scheduled',
  is_all_day: true,
  start_time: '08:00',
  end_time: '17:00',
};

export function AddEditEventDialog({
  jobId,
  contractorId,
  event,
  trigger,
  defaultDate,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  jobId: string;
  contractorId: string;
  event?: CalendarEvent | null;
  trigger?: React.ReactNode;
  defaultDate?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [form, setForm] = useState<EventFormData>(
    event
      ? {
          title: event.title,
          description: event.description || '',
          event_date: event.event_date,
          event_type: event.event_type,
          status: event.status,
          is_all_day: event.is_all_day,
          start_time: event.start_time || '08:00',
          end_time: event.end_time || '17:00',
        }
      : { ...defaultFormData, event_date: defaultDate || defaultFormData.event_date }
  );
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const payload = {
        job_id: jobId,
        contractor_id: contractorId,
        title: data.title,
        description: data.description || null,
        event_date: data.event_date,
        event_type: data.event_type,
        status: data.status,
        is_all_day: data.is_all_day,
        start_time: data.is_all_day ? null : data.start_time,
        end_time: data.is_all_day ? null : data.end_time,
      };

      if (event) {
        const { error } = await supabase
          .from('portal_calendar_events')
          .update(payload)
          .eq('id', event.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portal_calendar_events')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-calendar-events', jobId] });
      toast.success(event ? 'Event updated' : 'Event added');
      setOpen(false);
      if (!event) setForm(defaultFormData);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v && event) {
        setForm({
          title: event.title,
          description: event.description || '',
          event_date: event.event_date,
          event_type: event.event_type,
          status: event.status,
          is_all_day: event.is_all_day,
          start_time: event.start_time || '08:00',
          end_time: event.end_time || '17:00',
        });
      }
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Drywall installation" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work Day</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="postponed">Postponed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={form.is_all_day}
              onCheckedChange={(v) => setForm({ ...form, is_all_day: !!v })}
            />
            <Label htmlFor="all-day" className="cursor-pointer">All Day</Label>
          </div>
          {!form.is_all_day && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => mutation.mutate(form)} disabled={!form.title || !form.event_date || mutation.isPending}>
            {mutation.isPending ? 'Saving...' : event ? 'Update' : 'Add Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteEventButton({ eventId, jobId }: { eventId: string; jobId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('portal_calendar_events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-calendar-events', jobId] });
      toast.success('Event deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-destructive hover:text-destructive"
      onClick={(e) => {
        e.stopPropagation();
        if (confirm('Delete this event?')) mutation.mutate();
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

export function EmailScheduleDialog({
  jobId,
  contractorId,
  events,
  selectedDate,
}: {
  jobId: string;
  contractorId: string;
  events: CalendarEvent[];
  selectedDate?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [emailMode, setEmailMode] = useState<'day' | 'all'>(selectedDate ? 'day' : 'all');
  const [selectedDay, setSelectedDay] = useState(selectedDate || format(new Date(), 'yyyy-MM-dd'));
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState('');
  const [sending, setSending] = useState(false);

  const { data: crewMembers } = useQuery({
    queryKey: ['crew-members-for-email'],
    queryFn: async () => {
      const { data } = await supabase
        .from('crew_members')
        .select('id, name, contact_info, role')
        .order('name');
      return data || [];
    },
  });

  const getCrewEmail = (member: any): string | null => {
    if (!member.contact_info) return null;
    const info = typeof member.contact_info === 'string' ? JSON.parse(member.contact_info) : member.contact_info;
    return info?.email || null;
  };

  const toggleCrew = (id: string) => {
    setSelectedCrewIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (!crewMembers) return;
    const withEmail = crewMembers.filter((m) => getCrewEmail(m)).map((m) => m.id);
    setSelectedCrewIds(withEmail);
  };

  const filteredEvents = emailMode === 'day'
    ? events.filter((e) => e.event_date === selectedDay)
    : events;

  const handleSend = async () => {
    const crewEmails = (crewMembers || [])
      .filter((m) => selectedCrewIds.includes(m.id))
      .map((m) => getCrewEmail(m))
      .filter(Boolean) as string[];

    const extraEmails = customEmails
      .split(/[,;\n]/)
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));

    const allEmails = [...new Set([...crewEmails, ...extraEmails])];

    if (allEmails.length === 0) {
      toast.error('Please select crew members or enter email addresses');
      return;
    }

    if (filteredEvents.length === 0) {
      toast.error('No events to send for the selected period');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-schedule-email', {
        body: {
          to: allEmails,
          jobId,
          events: filteredEvents,
          mode: emailMode,
          selectedDate: emailMode === 'day' ? selectedDay : null,
        },
      });
      if (error) throw error;
      toast.success(`Schedule sent to ${allEmails.length} recipient(s)`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send schedule');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Mail className="h-4 w-4" />
          Email Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Email Schedule to Crew
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Mode selection */}
          <div>
            <Label>What to send</Label>
            <Select value={emailMode} onValueChange={(v: 'day' | 'all') => setEmailMode(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Entire Calendar ({events.length} events)</SelectItem>
                <SelectItem value="day">Specific Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {emailMode === 'day' && (
            <div>
              <Label>Select Date</Label>
              <Input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">
                {filteredEvents.length} event(s) on this day
              </p>
            </div>
          )}

          {/* Crew members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Select Crew Members
              </Label>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>
                Select All
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
              {crewMembers && crewMembers.length > 0 ? (
                crewMembers.map((member) => {
                  const email = getCrewEmail(member);
                  return (
                    <label
                      key={member.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50',
                        !email && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Checkbox
                        checked={selectedCrewIds.includes(member.id)}
                        onCheckedChange={() => email && toggleCrew(member.id)}
                        disabled={!email}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{member.name}</span>
                        {email ? (
                          <span className="text-xs text-muted-foreground ml-2">{email}</span>
                        ) : (
                          <span className="text-xs text-destructive ml-2">No email</span>
                        )}
                      </div>
                    </label>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground p-3">No crew members found</p>
              )}
            </div>
          </div>

          {/* Additional emails */}
          <div>
            <Label>Additional Email Addresses</Label>
            <Textarea
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              placeholder="Enter emails separated by commas or new lines"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : `Send Schedule`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
