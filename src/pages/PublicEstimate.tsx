import { useEffect, useState, useRef, Component, ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, FileText, Loader2, CreditCard, Building2, Calendar, DollarSign, Wallet, AlertCircle } from 'lucide-react';
import { FinixPaymentForm } from '@/components/payments/FinixPaymentForm';
import { AlternativePaymentMethods } from '@/components/payments/AlternativePaymentMethods';
import SignatureCanvas from 'react-signature-canvas';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import ct1PoweredLogo from '@/assets/ct1-powered-by-logo.png';

// Error boundary to prevent blank white page on crash
class PublicEstimateErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('PublicEstimate crashed:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-xl font-bold">Something went wrong</h2>
              <p className="text-muted-foreground">
                We encountered an error loading this estimate. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

// Safe number formatting helper
const safeFixed = (val: any, digits = 2): string => {
  const num = Number(val);
  return isNaN(num) ? '0.00' : num.toFixed(digits);
};

function PublicEstimateInner() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [estimate, setEstimate] = useState<any>(null);
  const [contractor, setContractor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<'deposit' | 'full' | null>(null);
  const [signed, setSigned] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showFinixForm, setShowFinixForm] = useState<'deposit' | 'full' | 'remaining' | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const clientSigRef = useRef<SignatureCanvas>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  // Check for payment intent from URL (from email links)
  const paymentIntent = searchParams.get('pay') as 'deposit' | 'full' | null;

  useEffect(() => {
    if (token) {
      fetchEstimate();
      logView();

      // Check for payment status in URL
      const paymentStatus = searchParams.get('payment');
      const paymentAmount = searchParams.get('amount');

      if (paymentStatus === 'success') {
        setSigned(true);
        const amountText = paymentAmount ? ` of $${parseFloat(paymentAmount).toFixed(2)}` : '';
        toast.success(`Payment${amountText} successful! Thank you. Our team will contact you shortly.`);
      } else if (paymentStatus === 'cancelled') {
        toast.error('Payment cancelled. You can try again below.');
      } else if (paymentStatus === 'error') {
        toast.error('Payment error. Please try again or contact support.');
      }
    }
  }, [token, searchParams]);

  // Auto-scroll to payment section when arriving from email with payment intent
  useEffect(() => {
    if (paymentIntent && !loading && estimate && !isFullyPaid) {
      setTimeout(() => {
        paymentSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 500);
    }
  }, [paymentIntent, loading, estimate]);

  // Helper to scroll to agreement and show toast
  const handleDisabledButtonClick = () => {
    if (!agreementAccepted && !signed) {
      agreementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.info('Please check the agreement and sign above to proceed with payment');
    }
  };

  const fetchEstimate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-public-estimate', {
        body: { token }
      });

      if (error) throw error;
      
      if (data.rate_limited) {
        toast.error('Too many requests. Please try again in an hour.');
        setLoading(false);
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }
      
      const estimateData = data.estimate;
      setEstimate(estimateData);
      setContractor(data.contractor || null);
      setSigned(!!estimateData.signed_at);
    } catch (error) {
      console.error('Error fetching estimate:', error);
      toast.error('Failed to load estimate');
    } finally {
      setLoading(false);
    }
  };

  const logView = async () => {
    // View logging is now handled by the edge function
  };

  // Calculate payment amounts
  const getPaymentAmounts = () => {
    if (!estimate) return { total: 0, deposit: 0, remaining: 0, amountPaid: 0, hasDeposit: false, depositRemaining: 0 };
    
    const total = Number(estimate.grand_total || estimate.total_amount) || 0;
    const deposit = Number(estimate.required_deposit) || 0;
    const amountPaid = Number(estimate.payment_amount) || 0;
    const remaining = Math.max(0, total - amountPaid);
    const hasDeposit = deposit > 0;
    
    // Calculate deposit remaining (in case of partial deposit payment)
    const depositRemaining = Math.max(0, Math.min(deposit - amountPaid, remaining));
    
    return { total, deposit, remaining, amountPaid, hasDeposit, depositRemaining };
  };

  const handlePayment = async (intent: 'deposit' | 'full' | 'remaining') => {
    try {
      if (!agreementAccepted && !signed) {
        toast.error('Please accept the payment agreement to proceed');
        return;
      }

      // Save signature first if not already signed
      if (!signed && (signatureData || clientSigRef.current?.toDataURL())) {
        const sigData = signatureData || clientSigRef.current?.toDataURL();
        if (sigData) {
          await supabase
            .from('estimates')
            .update({ client_signature: sigData })
            .eq('id', estimate.id);
        }
      }

      // Use Finix for contractor-to-customer payments
      if (contractor?.finix_merchant_id) {
        setShowFinixForm(intent);
        return;
      }

      // Fallback: if no Finix merchant configured, show error
      throw new Error('Online payments are not configured for this contractor. Please contact them directly.');
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
      setProcessingPayment(null);
    }
  };

  const handleFinixSuccess = () => {
    setShowFinixForm(null);
    setSigned(true);
    toast.success('Payment successful! Thank you. Our team will contact you shortly.');
    fetchEstimate();
  };

  const handleSignatureEnd = () => {
    if (clientSigRef.current && !clientSigRef.current.isEmpty()) {
      setSignatureData(clientSigRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    clientSigRef.current?.clear();
    setSignatureData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>
                Estimate not found or link has expired.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lineItems = estimate.line_items || [];
  const costSummary = estimate.cost_summary || {};
  const { total, deposit, remaining, amountPaid, hasDeposit, depositRemaining } = getPaymentAmounts();
  const isFullyPaid = remaining <= 0;
  const isPartiallyPaid = amountPaid > 0 && remaining > 0;

  // Get brand colors from contractor profile or use defaults
  const brandColors = {
    primary: contractor?.brand_primary_color || '#D50A22',
    secondary: contractor?.brand_secondary_color || '#1e3a5f',
    accent: contractor?.brand_accent_color || '#c9a227',
  };

  // Use contractor logo if available, otherwise show Building2 icon
  const displayLogo = contractor?.logo_url;
  const companyName = contractor?.company_name || 'Professional Estimate';

  return (
    <div className="min-h-screen bg-muted py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Professional Header with Branding */}
        <Card className="overflow-hidden border-2 shadow-xl">
          <div 
            className="p-8 sm:p-12 relative"
            style={{ background: `linear-gradient(135deg, ${brandColors.secondary} 0%, ${brandColors.primary} 100%)` }}
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="bg-white rounded-full p-3 shadow-2xl">
                    {displayLogo ? (
                      <img 
                        src={displayLogo}
                        alt="Company Logo" 
                        className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                      />
                    ) : (
                      <Building2 className="w-14 h-14 sm:w-16 sm:h-16 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                      {companyName}
                    </h1>
                    {estimate.estimate_number && (
                      <p className="text-white/90 text-xl font-semibold mt-2">
                        Estimate #{estimate.estimate_number}
                      </p>
                    )}
                  </div>
                </div>
                {isFullyPaid ? (
                  <Badge className="bg-green-600 text-white border-0 text-lg px-6 py-3 shadow-lg">
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Paid in Full
                  </Badge>
                ) : signed ? (
                  <Badge className="bg-blue-600 text-white border-0 text-lg px-6 py-3 shadow-lg">
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Accepted
                  </Badge>
                ) : (
                  <Badge className="bg-white/20 text-white border-white/30 text-lg px-6 py-3 backdrop-blur-sm">
                    Awaiting Signature
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <CardContent className="p-8 sm:p-10 bg-gradient-to-br from-background to-muted/30">
            <div 
              className="pl-8 bg-white/50 backdrop-blur-sm p-6 rounded-r-lg shadow-sm"
              style={{ borderLeft: `4px solid ${brandColors.primary}` }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                {estimate.title}
              </h2>
              <p className="text-muted-foreground text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" style={{ color: brandColors.primary }} />
                Prepared for <span className="font-semibold text-foreground">{estimate.client_name}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-background pb-6">
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Client Name
                </p>
                <p className="font-bold text-lg">{estimate.client_name}</p>
              </div>
              {estimate.site_address && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Site Address</p>
                  <p className="font-bold text-lg">{estimate.site_address}</p>
                </div>
              )}
              {estimate.trade_type && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Trade Type</p>
                  <p className="font-bold text-lg">{estimate.trade_type}</p>
                </div>
              )}
              {estimate.valid_until && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Valid Until
                  </p>
                  <p className="font-bold text-lg">
                    {new Date(estimate.valid_until).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}
            </div>
            {estimate.project_description && (
              <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg">
                <p className="text-sm text-muted-foreground font-semibold mb-2">Project Description</p>
                <p className="text-base leading-relaxed">{estimate.project_description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        {lineItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lineItems
                  .filter((item: any) => item.included)
                  .map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-start py-3 border-b last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.item_description}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit_type} × ${safeFixed(item.unit_cost)}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="font-semibold ml-4">
                        ${safeFixed(item.line_total)}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investment Summary with Payment Breakdown */}
        <Card className="border-2 shadow-2xl bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20 pb-6">
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Investment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            {costSummary.subtotal > 0 && (
              <>
                <div className="flex justify-between text-lg py-2">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-bold text-foreground text-xl">
                    ${safeFixed(costSummary.subtotal)}
                  </span>
                </div>
                {costSummary.profit_markup_percentage > 0 && (
                  <div className="flex justify-between text-lg py-2">
                    <span className="text-muted-foreground font-medium">
                      Profit/Markup ({costSummary.profit_markup_percentage}%)
                    </span>
                    <span className="font-bold text-foreground text-xl">
                      ${safeFixed(costSummary.profit_markup_amount)}
                    </span>
                  </div>
                )}
                {costSummary.tax_and_fees > 0 && (
                  <div className="flex justify-between text-lg py-2">
                    <span className="text-muted-foreground font-medium">Tax & Fees</span>
                    <span className="font-bold text-foreground text-xl">
                      ${safeFixed(costSummary.tax_and_fees)}
                    </span>
                  </div>
                )}
              </>
            )}
            
            <Separator className="my-6" style={{ backgroundColor: `${brandColors.primary}33` }} />
            
            {/* Total Investment */}
            <div 
              className="p-6 rounded-xl shadow-lg"
              style={{ background: `linear-gradient(90deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)` }}
            >
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-white">Total Investment</span>
                <span className="text-4xl font-black text-white">
                  ${safeFixed(total)}
                </span>
              </div>
            </div>

            {/* Deposit and Payment Breakdown */}
            {(hasDeposit || amountPaid > 0) && (
              <div className="space-y-4 pt-4">
                {hasDeposit && (
                  <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div>
                      <span className="text-amber-800 dark:text-amber-200 font-semibold">Deposit Due</span>
                      <p className="text-sm text-amber-600 dark:text-amber-400">Required to begin project</p>
                    </div>
                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      ${safeFixed(deposit)}
                    </span>
                  </div>
                )}

                {amountPaid > 0 && (
                  <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div>
                      <span className="text-green-800 dark:text-green-200 font-semibold flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Amount Paid
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                      ${safeFixed(amountPaid)}
                    </span>
                  </div>
                )}

                {remaining > 0 && (
                  <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div>
                      <span className="text-blue-800 dark:text-blue-200 font-semibold">Remaining Balance</span>
                      {isPartiallyPaid && hasDeposit && depositRemaining <= 0 && (
                        <p className="text-sm text-blue-600 dark:text-blue-400">Due at project completion</p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      ${safeFixed(remaining)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assumptions & Exclusions */}
        {estimate.assumptions_and_exclusions && (
          <Card>
            <CardHeader>
              <CardTitle>Assumptions & Exclusions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {estimate.assumptions_and_exclusions}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Signature and Payment Section */}
        {!isFullyPaid && (
          <>
            {!signed ? (
              <Card ref={paymentSectionRef} className="border-2 shadow-2xl bg-gradient-to-br from-background to-muted/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20 pb-6">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    Accept & Pay
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-8">
                  <Alert className="border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                    <FileText className="h-6 w-6 text-primary" />
                    <AlertDescription className="text-base leading-relaxed ml-2">
                      By signing below, you agree to the scope of work, terms, and total investment amount 
                      outlined in this estimate. Your digital signature is legally binding.
                    </AlertDescription>
                  </Alert>

                  {/* Payment Agreement */}
                  <Card ref={agreementRef} className="border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Payment Agreement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-background/80 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm leading-relaxed text-foreground">
                          This estimate constitutes a binding agreement between the customer and the contractor. 
                          By accepting this proposal, the customer acknowledges that they have read, understood, 
                          and agreed to all terms, conditions, and pricing stated herein, and accepts full legal 
                          responsibility for payment in accordance with the agreed terms. The contractor provides 
                          a minimum two (2) year labor warranty covering workmanship under normal use and conditions; 
                          this warranty excludes damage caused by misuse, neglect, alteration, or acts of nature.
                        </p>
                      </div>
                      
                      <div className="flex items-start space-x-3 bg-primary/5 p-4 rounded-lg border-2 border-primary/20">
                        <Checkbox
                          id="payment-agreement"
                          checked={agreementAccepted}
                          onCheckedChange={(checked) => setAgreementAccepted(checked as boolean)}
                          className="mt-1"
                        />
                        <label
                          htmlFor="payment-agreement"
                          className="text-sm font-medium leading-relaxed cursor-pointer text-foreground"
                        >
                          I have read and agree to the payment agreement above. I understand that by signing, 
                          I accept full legal responsibility for payment according to the terms stated in this estimate.
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="bg-muted/30 p-6 rounded-lg border-2 border-primary/20">
                    <label className="block text-base font-bold text-foreground mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Sign below using your mouse or finger:
                    </label>
                    <div className="border-4 border-primary/20 rounded-xl p-4 bg-white shadow-inner" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                      <SignatureCanvas
                        ref={(ref) => {
                          (clientSigRef as any).current = ref;
                          // Restore signature data after re-render
                          if (ref && signatureData && ref.isEmpty()) {
                            ref.fromDataURL(signatureData);
                          }
                        }}
                        onEnd={handleSignatureEnd}
                        canvasProps={{
                          className: 'w-full h-52 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-white',
                          style: { touchAction: 'none' },
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={clearSignature}
                      className="mt-3"
                      size="sm"
                    >
                      Clear Signature
                    </Button>
                  </div>
                  
                  {/* Payment Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Choose Payment Option:</h3>
                    
                    {/* Visual guidance when buttons are disabled */}
                    {!agreementAccepted && (
                      <div className="text-center text-sm text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Please check the agreement and sign above to enable payment</span>
                      </div>
                    )}
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Pay Deposit Now Button */}
                      {hasDeposit && depositRemaining > 0 && (
                        <div 
                          onClick={() => {
                            if (!agreementAccepted && processingPayment === null) {
                              handleDisabledButtonClick();
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <Button
                            onClick={(e) => {
                              if (agreementAccepted) {
                                handlePayment('deposit');
                              } else {
                                e.preventDefault();
                              }
                            }}
                            disabled={!agreementAccepted || processingPayment !== null}
                            className="w-full h-auto py-6 flex-col gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
                            size="lg"
                          >
                            {processingPayment === 'deposit' ? (
                              <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-lg font-bold">Processing...</span>
                              </>
                            ) : (
                              <>
                                <Wallet className="h-6 w-6" />
                                <span className="text-lg font-bold">Pay Deposit Now</span>
                                <span className="text-2xl font-black">${safeFixed(depositRemaining)}</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Pay In Full Button */}
                      <div 
                        onClick={() => {
                          if (!agreementAccepted && processingPayment === null) {
                            handleDisabledButtonClick();
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <Button
                          onClick={(e) => {
                            if (agreementAccepted) {
                              handlePayment('full');
                            } else {
                              e.preventDefault();
                            }
                          }}
                          disabled={!agreementAccepted || processingPayment !== null}
                          className="w-full h-auto py-6 flex-col gap-2 bg-gradient-to-r from-primary to-primary-hover hover:shadow-xl text-white shadow-lg"
                          size="lg"
                        >
                          {processingPayment === 'full' ? (
                            <>
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span className="text-lg font-bold">Processing...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-6 w-6" />
                              <span className="text-lg font-bold">Pay In Full Now</span>
                              <span className="text-2xl font-black">${safeFixed(remaining)}</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Finix Inline Payment Form */}
                  {showFinixForm && (
                    <div className="border-2 border-primary/20 rounded-xl p-6 bg-card">
                      <h3 className="text-lg font-bold mb-4">Enter Card Details</h3>
                      <FinixPaymentForm
                        entityType="estimate"
                        entityId={estimate.id}
                        publicToken={token!}
                        paymentIntent={showFinixForm}
                        customerEmail={estimate.client_email || ''}
                        amount={showFinixForm === 'deposit' ? depositRemaining : remaining}
                        finixEnvironment={contractor?.finix_environment || 'sandbox'}
                        finixApplicationId={contractor?.finix_merchant_id || ''}
                        onSuccess={handleFinixSuccess}
                        onCancel={() => setShowFinixForm(null)}
                      />
                    </div>
                  )}
                  
                  <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Secure Payment:</strong> Your payment is processed securely.
                      After payment, this estimate becomes an active project and our team will contact you.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Already signed but not fully paid */
              <Card className="border-2 shadow-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <CardContent className="p-10">
                  <div className="flex items-start gap-6">
                    <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex-1 space-y-6">
                      <div>
                        <h3 className="text-3xl font-black text-blue-900 dark:text-blue-100 mb-3">
                          Estimate Accepted
                        </h3>
                        <p className="text-blue-800 dark:text-blue-200 text-lg mb-4 font-medium">
                          {isPartiallyPaid 
                            ? `Thank you for your payment of $${safeFixed(amountPaid)}. Complete your remaining balance below.`
                            : 'Your estimate has been accepted. Complete your payment to begin the project.'}
                        </p>
                      </div>

                      {/* Payment Status Summary */}
                      <div className="bg-white dark:bg-blue-900/30 rounded-xl p-6 border-2 border-blue-300 dark:border-blue-700 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-1">Total</p>
                            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">${safeFixed(total)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-green-700 dark:text-green-300 font-semibold mb-1">Paid</p>
                            <p className="text-xl font-bold text-green-600 dark:text-green-400">${safeFixed(amountPaid)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold mb-1">Remaining</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">${safeFixed(remaining)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment Options */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Pay Deposit Button (if deposit required and not yet paid) */}
                        {hasDeposit && depositRemaining > 0 && (
                          <Button
                            onClick={() => handlePayment('deposit')}
                            disabled={processingPayment !== null}
                            className="h-auto py-6 flex-col gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
                            size="lg"
                          >
                            {processingPayment === 'deposit' ? (
                              <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-lg font-bold">Processing...</span>
                              </>
                            ) : (
                              <>
                                <Wallet className="h-6 w-6" />
                                <span className="text-lg font-bold">Pay Deposit</span>
                                <span className="text-2xl font-black">${safeFixed(depositRemaining)}</span>
                              </>
                            )}
                          </Button>
                        )}

                        {/* Pay Remaining Balance Button */}
                        <Button
                          onClick={() => handlePayment('remaining')}
                          disabled={processingPayment !== null}
                          className="h-auto py-6 flex-col gap-2 bg-gradient-to-r from-primary to-primary-hover hover:shadow-xl text-white shadow-lg"
                          size="lg"
                        >
                          {processingPayment === 'full' ? (
                            <>
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span className="text-lg font-bold">Processing...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-6 w-6" />
                              <span className="text-lg font-bold">
                                {isPartiallyPaid ? 'Pay Remaining Balance' : 'Pay In Full'}
                              </span>
                              <span className="text-2xl font-black">${safeFixed(remaining)}</span>
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Finix Inline Payment Form for signed estimates */}
                      {showFinixForm && (
                        <div className="border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 bg-card">
                          <h3 className="text-lg font-bold mb-4">Enter Card Details</h3>
                          <FinixPaymentForm
                            entityType="estimate"
                            entityId={estimate.id}
                            publicToken={token!}
                            paymentIntent={showFinixForm}
                            customerEmail={estimate.client_email || ''}
                            amount={showFinixForm === 'deposit' ? depositRemaining : remaining}
                            finixEnvironment={contractor?.finix_environment || 'sandbox'}
                            finixApplicationId={contractor?.finix_merchant_id || ''}
                            onSuccess={handleFinixSuccess}
                            onCancel={() => setShowFinixForm(null)}
                          />
                        </div>
                      )}

                      <div className="bg-blue-600/10 border-l-4 border-blue-600 p-4 rounded-r-lg">
                        <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Secure payment processing. Our team will contact you after payment is complete.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Fully Paid Confirmation */}
        {isFullyPaid && (
          <Card className="border-4 border-green-600 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-2xl">
            <CardContent className="p-10">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-lg">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-green-900 dark:text-green-100 mb-3">
                    Payment Complete!
                  </h3>
                  <p className="text-green-800 dark:text-green-200 text-lg mb-4 font-medium">
                    Thank you for your payment. Your project is now active and our team will contact you shortly to schedule the work.
                  </p>
                  
                  <div className="bg-white dark:bg-green-900/30 rounded-xl p-6 border-2 border-green-300 dark:border-green-700 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-300 font-semibold mb-1">Total Paid</p>
                        <p className="text-2xl text-green-900 dark:text-green-100 font-bold">
                          ${safeFixed(amountPaid)}
                        </p>
                      </div>
                      {estimate.signed_at && (
                        <div>
                          <p className="text-sm text-green-700 dark:text-green-300 font-semibold mb-1">Accepted On</p>
                          <p className="text-base text-green-900 dark:text-green-100 font-bold">
                            {new Date(estimate.signed_at).toLocaleDateString('en-US', { 
                              dateStyle: 'full'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-green-600/10 border-l-4 border-green-600 p-4 rounded-r-lg">
                    <p className="text-sm text-green-900 dark:text-green-100 font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      You will receive a confirmation email with project details and next steps.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alternative Payment Methods */}
        <AlternativePaymentMethods 
          contractor={contractor} 
          primaryColor={brandColors.primary}
        />

        {/* Footer Branding */}
        <Card className="bg-gradient-to-br from-muted/50 to-background border border-border/50 shadow-sm">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              This estimate is confidential and prepared exclusively for <span className="font-bold text-foreground">{estimate.client_name}</span>
            </p>
            <Separator className="bg-border/50" />
            <div className="flex items-center justify-center gap-2 pt-1">
              <img 
                src={ct1PoweredLogo}
                alt="CT1" 
                className="w-8 h-8"
              />
              <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Powered by CT1</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PublicEstimate() {
  return (
    <PublicEstimateErrorBoundary>
      <PublicEstimateInner />
    </PublicEstimateErrorBoundary>
  );
}
