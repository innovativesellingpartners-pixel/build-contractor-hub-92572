import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FinixPaymentFormProps {
  entityType: 'estimate' | 'invoice';
  entityId: string;
  publicToken: string;
  paymentIntent: 'deposit' | 'full' | 'remaining';
  customerEmail: string;
  amount: number;
  finixEnvironment?: string;
  finixApplicationId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  primaryColor?: string;
}

export function FinixPaymentForm({
  entityType,
  entityId,
  publicToken,
  paymentIntent,
  customerEmail,
  amount,
  onSuccess,
  onCancel,
  primaryColor,
}: FinixPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const digits = cardNumber.replace(/\s/g, '');
    const [expMonth, expYear] = expiry.split('/');
    
    if (digits.length < 15 || !expMonth || !expYear || cvc.length < 3 || !name) {
      toast.error('Please fill in all card details');
      return;
    }

    setProcessing(true);

    try {
      // Send card details to our secure edge function for server-side tokenization + payment
      const { data, error } = await supabase.functions.invoke('finix-create-payment', {
        body: {
          entity_type: entityType,
          entity_id: entityId,
          public_token: publicToken,
          payment_intent: paymentIntent,
          customer_email: customerEmail,
          card_number: digits,
          card_expiry_month: parseInt(expMonth),
          card_expiry_year: parseInt(`20${expYear}`),
          card_cvc: cvc,
          card_name: name,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Payment of $${data.amount?.toFixed(2)} processed successfully!`);
        onSuccess();
      } else {
        throw new Error(data?.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Secure payment processing</span>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="cardholder-name">Name on Card</Label>
          <Input
            id="cardholder-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            required
            disabled={processing}
          />
        </div>

        <div>
          <Label htmlFor="card-number">Card Number</Label>
          <Input
            id="card-number"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="4242 4242 4242 4242"
            required
            disabled={processing}
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="expiry">Expiry</Label>
            <Input
              id="expiry"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              required
              disabled={processing}
              maxLength={5}
            />
          </div>
          <div>
            <Label htmlFor="cvc">CVC</Label>
            <Input
              id="cvc"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              required
              disabled={processing}
              maxLength={4}
              type="password"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={processing}
        className="w-full h-auto py-4 text-lg font-bold shadow-lg"
        style={primaryColor ? { backgroundColor: primaryColor } : undefined}
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </Button>

      {onCancel && (
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={processing}
          className="w-full"
        >
          Cancel
        </Button>
      )}
    </form>
  );
}
