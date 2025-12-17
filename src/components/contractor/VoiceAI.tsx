import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bot, CheckCircle, Phone, Clock, Users, ExternalLink, PhoneCall, Zap } from "lucide-react";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

export function VoiceAI() {
  const [smithAIDialogOpen, setSmithAIDialogOpen] = useState(false);
  const [myCT1DialogOpen, setMyCT1DialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
          <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              Voice AI Assistant
            </h2>
            <p className="text-muted-foreground mt-1">
              Connect to AI-powered voice assistants for 24/7 call handling
            </p>
          </div>
        </div>
      </div>

      {/* Connection Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* myCT1 Voice AI Card */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <img src={ct1Logo} alt="myCT1" className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  myCT1 Voice AI
                  <Badge variant="default" className="text-xs">Native</Badge>
                </CardTitle>
                <CardDescription>Built-in AI voice assistant</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Native integration with CT1 CRM</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Automatic lead capture & sync</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Custom greeting & business hours</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>$50/month per user</span>
              </li>
            </ul>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setMyCT1DialogOpen(true)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Connect to myCT1 Voice AI
            </Button>
          </CardContent>
        </Card>

        {/* Smith AI Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Smith.ai
                  <Badge variant="secondary" className="text-xs">Third Party</Badge>
                </CardTitle>
                <CardDescription>Professional virtual receptionist</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Human + AI hybrid answering</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Appointment scheduling</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Bilingual English & Spanish</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Pay-per-call pricing</span>
              </li>
            </ul>
            <Button 
              variant="outline"
              className="w-full" 
              size="lg"
              onClick={() => setSmithAIDialogOpen(true)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect to Smith.ai
            </Button>
          </CardContent>
        </Card>
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

      {/* myCT1 Voice AI Dialog */}
      <Dialog open={myCT1DialogOpen} onOpenChange={setMyCT1DialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={ct1Logo} alt="myCT1" className="h-8 w-8" />
              Connect to myCT1 Voice AI
            </DialogTitle>
            <DialogDescription>
              Get started with the native CT1 AI voice assistant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold">What's Included:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>24/7 AI call answering with natural voice</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Automatic lead creation in CRM</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Calendar integration & scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Custom greeting & voicemail options</span>
                </li>
              </ul>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <p className="text-2xl font-bold text-primary">$50/month</p>
              <p className="text-sm text-muted-foreground">per user</p>
            </div>
            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                size="lg"
                asChild
              >
                <a href="/contact">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Contact Sales to Enable
                </a>
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Our team will set up your dedicated phone number and configure your AI assistant
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Smith.ai Dialog */}
      <Dialog open={smithAIDialogOpen} onOpenChange={setSmithAIDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              Connect to Smith.ai
            </DialogTitle>
            <DialogDescription>
              Access professional virtual receptionist services
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold">Smith.ai Features:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Human + AI hybrid call answering</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Appointment scheduling & calendar sync</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Lead capture & notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Bilingual English & Spanish support</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={() => {
                  window.open('https://app.smith.ai/log-in/', '_blank');
                  setSmithAIDialogOpen(false);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Log in to Smith.ai
              </Button>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              asChild
            >
              <a href="/contact">
                <PhoneCall className="h-4 w-4 mr-2" />
                Contact Sales for Setup
              </a>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Smith.ai will open in a new window for secure authentication
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}