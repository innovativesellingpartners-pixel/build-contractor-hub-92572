import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Copy, AlertCircle, Loader2, ChevronDown, Plus } from 'lucide-react';
import { usePhoneNumber, useProvisionPhoneNumber } from '@/hooks/usePhoneNumbers';
import { useUserTier } from '@/hooks/useUserTier';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CallsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function CallsSection({ onSectionChange }: CallsSectionProps) {
  const { data: phoneNumber, isLoading: phoneLoading } = usePhoneNumber();
  const { subscription, hasFullAccess, isLoading: tierLoading } = useUserTier();
  const provisionMutation = useProvisionPhoneNumber();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [manualSid, setManualSid] = useState('');

  const registerExistingNumber = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('phone_numbers')
        .insert({
          contractor_id: user?.id,
          twilio_phone_number: manualNumber,
          twilio_sid: manualSid,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-number', user?.id] });
      toast.success('Phone number registered successfully!');
      setShowManualEntry(false);
      setManualNumber('');
      setManualSid('');
    },
    onError: (error: any) => {
      console.error('Error registering phone number:', error);
      toast.error(error.message || 'Failed to register phone number');
    },
  });

  const hasActivePaidSubscription = hasFullAccess || 
    (subscription?.status === 'active' && 
    subscription?.tier_id !== 'trial' && 
    subscription?.tier_id !== 'bot_user');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Phone number copied to clipboard');
  };

  const handleProvision = () => {
    provisionMutation.mutate();
  };

  if (phoneLoading || tierLoading) {
    return (
      <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
          <div>
            <h1 className="text-3xl font-bold">Calls</h1>
            <p className="text-muted-foreground">Manage your call history and phone number</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Calls</h1>
          <p className="text-muted-foreground">Manage your call history and phone number</p>
        </div>

        {phoneNumber ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Your CT1 Phone Number
                  </CardTitle>
                  <Badge variant={phoneNumber.active ? "default" : "secondary"}>
                    {phoneNumber.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription>
                  Use this number to receive calls from clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-4 bg-muted rounded-lg font-mono text-lg font-semibold">
                    {phoneNumber.twilio_phone_number}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(phoneNumber.twilio_phone_number)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Calls to this number will go to voicemail. Set up call forwarding from your cell phone to receive calls directly.
                  </AlertDescription>
                </Alert>

                <Collapsible open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full">
                      {isGuideOpen ? 'Hide' : 'Show'} Call Forwarding Setup Guide
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-base">How to Set Up Conditional Call Forwarding</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <p className="font-semibold mb-2">For iPhone:</p>
                          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Open Phone app and dial: <code className="bg-background px-1 rounded">*67{phoneNumber.twilio_phone_number}</code></li>
                            <li>Press Call button</li>
                            <li>You'll see a confirmation message</li>
                          </ol>
                        </div>
                        <div>
                          <p className="font-semibold mb-2">For Android:</p>
                          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Open Phone app</li>
                            <li>Go to Settings → Calls → Call Forwarding</li>
                            <li>Select "When busy" or "When unanswered"</li>
                            <li>Enter: {phoneNumber.twilio_phone_number}</li>
                          </ol>
                        </div>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            To disable forwarding, dial <code className="bg-background px-1 rounded">##67#</code>
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
                <CardDescription>Your call history will appear here</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No calls yet
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Get Your CT1 Phone Number
              </CardTitle>
              <CardDescription>
                {hasActivePaidSubscription
                  ? "Register your existing Twilio number or generate a new one"
                  : "Upgrade to access dedicated phone number"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasActivePaidSubscription ? (
                <>
                  {!showManualEntry ? (
                    <div className="space-y-4">
                      <div className="text-center space-y-2 py-4">
                        <Phone className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="font-semibold">No Phone Number Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Register your existing Twilio number or generate a new CT1 phone number 
                          with AI-powered call handling.
                        </p>
                      </div>
                      <div className="grid gap-3">
                        <Button
                          onClick={() => setShowManualEntry(true)}
                          variant="default"
                          className="w-full"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Register Existing Twilio Number
                        </Button>
                        <Button
                          onClick={handleProvision}
                          disabled={provisionMutation.isPending}
                          variant="outline"
                          className="w-full"
                        >
                          {provisionMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Provisioning Number...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Generate New CT1 Number
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowManualEntry(false)}
                          className="mb-4"
                        >
                          <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
                          Back
                        </Button>
                        <h3 className="font-semibold mb-2">Register Existing Twilio Number</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Enter your Twilio phone number and SID to register it with CT1.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+1234567890"
                            value={manualNumber}
                            onChange={(e) => setManualNumber(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Include country code (e.g., +1 for US)
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">
                            Twilio SID
                          </label>
                          <input
                            type="text"
                            placeholder="PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            value={manualSid}
                            onChange={(e) => setManualSid(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Find this in your Twilio console under Phone Numbers
                          </p>
                        </div>
                        <Button
                          onClick={() => registerExistingNumber.mutate()}
                          disabled={!manualNumber || !manualSid || registerExistingNumber.isPending}
                          className="w-full"
                        >
                          {registerExistingNumber.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            'Register Number'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Subscription Required</AlertTitle>
                  <AlertDescription>
                    A paid subscription is required to get a dedicated phone number.{' '}
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => onSectionChange?.('account')}
                    >
                      Upgrade your account
                    </Button>
                    {' '}to unlock this feature.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
