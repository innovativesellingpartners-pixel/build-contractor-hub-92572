/**
 * SelfServiceFinixSetup — Allows paid contractors to provision their own
 * Finix merchant account without admin intervention.
 * Reuses the same edge function (finix-provision-merchant) used by admins.
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  CreditCard, Loader2, Shield, Zap, CheckCircle2,
  Building2, User, Landmark, ArrowRight,
} from 'lucide-react';

interface SelfServiceFinixSetupProps {
  onComplete?: () => void;
  triggerButton?: React.ReactNode;
}

export function SelfServiceFinixSetup({ onComplete, triggerButton }: SelfServiceFinixSetupProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isProvisioned, setIsProvisioned] = useState(false);
  const [finixMerchantId, setFinixMerchantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const DRAFT_KEY = `finix-self-provision-${user?.id}`;

  const defaultData = {
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
  };

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return { ...defaultData, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return defaultData;
  });

  // Check if already provisioned & pre-fill from profile
  useEffect(() => {
    if (!user?.id) return;
    const check = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('finix_merchant_id, company_name, contact_name, phone, business_email, business_address, city, state, zip_code')
        .eq('id', user.id)
        .single();

      if (data?.finix_merchant_id) {
        setIsProvisioned(true);
        setFinixMerchantId(data.finix_merchant_id);
      }

      // Pre-fill if no draft saved
      if (!localStorage.getItem(DRAFT_KEY) && data) {
        const nameParts = (data.contact_name || '').split(' ');
        setFormData(prev => ({
          ...prev,
          business_name: data.company_name || '',
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          email: data.business_email || '',
          phone: (data.phone || '').replace(/\D/g, ''),
          business_address_line1: data.business_address || '',
          business_address_city: data.city || '',
          business_address_state: data.state || '',
          business_address_postal_code: data.zip_code || '',
          default_statement_descriptor: (data.company_name || '').substring(0, 20),
        }));
      }
      setLoading(false);
    };
    check();
  }, [user?.id]);

  // Auto-save draft
  useEffect(() => {
    const timeout = setTimeout(() => {
      const hasData = Object.entries(formData).some(
        ([key, val]) => val && val !== defaultData[key as keyof typeof defaultData]
      );
      if (hasData) localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timeout);
  }, [formData]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, [DRAFT_KEY]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const provisionMutation = useMutation({
    mutationFn: async () => {
      const required = [
        'business_name', 'first_name', 'last_name', 'email', 'phone',
        'tax_id', 'date_of_birth', 'business_address_line1',
        'business_address_city', 'business_address_state',
        'business_address_postal_code', 'bank_account_name',
        'bank_routing_number', 'bank_account_number',
      ];
      for (const field of required) {
        if (!formData[field as keyof typeof formData]) {
          throw new Error(`${field.replace(/_/g, ' ')} is required`);
        }
      }

      const { data, error } = await supabase.functions.invoke('finix-provision-merchant', {
        body: { contractor_id: user!.id, ...formData },
      });

      if (error) {
        let msg = error.message || 'Provisioning failed';
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx.clone === 'function') {
          try { msg = (await ctx.clone().json())?.message || msg; } catch { /* ignore */ }
        }
        throw new Error(msg);
      }
      if (!data?.success) throw new Error(data?.message || 'Provisioning failed');
      return data;
    },
    onSuccess: (data) => {
      setIsProvisioned(true);
      setFinixMerchantId(data.identity_id);
      clearDraft();
      toast.success(`Payment account created! Status: ${data.onboarding_state}`);
      onComplete?.();
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set up payments');
    },
  });

  if (loading) return null;

  // Already provisioned — show status badge
  if (isProvisioned) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="text-muted-foreground">Payments active</span>
        {finixMerchantId && (
          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{finixMerchantId.slice(0, 10)}…</code>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="default" size="sm" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Set Up Payments
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Set Up Payment Processing
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Complete the form below to start accepting credit cards, debit cards, and ACH payments from your customers.
          </p>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <div className="space-y-6 py-2">
            {/* Business Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" /> Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label>Business Name *</Label>
                  <Input value={formData.business_name} onChange={e => updateField('business_name', e.target.value)} placeholder="ABC Contracting LLC" />
                </div>
                <div>
                  <Label>Business Type *</Label>
                  <Select value={formData.business_type} onValueChange={v => updateField('business_type', v)}>
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
                  <PasswordInput value={formData.tax_id} onChange={e => updateField('tax_id', e.target.value)} placeholder="XX-XXXXXXX" />
                </div>
                <div>
                  <Label>Statement Descriptor</Label>
                  <Input value={formData.default_statement_descriptor} onChange={e => updateField('default_statement_descriptor', e.target.value)} placeholder="Name on card statements" maxLength={20} />
                </div>
              </div>

              {formData.business_type !== 'INDIVIDUAL_SOLE_PROPRIETORSHIP' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border border-border rounded-lg bg-muted/30">
                  <p className="md:col-span-2 text-xs font-medium text-muted-foreground">Additional fields for {formData.business_type === 'LIMITED_LIABILITY_COMPANY' ? 'LLC' : formData.business_type}</p>
                  <div>
                    <Label>DBA (Doing Business As) *</Label>
                    <Input value={formData.doing_business_as} onChange={e => updateField('doing_business_as', e.target.value)} />
                  </div>
                  <div>
                    <Label>Business Phone *</Label>
                    <Input value={formData.business_phone} onChange={e => updateField('business_phone', e.target.value)} placeholder="5551234567" />
                  </div>
                  <div>
                    <Label>Business Tax ID (EIN) *</Label>
                    <PasswordInput value={formData.business_tax_id} onChange={e => updateField('business_tax_id', e.target.value)} placeholder="XX-XXXXXXX" />
                  </div>
                  <div>
                    <Label>Incorporation Date *</Label>
                    <Input value={formData.incorporation_date} onChange={e => updateField('incorporation_date', e.target.value)} type="date" />
                  </div>
                  <div>
                    <Label>Business Website</Label>
                    <Input value={formData.url} onChange={e => updateField('url', e.target.value)} placeholder="https://example.com" />
                  </div>
                  <div>
                    <Label>Ownership % *</Label>
                    <Input value={formData.principal_percentage_ownership} onChange={e => updateField('principal_percentage_ownership', e.target.value)} type="number" min="1" max="100" />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Owner Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <User className="h-4 w-4" /> Owner / Principal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>First Name *</Label>
                  <Input value={formData.first_name} onChange={e => updateField('first_name', e.target.value)} />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={formData.last_name} onChange={e => updateField('last_name', e.target.value)} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input value={formData.email} onChange={e => updateField('email', e.target.value)} type="email" />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="5551234567" />
                </div>
                <div>
                  <Label>Date of Birth *</Label>
                  <Input value={formData.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} type="date" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Business Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label>Address Line 1 *</Label>
                  <Input value={formData.business_address_line1} onChange={e => updateField('business_address_line1', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label>Address Line 2</Label>
                  <Input value={formData.business_address_line2} onChange={e => updateField('business_address_line2', e.target.value)} />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input value={formData.business_address_city} onChange={e => updateField('business_address_city', e.target.value)} />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input value={formData.business_address_state} onChange={e => updateField('business_address_state', e.target.value)} placeholder="CA" maxLength={2} />
                </div>
                <div>
                  <Label>ZIP Code *</Label>
                  <Input value={formData.business_address_postal_code} onChange={e => updateField('business_address_postal_code', e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Bank Account */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Landmark className="h-4 w-4" /> Bank Account (for payouts)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label>Account Holder Name *</Label>
                  <Input value={formData.bank_account_name} onChange={e => updateField('bank_account_name', e.target.value)} />
                </div>
                <div>
                  <Label>Routing Number *</Label>
                  <Input value={formData.bank_routing_number} onChange={e => updateField('bank_routing_number', e.target.value)} placeholder="021000021" maxLength={9} />
                </div>
                <div>
                  <Label>Account Number *</Label>
                  <PasswordInput value={formData.bank_account_number} onChange={e => updateField('bank_account_number', e.target.value)} />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Select value={formData.bank_account_type} onValueChange={v => updateField('bank_account_type', v)}>
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
                Sensitive data (Tax ID, bank details) is sent directly to the payment processor and is never stored in CT1's database.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
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
                    Setting Up...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Activate Payments
                  </>
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
