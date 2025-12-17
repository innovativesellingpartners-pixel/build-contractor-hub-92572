import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

export function QuickBooksIntegration() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();

    // Handle OAuth callback
    if (searchParams.get('qb_connected') === 'true') {
      toast({
        title: "QuickBooks Connected!",
        description: "Your QuickBooks account has been successfully connected.",
      });
    }

    if (searchParams.get('qb_error')) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: searchParams.get('qb_error') || "Failed to connect to QuickBooks",
      });
    }
  }, [searchParams, toast]);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('qb_realm_id, qb_last_sync_at')
        .eq('id', user.id)
        .single();

      setIsConnected(!!profile?.qb_realm_id);
    } catch (error) {
      console.error('Error checking QuickBooks connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      
      // Call the edge function with proper auth headers via Supabase client
      const { data, error } = await supabase.functions.invoke('quickbooks-connect');
      
      if (error) {
        console.error('QuickBooks connect error:', error);
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: error.message || "Failed to initiate QuickBooks connection",
        });
        return;
      }
      
      if (data?.authUrl) {
        // Redirect to QuickBooks OAuth page
        window.location.href = data.authUrl;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error: any) {
      console.error('Error connecting to QuickBooks:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to connect to QuickBooks",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      
      const { data, error } = await supabase.functions.invoke('quickbooks-disconnect');

      if (error) throw error;

      if (data?.success) {
        setIsConnected(false);
        toast({
          title: "Disconnected",
          description: "QuickBooks account has been disconnected.",
        });
      }
    } catch (error) {
      console.error('Error disconnecting QuickBooks:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to disconnect QuickBooks account.",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={ct1Logo} alt="CT1" className="h-10 w-10" />
          <div>
            <h1 className="text-2xl font-bold">QuickBooks Integration</h1>
            <p className="text-sm text-muted-foreground">
              Connect your QuickBooks account to sync invoices and financial data
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            {isConnected
              ? "Your QuickBooks account is connected and syncing"
              : "Connect your QuickBooks account to get started"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Not Connected</span>
                </>
              )}
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Active" : "Inactive"}
            </Badge>
          </div>

          {!isConnected ? (
            <Button onClick={handleConnect} className="w-full" size="lg">
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect QuickBooks Account
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your invoices and financial data are available in the <strong>Financials</strong> tab in the CRM.
              </p>
              <Button 
                onClick={handleDisconnect} 
                variant="outline" 
                className="w-full"
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  "Disconnect QuickBooks"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help with QuickBooks?</CardTitle>
          <CardDescription>Access QuickBooks support and sales assistance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => window.open('https://accounts.intuit.com/app/sign-in?app_group=QBO&asset_alias=Intuit.accounting.core.qbowebapp&app_environment=prod&intent=qbo', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Log in to QuickBooks Online
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => window.location.href = '/contact'}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Contact QuickBooks Sales
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
