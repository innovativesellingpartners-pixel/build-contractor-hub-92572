import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plug, Check, Loader2, X, RefreshCw, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';

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

  const googleConnected = connections.find(c => c.provider === 'google');
  const outlookConnected = connections.find(c => c.provider === 'outlook');

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

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">Connect and sync your calendars</p>
          </div>
          {connections.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEvents}
              disabled={loadingEvents}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingEvents ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Google Calendar */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Google Calendar</h3>
                {googleConnected ? (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      Connected: {googleConnected.calendar_email}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleDisconnect(googleConnected.id, 'google')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sync appointments and schedule from Google
                    </p>
                    <Button
                      className="mt-3"
                      size="sm"
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
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Outlook Calendar */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#0078D4" d="M21.17 3H8.83A1.83 1.83 0 0 0 7 4.83v14.34A1.83 1.83 0 0 0 8.83 21h12.34A1.83 1.83 0 0 0 23 19.17V4.83A1.83 1.83 0 0 0 21.17 3zM15 18a5 5 0 1 1 5-5 5 5 0 0 1-5 5z"/>
                  <path fill="#0078D4" d="M1 6v12.5A1.5 1.5 0 0 0 2.5 20H6V5.5H2.5A1.5 1.5 0 0 0 1 6z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Outlook Calendar</h3>
                {outlookConnected ? (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      Connected: {outlookConnected.calendar_email}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleDisconnect(outlookConnected.id, 'outlook')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sync appointments from Microsoft Outlook
                    </p>
                    <Button
                      className="mt-3"
                      size="sm"
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
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar Events */}
        {connections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            
            {loadingEvents ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading calendar events...</p>
              </Card>
            ) : events.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming events in the next 30 days</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{event.summary || 'Untitled Event'}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>{formatEventTime(event)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          From: {event.calendar_email}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {connections.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Calendars Connected</h3>
            <p className="text-muted-foreground mb-6">
              Connect your Google or Outlook calendar to sync appointments and manage your schedule
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
