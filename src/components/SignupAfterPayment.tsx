import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ContractorAccountSetup } from './ContractorAccountSetup';

interface SignupAfterPaymentProps {
  isOpen: boolean;
  tierId: string;
  billingCycle: string;
  cloverPaymentId: string;
}

export function SignupAfterPayment({ isOpen, tierId, billingCycle, cloverPaymentId }: SignupAfterPaymentProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showContractorSetup, setShowContractorSetup] = useState(false);
  const [newUserId, setNewUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
    trade: '',
    taxId: '',
    username: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            company_name: formData.businessName,
            trade: formData.trade,
            tax_id: formData.taxId,
            username: formData.username,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create subscription record
        const { error: subError } = await supabase
          .from('subscriptions' as any)
          .insert({
            user_id: authData.user.id,
            tier_id: tierId,
            billing_cycle: billingCycle,
            clover_payment_id: cloverPaymentId,
            status: 'active',
          });

        if (subError) throw subError;

        toast({
          title: 'Account created successfully!',
          description: 'Now let\'s set up your contractor account.',
        });

        // Show contractor account setup
        setNewUserId(authData.user.id);
        setShowContractorSetup(true);
      }
    } catch (error: any) {
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Account Setup</DialogTitle>
          <DialogDescription>
            Payment successful! Now let's set up your contractor account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              required
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="trade">Trade *</Label>
            <Input
              id="trade"
              required
              placeholder="e.g., Plumbing, Electrical, HVAC"
              value={formData.trade}
              onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="taxId">Tax ID *</Label>
            <Input
              id="taxId"
              required
              placeholder="EIN or SSN"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <PasswordInput
              id="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <PasswordInput
              id="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
        </form>
      </DialogContent>

      {showContractorSetup && newUserId && (
        <ContractorAccountSetup
          isOpen={showContractorSetup}
          userId={newUserId}
          onClose={() => setShowContractorSetup(false)}
        />
      )}
    </Dialog>
  );
}
