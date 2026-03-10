import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, Phone, Mail, User, Mic, Settings } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

interface UpcomingCall {
  id: string;
  date: string;
  time: string;
  type: 'training' | 'business' | 'support';
  accountManager: string;
  status: 'confirmed' | 'pending';
}

export function ScheduleCall() {
  const { toast } = useToast();
  const [upcomingCalls] = useState<UpcomingCall[]>([
    {
      id: '1',
      date: '2024-02-15',
      time: '2:00 PM EST',
      type: 'business',
      accountManager: 'John Smith',
      status: 'confirmed'
    }
  ]);
  
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(false);
  const [aiVoiceProvider, setAiVoiceProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');

  const handleSaveAiVoice = () => {
    if (aiVoiceEnabled && !apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key to enable AI voice.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Settings Saved",
      description: "AI voice provider settings have been updated.",
    });
  };

  const getCallTypeLabel = (type: string) => {
    switch (type) {
      case 'training': return 'Training Session';
      case 'business': return 'Business Consultation';
      case 'support': return 'Support Call';
      default: return 'Call';
    }
  };

  const getCallTypeColor = (type: string) => {
    switch (type) {
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Schedule a Call with CT1 Account Manager</h2>
        <p className="text-muted-foreground">Book one-on-one sessions with your dedicated account manager</p>
      </div>

      {/* AI Voice Provider Connection */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>AI Voice Assistant</CardTitle>
                <CardDescription>Connect to an AI voice provider for automated call handling</CardDescription>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Voice Provider Settings</DialogTitle>
                  <DialogDescription>
                    Configure your AI voice assistant for automated call handling
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ai-voice-toggle">Enable AI Voice</Label>
                    <Switch
                      id="ai-voice-toggle"
                      checked={aiVoiceEnabled}
                      onCheckedChange={setAiVoiceEnabled}
                    />
                  </div>
                  
                  {aiVoiceEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="provider">Provider</Label>
                        <select
                          id="provider"
                          value={aiVoiceProvider}
                          onChange={(e) => setAiVoiceProvider(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="openai">OpenAI Realtime API</option>
                          <option value="elevenlabs">ElevenLabs</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input
                          id="api-key"
                          type="password"
                          placeholder="Enter your API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your API key is stored securely and never shared
                        </p>
                      </div>
                    </>
                  )}
                  
                  <Button onClick={handleSaveAiVoice} className="w-full">
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${aiVoiceEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-muted-foreground">
              {aiVoiceEnabled ? `Connected to ${aiVoiceProvider === 'openai' ? 'OpenAI' : 'ElevenLabs'}` : 'Not connected'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Business Training Session</h3>
                <p className="text-sm text-muted-foreground">30 minutes</p>
              </div>
              <Button className="w-full">Schedule Now</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Growth Consultation</h3>
                <p className="text-sm text-muted-foreground">45 minutes</p>
              </div>
              <Button className="w-full">Schedule Now</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Quick Support Call</h3>
                <p className="text-sm text-muted-foreground">15 minutes</p>
              </div>
              <Button className="w-full">Schedule Now</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Calls</CardTitle>
          <CardDescription>Your scheduled sessions with CT1 team</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingCalls.length > 0 ? (
            <div className="space-y-4">
              {upcomingCalls.map((call) => (
                <div key={call.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border rounded-lg gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{getCallTypeLabel(call.type)}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCallTypeColor(call.type)}`}>
                          {call.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(call.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{call.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{call.accountManager}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" className="flex-1 md:flex-none">Reschedule</Button>
                    <Button size="sm" className="flex-1 md:flex-none">Join Call</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No upcoming calls</h3>
              <p className="text-muted-foreground mb-4">Schedule your first session with your account manager</p>
              <Button>Schedule Now</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Account Manager</CardTitle>
          <CardDescription>Direct contact for support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto md:mx-0">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-semibold text-lg">John Smith</h4>
              <p className="text-sm text-muted-foreground mb-2">Senior Account Manager</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center md:justify-start gap-2 sm:gap-4 text-sm">
                <div className="flex items-center justify-center md:justify-start gap-1">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="break-all">support@myct1.com</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-1">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span>(419) 827-4285</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}