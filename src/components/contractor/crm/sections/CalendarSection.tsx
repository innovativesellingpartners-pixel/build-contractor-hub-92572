import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plug, Check, Loader2, X, RefreshCw, Clock, MapPin, ChevronDown, ChevronUp, Trash2, Plus, Briefcase, FileText, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScheduleMeetingDialog } from '../ScheduleMeetingDialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type CalendarViewMode = 'day' | '3-day' | '5-day' | 'month';

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
  calendar_email: string;
}

interface CalendarSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function CalendarSection({ onSectionChange }: CalendarSectionProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectionsExpanded, setConnectionsExpanded] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnections();
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

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = getEventDate(event);
      return eventDate && isSameDay(eventDate, day);
    });
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
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Google Calendar */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Google</p>
                        {googleConnected ? (
                          <p className="text-xs text-green-600">{googleConnected.calendar_email}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Not connected</p>
                        )}
                      </div>
                    </div>
                    {googleConnected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(googleConnected.id, 'google')}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleConnect('google')} disabled={connecting === 'google'}>
                        {connecting === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>

                  {/* Outlook Calendar */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#0078D4" d="M21.17 3H8.83A1.83 1.83 0 0 0 7 4.83v14.34A1.83 1.83 0 0 0 8.83 21h12.34A1.83 1.83 0 0 0 23 19.17V4.83A1.83 1.83 0 0 0 21.17 3zM15 18a5 5 0 1 1 5-5 5 5 0 0 1-5 5z"/>
                        <path fill="#0078D4" d="M1 6v12.5A1.5 1.5 0 0 0 2.5 20H6V5.5H2.5A1.5 1.5 0 0 0 1 6z"/>
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Outlook</p>
                        {outlookConnected ? (
                          <p className="text-xs text-green-600">{outlookConnected.calendar_email}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Not connected</p>
                        )}
                      </div>
                    </div>
                    {outlookConnected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(outlookConnected.id, 'outlook')}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleConnect('outlook')} disabled={connecting === 'outlook'}>
                        {connecting === 'outlook' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
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
                          {dayEvents.length > 2 && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDayClick(day);
                              }}
                              className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer"
                            >
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              /* Day / 3-Day / 5-Day View */
              <div className={`grid gap-4 ${
                viewMode === 'day' ? 'grid-cols-1' : 
                viewMode === '3-day' ? 'grid-cols-1 sm:grid-cols-3' : 
                'grid-cols-1 sm:grid-cols-5'
              }`}>
                {daysToDisplay.map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
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
                          {format(day, 'MMM')}
                        </div>
                      </div>
                      
                      {dayEvents.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">No events</p>
                      ) : (
                        <div className="space-y-2">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 cursor-pointer transition-colors"
                            >
                              <div className="font-medium text-sm truncate">{event.summary || 'Untitled'}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {formatEventTimeShort(event)}
                              </div>
                              {event.location && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{event.location}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
        onSuccess={fetchEvents}
      />

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedEvent?.summary || 'Event Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'} • {selectedEvent?.calendar_email}
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

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Event
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
                return `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''} scheduled`;
              })()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDay && (
            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {(() => {
                const dayEvents = getEventsForDay(selectedDay);
                
                if (dayEvents.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No events scheduled for this day</p>
                    </div>
                  );
                }
                
                return dayEvents.map((event) => (
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
                ));
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
    </div>
  );
}
