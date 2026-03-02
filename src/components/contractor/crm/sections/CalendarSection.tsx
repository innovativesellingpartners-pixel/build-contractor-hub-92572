import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plug, Check, Loader2, X, RefreshCw, Clock, MapPin, ChevronDown, ChevronUp, Trash2, Plus, Briefcase, FileText, ExternalLink, ChevronLeft, ChevronRight, Pencil, CheckSquare, Mail, Users, CheckCircle2, HelpCircle, XCircle, Eye, Layers, Columns, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScheduleMeetingDialog } from '../ScheduleMeetingDialog';
import { EditEventDialog } from '../EditEventDialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePersonalTasks, PersonalTask } from '@/hooks/usePersonalTasks';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CrmNavHeader } from '../CrmNavHeader';

type CalendarViewMode = 'day' | '3-day' | '5-day' | 'month';
type CalendarDisplayMode = 'overlay' | 'toggle' | 'side-by-side';

const PROVIDER_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  google: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  outlook: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  local: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

interface CalendarConnection {
  id: string;
  provider: string;
  calendar_email: string;
  created_at: string;
}

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
  calendarName?: string;
  calendarEventId?: string;
  jobId?: string;
  leadId?: string;
  isLocal?: boolean;
  attendees?: Array<{ email: string; responseStatus?: string; displayName?: string }>;
  organizer?: { email?: string; displayName?: string };
  htmlLink?: string;
}

interface UserMeeting {
  id: string;
  title: string;
  meeting_type: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  calendar_event_id: string | null;
  provider: string | null;
  job_id: string | null;
  lead_id: string | null;
}

interface CalendarSectionProps {
  onSectionChange?: (section: string) => void;
}

// Time slots for the day view grid (7am to 9pm)
const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
];

