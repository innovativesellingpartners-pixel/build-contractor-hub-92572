import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, CheckCircle, TrendingUp, FileText, Users, Loader2, PhoneCall } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function QuickBooks() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    checkConnection();
    
    // Check for OAuth callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('qb_connected') === 'true') {
      toast({
        title: "QuickBooks Connected!",
        description: "Your QuickBooks account has been successfully connected.",
      });
      setIsConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('qb_error')) {
      toast({
        title: "Connection Failed",
        description: params.get('qb_error') || "Failed to connect to QuickBooks",
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkConnection = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      const connected = !!data;
      setIsConnected(connected);
      
      // Auto-open login dialog if not connected and first time checking
      if (!connected && !hasCheckedConnection) {
        setLoginDialogOpen(true);
        setHasCheckedConnection(true);
      }
    } catch (error) {
      console.error('Error checking QuickBooks connection:', error);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-oauth-init');
      
      if (error) throw error;
      
      // Redirect to QuickBooks OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error initiating QuickBooks OAuth:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate QuickBooks connection. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('quickbooks_connections')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "QuickBooks account has been disconnected.",
      });
    } catch (error) {
      console.error('Error disconnecting QuickBooks:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect QuickBooks account.",
        variant: "destructive",
      });
    }
  };

  if (checkingConnection) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            QuickBooks Integration
          </h2>
          <p className="text-muted-foreground mt-2">
            Connect your QuickBooks account to sync invoices, expenses, and financial data
          </p>
        </div>
        {isConnected && (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        )}
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
          {!isConnected ? (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold">Benefits of Integration:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Automatically sync invoices and payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Track expenses and job costs in real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Generate financial reports and insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Streamline your accounting workflow</span>
                  </li>
                </ul>
              </div>
              <Button onClick={handleConnect} size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Connect QuickBooks Account
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">Connected</p>
                      <p className="text-sm text-muted-foreground">QuickBooks Data</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">Synced</p>
                      <p className="text-sm text-muted-foreground">Invoices</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">Active</p>
                      <p className="text-sm text-muted-foreground">Integration</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Button 
                onClick={handleDisconnect} 
                variant="outline" 
                size="lg" 
                className="w-full"
              >
                Disconnect QuickBooks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QuickBooks Login Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help with QuickBooks?</CardTitle>
          <CardDescription>
            Access QuickBooks support and sales assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Log in to QuickBooks Online
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <div className="flex flex-col items-center space-y-6 p-4">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-blue-600">INTUIT</h2>
                  <p className="text-lg font-medium">Let's get you in to QuickBooks</p>
                </div>

                <div className="w-full space-y-3">
                  <Button 
                    onClick={handleConnect} 
                    size="lg" 
                    className="w-full bg-green-700 hover:bg-green-800 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Connect to QuickBooks
                      </>
                    )}
                  </Button>

                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                    onClick={() => {
                      setLoginDialogOpen(false);
                      window.location.href = '/contact';
                    }}
                  >
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Contact Sales
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  By connecting, you agree to Intuit Terms and our Privacy Policy applies to your personal data.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Sync Settings (only visible when connected) */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>
              Manage how CT1 syncs with QuickBooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Auto-sync Invoices</p>
                <p className="text-sm text-muted-foreground">Automatically sync new invoices</p>
              </div>
              <Badge className="bg-green-500 text-white">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Expense Tracking</p>
                <p className="text-sm text-muted-foreground">Track job expenses in QuickBooks</p>
              </div>
              <Badge className="bg-green-500 text-white">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Payment Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified of payment updates</p>
              </div>
              <Badge className="bg-green-500 text-white">Enabled</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
