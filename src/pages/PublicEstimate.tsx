import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, FileText, Loader2, CreditCard, Building2, Calendar, DollarSign } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

export default function PublicEstimate() {
  const { token } = useParams();
  const [estimate, setEstimate] = useState<any>(null);
  const [contractor, setContractor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const clientSigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (token) {
      fetchEstimate();
      logView();

      // Check for payment status in URL
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');

      if (paymentStatus === 'success') {
        setSigned(true);
        toast.success('Payment successful! Thank you for your payment. Our team will contact you shortly to schedule the work.');
      } else if (paymentStatus === 'cancelled') {
        toast.error('Payment cancelled. You can try again by signing the estimate.');
      } else if (paymentStatus === 'error') {
        toast.error('Payment error. There was an error processing your payment. Please try again.');
      }
    }
  }, [token]);

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

  const handleSign = async () => {
    if (!agreementAccepted) {
      toast.error('Please accept the payment agreement to proceed');
      return;
    }

    if (!clientSigRef.current?.toDataURL()) {
      toast.error('Please provide your signature');
      return;
    }

    setSigning(true);
    try {
      const signatureData = clientSigRef.current.toDataURL();

      // Save signature to estimate
      const { error: sigError } = await supabase
        .from('estimates')
        .update({
          client_signature: signatureData,
        })
        .eq('id', estimate.id);

      if (sigError) throw sigError;

      // Initiate Clover payment - use deposit amount if set, otherwise total
      const paymentAmount = estimate.required_deposit && estimate.required_deposit > 0 
        ? estimate.required_deposit 
        : estimate.total_amount;
      
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'process-estimate-payment',
        {
          body: {
            estimate_id: estimate.id,
            public_token: token,
            amount: paymentAmount,
            customer_email: estimate.client_email,
          },
        }
      );

      if (paymentError) throw paymentError;

      if (paymentData?.success && paymentData?.checkout_url) {
        // Store payment session info
        sessionStorage.setItem('estimate_payment', JSON.stringify({
          estimate_id: estimate.id,
          token,
        }));

        // Redirect to Clover checkout
        window.location.href = paymentData.checkout_url;
      } else {
        throw new Error(paymentData?.message || 'Failed to create payment session');
      }
    } catch (error) {
      console.error('Error processing estimate:', error);
      toast.error('Failed to process estimate. Please try again.');
      setSigning(false);
    }
  };

  const clearSignature = () => {
    clientSigRef.current?.clear();
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

  // Get brand colors from contractor profile or use defaults
  const brandColors = {
    primary: contractor?.brand_primary_color || '#D50A22',
    secondary: contractor?.brand_secondary_color || '#1e3a5f',
    accent: contractor?.brand_accent_color || '#c9a227',
  };

  // Use contractor logo if available, otherwise fallback to CT1 logo
  const displayLogo = contractor?.logo_url || ct1Logo;
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
                    <img 
                      src={displayLogo}
                      alt="Company Logo" 
                      className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                    />
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
                {signed ? (
                  <Badge className="bg-green-600 text-white border-0 text-lg px-6 py-3 shadow-lg">
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
                          {item.quantity} {item.unit_type} × ${item.unit_cost.toFixed(2)}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="font-semibold ml-4">
                        ${item.line_total.toFixed(2)}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost Summary - Professional Presentation */}
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
                    ${costSummary.subtotal?.toFixed(2)}
                  </span>
                </div>
                {costSummary.profit_markup_percentage > 0 && (
                  <div className="flex justify-between text-lg py-2">
                    <span className="text-muted-foreground font-medium">
                      Profit/Markup ({costSummary.profit_markup_percentage}%)
                    </span>
                    <span className="font-bold text-foreground text-xl">
                      ${costSummary.profit_markup_amount?.toFixed(2)}
                    </span>
                  </div>
                )}
                {costSummary.tax_and_fees > 0 && (
                  <div className="flex justify-between text-lg py-2">
                    <span className="text-muted-foreground font-medium">Tax & Fees</span>
                    <span className="font-bold text-foreground text-xl">
                      ${costSummary.tax_and_fees?.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}
            <Separator className="my-6" style={{ backgroundColor: `${brandColors.primary}33` }} />
            <div 
              className="p-6 rounded-xl shadow-lg"
              style={{ background: `linear-gradient(90deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)` }}
            >
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-white">Total Investment</span>
                <span className="text-4xl font-black text-white">
                  ${estimate.total_amount?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
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

        {/* Signature Section */}
        {!signed ? (
          <Card className="border-2 shadow-2xl bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20 pb-6">
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Digital Signature Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <Alert className="border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                <FileText className="h-6 w-6 text-primary" />
                <AlertDescription className="text-base leading-relaxed ml-2">
                  By signing below, you agree to the scope of work, terms, and total investment amount 
                  outlined in this estimate. Your digital signature is legally binding and will convert 
                  this estimate into an active project.
                </AlertDescription>
              </Alert>

              {/* Payment Agreement */}
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5">
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
                <div className="border-4 border-primary/20 rounded-xl p-4 bg-white shadow-inner">
                  <SignatureCanvas
                    ref={clientSigRef}
                    canvasProps={{
                      className: 'w-full h-52 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-white',
                      style: { touchAction: 'none' },
                    }}
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={clearSignature}
                  className="flex-1 h-14 text-lg font-semibold border-2"
                  size="lg"
                >
                  Clear Signature
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={signing || !agreementAccepted}
                  className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary-hover shadow-lg hover:shadow-xl disabled:opacity-50"
                  size="lg"
                >
                  {signing && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Accept & Sign Estimate
                </Button>
              </div>
              
              <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> After signing, this estimate will be converted to an active job/order 
                  in our system. You'll receive confirmation and next steps via email.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-4 border-green-600 bg-gradient-to-br from-green-50 to-green-100 shadow-2xl">
            <CardContent className="p-10">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-lg">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-green-900 mb-3">
                    Estimate Successfully Accepted!
                  </h3>
                  <p className="text-green-800 text-lg mb-4 font-medium">
                    Thank you for accepting this estimate. Your project has been converted to an active job.
                  </p>
                  
                  {estimate.payment_status !== 'paid' && (
                    <Button
                      onClick={async () => {
                        setSigning(true);
                        try {
                          // Use deposit amount if set, otherwise total
                          const paymentAmount = estimate.required_deposit && estimate.required_deposit > 0 
                            ? estimate.required_deposit 
                            : estimate.total_amount;
                          
                          const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
                            'process-estimate-payment',
                            {
                              body: {
                                estimate_id: estimate.id,
                                public_token: token,
                                amount: paymentAmount,
                                customer_email: estimate.client_email,
                              },
                            }
                          );

                          if (paymentError) throw paymentError;

                          if (paymentData?.success && paymentData?.checkout_url) {
                            sessionStorage.setItem('estimate_payment', JSON.stringify({
                              estimate_id: estimate.id,
                              token,
                            }));
                            window.location.href = paymentData.checkout_url;
                          } else {
                            throw new Error(paymentData?.message || 'Failed to create payment session');
                          }
                        } catch (error) {
                          console.error('Error processing payment:', error);
                          toast.error('Failed to process payment. Please try again.');
                          setSigning(false);
                        }
                      }}
                      disabled={signing}
                      size="lg"
                      className="w-full sm:w-auto h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary-hover shadow-lg hover:shadow-xl mt-4"
                    >
                      {signing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Pay Now - ${(estimate.required_deposit && estimate.required_deposit > 0 ? estimate.required_deposit : estimate.total_amount)?.toFixed(2)}
                        </>
                      )}
                    </Button>
                  )}
                  <div className="bg-white rounded-xl p-6 border-2 border-green-300 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-green-700 font-semibold mb-1">Signed On</p>
                        <p className="text-base text-green-900 font-bold">
                          {new Date(estimate.signed_at).toLocaleDateString('en-US', { 
                            dateStyle: 'full'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-700 font-semibold mb-1">Status</p>
                        <Badge className="bg-green-600 text-white border-0 text-base">
                          Converted to Job
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 bg-green-600/10 border-l-4 border-green-600 p-4 rounded-r-lg">
                    <p className="text-sm text-green-900 font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {estimate.payment_status === 'paid' 
                        ? 'Payment received! Our team will contact you to schedule the work.'
                        : 'Next Steps: Click "Pay Now" above to complete payment, then our team will schedule your project.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Branding */}
        <Card className="bg-gradient-to-br from-primary/5 to-background border-2 border-primary/20 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="bg-white rounded-full p-2 shadow-md">
                <img 
                  src={ct1Logo}
                  alt="CT1" 
                  className="w-12 h-12"
                />
              </div>
              <span className="text-3xl font-black text-foreground">CT1</span>
            </div>
            <p className="text-base text-muted-foreground font-medium mb-3">
              Professional Contractor Management Platform
            </p>
            <Separator className="my-4 bg-primary/20" />
            <p className="text-sm text-muted-foreground">
              This estimate is confidential and prepared exclusively for <span className="font-bold text-foreground">{estimate.client_name}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
