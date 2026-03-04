import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, RefreshCw, Zap } from 'lucide-react';
import { generateVapiPrompt, generateFirstMessage } from '@/lib/generateVapiPrompt';

interface VoiceAISettingsProps {
  contractorId: string;
}

const DEFAULT_ASSISTANT_PROMPT = (profile: any) => `You are the AI voice assistant for ${profile?.business_name || '[Business Name]'}. You answer calls for ${profile?.trade || '[Trade]'} services.

Goals:
- Greet the caller as ${profile?.business_name || '[Business Name]'}.
- Collect caller name, phone number, address, and a short description of the problem.
- Explain services using: ${profile?.services_offered || '[Services]'}.
- Respect service area: ${profile?.service_area?.join(', ') || '[Service Area]'}. Do not promise service outside this area.
- Respect hours_of_operation and emergency_available when offering visit times.
- ${profile?.allow_pricing ? 'Provide pricing information when requested.' : 'Never give exact prices. Instead say the contractor will confirm pricing.'}
- Offer to schedule an appointment using the contractor calendar tied to ${profile?.calendar_email || '[Calendar Email]'}.
- Log calls, outcomes, and any scheduled meetings into CT1.
- Keep responses short and clear.
- If you cannot complete the goal, take a message and confirm someone will follow up.`;

