import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, ExternalLink, CheckCircle, TrendingUp, FileText, Users, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function QuickBooks() {
  const [isConnected, setIsConnected] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [emailOrUserId, setEmailOrUserId] = useState("");
  const [phone, setPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const { toast } = useToast();

  const handleConnect = () => {
    // In production, this would initiate OAuth flow
    toast({
      title: "QuickBooks Integration",
      description: "QuickBooks connection coming soon! This feature will sync your financial data seamlessly.",
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Signing in...",
      description: "Connecting to your QuickBooks Online account.",
    });
    setLoginOpen(false);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
          <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Log in to QuickBooks Online
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-blue-600">INTUIT</h2>
                  <p className="text-lg font-medium">Let's get you in to QuickBooks</p>
                </div>
                
                <form onSubmit={handleLogin} className="w-full space-y-4">
                  <Tabs defaultValue="email" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="email">Email or user ID</TabsTrigger>
                      <TabsTrigger value="phone">Phone</TabsTrigger>
                    </TabsList>
                    <TabsContent value="email" className="space-y-4 mt-4">
                      <Input
                        id="emailOrUserId"
                        type="text"
                        placeholder="Email or user ID"
                        value={emailOrUserId}
                        onChange={(e) => setEmailOrUserId(e.target.value)}
                        required
                        className="h-11"
                      />
                    </TabsContent>
                    <TabsContent value="phone" className="space-y-4 mt-4">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-11"
                      />
                    </TabsContent>
                  </Tabs>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="qb-remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <label
                      htmlFor="qb-remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me
                    </label>
                  </div>

                  <Button type="submit" className="w-full h-11 bg-green-700 hover:bg-green-800 text-white">
                    <Lock className="h-4 w-4 mr-2" />
                    Sign in
                  </Button>

                  <div className="text-xs text-center text-muted-foreground">
                    By selecting Sign in, you agree to Intuit Terms and Mailchimp Terms. Our Privacy Policy applies to your personal data.
                  </div>

                  <div className="text-center space-y-2">
                    <Button type="button" variant="link" className="text-sm text-green-700 hover:text-green-800">
                      Try something else
                    </Button>
                    <p className="text-sm">
                      New to Intuit?{" "}
                      <Button type="button" variant="link" className="text-sm text-primary p-0 h-auto">
                        Create an account
                      </Button>
                    </p>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Secure login within CT1 environment
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
