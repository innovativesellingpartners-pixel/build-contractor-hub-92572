import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Calendar, Clock, Phone, Globe, AlertTriangle, PhoneCall, ChevronDown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { generateVapiPrompt, generateFirstMessage } from "@/lib/generateVapiPrompt";
import { useUserTier } from "@/hooks/useUserTier";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AIProfile {
  business_name: string;
  contractor_name: string;
  contractor_phone: string | null;
  trade: string;
  service_description: string | null;
  custom_greeting: string | null;
  custom_instructions: string | null;
  qualification_instructions: string | null;
  business_hours: any;
  ai_enabled: boolean | null;
  inbound_call_mode: string | null;
  forward_timeout_seconds: number | null;
  booking_buffer_minutes: number | null;
  default_meeting_length: number | null;
  services_offered: string[] | null;
  service_area: string[] | null;
  google_calendar_enabled: boolean | null;
  calendar_email: string | null;
}

const defaultProfile: AIProfile = {
  business_name: "",
  contractor_name: "",
  contractor_phone: null,
  trade: "",
  service_description: null,
  custom_greeting: null,
  custom_instructions: null,
  qualification_instructions: null,
  business_hours: null,
  ai_enabled: false,
  inbound_call_mode: "ai_only",
  forward_timeout_seconds: 20,
  booking_buffer_minutes: 30,
  default_meeting_length: 60,
  services_offered: [],
  service_area: [],
  google_calendar_enabled: false,
  calendar_email: null,
};

