import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Plug, Check, Loader2, X, RefreshCw, Circle, ArrowLeft, Reply, Send, ChevronDown, ChevronUp, Search, PenSquare, Paperclip, ChevronLeft, ChevronRight, MailOpen, Calendar as CalendarIcon, AlertTriangle, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrmNavHeader } from '../CrmNavHeader';

interface EmailConnection {
  id: string;
  provider: string;
  email_address: string;
  created_at: string;
}

interface Email {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  subject: string;
  date: string;
  isUnread: boolean;
  provider: string;
  email_account: string;
  body?: string;
}

interface EmailsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function EmailsSection({ onSectionChange }: EmailsSectionProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [reauthConnectionIds, setReauthConnectionIds] = useState<string[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectionsExpanded, setConnectionsExpanded] = useState(false);
  
  // Track if emails have been fetched to prevent re-fetching on tab switches
  const emailsFetchedRef = useRef(false);
  // Track emails that have been marked as read locally - persisted in localStorage
  const STORAGE_KEY = `ct1-read-emails-${user?.id || 'anon'}`;
  const readEmailIdsRef = useRef<Set<string>>(new Set<string>());

  // Initialize ref from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        ids.forEach(id => readEmailIdsRef.current.add(id));
      }
    } catch { /* ignore */ }
  }, [STORAGE_KEY]);

  const persistReadIds = useCallback(() => {
    try {
      // Keep only last 500 to avoid unbounded growth
      const arr = Array.from(readEmailIdsRef.current).slice(-500);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch { /* ignore */ }
  }, [STORAGE_KEY]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Email detail view state
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState<number>(-1);
  const [loadingEmailBody, setLoadingEmailBody] = useState(false);
  const [emailBody, setEmailBody] = useState<string>('');
  
  // Reply state
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  
  // Compose new email state
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: '',
    fromAccount: ''
  });
  const [composeSending, setComposeSending] = useState(false);

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

    if (oauthSuccess === 'email') {
      toast.success(`${provider === 'google' ? 'Gmail' : 'Outlook'} connected successfully!`);
      setReauthConnectionIds([]);
      fetchConnections();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthError) {
      const errorMessages: Record<string, string> = {
        no_refresh_token: 'Could not get persistent access. Please revoke app access in your Google/Outlook account settings and try again.',
        token_exchange_failed: 'Failed to exchange authorization code. Please try again.',
        save_failed: 'Failed to save connection. Please try again.',
        state_expired: 'Connection attempt timed out. Please try again.',
      };
      toast.error(errorMessages[oauthError] || `Connection failed: ${oauthError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('email_connections')
        .select('id, provider, email_address, created_at')
        .eq('user_id', user?.id);

      if (error) throw error;
      setConnections(data || []);
      
      // If there are connections, fetch emails
      if (data && data.length > 0) {
        fetchEmails();
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async (forceRefresh = false) => {
    if (emailsFetchedRef.current && !forceRefresh) {
      console.log('Skipping email fetch - already loaded');
      return;
    }
    
    setLoadingEmails(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('fetch-emails', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      
      // Handle needs_reauth flag from backend
      if (data?.needs_reauth && data.needs_reauth.length > 0) {
        setReauthConnectionIds(data.needs_reauth);
        const affectedConnections = connections.filter(c => data.needs_reauth.includes(c.id));
        const providers = affectedConnections.map(c => c.provider === 'google' ? 'Gmail' : 'Outlook').join(' & ');
        toast.error(`${providers} connection expired. Please reconnect to continue receiving emails.`, {
          duration: 10000,
        });
      }
      
      const fetchedEmails = (data?.emails || []).map((email: Email) => ({
        ...email,
        isUnread: readEmailIdsRef.current.has(email.id) ? false : email.isUnread
      }));
      
      setEmails(fetchedEmails);
      emailsFetchedRef.current = true;
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      toast.error('Failed to fetch emails');
    } finally {
      setLoadingEmails(false);
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
          body: { type: 'email' },
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
        .from('email_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      
      toast.success(`${provider === 'google' ? 'Gmail' : 'Outlook'} disconnected`);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      setEmails([]);
    } catch (error: any) {
      toast.error('Failed to disconnect');
    }
  };

  const handleOpenEmail = async (email: Email, index: number) => {
    setSelectedEmail(email);
    setSelectedEmailIndex(index);
    setLoadingEmailBody(true);
    setEmailBody('');
    
    // Optimistically mark as read locally
    if (email.isUnread) {
      // Update local state immediately (optimistic update)
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, isUnread: false } : e
      ));
      // Track this email as read locally and persist
      readEmailIdsRef.current.add(email.id);
      persistReadIds();
      // Also update the selected email reference
      setSelectedEmail({ ...email, isUnread: false });
      
      // Persist to Gmail API in background (don't block UI)
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const { error } = await supabase.functions.invoke('mark-email-read', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: { emailId: email.id, provider: email.provider }
          });

          if (error) {
            console.error('Failed to mark email as read on server:', error);
            // Don't revert UI - the local state is what matters for UX
          }
        } catch (err) {
          console.error('Error marking email as read:', err);
        }
      })();
    }
    
    // Fetch email body
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('fetch-email-body', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { emailId: email.id, provider: email.provider }
      });

      if (error) throw error;
      setEmailBody(data?.body || email.snippet);
    } catch (error: any) {
      console.error('Error fetching email body:', error);
      setEmailBody(email.snippet);
    } finally {
      setLoadingEmailBody(false);
    }
  };


  const handleReply = () => {
    setReplyBody('');
    setShowReplyDialog(true);
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !replyBody.trim()) return;
    
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke('send-email-reply', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          provider: selectedEmail.provider,
          threadId: selectedEmail.threadId,
          to: selectedEmail.from,
          subject: `Re: ${selectedEmail.subject}`,
          body: replyBody,
          inReplyTo: selectedEmail.id,
        }
      });

      if (error) throw error;
      
      toast.success('Reply sent successfully');
      setShowReplyDialog(false);
      setReplyBody('');
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleSendNewEmail = async () => {
    if (!composeData.to.trim() || !composeData.subject.trim() || !composeData.body.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const selectedConnection = connections.find(c => c.id === composeData.fromAccount);
    if (!selectedConnection) {
      toast.error('Please select an account to send from');
      return;
    }
    
    setComposeSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke('send-email-reply', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          provider: selectedConnection.provider,
          to: composeData.to,
          subject: composeData.subject,
          body: composeData.body,
        }
      });

      if (error) throw error;
      
      toast.success('Email sent successfully');
      setShowComposeDialog(false);
      setComposeData({ to: '', subject: '', body: '', fromAccount: '' });
      fetchEmails(true); // Force refresh after sending
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setComposeSending(false);
    }
  };

  const googleConnected = connections.find(c => c.provider === 'google');
  const outlookConnected = connections.find(c => c.provider === 'outlook');
  const hasAnyConnection = connections.length > 0;
  const hasBothProviders = !!googleConnected && !!outlookConnected;
  
  // Filter emails based on search query
  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) return emails;
    const query = searchQuery.toLowerCase();
    return emails.filter(email => 
      email.subject?.toLowerCase().includes(query) ||
      email.from?.toLowerCase().includes(query) ||
      email.snippet?.toLowerCase().includes(query)
    );
  }, [emails, searchQuery]);

  // Split emails by provider
  const gmailEmails = useMemo(() => filteredEmails.filter(e => e.provider === 'google'), [filteredEmails]);
  const outlookEmails = useMemo(() => filteredEmails.filter(e => e.provider === 'outlook'), [filteredEmails]);

  // Navigation logic - must be after filteredEmails is defined
  const handleNavigateEmail = useCallback((direction: 'prev' | 'next') => {
    const currentList = searchQuery.trim() ? filteredEmails : emails;
    const newIndex = direction === 'prev' ? selectedEmailIndex - 1 : selectedEmailIndex + 1;
    
    if (newIndex >= 0 && newIndex < currentList.length) {
      const nextEmail = currentList[newIndex];
      handleOpenEmail(nextEmail, newIndex);
    }
  }, [selectedEmailIndex, emails, filteredEmails, searchQuery]);

  const canNavigatePrev = selectedEmailIndex > 0;
  const canNavigateNext = selectedEmailIndex < (searchQuery.trim() ? filteredEmails : emails).length - 1;

  const formatEmailDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return format(date, 'h:mm a');
      }
      return format(date, 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const extractSenderName = (from: string) => {
    const match = from?.match(/^([^<]+)/);
    if (match) {
      return match[1].trim().replace(/"/g, '');
    }
    return from || 'Unknown';
  };

  const extractSenderEmail = (from: string) => {
    const match = from?.match(/<([^>]+)>/);
    return match ? match[1] : from;
  };

  // Email detail view
  if (selectedEmail) {
    const currentList = searchQuery.trim() ? filteredEmails : emails;
    const emailPosition = `${selectedEmailIndex + 1} of ${currentList.length}`;
    
    return (
      <div className="w-full pb-20 bg-background">
        <div className="p-4 sm:p-6 space-y-4 w-full sm:max-w-4xl sm:mx-auto">
          {/* Header with navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => {
              setSelectedEmail(null);
              setSelectedEmailIndex(-1);
            }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {/* Email navigation */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {emailPosition}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigateEmail('prev')}
                  disabled={!canNavigatePrev}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigateEmail('next')}
                  disabled={!canNavigateNext}
                  className="gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <Card className="p-6">
            <div className="space-y-4">
              <h1 className="text-xl font-semibold">{selectedEmail.subject || '(No subject)'}</h1>
              
              <div className="flex items-start justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {extractSenderName(selectedEmail.from).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{extractSenderName(selectedEmail.from)}</p>
                    <p className="text-sm text-muted-foreground">{extractSenderEmail(selectedEmail.from)}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatEmailDate(selectedEmail.date)}
                </span>
              </div>

              <div className="min-h-[200px]">
                {loadingEmailBody ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: emailBody || selectedEmail.snippet }}
                  />
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleReply}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          </Card>

          {/* Reply Dialog */}
          <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Reply to {extractSenderName(selectedEmail.from)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  To: {selectedEmail.from}
                </div>
                <div className="text-sm text-muted-foreground">
                  Subject: Re: {selectedEmail.subject}
                </div>
                <Textarea
                  placeholder="Write your reply..."
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="min-h-[200px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendReply} disabled={sending || !replyBody.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Reply
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        {/* Navigation Header */}
        <CrmNavHeader
          back
          dashboard
          onBack={() => onSectionChange?.('dashboard')}
          onDashboard={() => onSectionChange?.('dashboard')}
          sectionLabel="Emails"
        />

        {/* Calendar / Emails Tab Toggle */}
        <div className="flex items-center gap-2 border-b pb-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => onSectionChange?.('calendar')}
          >
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Emails
          </Button>
        </div>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Emails
            </h1>
            <p className="text-muted-foreground text-sm">Read, compose, and manage your emails</p>
          </div>
          <div className="flex items-center gap-2">
            {hasAnyConnection && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2">
                      <PenSquare className="h-4 w-4" />
                      Compose
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {connections.map((conn) => (
                      <DropdownMenuItem
                        key={conn.id}
                        onClick={() => {
                          setComposeData({ to: '', subject: '', body: '', fromAccount: conn.id });
                          setShowComposeDialog(true);
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {conn.email_address}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({conn.provider === 'google' ? 'Gmail' : 'Outlook'})
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchEmails(true)}
                  disabled={loadingEmails}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingEmails ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Reconnect Banner */}
        {reauthConnectionIds.length > 0 && (
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Email connection expired</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {connections
                    .filter(c => reauthConnectionIds.includes(c.id))
                    .map(c => `${c.provider === 'google' ? 'Gmail' : 'Outlook'} (${c.email_address})`)
                    .join(', ')
                  } needs to be reconnected for continued access.
                </p>
                <div className="flex gap-2 mt-3">
                  {connections.filter(c => reauthConnectionIds.includes(c.id)).map(c => (
                    <Button
                      key={c.id}
                      size="sm"
                      variant="destructive"
                      onClick={() => handleConnect(c.provider as 'google' | 'outlook')}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reconnect {c.provider === 'google' ? 'Gmail' : 'Outlook'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Search Bar */}
        {hasAnyConnection && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails by sender, subject, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Connected Accounts Summary - Compact when connected */}
        {hasAnyConnection ? (
          <Collapsible open={connectionsExpanded} onOpenChange={setConnectionsExpanded}>
            <Card className="p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {connections.length} Email Account{connections.length > 1 ? 's' : ''} Connected
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {connections.map(c => c.email_address).join(', ')}
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
                  {/* Gmail */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Gmail</p>
                        {googleConnected ? (
                          <p className="text-xs text-green-600">{googleConnected.email_address}</p>
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

                  {/* Outlook */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#0078D4" d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12z"/>
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Outlook</p>
                        {outlookConnected ? (
                          <p className="text-xs text-green-600">{outlookConnected.email_address}</p>
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
          /* Full connection UI when no accounts connected */
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gmail Card */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Gmail</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Read, send, and manage emails from Gmail
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
                    Connect Gmail
                  </Button>
                </div>
              </div>
            </Card>

            {/* Outlook Card */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center shadow-sm">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path fill="#0078D4" d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Outlook</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Read, send, and manage emails from Outlook
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

        {/* Action Bar above email list */}
        {hasAnyConnection && !loadingEmails && filteredEmails.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2">
                  <PenSquare className="h-4 w-4" />
                  Compose
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {connections.map((conn) => (
                  <DropdownMenuItem
                    key={conn.id}
                    onClick={() => {
                      setComposeData({ to: '', subject: '', body: '', fromAccount: conn.id });
                      setShowComposeDialog(true);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {conn.email_address}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({conn.provider === 'google' ? 'Gmail' : 'Outlook'})
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={!selectedEmail}
              onClick={() => {
                if (selectedEmail) handleReply();
              }}
            >
              <Reply className="h-4 w-4" />
              Reply
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">
              {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Emails List */}
        {hasAnyConnection && hasBothProviders ? (
          /* Side-by-side layout when both providers connected */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gmail Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                </svg>
                <h2 className="text-lg font-semibold">Gmail</h2>
                <span className="text-xs text-muted-foreground ml-auto">{googleConnected?.email_address}</span>
              </div>
              {loadingEmails ? (
                <Card className="p-6 text-center">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                </Card>
              ) : gmailEmails.length === 0 ? (
                <Card className="p-6 text-center bg-muted/20">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No Gmail messages</p>
                </Card>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {gmailEmails.map((email, index) => {
                    const globalIndex = filteredEmails.indexOf(email);
                    return (
                      <Card 
                        key={email.id} 
                        className={`p-3 hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md ${
                          email.isUnread 
                            ? 'border-l-4 border-l-primary bg-primary/5' 
                            : 'border-l-4 border-l-transparent'
                        }`}
                        onClick={() => handleOpenEmail(email, globalIndex)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-4 flex items-center justify-center mt-1">
                            {email.isUnread ? (
                              <Circle className="h-2 w-2 fill-primary text-primary" />
                            ) : (
                              <MailOpen className="h-3.5 w-3.5 text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`truncate text-sm ${email.isUnread ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                {extractSenderName(email.from)}
                              </p>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatEmailDate(email.date)}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${email.isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                              {email.subject || '(No subject)'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {email.snippet}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Outlook Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#0078D4" d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12z"/>
                </svg>
                <h2 className="text-lg font-semibold">Outlook</h2>
                <span className="text-xs text-muted-foreground ml-auto">{outlookConnected?.email_address}</span>
              </div>
              {loadingEmails ? (
                <Card className="p-6 text-center">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                </Card>
              ) : outlookEmails.length === 0 ? (
                <Card className="p-6 text-center bg-muted/20">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No Outlook messages</p>
                </Card>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {outlookEmails.map((email, index) => {
                    const globalIndex = filteredEmails.indexOf(email);
                    return (
                      <Card 
                        key={email.id} 
                        className={`p-3 hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md ${
                          email.isUnread 
                            ? 'border-l-4 border-l-primary bg-primary/5' 
                            : 'border-l-4 border-l-transparent'
                        }`}
                        onClick={() => handleOpenEmail(email, globalIndex)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-4 flex items-center justify-center mt-1">
                            {email.isUnread ? (
                              <Circle className="h-2 w-2 fill-primary text-primary" />
                            ) : (
                              <MailOpen className="h-3.5 w-3.5 text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`truncate text-sm ${email.isUnread ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                {extractSenderName(email.from)}
                              </p>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatEmailDate(email.date)}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${email.isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                              {email.subject || '(No subject)'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {email.snippet}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : hasAnyConnection ? (
          /* Single column when only one provider connected */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Inbox
                {searchQuery && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({filteredEmails.length} result{filteredEmails.length !== 1 ? 's' : ''})
                  </span>
                )}
              </h2>
            </div>
            
            {loadingEmails ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading emails...</p>
              </Card>
            ) : filteredEmails.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-to-br from-muted/30 to-muted/10">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                {searchQuery ? (
                  <>
                    <p className="text-muted-foreground font-medium">No emails match "{searchQuery}"</p>
                    <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground font-medium">No recent emails found</p>
                    <p className="text-sm text-muted-foreground mt-1">Emails from your connected accounts will appear here</p>
                  </>
                )}
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredEmails.map((email, index) => (
                  <Card 
                    key={email.id} 
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md ${
                      email.isUnread 
                        ? 'border-l-4 border-l-primary bg-primary/5' 
                        : 'border-l-4 border-l-transparent'
                    }`}
                    onClick={() => handleOpenEmail(email, index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 flex items-center justify-center mt-1">
                        {email.isUnread ? (
                          <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
                        ) : (
                          <MailOpen className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold">
                          {extractSenderName(email.from).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate ${email.isUnread ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                            {extractSenderName(email.from)}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatEmailDate(email.date)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${email.isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {email.subject || '(No subject)'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {email.snippet}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Empty state when no connections */}
        {!hasAnyConnection && !loading && (
          <Card className="p-12 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-dashed border-2">
            <Mail className="h-16 w-16 mx-auto mb-4 text-primary/40" />
            <h3 className="text-xl font-semibold mb-2">Connect Your Email</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Connect your Gmail or Outlook account to read, send, and manage emails directly from your CRM.
            </p>
          </Card>
        )}

        {/* Compose Email Dialog */}
        <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenSquare className="h-5 w-5" />
                Compose New Email
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Select
                  value={composeData.fromAccount}
                  onValueChange={(value) => setComposeData(prev => ({ ...prev, fromAccount: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        {conn.email_address} ({conn.provider === 'google' ? 'Gmail' : 'Outlook'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="compose-to">To</Label>
                <Input
                  id="compose-to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={composeData.to}
                  onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="compose-subject">Subject</Label>
                <Input
                  id="compose-subject"
                  placeholder="Email subject..."
                  value={composeData.subject}
                  onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="compose-body">Message</Label>
                <Textarea
                  id="compose-body"
                  placeholder="Write your message..."
                  value={composeData.body}
                  onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                  className="min-h-[200px]"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendNewEmail} 
                  disabled={composeSending || !composeData.to.trim() || !composeData.subject.trim() || !composeData.body.trim()}
                >
                  {composeSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
