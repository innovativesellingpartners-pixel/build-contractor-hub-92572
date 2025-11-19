import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Copy, CheckCircle2, AlertCircle, Loader2, PhoneForwarded } from 'lucide-react';
import { usePhoneNumber, useProvisionPhoneNumber } from '@/hooks/usePhoneNumbers';
import { useUserTier } from '@/hooks/useUserTier';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';

interface CallsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function CallsSection({ onSectionChange }: CallsSectionProps) {
  const { data: phoneNumber, isLoading: phoneLoading } = usePhoneNumber();
  const { subscription, hasFullAccess, isLoading: tierLoading } = useUserTier();
  const provisionMutation = useProvisionPhoneNumber();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Check for active paid subscription - either from subscriptions table or profile tier
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
                  <PhoneForwarded className="h-4 w-4" />
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
                Never miss a call with your dedicated business line
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasActivePaidSubscription ? (
                <>
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Your subscription includes a dedicated phone number with voicemail.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">What you'll get:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                        <span>A local phone number for your business</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                        <span>Professional voicemail system</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                        <span>Call forwarding to your cell phone</span>
                      </li>
                    </ul>
                  </div>

                  <Button 
                    onClick={handleProvision}
                    disabled={provisionMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {provisionMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Provisioning...
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Generate my CT1 phone number
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      A paid subscription is required to get a dedicated phone number.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    variant="default"
                    className="w-full"
                    onClick={() => onSectionChange?.('account')}
                  >
                    Upgrade to Get Phone Number
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
