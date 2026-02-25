import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, FileText, Loader2, Building2, Calendar, DollarSign, CreditCard, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { AlternativePaymentMethods } from '@/components/payments/AlternativePaymentMethods';
import { FinixPaymentForm } from '@/components/payments/FinixPaymentForm';
import { toast } from 'sonner';

export default function PublicInvoice() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [contractor, setContractor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showFinixForm, setShowFinixForm] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvoice();

      const paymentStatus = searchParams.get('payment');
      const paymentAmount = searchParams.get('amount');

      if (paymentStatus === 'success') {
        const amountText = paymentAmount ? ` of $${parseFloat(paymentAmount).toFixed(2)}` : '';
        toast.success(`Payment${amountText} successful! Thank you.`);
        setTimeout(() => fetchInvoice(), 1000);
      } else if (paymentStatus === 'cancelled') {
        toast.error('Payment cancelled. You can try again below.');
      } else if (paymentStatus === 'error') {
        toast.error('Payment error. Please try again or contact support.');
      }
    }
  }, [token, searchParams]);

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-public-invoice', {
        body: { token }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setInvoice(data.invoice);
      setContractor(data.contractor || null);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    // Check if contractor uses Finix
    if (contractor?.preferred_payment_provider === 'finix' && contractor?.finix_merchant_id) {
      setShowFinixForm(true);
      return;
    }

    setProcessingPayment(true);
    try {
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'process-invoice-payment',
        {
          body: {
            invoice_id: invoice.id,
            public_token: token,
            payment_intent: 'remaining',
            customer_email: invoice.customers?.email,
          },
        }
      );

      if (paymentError) throw paymentError;
      if (paymentData?.success && paymentData?.checkout_url) {
        window.location.href = paymentData.checkout_url;
      } else {
        throw new Error(paymentData?.message || 'Failed to create payment session');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
      setProcessingPayment(false);
    }
  };

  const handleFinixSuccess = () => {
    setShowFinixForm(false);
    toast.success('Payment successful! Thank you.');
    setTimeout(() => fetchInvoice(), 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>
                Invoice not found or link has expired.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lineItems = invoice.line_items || [];
  const amountDue = invoice.amount_due || 0;
  const amountPaid = invoice.amount_paid || 0;
  const remainingBalance = invoice.remaining_balance || Math.max(0, amountDue - amountPaid);
  const isFullyPaid = remainingBalance <= 0;
  const isPartiallyPaid = amountPaid > 0 && remainingBalance > 0;

  // Use contractor brand colors with neutral fallbacks
  const primaryColor = contractor?.brand_primary_color || '#334155';
  const secondaryColor = contractor?.brand_secondary_color || '#1e293b';
  const accentColor = contractor?.brand_accent_color || '#475569';

  const companyName = contractor?.company_name || 'Invoice';
  const displayLogo = contractor?.logo_url;

  // Build contractor address string
  const addressParts = [contractor?.business_address, contractor?.city, contractor?.state, contractor?.zip_code].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null;

  return (
    <div className="min-h-screen bg-muted py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="overflow-hidden border-2 shadow-xl">
          <div
            className="p-8 sm:p-12 relative"
            style={{ background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)` }}
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  {displayLogo ? (
                    <div className="bg-white rounded-full p-3 shadow-2xl">
                      <img
                        src={displayLogo}
                        alt={companyName}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 shadow-2xl">
                      <Building2 className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                      {companyName}
                    </h1>
                    {invoice.invoice_number && (
                      <p className="text-white/90 text-xl font-semibold mt-2">
                        Invoice #{invoice.invoice_number}
                      </p>
                    )}
                  </div>
                </div>
                {isFullyPaid ? (
                  <Badge className="bg-green-600 text-white border-0 text-lg px-6 py-3 shadow-lg">
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Paid in Full
                  </Badge>
                ) : isPartiallyPaid ? (
                  <Badge className="bg-amber-600 text-white border-0 text-lg px-6 py-3 shadow-lg">
                    Partially Paid
                  </Badge>
                ) : (
                  <Badge className="bg-white/20 text-white border-white/30 text-lg px-6 py-3 backdrop-blur-sm">
                    Payment Due
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Job Details */}
        {invoice.jobs && (
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-background pb-6">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6" style={{ color: primaryColor }} />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Job Name</p>
                  <p className="font-bold text-lg">{invoice.jobs.name}</p>
                </div>
                {invoice.jobs.job_number && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground font-medium mb-1">Job Number</p>
                    <p className="font-bold text-lg">{invoice.jobs.job_number}</p>
                  </div>
                )}
                {invoice.jobs.address && (
                  <div className="bg-muted/30 p-4 rounded-lg col-span-full">
                    <p className="text-sm text-muted-foreground font-medium mb-1">Location</p>
                    <p className="font-bold text-lg">
                      {invoice.jobs.address}
                      {invoice.jobs.city && `, ${invoice.jobs.city}`}
                      {invoice.jobs.state && `, ${invoice.jobs.state}`}
                      {invoice.jobs.zip_code && ` ${invoice.jobs.zip_code}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line Items */}
        {lineItems.length > 0 && (
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-gradient-to-r from-muted/50 to-background pb-6">
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6" style={{ color: primaryColor }} />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-3">
                {lineItems.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-start py-4 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{item.description || item.name}</p>
                      {item.item_code && (
                        <p className="text-sm text-muted-foreground">{item.item_code}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {item.quantity || 1} × ${(item.unit_price || 0).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-bold text-xl ml-4" style={{ color: primaryColor }}>
                      ${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Summary */}
        <Card className="border-2 shadow-2xl bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="border-b-2 pb-6" style={{ borderColor: `${primaryColor}20` }}>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-6 w-6" style={{ color: primaryColor }} />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            {/* Total Amount */}
            <div
              className="p-6 rounded-xl shadow-lg"
              style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
            >
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-white">Invoice Total</span>
                <span className="text-4xl font-black text-white">
                  ${amountDue.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Breakdown */}
            {amountPaid > 0 && (
              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div>
                  <span className="text-green-800 dark:text-green-200 font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Amount Paid
                  </span>
                </div>
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ${amountPaid.toFixed(2)}
                </span>
              </div>
            )}

            {/* Remaining Balance */}
            {!isFullyPaid && (
              <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div>
                  <span className="text-amber-800 dark:text-amber-200 font-semibold">
                    Remaining Balance
                  </span>
                  <p className="text-sm text-amber-600 dark:text-amber-400">Due now</p>
                </div>
                <span className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  ${remainingBalance.toFixed(2)}
                </span>
              </div>
            )}

            <Separator />

            {/* Payment Actions */}
            {!isFullyPaid ? (
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full py-8 text-xl font-bold shadow-xl text-white"
                  style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
                  onClick={handlePayment}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-6 w-6 mr-3" />
                      Pay ${remainingBalance.toFixed(2)} Now
                    </>
                  )}
                </Button>

                {/* Finix Inline Payment Form */}
                {showFinixForm && (
                  <div className="border-2 border-primary/20 rounded-xl p-6 bg-card mt-4">
                    <h3 className="text-lg font-bold mb-4">Enter Card Details</h3>
                    <FinixPaymentForm
                      entityType="invoice"
                      entityId={invoice.id}
                      publicToken={token!}
                      paymentIntent="remaining"
                      customerEmail={invoice.customers?.email || ''}
                      amount={remainingBalance}
                      finixEnvironment={contractor?.finix_environment || 'sandbox'}
                      finixApplicationId={contractor?.finix_merchant_id || ''}
                      onSuccess={handleFinixSuccess}
                      onCancel={() => setShowFinixForm(false)}
                      primaryColor={primaryColor}
                    />
                  </div>
                )}

                <p className="text-center text-sm text-muted-foreground">
                  Secure online payment
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">
                  Invoice Paid in Full
                </h3>
                <p className="text-muted-foreground">
                  Thank you for your payment! A receipt has been sent to your email.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alternative Payment Methods */}
        <AlternativePaymentMethods 
          contractor={contractor} 
          primaryColor={primaryColor}
        />

        {/* Notes */}
        {invoice.notes && (
          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle className="text-xl">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer - Contractor Contact Info */}
        <div className="text-center text-sm text-muted-foreground py-6 space-y-2">
          {companyName !== 'Invoice' && (
            <p className="font-medium text-foreground">{companyName}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {contractor?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {contractor.phone}
              </span>
            )}
            {contractor?.business_email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {contractor.business_email}
              </span>
            )}
            {contractor?.website_url && (
              <span className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {contractor.website_url}
              </span>
            )}
          </div>
          {fullAddress && (
            <p className="flex items-center justify-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {fullAddress}
            </p>
          )}
          {contractor?.license_number && (
            <p className="text-xs text-muted-foreground">License #{contractor.license_number}</p>
          )}
        </div>
      </div>
    </div>
  );
}
