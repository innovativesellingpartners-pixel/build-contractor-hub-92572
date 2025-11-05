import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CreditCard, DollarSign, Loader2 } from "lucide-react";
import ct1Logo from "@/assets/ct1-logo-main.png";

export default function PayBill() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "You must be logged in to make a payment",
        variant: "destructive",
      });
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (paymentAmount < 1) {
      toast({
        title: "Minimum Payment",
        description: "Minimum payment amount is $1.00",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-bill-payment', {
        body: {
          amount: paymentAmount,
          customer_email: user.email,
          customer_name: profile.contact_name || profile.company_name,
          description: `CT1 Bill Payment - ${profile.company_name || 'Account'}`,
        }
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Unable to process payment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.checkout_url) {
        // Redirect to Clover checkout
        window.location.href = data.checkout_url;
      } else {
        toast({
          title: "Payment Error",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl">Pay Your CT1 Bill</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Enter the amount you wish to pay
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 md:p-8 space-y-6">
              {/* Account Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account:</span>
                  <span className="font-medium">{profile?.company_name || 'Your Company'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="font-medium">{profile?.contact_name || user?.email}</span>
                </div>
                {profile?.ct1_contractor_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">CT1 Number:</span>
                    <span className="font-medium font-mono">#{profile.ct1_contractor_number}</span>
                  </div>
                )}
              </div>

              {/* Payment Amount Input */}
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-base font-semibold">
                  Payment Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 text-2xl h-14 font-semibold"
                    min="1"
                    step="0.01"
                    disabled={isProcessing}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Minimum payment: $1.00
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Quick Select:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 250, 500, 1000, 2500].map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      onClick={() => setAmount(quickAmount.toString())}
                      disabled={isProcessing}
                      className="hover:bg-primary/10"
                    >
                      ${quickAmount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                className="w-full h-12 text-lg shadow-lg hover:shadow-xl transition-shadow"
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
                    Continue to Secure Payment
                  </>
                )}
              </Button>

              {/* Security Info */}
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      Secure Payment Processing
                    </p>
                    <p className="text-green-700 dark:text-green-300">
                      Your payment is processed securely through Clover. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Need help or have questions?{" "}
              <a href="mailto:support@myct1.com" className="text-primary hover:underline font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
