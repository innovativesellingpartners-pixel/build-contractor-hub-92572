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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Send, Mail, Users, Phone, UserPlus, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  job_id: string;
  contractor_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_end_date: string | null;
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
  event_end_date: string;
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
  event_end_date: '',
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
          event_end_date: event.event_end_date || '',
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
        event_end_date: data.event_end_date || null,
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
      } else if (v && !event) {
        setForm({ ...defaultFormData, event_date: defaultDate || defaultFormData.event_date });
      }
    }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
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
  portalTokenId,
}: {
  jobId: string;
  contractorId: string;
  events: CalendarEvent[];
  selectedDate?: string | null;
  portalTokenId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [emailMode, setEmailMode] = useState<'day' | 'all'>(selectedDate ? 'day' : 'all');
  const [selectedDay, setSelectedDay] = useState(selectedDate || format(new Date(), 'yyyy-MM-dd'));
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState('');
  const [customPhones, setCustomPhones] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [activeTab, setActiveTab] = useState('email');

  // Fetch crew members
  const { data: crewMembers } = useQuery({
    queryKey: ['crew-members-for-email'],
    queryFn: async () => {
      const { data } = await supabase
        .from('crew_members')
        .select('id, name, email, phone, role')
        .order('name');
      return data || [];
    },
  });

  // Fetch portal participants
  const { data: participants } = useQuery({
    queryKey: ['portal-participants-schedule', portalTokenId],
    queryFn: async () => {
      if (!portalTokenId) return [];
      const { data } = await (supabase as any)
        .from('portal_participants')
        .select('*')
        .eq('portal_token_id', portalTokenId)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!portalTokenId,
  });

  const toggleCrew = (id: string) => {
    setSelectedCrewIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllCrew = () => {
    if (!crewMembers) return;
    const withEmail = crewMembers.filter((m) => m.email).map((m) => m.id);
    setSelectedCrewIds(withEmail);
  };

  const selectAllParticipants = () => {
    if (!participants) return;
    const withContact = participants.filter((p: any) => p.email || p.phone).map((p: any) => p.id);
    setSelectedParticipantIds(withContact);
  };

  const filteredEvents = emailMode === 'day'
    ? events.filter((e) => e.event_date === selectedDay)
    : events;

  const formatTime = (time: string | null) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const formatDateStr = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const buildScheduleText = () => {
    const sorted = [...filteredEvents].sort((a, b) => a.event_date.localeCompare(b.event_date));
    let text = emailMode === 'day' ? `Schedule for ${formatDateStr(selectedDay)}:\n` : `Project Schedule:\n`;
    sorted.forEach((evt) => {
      const timeStr = evt.is_all_day ? 'All Day' : `${formatTime(evt.start_time)}${evt.end_time ? ' - ' + formatTime(evt.end_time) : ''}`;
      text += `\n📅 ${formatDateStr(evt.event_date)} (${timeStr})\n   ${evt.title}`;
      if (evt.description) text += `\n   ${evt.description}`;
    });
    return text;
  };

  // Gather all email recipients
  const gatherEmailRecipients = () => {
    const emails: string[] = [];

    // From crew members
    (crewMembers || [])
      .filter((m) => selectedCrewIds.includes(m.id) && m.email)
      .forEach((m) => emails.push(m.email!));

    // From portal participants
    (participants || [])
      .filter((p: any) => selectedParticipantIds.includes(p.id) && p.email)
      .forEach((p: any) => emails.push(p.email));

    // Custom emails
    customEmails
      .split(/[,;\n]/)
      .map((e) => e.trim())
      .filter((e) => e.includes('@'))
      .forEach((e) => emails.push(e));

    return [...new Set(emails)];
  };

  // Gather all SMS recipients
  const gatherSmsRecipients = () => {
    const phones: string[] = [];

    // From crew members
    (crewMembers || [])
      .filter((m) => selectedCrewIds.includes(m.id) && m.phone)
      .forEach((m) => phones.push(m.phone!));

    // From portal participants
    (participants || [])
      .filter((p: any) => selectedParticipantIds.includes(p.id) && p.phone)
      .forEach((p: any) => phones.push(p.phone));

    // Custom phones
    customPhones
      .split(/[,;\n]/)
      .map((p) => p.trim().replace(/[^\d+]/g, ''))
      .filter((p) => p.length >= 10)
      .forEach((p) => phones.push(p));

    return [...new Set(phones)];
  };

  const handleSendEmail = async () => {
    const allEmails = gatherEmailRecipients();
    if (allEmails.length === 0) {
      toast.error('No email recipients selected');
      return;
    }
    if (filteredEvents.length === 0) {
      toast.error('No events to send for the selected period');
      return;
    }

    setSendingEmail(true);
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
      toast.success(`Schedule emailed to ${allEmails.length} recipient(s)`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendSms = async () => {
    const allPhones = gatherSmsRecipients();
    if (allPhones.length === 0) {
      toast.error('No SMS recipients selected');
      return;
    }
    if (filteredEvents.length === 0) {
      toast.error('No events to send');
      return;
    }

    setSendingSms(true);
    const scheduleText = buildScheduleText();
    let sentCount = 0;

    try {
      for (const phone of allPhones) {
        const { error } = await supabase.functions.invoke('send-portal-sms', {
          body: { to: phone, message: scheduleText },
        });
        if (error) {
          console.error(`SMS failed for ${phone}:`, error);
        } else {
          sentCount++;
        }
      }
      if (sentCount > 0) {
        toast.success(`Schedule texted to ${sentCount} recipient(s)`);
        setOpen(false);
      } else {
        toast.error('Failed to send any SMS');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send SMS');
    } finally {
      setSendingSms(false);
    }
  };

  const emailCount = gatherEmailRecipients().length;
  const smsCount = gatherSmsRecipients().length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Send className="h-4 w-4" />
          Send Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send Schedule
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* What to send */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>What to send</Label>
              <Select value={emailMode} onValueChange={(v: 'day' | 'all') => setEmailMode(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Full Calendar ({events.length} events)</SelectItem>
                  <SelectItem value="day">Specific Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {emailMode === 'day' && (
              <div>
                <Label>Select Date</Label>
                <Input type="date" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {filteredEvents.length} event(s)
                </p>
              </div>
            )}
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Recipients</Label>

            {/* Portal Participants */}
            {participants && participants.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" />
                    Portal Participants
                  </Label>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={selectAllParticipants}>
                    Select All
                  </Button>
                </div>
                <div className="max-h-32 overflow-y-auto border rounded-md divide-y">
                  {participants.map((p: any) => {
                    const hasContact = p.email || p.phone;
                    return (
                      <label
                        key={p.id}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50',
                          !hasContact && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Checkbox
                          checked={selectedParticipantIds.includes(p.id)}
                          onCheckedChange={() => hasContact && toggleParticipant(p.id)}
                          disabled={!hasContact}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">{p.name}</span>
                            <Badge variant="outline" className="text-[9px] h-4">
                              {p.role === 'contractor' ? 'Team' : 'Customer'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {p.email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{p.email}</span>}
                            {p.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{p.phone}</span>}
                            {!hasContact && <span className="text-destructive">No contact info</span>}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Crew Members */}
            {crewMembers && crewMembers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Crew Members
                  </Label>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={selectAllCrew}>
                    Select All
                  </Button>
                </div>
                <div className="max-h-32 overflow-y-auto border rounded-md divide-y">
                  {crewMembers.map((member) => {
                    const hasContact = member.email || member.phone;
                    return (
                      <label
                        key={member.id}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50',
                          !hasContact && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Checkbox
                          checked={selectedCrewIds.includes(member.id)}
                          onCheckedChange={() => hasContact && toggleCrew(member.id)}
                          disabled={!hasContact}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{member.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {member.email && <span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{member.email}</span>}
                            {member.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{member.phone}</span>}
                            {!hasContact && <span className="text-destructive">No contact info</span>}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom recipients */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Additional Emails
                </Label>
                <Textarea
                  value={customEmails}
                  onChange={(e) => setCustomEmails(e.target.value)}
                  placeholder="Comma-separated emails"
                  rows={2}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Additional Phone Numbers
                </Label>
                <Textarea
                  value={customPhones}
                  onChange={(e) => setCustomPhones(e.target.value)}
                  placeholder="Comma-separated phone numbers"
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSendSms}
            disabled={sendingSms || smsCount === 0}
            variant="outline"
            className="flex-1 gap-1.5"
          >
            {sendingSms ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            Text {smsCount > 0 ? `(${smsCount})` : ''}
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={sendingEmail || emailCount === 0}
            className="flex-1 gap-1.5"
          >
            {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Email {emailCount > 0 ? `(${emailCount})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