export function ForgeSettings({ onBack }: { onBack: () => void }) {
  const [profile, setProfile] = useState<AIProfile>(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [showContactSales, setShowContactSales] = useState(false);
  const { userRole, hasFullAccess, subscription } = useUserTier();
  
  const isAdmin = hasFullAccess || userRole === 'super_admin' || userRole === 'admin';
  // Check if user has Voice AI subscription (bot_user tier includes it, or growth/accel)
  const hasVoiceAISubscription = subscription?.tier_id === 'bot_user' || 
    subscription?.tier_id === 'growth' || 
    subscription?.tier_id === 'accel' || 
    subscription?.tier_id === 'full_access';

  useEffect(() => {
    loadProfile();
    checkCalendar();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("contractor_ai_profiles")
      .select("*")
      .eq("contractor_id", user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        business_name: data.business_name,
        contractor_name: data.contractor_name,
        contractor_phone: data.contractor_phone,
        trade: data.trade,
        service_description: data.service_description,
        custom_greeting: data.custom_greeting,
        custom_instructions: data.custom_instructions,
        qualification_instructions: (data as any).qualification_instructions || null,
        business_hours: data.business_hours,
        ai_enabled: data.ai_enabled,
        inbound_call_mode: data.inbound_call_mode,
        forward_timeout_seconds: data.forward_timeout_seconds,
        booking_buffer_minutes: data.booking_buffer_minutes,
        default_meeting_length: data.default_meeting_length,
        services_offered: data.services_offered,
        service_area: data.service_area,
        google_calendar_enabled: data.google_calendar_enabled,
        calendar_email: data.calendar_email,
      });
    }
  };

  const checkCalendar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("calendar_connections")
      .select("id, calendar_email")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();

    setCalendarConnected(!!data);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate structured prompt from profile fields
    const generatedPrompt = generateVapiPrompt({
      business_name: profile.business_name,
      trade: profile.trade,
      service_description: profile.service_description,
      services_offered: profile.services_offered,
      service_area: profile.service_area,
      business_hours: profile.business_hours,
      calendar_email: profile.calendar_email,
      contractor_phone: profile.contractor_phone,
      qualification_instructions: profile.qualification_instructions,
    });

    const { error } = await supabase
      .from("contractor_ai_profiles")
      .upsert({
        contractor_id: user.id,
        business_name: profile.business_name,
        contractor_name: profile.contractor_name,
        contractor_phone: profile.contractor_phone,
        trade: profile.trade,
        service_description: profile.service_description,
        custom_greeting: profile.custom_greeting,
        custom_instructions: generatedPrompt,
        business_hours: profile.business_hours,
        ai_enabled: profile.ai_enabled,
        inbound_call_mode: profile.inbound_call_mode,
        forward_timeout_seconds: profile.forward_timeout_seconds,
        booking_buffer_minutes: profile.booking_buffer_minutes,
        default_meeting_length: profile.default_meeting_length,
        services_offered: profile.services_offered,
        service_area: profile.service_area,
      } as any, { onConflict: "contractor_id" });

    setSaving(false);
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved");
      setProfile(prev => ({ ...prev, custom_instructions: generatedPrompt }));
      
      // Trigger Forge sync
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { error: syncError } = await supabase.functions.invoke("forge-prompt-sync", {
            body: { contractor_id: user.id },
          });
          if (syncError) {
            console.error("Forge sync error:", syncError);
            toast.warning("Settings saved but Forge sync failed");
          } else {
            toast.success("Prompt synced to Forge");
          }
        }
      } catch (syncErr) {
        console.error("Forge sync error:", syncErr);
      }
    }
  };

  const connectCalendar = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke("google-oauth-init", {
        body: { type: "calendar" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      toast.error("Failed to start Google connection");
    }
  };

  const update = (field: keyof AIProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Voice AI Settings</h2>
            <p className="text-sm text-muted-foreground">Configure hours, booking rules, and integrations</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4 text-orange-500" />
            Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Business Name</Label>
              <Input value={profile.business_name} onChange={e => update("business_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Your Name</Label>
              <Input value={profile.contractor_name} onChange={e => update("contractor_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={profile.contractor_phone || ""} onChange={e => update("contractor_phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Trade</Label>
              <Input value={profile.trade} onChange={e => update("trade", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Service Description</Label>
            <Textarea
              value={profile.service_description || ""}
              onChange={e => update("service_description", e.target.value)}
              rows={2}
              placeholder="Brief description of services for the AI to reference..."
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-orange-500" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Voice AI</p>
              <p className="text-xs text-muted-foreground">
                {!isAdmin && profile.ai_enabled 
                  ? "Contact sales to disable Voice AI" 
                  : "Toggle AI call handling on/off"}
              </p>
              {!isAdmin && profile.ai_enabled && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Once enabled, only a sales representative can disable this feature
                </p>
              )}
            </div>
            <Switch 
              checked={profile.ai_enabled ?? false} 
              disabled={!isAdmin && profile.ai_enabled === true}
              onCheckedChange={v => {
                if (!isAdmin && !v && profile.ai_enabled) {
                  // User trying to disable — show contact sales dialog
                  setShowContactSales(true);
                  return;
                }
                if (!isAdmin && v && !hasVoiceAISubscription) {
                  // User trying to enable without subscription — show payment prompt
                  setShowPaymentPrompt(true);
                  return;
                }
                update("ai_enabled", v);
              }} 
            />
          </div>
          <div className="space-y-1.5">
            <Label>Custom Greeting</Label>
            <Textarea
              value={profile.custom_greeting || ""}
              onChange={e => update("custom_greeting", e.target.value)}
              rows={2}
              placeholder="How should the AI greet callers?"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Custom Instructions</Label>
            <Textarea
              value={profile.custom_instructions || ""}
              onChange={e => update("custom_instructions", e.target.value)}
              rows={3}
              placeholder="Special instructions for the AI (e.g., ask about project size, mention promotions)..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Booking Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Booking Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Buffer Between Appointments (min)</Label>
              <Input
                type="number"
                value={profile.booking_buffer_minutes ?? 30}
                onChange={e => update("booking_buffer_minutes", parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Default Meeting Length (min)</Label>
              <Input
                type="number"
                value={profile.default_meeting_length ?? 60}
                onChange={e => update("default_meeting_length", parseInt(e.target.value) || 60)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Forward Timeout (sec)</Label>
              <Input
                type="number"
                value={profile.forward_timeout_seconds ?? 20}
                onChange={e => update("forward_timeout_seconds", parseInt(e.target.value) || 20)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-500" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Connect your calendar so Forge AI can check availability and book appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calendarConnected ? (
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-700 border-green-300">Connected</Badge>
              <span className="text-sm text-muted-foreground">{profile.calendar_email || "Google Calendar linked"}</span>
            </div>
          ) : (
            <Button onClick={connectCalendar} variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payment Prompt Dialog */}
      <AlertDialog open={showPaymentPrompt} onOpenChange={setShowPaymentPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-orange-500" />
              Voice AI Subscription Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Voice AI is an add-on feature that costs <strong>$30/month</strong>.</p>
              <p>This includes AI-powered call answering, appointment booking, lead capture, and more.</p>
              <p>Please contact our sales team to add Voice AI to your subscription.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.location.href = "mailto:sales@myct1.com?subject=Voice AI Subscription&body=I'd like to add Voice AI to my account.";
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Contact Sales
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contact Sales to Disable Dialog */}
      <AlertDialog open={showContactSales} onOpenChange={setShowContactSales}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Contact Sales to Disable
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Voice AI cannot be disabled from your account settings.</p>
              <p>To disable Voice AI, please contact our sales team and they will assist you with the process.</p>
              <p className="font-medium">Email: sales@myct1.com</p>
              <p className="font-medium">Phone: (555) 123-4567</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.location.href = "mailto:sales@myct1.com?subject=Disable Voice AI&body=I'd like to disable Voice AI on my account.";
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Email Sales
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