export default function CalendarSection({ onSectionChange }: CalendarSectionProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [localMeetings, setLocalMeetings] = useState<UserMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectionsExpanded, setConnectionsExpanded] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('5-day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Fetch personal tasks
  const { tasks: personalTasks, toggleComplete } = usePersonalTasks();

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchLocalMeetings(); // Always fetch local meetings
    }
  }, [user]);

  // Check for OAuth callback success/error in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get('oauth_success');
    const oauthError = params.get('oauth_error');
    const provider = params.get('provider');

    if (oauthSuccess === 'calendar') {
      toast.success(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar connected successfully!`);
      fetchConnections();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthError) {
      toast.error(`Connection failed: ${oauthError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_connections')
        .select('id, provider, calendar_email, created_at')
        .eq('user_id', user?.id);

      if (error) throw error;
      setConnections(data || []);
      
      // If there are connections, fetch events
      if (data && data.length > 0) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('fetch-calendar-events', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      setEvents(data?.events || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch calendar events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchLocalMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_meetings')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setLocalMeetings(data || []);
    } catch (error: any) {
      console.error('Error fetching local meetings:', error);
    }
  };

  const handleConnect = async (provider: 'google' | 'outlook') => {
    setConnecting(provider);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        provider === 'google' ? 'google-oauth-init' : 'outlook-oauth-init',
        {
          body: { type: 'calendar' },
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      if (error) throw error;
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Connect error:', error);
      toast.error(error.message || 'Failed to start connection');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectionId: string, provider: string) => {
    try {
      const { error } = await supabase
        .from('calendar_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      
      toast.success(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar disconnected`);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      setEvents([]);
    } catch (error: any) {
      toast.error('Failed to disconnect');
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    setDeletingEventId(event.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in first');
        return;
      }

      const { error } = await supabase.functions.invoke('delete-calendar-event', {
        body: { 
          eventId: event.id, 
          provider: event.provider,
          calendarEmail: event.calendar_email 
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      
      setEvents(prev => prev.filter(e => e.id !== event.id));
      toast.success('Event deleted');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setDeletingEventId(null);
    }
  };

  const googleConnected = connections.find(c => c.provider === 'google');
  const outlookConnected = connections.find(c => c.provider === 'outlook');
  const hasAnyConnection = connections.length > 0;

  const formatEventTime = (event: CalendarEvent) => {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    
    if (!start) return '';
    
    try {
      const startDate = parseISO(start);
      const isAllDay = !event.start?.dateTime;
      
      if (isAllDay) {
        return format(startDate, 'MMM d, yyyy') + ' (All Day)';
      }
      
      const formattedStart = format(startDate, 'MMM d, yyyy h:mm a');
      if (end) {
        const endDate = parseISO(end);
        const formattedEnd = format(endDate, 'h:mm a');
        return `${formattedStart} - ${formattedEnd}`;
      }
      return formattedStart;
    } catch {
      return start;
    }
  };

  const formatEventTimeShort = (event: CalendarEvent) => {
    const start = event.start?.dateTime || event.start?.date;
    if (!start) return '';
    try {
      const startDate = parseISO(start);
      const isAllDay = !event.start?.dateTime;
      return isAllDay ? 'All Day' : format(startDate, 'h:mm a');
    } catch {
      return '';
    }
  };

  const getEventDate = (event: CalendarEvent): Date | null => {
    const start = event.start?.dateTime || event.start?.date;
    if (!start) return null;
    try {
      return parseISO(start);
    } catch {
      return null;
    }
  };

  // Get days to display based on view mode
  const daysToDisplay = useMemo(() => {
    const days: Date[] = [];
    
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      
      let day = calendarStart;
      while (day <= calendarEnd) {
        days.push(day);
        day = addDays(day, 1);
      }
    } else if (viewMode === 'day') {
      days.push(currentDate);
    } else if (viewMode === '3-day') {
      for (let i = 0; i < 3; i++) {
        days.push(addDays(currentDate, i));
      }
    } else if (viewMode === '5-day') {
      for (let i = 0; i < 5; i++) {
        days.push(addDays(currentDate, i));
      }
    }
    
    return days;
  }, [currentDate, viewMode]);

  // Get events for a specific day (combining external calendar events and local meetings)
  const getEventsForDay = (day: Date) => {
    // Get external calendar events
    const externalEvents = events.filter(event => {
      const eventDate = getEventDate(event);
      return eventDate && isSameDay(eventDate, day);
    });

    // Get local meetings that aren't already synced to external calendar
    // (to avoid duplicates)
    const syncedEventIds = new Set(
      localMeetings
        .filter(m => m.calendar_event_id)
        .map(m => m.calendar_event_id)
    );

    const localOnlyMeetings = localMeetings
      .filter(meeting => {
        // Skip if already synced (will show from external events)
        if (meeting.calendar_event_id && syncedEventIds.has(meeting.calendar_event_id)) {
          // Check if it's actually in the external events
          const isInExternal = events.some(e => e.id === meeting.calendar_event_id);
          if (isInExternal) return false;
        }
        
        try {
          return isSameDay(parseISO(meeting.start_time), day);
        } catch {
          return false;
        }
      })
      .map(meeting => ({
        id: meeting.id,
        summary: meeting.title,
        description: meeting.notes || undefined,
        location: meeting.location || undefined,
        start: { dateTime: meeting.start_time },
        end: { dateTime: meeting.end_time },
        provider: meeting.provider || 'local',
        calendarEventId: meeting.calendar_event_id || undefined,
        jobId: meeting.job_id || undefined,
        leadId: meeting.lead_id || undefined,
        isLocal: true,
      } as CalendarEvent));

    return [...externalEvents, ...localOnlyMeetings];
  };

  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return personalTasks.filter(task => {
      if (!task.due_date) return false;
      try {
        return isSameDay(parseISO(task.due_date), day);
      } catch {
        return false;
      }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  // Helper to get event at a specific time slot
  const getEventAtTimeSlot = (day: Date, timeSlot: string): CalendarEvent | null => {
    const dayEvents = getEventsForDay(day);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = new Date(day);
    slotTime.setHours(hours, minutes, 0, 0);
    
    return dayEvents.find(event => {
      const startStr = event.start?.dateTime;
      if (!startStr) return false;
      try {
        const eventStart = parseISO(startStr);
        const eventHour = eventStart.getHours();
        const eventMinute = eventStart.getMinutes();
        return eventHour === hours && eventMinute === minutes;
      } catch {
        return false;
      }
    }) || null;
  };

  // Check if a time slot is within an event's duration (busy)
  const isTimeSlotBusy = (day: Date, timeSlot: string): boolean => {
    const dayEvents = getEventsForDay(day);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = new Date(day);
    slotTime.setHours(hours, minutes, 0, 0);
    
    return dayEvents.some(event => {
      const startStr = event.start?.dateTime;
      const endStr = event.end?.dateTime;
      if (!startStr || !endStr) return false;
      try {
        const eventStart = parseISO(startStr);
        const eventEnd = parseISO(endStr);
        return slotTime >= eventStart && slotTime < eventEnd;
      } catch {
        return false;
      }
    });
  };

  // Get the event that covers a given time slot (useful for clicking mid-event slots)
  const getEventCoveringTimeSlot = (day: Date, timeSlot: string): CalendarEvent | null => {
    const dayEvents = getEventsForDay(day);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotTime = new Date(day);
    slotTime.setHours(hours, minutes, 0, 0);

    return (
      dayEvents.find((event) => {
        const startStr = event.start?.dateTime;
        const endStr = event.end?.dateTime;
        if (!startStr || !endStr) return false;
        try {
          const eventStart = parseISO(startStr);
          const eventEnd = parseISO(endStr);
          return slotTime >= eventStart && slotTime < eventEnd;
        } catch {
          return false;
        }
      }) || null
    );
  };

  // Format time slot for display
  const formatTimeSlot = (timeSlot: string): string => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return format(date, 'h:mm a');
  };

  // Navigation handlers
  const goToToday = () => setCurrentDate(new Date());
  
  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else if (viewMode === '3-day') {
      setCurrentDate(addDays(currentDate, -3));
    } else if (viewMode === '5-day') {
      setCurrentDate(addDays(currentDate, -5));
    }
  };
  
  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === '3-day') {
      setCurrentDate(addDays(currentDate, 3));
    } else if (viewMode === '5-day') {
      setCurrentDate(addDays(currentDate, 5));
    }
  };

  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (viewMode === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else {
      const endDate = addDays(currentDate, viewMode === '3-day' ? 2 : 4);
      return `${format(currentDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
  };

  // Handler for day click - opens day events dialog
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
  };

  // Switch to day view for selected day
  const viewDayInDayMode = (day: Date) => {
    setCurrentDate(day);
    setViewMode('day');
    setSelectedDay(null);
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        {/* Navigation Header */}
        <CrmNavHeader
          back
          dashboard
          onBack={() => onSectionChange?.('dashboard')}
          onDashboard={() => onSectionChange?.('dashboard')}
          sectionLabel="Calendar"
        />

        {/* Calendar / Emails Tab Toggle */}
        <div className="flex items-center gap-2 border-b pb-1">
          <Button
            variant="default"
            size="sm"
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => onSectionChange?.('emails')}
          >
            <Mail className="h-4 w-4" />
            Emails
          </Button>
        </div>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Calendar
            </h1>
            <p className="text-muted-foreground text-sm">Sync and manage your schedule</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasAnyConnection && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSectionChange?.('jobs')}
                  className="gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Job</span>
                  <span className="sm:hidden">Job</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setScheduleMeetingOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Schedule Meeting</span>
                  <span className="sm:hidden">Meeting</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEvents}
                  disabled={loadingEvents}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingEvents ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Connected Accounts Summary - Compact when connected */}
        {hasAnyConnection ? (
          <Collapsible open={connectionsExpanded} onOpenChange={setConnectionsExpanded}>
            <Card className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {connections.length} Calendar{connections.length > 1 ? 's' : ''} Connected
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {connections.map(c => c.calendar_email).join(', ')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    {connectionsExpanded ? (
                      <>Collapse <ChevronUp className="h-4 w-4" /></>
                    ) : (
                      <>Manage <ChevronDown className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4 space-y-3">
                {/* List all connected calendars */}
                <div className="space-y-2">
                  {connections.map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                      <div className="flex items-center gap-3">
                        {conn.provider === 'google' ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#0078D4" d="M21.17 3H8.83A1.83 1.83 0 0 0 7 4.83v14.34A1.83 1.83 0 0 0 8.83 21h12.34A1.83 1.83 0 0 0 23 19.17V4.83A1.83 1.83 0 0 0 21.17 3zM15 18a5 5 0 1 1 5-5 5 5 0 0 1-5 5z"/>
                            <path fill="#0078D4" d="M1 6v12.5A1.5 1.5 0 0 0 2.5 20H6V5.5H2.5A1.5 1.5 0 0 0 1 6z"/>
                          </svg>
                        )}
                        <div>
                          <p className="text-sm font-medium capitalize">{conn.provider}</p>
                          <p className="text-xs text-green-600">{conn.calendar_email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(conn.id, conn.provider)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add Another Calendar */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <p className="text-sm text-muted-foreground mr-auto">Add another calendar:</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConnect('google')}
                    disabled={connecting === 'google'}
                    className="gap-2"
                  >
                    {connecting === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    Google
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConnect('outlook')}
                    disabled={connecting === 'outlook'}
                    className="gap-2"
                  >
                    {connecting === 'outlook' ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#0078D4" d="M21.17 3H8.83A1.83 1.83 0 0 0 7 4.83v14.34A1.83 1.83 0 0 0 8.83 21h12.34A1.83 1.83 0 0 0 23 19.17V4.83A1.83 1.83 0 0 0 21.17 3zM15 18a5 5 0 1 1 5-5 5 5 0 0 1-5 5z"/>
                        <path fill="#0078D4" d="M1 6v12.5A1.5 1.5 0 0 0 2.5 20H6V5.5H2.5A1.5 1.5 0 0 0 1 6z"/>
                      </svg>
                    )}
                    Outlook
                  </Button>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ) : (
          /* Full connection UI when no calendars connected */
          <div className="grid gap-4 md:grid-cols-2">
            {/* Google Calendar Card */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-100 to-yellow-100 dark:from-red-900/30 dark:to-yellow-900/30 flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Google Calendar</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sync appointments and manage schedules with Google
                  </p>
                  <Button
                    className="mt-4 w-full sm:w-auto"
                    onClick={() => handleConnect('google')}
                    disabled={connecting === 'google'}
                  >
                    {connecting === 'google' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plug className="h-4 w-4 mr-2" />
                    )}
                    Connect Google
                  </Button>
                </div>
              </div>
            </Card>

            {/* Outlook Calendar Card */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path fill="#0078D4" d="M21.17 3H8.83A1.83 1.83 0 0 0 7 4.83v14.34A1.83 1.83 0 0 0 8.83 21h12.34A1.83 1.83 0 0 0 23 19.17V4.83A1.83 1.83 0 0 0 21.17 3zM15 18a5 5 0 1 1 5-5 5 5 0 0 1-5 5z"/>
                    <path fill="#0078D4" d="M1 6v12.5A1.5 1.5 0 0 0 2.5 20H6V5.5H2.5A1.5 1.5 0 0 0 1 6z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Outlook Calendar</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sync appointments from Microsoft Outlook
                  </p>
                  <Button
                    className="mt-4 w-full sm:w-auto"
                    onClick={() => handleConnect('outlook')}
                    disabled={connecting === 'outlook'}
                  >
                    {connecting === 'outlook' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plug className="h-4 w-4 mr-2" />
                    )}
                    Connect Outlook
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Calendar View with View Mode Toggle */}
        {hasAnyConnection && (
          <div className="space-y-4">
            {/* View Mode Toggle & Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={goToNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold ml-2">{getHeaderTitle()}</h2>
              </div>
              
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && setViewMode(value as CalendarViewMode)}
                className="justify-start"
              >
                <ToggleGroupItem value="day" aria-label="Day view" className="text-xs sm:text-sm px-2 sm:px-3">
                  Day
                </ToggleGroupItem>
                <ToggleGroupItem value="3-day" aria-label="3-day view" className="text-xs sm:text-sm px-2 sm:px-3">
                  3-Day
                </ToggleGroupItem>
                <ToggleGroupItem value="5-day" aria-label="5-day view" className="text-xs sm:text-sm px-2 sm:px-3">
                  5-Day
                </ToggleGroupItem>
                <ToggleGroupItem value="month" aria-label="Month view" className="text-xs sm:text-sm px-2 sm:px-3">
                  Month
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {loadingEvents ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading calendar events...</p>
              </Card>
            ) : viewMode === 'month' ? (
              /* Month View */
              <Card className="p-4">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {daysToDisplay.map((day, idx) => {
                    const dayEvents = getEventsForDay(day);
                    const dayTasks = getTasksForDay(day);
                    const totalItems = dayEvents.length + dayTasks.length;
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isCurrentDay = isToday(day);
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => handleDayClick(day)}
                        className={`min-h-[80px] sm:min-h-[100px] p-1 border rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${
                          isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                        } ${isCurrentDay ? 'border-primary border-2' : 'border-border'}`}
                      >
                        <div className={`text-xs sm:text-sm font-medium mb-1 ${
                          isCurrentDay ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-0.5 overflow-hidden">
                          {/* Show events first */}
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                              }}
                              className="text-[10px] sm:text-xs p-0.5 sm:p-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20 transition-colors"
                            >
                              {event.summary || 'Event'}
                            </div>
                          ))}
                          {/* Show tasks if space permits */}
                          {dayEvents.length < 2 && dayTasks.slice(0, 2 - dayEvents.length).map((task) => (
                            <div
                              key={task.id}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 truncate flex items-center gap-1 ${
                                task.status === 'completed' ? 'line-through opacity-60' : ''
                              }`}
                            >
                              <CheckSquare className="h-2.5 w-2.5 flex-shrink-0" />
                              {task.title}
                            </div>
                          ))}
                          {totalItems > 2 && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDayClick(day);
                              }}
                              className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer"
                            >
                              +{totalItems - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              /* Day / 3-Day / 5-Day View with Time Slots */
              <div className={`grid gap-4 ${
                viewMode === 'day' ? 'grid-cols-1' : 
                viewMode === '3-day' ? 'grid-cols-1 sm:grid-cols-3' : 
                'grid-cols-1 sm:grid-cols-5'
              }`}>
                {daysToDisplay.map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
                  const dayTasks = getTasksForDay(day);
                  const isCurrentDay = isToday(day);
                  
                  return (
                    <Card 
                      key={idx} 
                      className={`p-4 ${isCurrentDay ? 'border-primary border-2' : ''}`}
                    >
                      <div className={`text-center pb-3 border-b mb-3 ${isCurrentDay ? 'text-primary' : ''}`}>
                        <div className="text-xs text-muted-foreground uppercase">
                          {format(day, 'EEE')}
                        </div>
                        <div className={`text-2xl font-bold ${isCurrentDay ? 'text-primary' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(day, 'MMM yyyy')}
                        </div>
                      </div>
                      
                      {/* Tasks Section (above time slots) */}
                      {dayTasks.length > 0 && (
                        <div className="mb-4 pb-3 border-b">
                          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                            <CheckSquare className="h-3 w-3" />
                            Tasks ({dayTasks.length})
                          </div>
                          <div className="space-y-2">
                            {dayTasks.map((task) => (
                              <div
                                key={task.id}
                                className={`p-2 rounded-lg bg-amber-500/10 transition-colors ${
                                  task.status === 'completed' ? 'opacity-60' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <Checkbox
                                    checked={task.status === 'completed'}
                                    onCheckedChange={() => toggleComplete.mutate(task)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-medium text-sm truncate ${
                                      task.status === 'completed' ? 'line-through' : ''
                                    }`}>
                                      {task.title}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                                      <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Time Slots Grid */}
                      <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2 sticky top-0 bg-background py-1">
                          <Clock className="h-3 w-3" />
                          Schedule
                        </div>
                        {TIME_SLOTS.map((timeSlot) => {
                          const eventAtSlot = getEventAtTimeSlot(day, timeSlot);
                          const isBusy = isTimeSlotBusy(day, timeSlot);
                          const isAvailable = !isBusy;
                          const coveringEvent = isBusy ? getEventCoveringTimeSlot(day, timeSlot) : null;
                          
                          // Only show the row if it has an event starting at this time OR is the start of an hour
                          const isHourStart = timeSlot.endsWith(':00');
                          
                          if (eventAtSlot) {
                            // Event starts at this time slot - show event card with edit button
                            return (
                              <div
                                key={timeSlot}
                                className="flex items-stretch gap-2 group"
                              >
                                <div className="w-16 text-xs text-muted-foreground py-2 flex-shrink-0">
                                  {formatTimeSlot(timeSlot)}
                                </div>
                                <div
                                  role="button"
                                  tabIndex={0}
                                  className="flex-1 p-2 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEventToEdit(eventAtSlot);
                                    setEditEventOpen(true);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEventToEdit(eventAtSlot);
                                      setEditEventOpen(true);
                                    }
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">{eventAtSlot.summary || 'Untitled'}</div>
                                      <div className="text-xs text-muted-foreground mt-0.5">
                                        {formatEventTimeShort(eventAtSlot)}
                                        {eventAtSlot.end?.dateTime && (
                                          <> - {format(parseISO(eventAtSlot.end.dateTime), 'h:mm a')}</>
                                        )}
                                      </div>
                                      {eventAtSlot.location && (
                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                          <MapPin className="h-3 w-3 flex-shrink-0" />
                                          <span className="truncate">{eventAtSlot.location}</span>
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEventToEdit(eventAtSlot);
                                        setEditEventOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          } else if (isBusy) {
                            // This slot is during an event - show busy indicator (compact)
                            return (
                              <div
                                key={timeSlot}
                                role={coveringEvent ? 'button' : undefined}
                                tabIndex={coveringEvent ? 0 : undefined}
                                className={cn(
                                  'flex items-center gap-2 py-1 rounded transition-colors',
                                  coveringEvent ? 'group cursor-pointer hover:bg-primary/10' : ''
                                )}
                                onClick={(e) => {
                                  if (!coveringEvent) return;
                                  e.stopPropagation();
                                  setEventToEdit(coveringEvent);
                                  setEditEventOpen(true);
                                }}
                                onKeyDown={(e) => {
                                  if (!coveringEvent) return;
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEventToEdit(coveringEvent);
                                    setEditEventOpen(true);
                                  }
                                }}
                              >
                                <div className="w-16 text-xs text-muted-foreground/50 flex-shrink-0">
                                  {isHourStart ? formatTimeSlot(timeSlot) : ''}
                                </div>
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-primary/20 rounded" />
                                  {isHourStart && coveringEvent && (
                                    <div className="text-[11px] text-muted-foreground truncate">
                                      {coveringEvent.summary || 'Busy'}
                                    </div>
                                  )}
                                  {coveringEvent && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEventToEdit(coveringEvent);
                                        setEditEventOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          } else if (isHourStart) {
                            // Available hour slot - show clickable area
                            return (
                              <div
                                key={timeSlot}
                                className="flex items-center gap-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer transition-colors"
                                onClick={() => {
                                  // Open schedule meeting dialog with this time pre-selected
                                  setScheduleMeetingOpen(true);
                                }}
                              >
                                <div className="w-16 text-xs text-muted-foreground flex-shrink-0">
                                  {formatTimeSlot(timeSlot)}
                                </div>
                                <div className="flex-1 h-6 border border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground/50">Available</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty state when no connections */}
        {!hasAnyConnection && !loading && (
          <Card className="p-12 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-dashed border-2">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-primary/40" />
            <h3 className="text-xl font-semibold mb-2">Connect Your Calendar</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Connect your Google or Outlook calendar to sync appointments, view your schedule, and automatically create events when jobs are scheduled.
            </p>
          </Card>
        )}
      </div>

      {/* Schedule Meeting Dialog */}
      <ScheduleMeetingDialog
        open={scheduleMeetingOpen}
        onOpenChange={setScheduleMeetingOpen}
        onSuccess={() => {
          fetchEvents();
          fetchLocalMeetings();
        }}
      />

      {/* Event Detail Dialog - Read-Only View */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedEvent?.summary || 'Event Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.isLocal || selectedEvent?.provider === 'local' 
                ? 'Local Meeting' 
                : `${selectedEvent?.provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'} • ${selectedEvent?.calendar_email || ''}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 pt-4">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">{formatEventTime(selectedEvent)}</p>
                </div>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-primary"
                      onClick={() => {
                        const encodedAddress = encodeURIComponent(selectedEvent.location || '');
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open in Maps
                    </Button>
                  </div>
                </div>
              )}

              {/* Organizer */}
              {selectedEvent.organizer?.email && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Organizer</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.organizer.displayName || selectedEvent.organizer.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Attendees */}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Attendees ({selectedEvent.attendees.length})</p>
                    <div className="mt-1 space-y-1">
                      {selectedEvent.attendees.map((attendee, idx) => {
                        const statusIcon = attendee.responseStatus === 'accepted' 
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          : attendee.responseStatus === 'declined'
                          ? <XCircle className="h-3.5 w-3.5 text-destructive" />
                          : attendee.responseStatus === 'tentative'
                          ? <HelpCircle className="h-3.5 w-3.5 text-warning" />
                          : <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
                        return (
                          <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {statusIcon}
                            <span>{attendee.displayName || attendee.email}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Description</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                </div>
              )}

              {/* RSVP Section - Only for external calendar events with attendees */}
              {!selectedEvent.isLocal && selectedEvent.provider !== 'local' && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Your Response (RSVP)</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-green-500/30 hover:bg-green-500/10 hover:text-green-600"
                      onClick={async () => {
                        try {
                          const session = await supabase.auth.getSession();
                          await supabase.functions.invoke('rsvp-calendar-event', {
                            body: {
                              eventId: selectedEvent.id,
                              calendarId: selectedEvent.calendarId,
                              provider: selectedEvent.provider,
                              response: 'accepted',
                            },
                            headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
                          });
                          toast.success('RSVP: Accepted');
                          fetchEvents();
                        } catch (e) { toast.error('Failed to send RSVP'); }
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-600"
                      onClick={async () => {
                        try {
                          const session = await supabase.auth.getSession();
                          await supabase.functions.invoke('rsvp-calendar-event', {
                            body: {
                              eventId: selectedEvent.id,
                              calendarId: selectedEvent.calendarId,
                              provider: selectedEvent.provider,
                              response: 'tentative',
                            },
                            headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
                          });
                          toast.success('RSVP: Tentative');
                          fetchEvents();
                        } catch (e) { toast.error('Failed to send RSVP'); }
                      }}
                    >
                      <HelpCircle className="h-4 w-4 mr-1" />
                      Tentative
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-500/30 hover:bg-red-500/10 hover:text-red-600"
                      onClick={async () => {
                        try {
                          const session = await supabase.auth.getSession();
                          await supabase.functions.invoke('rsvp-calendar-event', {
                            body: {
                              eventId: selectedEvent.id,
                              calendarId: selectedEvent.calendarId,
                              provider: selectedEvent.provider,
                              response: 'declined',
                            },
                            headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
                          });
                          toast.success('RSVP: Declined');
                          fetchEvents();
                        } catch (e) { toast.error('Failed to send RSVP'); }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions - Edit & Delete as secondary */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setEventToEdit(selectedEvent);
                    setEditEventOpen(true);
                    setSelectedEvent(null);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Event</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{selectedEvent.summary || 'this event'}"? This will also remove it from your calendar.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          handleDeleteEvent(selectedEvent);
                          setSelectedEvent(null);
                        }} 
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Day Events Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              {selectedDay && (() => {
                const dayEvents = getEventsForDay(selectedDay);
                const dayTasks = getTasksForDay(selectedDay);
                const parts = [];
                if (dayEvents.length > 0) parts.push(`${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`);
                if (dayTasks.length > 0) parts.push(`${dayTasks.length} task${dayTasks.length !== 1 ? 's' : ''}`);
                return parts.length > 0 ? parts.join(', ') : 'Nothing scheduled';
              })()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDay && (
            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              {(() => {
                const dayEvents = getEventsForDay(selectedDay);
                const dayTasks = getTasksForDay(selectedDay);
                
                if (dayEvents.length === 0 && dayTasks.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No events or tasks scheduled for this day</p>
                    </div>
                  );
                }
                
                return (
                  <>
                    {/* Events Section */}
                    {dayEvents.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 px-1">
                          <CalendarIcon className="h-3 w-3" />
                          Events ({dayEvents.length})
                        </div>
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => {
                              setSelectedDay(null);
                              setSelectedEvent(event);
                            }}
                            className="p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <div className="font-medium truncate">{event.summary || 'Untitled Event'}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {formatEventTimeShort(event)}
                            </div>
                            {event.location && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Tasks Section */}
                    {dayTasks.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1 px-1">
                          <CheckSquare className="h-3 w-3" />
                          Tasks ({dayTasks.length})
                        </div>
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-3 rounded-lg border bg-amber-500/10 transition-colors ${
                              task.status === 'completed' ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Checkbox
                                checked={task.status === 'completed'}
                                onCheckedChange={() => toggleComplete.mutate(task)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${
                                  task.status === 'completed' ? 'line-through' : ''
                                }`}>
                                  {task.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                                  <span className="text-xs text-muted-foreground capitalize">{task.priority}</span>
                                  {task.category && (
                                    <span className="text-xs text-muted-foreground">• {task.category}</span>
                                  )}
                                </div>
                                {task.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setSelectedDay(null)}
            >
              Close
            </Button>
            <Button 
              className="flex-1"
              onClick={() => selectedDay && viewDayInDayMode(selectedDay)}
            >
              View in Day Mode
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <EditEventDialog
        open={editEventOpen}
        onOpenChange={setEditEventOpen}
        event={eventToEdit}
        onSuccess={() => {
          fetchEvents();
          fetchLocalMeetings();
          setEventToEdit(null);
        }}
      />
    </div>
  );
}
