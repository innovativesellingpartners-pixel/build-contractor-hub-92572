import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ExternalLink, CheckCircle, TrendingUp, FileText, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function QuickBooks() {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    // In production, this would initiate OAuth flow
    toast({
      title: "QuickBooks Integration",
      description: "QuickBooks connection coming soon! This feature will sync your financial data seamlessly.",
    });
  };

  const handleLogin = () => {
    // Open QuickBooks Online in iframe or new window
    window.open("https://app.qbo.intuit.com/app/homepage", "_blank", "width=1200,height=800");
  };

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
              <Button onClick={handleConnect} size="lg" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Connect QuickBooks Account
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">$127,450</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">23</p>
                    <p className="text-sm text-muted-foreground">Open Invoices</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">48</p>
                    <p className="text-sm text-muted-foreground">Active Clients</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QuickBooks Online Access */}
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Online Access</CardTitle>
          <CardDescription>
            Access your QuickBooks account directly from CT1
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogin} variant="outline" size="lg" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Log in to QuickBooks Online
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Opens in a new window for secure access
          </p>
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