export const VoiceAISettings = ({ contractorId }: VoiceAISettingsProps) => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile, isLoading, error } = useQuery<any>({
    queryKey: ['voiceAIProfile', contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractor_ai_profiles')
        .select('*')
        .eq('contractor_id', contractorId)
        .maybeSingle();

      // Fetch Twilio phone number separately since there's no direct relationship
      const { data: phoneNumber, error: phoneError } = await supabase
        .from('phone_numbers')
        .select('twilio_phone_number')
        .eq('contractor_id', contractorId)
        .eq('active', true)
        .maybeSingle();

      if (phoneError && phoneError.code !== 'PGRST116') {
        console.error('Error loading phone number for contractor:', phoneError);
      }


      if (error && error.code !== 'PGRST116') throw error;
      
      // If no profile exists, return default structure
      if (!data) {
        return {
          contractor_id: contractorId,
          ai_enabled: false,
          inbound_call_mode: 'ai_assistant',
          voice_id: 'pocket-agent',
          business_name: '',
          trade: '',
          services_offered: [],
          services_not_offered: [],
          service_area: [],
          business_hours: {},
          emergency_availability: false,
          pricing_rules: '',
          allow_pricing: false,
          calendar_type: null,
          calendar_email: '',
          default_meeting_length: 30,
          booking_buffer_minutes: 15,
          preferred_meeting_types: ['phone'],
          custom_instructions: DEFAULT_ASSISTANT_PROMPT(null),
          confirmation_message_template: '',
          internal_notes: '',
          contractor_phone: '',
          forward_timeout_seconds: 0,
          phone_numbers: []
        };
      }
      
      // Ensure custom_instructions has a value
      if (!data.custom_instructions) {
        data.custom_instructions = DEFAULT_ASSISTANT_PROMPT(data);
      }

      const result: any = {
        ...data,
        phone_numbers: phoneNumber ? [phoneNumber] : [],
      };

      return result;
    },
  });

  const [formData, setFormData] = useState<any>(null);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && !formData) {
      setFormData(profile);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      const { contractor_id, phone_numbers, ...profileData } = data;
      
      // Check if profile exists
      const { data: existing } = await supabase
        .from('contractor_ai_profiles')
        .select('id')
        .eq('contractor_id', contractorId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('contractor_ai_profiles')
          .update(profileData)
          .eq('contractor_id', contractorId);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('contractor_ai_profiles')
          .insert({
            contractor_id: contractorId,
            ...profileData
          });
        
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['voiceAIProfile', contractorId] });
      toast.success('Voice AI settings saved successfully');
      
      // Trigger Forge sync
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { error: syncError } = await supabase.functions.invoke('forge-prompt-sync', {
            body: { contractor_id: contractorId },
          });
          if (syncError) {
            console.error('Forge sync error:', syncError);
            toast.warning('Settings saved but Forge sync failed');
          } else {
            toast.success('Prompt synced to Forge');
          }
        }
      } catch (syncErr) {
        console.error('Forge sync error:', syncErr);
      }
      
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + (error as Error).message);
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    // Generate structured prompt before saving
    const generatedPrompt = generateVapiPrompt({
      business_name: formData.business_name,
      trade: formData.trade,
      service_description: formData.service_description,
      services_offered: formData.services_offered,
      services_not_offered: formData.services_not_offered,
      service_area: formData.service_area,
      business_hours: formData.business_hours,
      emergency_availability: formData.emergency_availability,
      allow_pricing: formData.allow_pricing,
      pricing_rules: formData.pricing_rules,
      calendar_email: formData.calendar_email,
      contractor_phone: formData.contractor_phone,
      qualification_instructions: formData.qualification_instructions,
    });
    const updatedFormData = { ...formData, custom_instructions: generatedPrompt };
    setFormData(updatedFormData);
    updateProfile.mutate(updatedFormData);
  };

  const handleCancel = () => {
    setFormData(profile);
    toast.info('Changes discarded');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Loading Voice AI settings...
      </div>
    );
  }

  if (error) {
    console.error('Error loading Voice AI profile:', error);
    return (
      <div className="space-y-2 text-sm p-4">
        <p className="text-red-600">
          There was a problem loading Voice AI settings for this user.
        </p>
        <p className="text-xs text-muted-foreground">
          Try refreshing the page. If this continues, check the AI configuration for this account.
        </p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        No Voice AI settings found for this user.
      </div>
    );
  }

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const twilioNumber = profile?.phone_numbers?.[0]?.twilio_phone_number || 'Not configured';

  return (
    <div className="space-y-6">
      {/* Status and Routing */}
      <Card>
        <CardHeader>
          <CardTitle>Status and Routing</CardTitle>
          <CardDescription>Control how incoming calls are handled</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Voice AI Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered voice assistant for this contractor
              </p>
            </div>
            <Switch
              checked={formData.ai_enabled}
              onCheckedChange={(checked) => updateField('ai_enabled', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Inbound Call Mode</Label>
            <Select
              value={formData.inbound_call_mode}
              onValueChange={(value) => updateField('inbound_call_mode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai_assistant">AI Assistant</SelectItem>
                <SelectItem value="voicemail_only">Voicemail Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Twilio Number</Label>
            <Input value={twilioNumber} disabled className="bg-muted" />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Contractor Phone (Forward To)</Label>
            <Input
              value={formData.contractor_phone || ''}
              onChange={(e) => updateField('contractor_phone', e.target.value)}
              placeholder="+1234567890"
            />
            <p className="text-xs text-muted-foreground">
              Phone number to ring before AI picks up (E.164 format)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Ring Timeout (seconds)</Label>
            <Input
              type="number"
              value={formData.forward_timeout_seconds || 0}
              onChange={(e) => updateField('forward_timeout_seconds', parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              max="60"
            />
            <p className="text-xs text-muted-foreground">
              How long to ring contractor's phone before AI answers (0 = immediate AI, 15-20 ≈ 3 rings)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>Information about the contractor's business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                value={formData.business_name || ''}
                onChange={(e) => updateField('business_name', e.target.value)}
                placeholder="Acme Plumbing"
              />
            </div>

            <div className="space-y-2">
              <Label>Trade</Label>
              <Input
                value={formData.trade || ''}
                onChange={(e) => updateField('trade', e.target.value)}
                placeholder="Plumbing"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Services Offered</Label>
            <Textarea
              value={Array.isArray(formData.services_offered) ? formData.services_offered.join(', ') : formData.services_offered || ''}
              onChange={(e) => updateField('services_offered', e.target.value.split(',').map(s => s.trim()))}
              placeholder="Pipe repair, drain cleaning, water heater installation"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Services NOT Offered</Label>
            <Textarea
              value={Array.isArray(formData.services_not_offered) ? formData.services_not_offered.join(', ') : formData.services_not_offered || ''}
              onChange={(e) => updateField('services_not_offered', e.target.value.split(',').map(s => s.trim()))}
              placeholder="Gas line work, septic systems"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Service Area</Label>
            <Input
              value={Array.isArray(formData.service_area) ? formData.service_area.join(', ') : formData.service_area || ''}
              onChange={(e) => updateField('service_area', e.target.value.split(',').map(s => s.trim()))}
              placeholder="Detroit, Ann Arbor, Dearborn"
            />
          </div>

          <div className="space-y-2">
            <Label>Hours of Operation</Label>
            <Input
              value={formData.business_hours ? JSON.stringify(formData.business_hours) : ''}
              onChange={(e) => {
                try {
                  updateField('business_hours', JSON.parse(e.target.value));
                } catch {
                  updateField('business_hours', e.target.value);
                }
              }}
              placeholder='{"mon-fri": "8am-5pm", "sat": "9am-2pm"}'
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Emergency Available</Label>
              <p className="text-sm text-muted-foreground">
                Offer 24/7 emergency services
              </p>
            </div>
            <Switch
              checked={formData.emergency_availability}
              onCheckedChange={(checked) => updateField('emergency_availability', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Pricing Notes</Label>
            <Textarea
              value={formData.pricing_rules || ''}
              onChange={(e) => updateField('pricing_rules', e.target.value)}
              placeholder="Standard hourly rate $125/hr, emergency rate $185/hr"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Pricing Discussion</Label>
              <p className="text-sm text-muted-foreground">
                Allow AI to discuss pricing with callers
              </p>
            </div>
            <Switch
              checked={formData.allow_pricing}
              onCheckedChange={(checked) => updateField('allow_pricing', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={formData.internal_notes || ''}
              onChange={(e) => updateField('internal_notes', e.target.value)}
              placeholder="Private admin notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduling</CardTitle>
          <CardDescription>Calendar and appointment settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Calendar Type</Label>
              <Select
                value={formData.calendar_type || 'none'}
                onValueChange={(value) => updateField('calendar_type', value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select calendar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="google">Google Calendar</SelectItem>
                  <SelectItem value="outlook">Outlook Calendar</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Calendar Email</Label>
              <Input
                type="email"
                value={formData.calendar_email || ''}
                onChange={(e) => updateField('calendar_email', e.target.value)}
                placeholder="calendar@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Meeting Length (minutes)</Label>
              <Input
                type="number"
                value={formData.default_meeting_length || 30}
                onChange={(e) => updateField('default_meeting_length', parseInt(e.target.value))}
                min={15}
                step={15}
              />
            </div>

            <div className="space-y-2">
              <Label>Booking Buffer (minutes)</Label>
              <Input
                type="number"
                value={formData.booking_buffer_minutes || 15}
                onChange={(e) => updateField('booking_buffer_minutes', parseInt(e.target.value))}
                min={0}
                step={15}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred Meeting Types</Label>
            <Input
              value={Array.isArray(formData.preferred_meeting_types) ? formData.preferred_meeting_types.join(', ') : formData.preferred_meeting_types || ''}
              onChange={(e) => updateField('preferred_meeting_types', e.target.value.split(',').map(s => s.trim()))}
              placeholder="phone, onsite, video"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Behavior */}
      <Card>
        <CardHeader>
          <CardTitle>AI Behavior</CardTitle>
          <CardDescription>Configure how the AI assistant responds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Voice ID</Label>
            <Input
              value={formData.voice_id || 'pocket-agent'}
              onChange={(e) => updateField('voice_id', e.target.value)}
              placeholder="pocket-agent"
            />
          </div>

          <div className="space-y-2">
            <Label>Assistant Prompt</Label>
            <Textarea
              value={formData.custom_instructions || ''}
              onChange={(e) => updateField('custom_instructions', e.target.value)}
              placeholder="System instructions for the AI..."
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This prompt guides the AI assistant's behavior and responses
            </p>
          </div>

          <div className="space-y-2">
            <Label>Confirmation Message Template</Label>
            <Textarea
              value={formData.confirmation_message_template || ''}
              onChange={(e) => updateField('confirmation_message_template', e.target.value)}
              placeholder="Thank you for scheduling with {business_name}. We'll see you on {date} at {time}."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};
