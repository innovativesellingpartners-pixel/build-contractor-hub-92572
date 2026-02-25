import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CreditCard, Save, Loader2, Shield } from 'lucide-react';

interface PaymentProviderSettingsProps {
  contractorId: string;
}

export function PaymentProviderSettings({ contractorId }: PaymentProviderSettingsProps) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['contractor-payment-settings', contractorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_payment_provider, finix_merchant_id, stripe_connect_account_id')
        .eq('id', contractorId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [provider, setProvider] = useState<string>('');
  const [finixMerchantId, setFinixMerchantId] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Initialize form values when data loads
  if (profile && !initialized) {
    setProvider(profile.preferred_payment_provider || 'clover');
    setFinixMerchantId(profile.finix_merchant_id || '');
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, any> = {
        preferred_payment_provider: provider,
      };

      if (provider === 'finix') {
        if (!finixMerchantId.trim()) {
          throw new Error('Finix Merchant ID is required when Finix is selected');
        }
        updates.finix_merchant_id = finixMerchantId.trim();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', contractorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-payment-settings', contractorId] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Payment provider settings saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Provider Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Active Payment Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clover">Clover</SelectItem>
                <SelectItem value="finix">Finix</SelectItem>
                <SelectItem value="stripe">Stripe Connect</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This determines which payment processor is used for customer-facing estimates and invoices.
            </p>
          </div>

          <Separator />

          {/* Finix Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Finix Settings</h3>
              {provider === 'finix' && (
                <Badge variant="default" className="text-xs">Active</Badge>
              )}
              {provider !== 'finix' && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="finix-merchant-id">Merchant Identity ID</Label>
              <Input
                id="finix-merchant-id"
                value={finixMerchantId}
                onChange={(e) => setFinixMerchantId(e.target.value)}
                placeholder="IDxxxxxxxxxxxxxxxxxx"
                disabled={provider !== 'finix'}
              />
              <p className="text-xs text-muted-foreground">
                The Finix Merchant Identity ID (starts with "ID"). Found in Finix Dashboard → Merchants.
              </p>
            </div>
          </div>

          <Separator />

          {/* Stripe Connect Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Stripe Connect</h3>
              {profile?.stripe_connect_account_id ? (
                <Badge variant="default" className="text-xs">Connected</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Not Connected</Badge>
              )}
            </div>
            {profile?.stripe_connect_account_id && (
              <p className="text-sm text-muted-foreground">
                Account: {profile.stripe_connect_account_id}
              </p>
            )}
          </div>

          <Separator />

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              API credentials (FINIX_API_KEY) are stored securely as backend secrets and shared across all contractors. 
              The Merchant ID determines which merchant account receives funds.
            </p>
          </div>

          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Payment Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
