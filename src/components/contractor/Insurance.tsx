import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileText, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function Insurance() {
  const [open, setOpen] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Logging in...",
      description: "Connecting to your World Insurance account.",
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Insurance & Compliance</h1>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Log in to Insurance Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">Login to your account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="emailOrUsername" className="text-sm font-medium">
                    Email or username <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="emailOrUsername"
                    type="text"
                    placeholder="Email or username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me next time
                  </label>
                </div>
                <Button type="submit" className="w-full h-11 bg-green-600 hover:bg-green-700 text-white">
                  Sign in
                </Button>
                <div className="text-center">
                  <Button type="button" variant="link" className="text-sm text-primary">
                    Forgot password
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button onClick={() => window.location.href = 'mailto:sales@myct1.com?subject=Insurance Options - Lower My Bill'}>
            Contact Sales for Better Rates
          </Button>
          <Button variant="secondary">Upload Documents</Button>
        </div>
      </div>

      {/* Insurance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">General Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Expires: Dec 31, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Workers Comp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <Badge className="bg-yellow-500">Expiring Soon</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Expires: Feb 15, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contractor License</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Expires: Jun 30, 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insurance Providers */}
      <Card>
        <CardHeader>
          <CardTitle>CT1 Preferred Insurance Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">CT1 Insurance Program</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Comprehensive coverage designed specifically for CT1 contractors with competitive rates and exclusive benefits.
                  </p>
                  <div className="flex gap-2">
                    <Button>Get a Quote</Button>
                    <Button variant="outline">Learn More</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Partner Insurance Solutions</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Additional coverage options for specialized work and expanded protection.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">Contact Agent</Button>
                    <Button variant="outline">View Details</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">General Liability Certificate</p>
                  <p className="text-xs text-muted-foreground">Updated: Jan 1, 2024</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Download</Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Workers Comp Policy</p>
                  <p className="text-xs text-muted-foreground">Updated: Jan 1, 2023</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Download</Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Contractor License</p>
                  <p className="text-xs text-muted-foreground">Updated: Jul 1, 2023</p>
                </div>
              </div>
              <Button size="sm" variant="outline">Download</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
