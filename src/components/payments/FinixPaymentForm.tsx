import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useFinixPayment } from '@/hooks/useFinixPayment';

interface FinixPaymentFormProps {
  entityType: 'estimate' | 'invoice';
  entityId: string;
  publicToken: string;
  paymentIntent: 'deposit' | 'full' | 'remaining';
  customerEmail: string;
  amount: number;
  finixEnvironment: string;
  finixApplicationId: string;
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
  finixEnvironment,
  finixApplicationId,
  onSuccess,
  onCancel,
  primaryColor,
}: FinixPaymentFormProps) {
  const { processPayment, processing } = useFinixPayment();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [tokenizing, setTokenizing] = useState(false);

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

    setTokenizing(true);

    try {
      // Tokenize using Finix API
      const finixBaseUrl = finixEnvironment === 'live'
        ? 'https://finix.live-payments-api.com'
        : 'https://finix.sandbox-payments-api.com';

      const tokenResponse = await fetch(`${finixBaseUrl}/payment_instruments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application: finixApplicationId,
          type: 'PAYMENT_CARD',
          name: name,
          number: digits,
          expiration_month: parseInt(expMonth),
          expiration_year: parseInt(`20${expYear}`),
          security_code: cvc,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Card tokenization failed. Please check your card details.');
      }

      const tokenData = await tokenResponse.json();

      // Process payment using the token
      const result = await processPayment({
        entityType,
        entityId,
        publicToken,
        paymentIntent,
        customerEmail,
        finixToken: tokenData.id,
      });

      if (result?.success) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Finix payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setTokenizing(false);
    }
  };

  const isProcessing = processing || tokenizing;

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
            disabled={isProcessing}
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
            disabled={isProcessing}
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
              disabled={isProcessing}
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
              disabled={isProcessing}
              maxLength={4}
              type="password"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isProcessing}
        className="w-full h-auto py-4 text-lg font-bold shadow-lg"
        style={primaryColor ? { backgroundColor: primaryColor } : undefined}
        size="lg"
      >
        {isProcessing ? (
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
          disabled={isProcessing}
          className="w-full"
        >
          Cancel
        </Button>
      )}
    </form>
  );
}
