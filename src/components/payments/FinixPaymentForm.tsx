import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Lock, ShieldCheck } from 'lucide-react';
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
  const [submitted, setSubmitted] = useState(false);
  const idempotencyKeyRef = useRef(crypto.randomUUID());

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

  const validateForm = (): string | null => {
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 13 || digits.length > 19) return 'Please enter a valid card number';
    
    const [expMonth, expYear] = expiry.split('/');
    if (!expMonth || !expYear) return 'Please enter a valid expiry date (MM/YY)';
    const month = parseInt(expMonth);
    if (month < 1 || month > 12) return 'Invalid expiry month';
    const year = parseInt(`20${expYear}`);
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      return 'This card has expired';
    }
    
    if (cvc.length < 3) return 'Please enter a valid CVC';
    if (name.trim().length < 2) return 'Please enter the cardholder name';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (processing || submitted) return;
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const digits = cardNumber.replace(/\s/g, '');
    const [expMonth, expYear] = expiry.split('/');

    setProcessing(true);

    try {
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
          card_name: name.trim(),
          idempotency_key: idempotencyKeyRef.current,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setSubmitted(true);
        if (data.duplicate) {
          toast.info('Payment was already processed successfully.');
        } else {
          toast.success(`Payment of $${data.amount?.toFixed(2)} processed successfully!`);
        }
        onSuccess();
      } else {
        // Generate new idempotency key for retry
        idempotencyKeyRef.current = crypto.randomUUID();
        throw new Error(data?.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      // Generate new idempotency key for retry
      idempotencyKeyRef.current = crypto.randomUUID();
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      if (!submitted) setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Secure payment processing</span>
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span className="text-xs text-green-700 font-medium">256-bit SSL</span>
        </div>
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
            disabled={processing || submitted}
            autoComplete="cc-name"
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
            disabled={processing || submitted}
            maxLength={19}
            inputMode="numeric"
            autoComplete="cc-number"
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
              disabled={processing || submitted}
              maxLength={5}
              inputMode="numeric"
              autoComplete="cc-exp"
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
              disabled={processing || submitted}
              maxLength={4}
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={processing || submitted}
        className="w-full h-auto py-4 text-lg font-bold shadow-lg"
        style={primaryColor ? { backgroundColor: primaryColor } : undefined}
        size="lg"
      >
        {submitted ? (
          <>
            <ShieldCheck className="h-5 w-5 mr-2" />
            Payment Complete
          </>
        ) : processing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing — do not close this page...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </Button>

      {onCancel && !processing && !submitted && (
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full"
        >
          Cancel
        </Button>
      )}
    </form>
  );
}
