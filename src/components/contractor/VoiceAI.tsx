import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Bot, CheckCircle, Phone, Clock, Users, ExternalLink, PhoneCall } from "lucide-react";

export function VoiceAI() {
  const [voiceAIDialogOpen, setVoiceAIDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI Voice Assistant
          </h2>
          <p className="text-muted-foreground mt-2">
            smith.ai virtual receptionists handle calls, schedule appointments, and capture leads
          </p>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-sm text-muted-foreground">Call Answering</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">Instant</p>
              <p className="text-sm text-muted-foreground">Response Time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">100%</p>
              <p className="text-sm text-muted-foreground">Lead Capture</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>smith.ai Features</CardTitle>
          <CardDescription>
            Professional virtual receptionist services powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold">Key Benefits:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Answer calls 24/7 with natural AI conversations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Schedule appointments and sync with your calendar</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Capture lead information and send instant notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Handle customer service inquiries professionally</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Bilingual support for English and Spanish speakers</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Access smith.ai */}
      <Card>
        <CardHeader>
          <CardTitle>Access Your smith.ai Account</CardTitle>
          <CardDescription>
            Log in to manage your virtual receptionist settings and view call logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={voiceAIDialogOpen} onOpenChange={setVoiceAIDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Log in to smith.ai
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[90vh] p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">smith.ai Login</h3>
                    <p className="text-sm text-muted-foreground">Access your virtual receptionist dashboard</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVoiceAIDialogOpen(false);
                        window.location.href = '/contact';
                      }}
                    >
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Contact Sales
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setVoiceAIDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <iframe 
                    src="https://app.smith.ai/log-in/?utm_source=google-ads&utm_medium=cpc&utm_campaign=air-key-terms-search&_gl=1*16pd9z*_gcl_aw*R0NMLjE3NjAwMTg5NzAuQ2p3S0NBand1cDNIQmhBQUVpd0E3ZXVadWlZbDN6YnNSeURHZ0xsSlFTa1pTdDZxR05qMnpObnVNUkpZaGo2dVFWVVM2dzJWTHAwQkRCb0NtczhRQXZEX0J3RQ..*_gcl_au*MTc2Nzk4ODc4MC4xNzYwMDE4OTcw"
                    className="w-full h-full border-0"
                    title="smith.ai Login"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Secure login within CT1 environment
          </p>
        </CardContent>
      </Card>

      {/* Pricing & Plans Info */}
      <Card>
        <CardHeader>
          <CardTitle>Plans & Pricing</CardTitle>
          <CardDescription>
            Flexible pricing to match your business needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Starter Plan</h4>
              <p className="text-sm text-muted-foreground mb-2">Perfect for small businesses</p>
              <ul className="text-sm space-y-1">
                <li>• Up to 50 calls/month</li>
                <li>• Basic lead capture</li>
                <li>• Email notifications</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg border-primary/50 bg-primary/5">
              <Badge className="mb-2">Most Popular</Badge>
              <h4 className="font-semibold mb-2">Professional Plan</h4>
              <p className="text-sm text-muted-foreground mb-2">For growing contractors</p>
              <ul className="text-sm space-y-1">
                <li>• Unlimited calls</li>
                <li>• Advanced scheduling</li>
                <li>• CRM integration</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
          <Button variant="outline" className="w-full" size="lg" asChild>
            <a href="/contact">
              <PhoneCall className="h-4 w-4 mr-2" />
              Contact Sales for Pricing
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}