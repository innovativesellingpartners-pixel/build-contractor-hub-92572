import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Tier {
  id: string;
  name: string;
  price: number;
}

interface TierCheckoutProps {
  tier: Tier;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (tierId: string, billingCycle: string) => void;
}

export function TierCheckout({ tier, isOpen, onClose, onPaymentSuccess }: TierCheckoutProps) {
  const [billingCycle, setBillingCycle] = useState<'quarterly' | 'yearly'>('quarterly');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const calculatePrice = () => {
    if (billingCycle === 'quarterly') {
      return tier.price * 3;
    }
    // Yearly gets 10% discount
    return Math.floor(tier.price * 12 * 0.9);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      console.log('Processing payment:', {
        amount: calculatePrice() * 100,
        tier_id: tier.id,
        billing_cycle: billingCycle,
      });

      const { data, error } = await supabase.functions.invoke('process-clover-payment', {
        body: {
          amount: calculatePrice() * 100,
          tier_id: tier.id,
          billing_cycle: billingCycle,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Payment successful!',
          description: 'Redirecting to account setup...',
        });
        onPaymentSuccess(tier.id, billingCycle);
      } else {
        throw new Error(data?.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment failed',
        description: error.message || 'Unable to process payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to {tier.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'quarterly' | 'yearly')}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
              <RadioGroupItem value="quarterly" id="quarterly" />
              <Label htmlFor="quarterly" className="flex-1 cursor-pointer">
                <div className="font-semibold">Quarterly Billing</div>
                <div className="text-sm text-muted-foreground">
                  ${tier.price * 3} every 3 months
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer">
              <RadioGroupItem value="yearly" id="yearly" />
              <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                <div className="font-semibold flex items-center gap-2">
                  Yearly Billing
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                    Save 10%
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  ${Math.floor(tier.price * 12 * 0.9)} per year
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Total Due Today:</span>
              <span className="text-2xl font-bold">${calculatePrice()}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {billingCycle === 'quarterly' ? 'Billed every 3 months' : 'Billed annually'}
            </p>
          </div>

          <Button 
            onClick={handlePayment} 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${calculatePrice()}`
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Clover
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
