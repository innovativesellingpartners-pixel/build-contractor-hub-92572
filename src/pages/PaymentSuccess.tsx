import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { SignupAfterPayment } from '@/components/SignupAfterPayment';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showSignup, setShowSignup] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<{ tier_id: string; billing_cycle: string } | null>(null);

  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // Retrieve checkout info from sessionStorage
    const stored = sessionStorage.getItem('pending_checkout');
    if (stored) {
      const info = JSON.parse(stored);
      setCheckoutInfo(info);
      sessionStorage.removeItem('pending_checkout');
    }
  }, []);

  const handleContinue = () => {
    if (checkoutInfo) {
      setShowSignup(true);
    } else {
      navigate('/pricing');
    }
  };

  if (!paymentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="text-muted-foreground">Invalid payment confirmation</p>
          <Button onClick={() => navigate('/pricing')} className="mt-4">
            Return to Pricing
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your payment has been processed successfully.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Payment ID: {paymentId}
            </p>
          </div>

          {!checkoutInfo ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading checkout information...</span>
            </div>
          ) : (
            <Button onClick={handleContinue} className="w-full" size="lg">
              Continue to Account Setup
            </Button>
          )}
        </div>
      </Card>

      {showSignup && checkoutInfo && (
        <SignupAfterPayment
          isOpen={showSignup}
          tierId={checkoutInfo.tier_id}
          billingCycle={checkoutInfo.billing_cycle}
          cloverPaymentId={paymentId || ''}
        />
      )}
    </div>
  );
}
