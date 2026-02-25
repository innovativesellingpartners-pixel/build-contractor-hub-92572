import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CreditCard, Save, Loader2, Shield, Zap, CheckCircle2, Building2, User, Landmark } from 'lucide-react';

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
        .select('preferred_payment_provider, finix_merchant_id, stripe_connect_account_id, company_name, contact_name, phone, business_email, business_address, city, state, zip_code')
        .eq('id', contractorId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [provider, setProvider] = useState<string>('');
  const [finixMerchantId, setFinixMerchantId] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [showProvisionForm, setShowProvisionForm] = useState(false);

  // Provision form state
  const [provisionData, setProvisionData] = useState({
    business_name: '',
    business_type: 'INDIVIDUAL_SOLE_PROPRIETORSHIP',
    doing_business_as: '',
    business_phone: '',
    business_tax_id: '',
    incorporation_date: '',
    url: '',
    principal_percentage_ownership: '100',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    tax_id: '',
    date_of_birth: '',
    business_address_line1: '',
    business_address_line2: '',
    business_address_city: '',
    business_address_state: '',
    business_address_postal_code: '',
    bank_account_name: '',
    bank_routing_number: '',
    bank_account_number: '',
    bank_account_type: 'CHECKING',
    default_statement_descriptor: '',
  });

  if (profile && !initialized) {
    setProvider(profile.preferred_payment_provider || 'finix');
    setFinixMerchantId(profile.finix_merchant_id || '');

    // Pre-fill provision form with known contractor data
    const nameParts = (profile.contact_name || '').split(' ');
    setProvisionData(prev => ({
      ...prev,
      business_name: profile.company_name || '',
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: profile.business_email || '',
      phone: (profile.phone || '').replace(/\D/g, ''),
      business_address_line1: profile.business_address || '',
      business_address_city: profile.city || '',
      business_address_state: profile.state || '',
      business_address_postal_code: profile.zip_code || '',
      default_statement_descriptor: (profile.company_name || '').substring(0, 20),
    }));
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, any> = {
        preferred_payment_provider: provider,
      };

      if (provider === 'finix' && finixMerchantId.trim()) {
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
      toast.success('Payment provider settings saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });

  const provisionMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      const required = ['business_name', 'first_name', 'last_name', 'email', 'phone', 'tax_id', 'date_of_birth', 'business_address_line1', 'business_address_city', 'business_address_state', 'business_address_postal_code', 'bank_account_name', 'bank_routing_number', 'bank_account_number'];
      for (const field of required) {
        if (!provisionData[field as keyof typeof provisionData]) {
          throw new Error(`${field.replace(/_/g, ' ')} is required`);
        }
      }

      const { data, error } = await supabase.functions.invoke('finix-provision-merchant', {
        body: {
          contractor_id: contractorId,
          ...provisionData,
        },
      });

      if (error) {
        let detailedMessage = error.message || 'Provisioning failed';
        const responseContext = (error as any)?.context;

        if (responseContext && typeof responseContext.clone === 'function') {
          try {
            const errorJson = await responseContext.clone().json();
            detailedMessage = errorJson?.message || errorJson?.error || detailedMessage;
          } catch {
            try {
              const errorText = await responseContext.clone().text();
              if (errorText) detailedMessage = errorText;
            } catch {
              // Keep fallback message
            }
          }
        }

        throw new Error(detailedMessage);
      }
      if (!data?.success) throw new Error(data?.message || 'Provisioning failed');
      return data;
    },
    onSuccess: (data) => {
      setFinixMerchantId(data.identity_id);
      setShowProvisionForm(false);
      queryClient.invalidateQueries({ queryKey: ['contractor-payment-settings', contractorId] });
      toast.success(`Finix merchant provisioned! Status: ${data.onboarding_state}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to provision merchant');
    },
  });

  const updateField = (field: string, value: string) => {
    setProvisionData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isProvisioned = !!finixMerchantId;

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Active Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finix">Finix (Default)</SelectItem>
                <SelectItem value="clover">Clover</SelectItem>
                <SelectItem value="stripe">Stripe Connect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            variant="outline"
            className="w-full"
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Provider
          </Button>
        </CardContent>
      </Card>

      {/* Finix Merchant Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Finix Merchant Account
            {isProvisioned ? (
              <Badge variant="default" className="ml-auto gap-1">
                <CheckCircle2 className="h-3 w-3" /> Provisioned
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-auto">Not Set Up</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProvisioned && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Merchant Identity</span>
                <code className="text-sm font-mono bg-background px-2 py-1 rounded">{finixMerchantId}</code>
              </div>
            </div>
          )}

          {!isProvisioned && !showProvisionForm && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Set Up Finix Payments</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a merchant account for this contractor so they can accept card payments.
                </p>
              </div>
              <Button onClick={() => setShowProvisionForm(true)} className="gap-2">
                <Zap className="h-4 w-4" />
                Provision Finix Account
              </Button>
            </div>
          )}

          {showProvisionForm && (
            <div className="space-y-6">
              {/* Business Info */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Business Name *</Label>
                    <Input value={provisionData.business_name} onChange={e => updateField('business_name', e.target.value)} placeholder="ABC Contracting LLC" />
                  </div>
                  <div>
                    <Label>Business Type *</Label>
                    <Select value={provisionData.business_type} onValueChange={v => updateField('business_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL_SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                        <SelectItem value="LIMITED_LIABILITY_COMPANY">LLC</SelectItem>
                        <SelectItem value="CORPORATION">Corporation</SelectItem>
                        <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tax ID (EIN/SSN) *</Label>
                    <PasswordInput value={provisionData.tax_id} onChange={e => updateField('tax_id', e.target.value)} placeholder="XX-XXXXXXX" />
                  </div>
                  <div>
                    <Label>Statement Descriptor</Label>
                    <Input value={provisionData.default_statement_descriptor} onChange={e => updateField('default_statement_descriptor', e.target.value)} placeholder="Business name on statements" maxLength={20} />
                  </div>
                </div>

                {/* LLC/Corp-specific fields */}
                {provisionData.business_type !== 'INDIVIDUAL_SOLE_PROPRIETORSHIP' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-muted/30">
                    <p className="md:col-span-2 text-sm font-medium text-muted-foreground">Additional fields required for {provisionData.business_type === 'LIMITED_LIABILITY_COMPANY' ? 'LLC' : provisionData.business_type}</p>
                    <div>
                      <Label>DBA (Doing Business As) *</Label>
                      <Input value={provisionData.doing_business_as} onChange={e => updateField('doing_business_as', e.target.value)} placeholder="Trade name" />
                    </div>
                    <div>
                      <Label>Business Phone *</Label>
                      <Input value={provisionData.business_phone} onChange={e => updateField('business_phone', e.target.value)} placeholder="5551234567" />
                    </div>
                    <div>
                      <Label>Business Tax ID (EIN) *</Label>
                      <PasswordInput value={provisionData.business_tax_id} onChange={e => updateField('business_tax_id', e.target.value)} placeholder="XX-XXXXXXX" />
                    </div>
                    <div>
                      <Label>Incorporation Date *</Label>
                      <Input value={provisionData.incorporation_date} onChange={e => updateField('incorporation_date', e.target.value)} type="date" />
                    </div>
                    <div>
                      <Label>Business Website</Label>
                      <Input value={provisionData.url} onChange={e => updateField('url', e.target.value)} placeholder="https://example.com" />
                    </div>
                    <div>
                      <Label>Ownership % *</Label>
                      <Input value={provisionData.principal_percentage_ownership} onChange={e => updateField('principal_percentage_ownership', e.target.value)} placeholder="100" type="number" min="1" max="100" />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Owner Info */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" /> Owner / Principal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input value={provisionData.first_name} onChange={e => updateField('first_name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input value={provisionData.last_name} onChange={e => updateField('last_name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input value={provisionData.email} onChange={e => updateField('email', e.target.value)} type="email" />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input value={provisionData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="5551234567" />
                  </div>
                  <div>
                    <Label>Date of Birth *</Label>
                    <Input value={provisionData.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} type="date" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-semibold">Business Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Address Line 1 *</Label>
                    <Input value={provisionData.business_address_line1} onChange={e => updateField('business_address_line1', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address Line 2</Label>
                    <Input value={provisionData.business_address_line2} onChange={e => updateField('business_address_line2', e.target.value)} />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <Input value={provisionData.business_address_city} onChange={e => updateField('business_address_city', e.target.value)} />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input value={provisionData.business_address_state} onChange={e => updateField('business_address_state', e.target.value)} placeholder="CA" maxLength={2} />
                  </div>
                  <div>
                    <Label>ZIP Code *</Label>
                    <Input value={provisionData.business_address_postal_code} onChange={e => updateField('business_address_postal_code', e.target.value)} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bank Account */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Landmark className="h-4 w-4" /> Bank Account (for settlements)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Account Holder Name *</Label>
                    <Input value={provisionData.bank_account_name} onChange={e => updateField('bank_account_name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Routing Number *</Label>
                    <Input value={provisionData.bank_routing_number} onChange={e => updateField('bank_routing_number', e.target.value)} placeholder="021000021" maxLength={9} />
                  </div>
                  <div>
                    <Label>Account Number *</Label>
                    <PasswordInput value={provisionData.bank_account_number} onChange={e => updateField('bank_account_number', e.target.value)} />
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <Select value={provisionData.bank_account_type} onValueChange={v => updateField('bank_account_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CHECKING">Checking</SelectItem>
                        <SelectItem value="SAVINGS">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Sensitive data (Tax ID, bank details) is sent directly to Finix and is not stored in CT1's database.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowProvisionForm(false)}
                  disabled={provisionMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => provisionMutation.mutate()}
                  disabled={provisionMutation.isPending}
                  className="flex-1 gap-2"
                >
                  {provisionMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Create Merchant Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {isProvisioned && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <Label>Manual Merchant ID Override</Label>
                <Input
                  value={finixMerchantId}
                  onChange={(e) => setFinixMerchantId(e.target.value)}
                  placeholder="IDxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Only change this if you need to link to a different Finix merchant identity.
                </p>
              </div>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                variant="outline"
                size="sm"
              >
                {updateMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                Update
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe Connect Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Stripe Connect
            {profile?.stripe_connect_account_id ? (
              <Badge variant="default" className="ml-auto text-xs">Connected</Badge>
            ) : (
              <Badge variant="secondary" className="ml-auto text-xs">Not Connected</Badge>
            )}
          </CardTitle>
        </CardHeader>
        {profile?.stripe_connect_account_id && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Account: <code className="text-xs">{profile.stripe_connect_account_id}</code>
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
