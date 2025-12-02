import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Plug, Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EmailConnection {
  id: string;
  provider: string;
  email_address: string;
  created_at: string;
}

interface EmailsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function EmailsSection({ onSectionChange }: EmailsSectionProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
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

    if (oauthSuccess === 'email') {
      toast.success(`${provider === 'google' ? 'Gmail' : 'Outlook'} connected successfully!`);
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
        .from('email_connections')
        .select('id, provider, email_address, created_at')
        .eq('user_id', user?.id);

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
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
    } catch (error: any) {
      toast.error('Failed to disconnect');
    }
  };

  const googleConnected = connections.find(c => c.provider === 'google');
  const outlookConnected = connections.find(c => c.provider === 'outlook');

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Emails</h1>
            <p className="text-muted-foreground">Connect and manage your email accounts</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Gmail */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Gmail</h3>
                {googleConnected ? (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      Connected: {googleConnected.email_address}
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
                      Read, send, and manage emails from Gmail
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
                      Connect Gmail
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Outlook */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#0078D4" d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V12zm-6-8.25v3h3v-3zm0 4.5v3h3v-3zm0 4.5v1.83l3.05-1.83zm-5.25-9v3h3.75v-3zm0 4.5v3h3.75v-3zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73zM9 3.75V6h2l.13.01.12.04v-2.3zM5.98 15.98q.9 0 1.6-.3.7-.32 1.19-.86.48-.55.73-1.28.25-.74.25-1.61 0-.83-.25-1.55-.24-.71-.71-1.24t-1.15-.83q-.68-.3-1.55-.3-.92 0-1.64.3-.71.3-1.2.85-.5.54-.75 1.3-.25.74-.25 1.63 0 .85.26 1.56.26.72.74 1.23.48.52 1.17.81.69.3 1.56.3zM7.5 21h12.39L12 16.08V17q0 .41-.3.7-.29.3-.7.3H7.5zm15-.13v-7.24l-5.9 3.54Z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Outlook</h3>
                {outlookConnected ? (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      Connected: {outlookConnected.email_address}
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
                      Read, send, and manage emails from Outlook
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

        {connections.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Email Accounts Connected</h3>
            <p className="text-muted-foreground mb-6">
              Connect your Gmail or Outlook account to manage communications directly from your CRM
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
