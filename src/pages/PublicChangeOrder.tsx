import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, FileText, Loader2, Building2, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

interface ChangeOrderData {
  id: string;
  description: string;
  reason?: string;
  scope_of_work?: string;
  terms_and_conditions?: string;
  additional_cost: number;
  total_amount?: number;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  line_items?: any[];
  status: string;
  client_name?: string;
  client_email?: string;
  client_signature?: string;
  signed_at?: string;
  date_requested?: string;
  change_order_number?: string;
  notes?: string;
  jobs?: {
    title: string;
    site_address?: string;
  };
}

export default function PublicChangeOrder() {
  const { token } = useParams();
  const [changeOrder, setChangeOrder] = useState<ChangeOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const clientSigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (token) {
      fetchChangeOrder();
      logView();
    }
  }, [token]);

  const fetchChangeOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('change_orders')
        .select('*, jobs(title, site_address)')
        .eq('public_token', token)
        .single();

      if (error) throw error;
      
      const changeOrderData: ChangeOrderData = {
        ...data,
        line_items: Array.isArray(data.line_items) ? data.line_items : [],
        jobs: data.jobs as any,
      };
      
      setChangeOrder(changeOrderData);
      setSigned(!!data.signed_at || data.status === 'approved');
    } catch (error) {
      console.error('Error fetching change order:', error);
      toast.error('Failed to load change order');
    } finally {
      setLoading(false);
    }
  };

  const logView = async () => {
    try {
      // Update viewed_at if not already viewed
      await supabase
        .from('change_orders')
        .update({ viewed_at: new Date().toISOString() })
        .eq('public_token', token)
        .is('viewed_at', null);

      // Log the view
      await supabase.from('change_order_views').insert({
        change_order_id: changeOrder?.id,
        ip_address: null,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error logging view:', error);
    }
  };

  const handleSign = async () => {
    if (!agreementAccepted) {
      toast.error('Please accept the agreement to proceed');
      return;
    }

    if (!clientSigRef.current || clientSigRef.current.isEmpty()) {
      toast.error('Please provide your signature');
      return;
    }

    setSigning(true);
    try {
      const signatureData = clientSigRef.current.toDataURL();

      const { error } = await supabase
        .from('change_orders')
        .update({
          client_signature: signatureData,
          signed_at: new Date().toISOString(),
          status: 'approved',
          date_approved: new Date().toISOString(),
        })
        .eq('public_token', token);

      if (error) throw error;

      setSigned(true);
      toast.success('Change order approved successfully!');
    } catch (error) {
      console.error('Error signing change order:', error);
      toast.error('Failed to sign change order. Please try again.');
    } finally {
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

  if (!changeOrder) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>
                Change order not found or link has expired.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lineItems = changeOrder.line_items || [];
  const totalAmount = changeOrder.total_amount || changeOrder.additional_cost || 0;

  return (
    <div className="min-h-screen bg-muted py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Professional Header */}
        <Card className="overflow-hidden border-2 shadow-xl">
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-8 sm:p-12 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="bg-white rounded-full p-3 shadow-2xl">
                    <img 
                      src={ct1Logo}
                      alt="CT1 Logo" 
                      className="w-14 h-14 sm:w-16 sm:h-16"
                    />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                      Change Order
                    </h1>
                    {changeOrder.change_order_number && (
                      <p className="text-white/95 text-xl font-semibold mt-2">
                        #{changeOrder.change_order_number}
                      </p>
                    )}
                  </div>
                </div>
                {signed ? (
                  <Badge className="bg-green-600 text-white border-0 text-lg px-6 py-3 shadow-lg">
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Approved
                  </Badge>
                ) : (
                  <Badge className="bg-white/20 text-white border-white/30 text-lg px-6 py-3 backdrop-blur-sm">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Awaiting Approval
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <CardContent className="p-8 sm:p-10 bg-gradient-to-br from-background to-muted/30">
            <div className="border-l-4 border-amber-500 pl-8 bg-white/50 backdrop-blur-sm p-6 rounded-r-lg shadow-sm">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                {changeOrder.description}
              </h2>
              {changeOrder.jobs?.title && (
                <p className="text-muted-foreground text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-500" />
                  Related to: <span className="font-semibold text-foreground">{changeOrder.jobs.title}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-background pb-6">
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-amber-500" />
              Change Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {changeOrder.client_name && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Client Name
                  </p>
                  <p className="font-bold text-lg">{changeOrder.client_name}</p>
                </div>
              )}
              {changeOrder.jobs?.site_address && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Site Address</p>
                  <p className="font-bold text-lg">{changeOrder.jobs.site_address}</p>
                </div>
              )}
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Requested
                </p>
                <p className="font-bold text-lg">
                  {changeOrder.date_requested 
                    ? new Date(changeOrder.date_requested).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
            
            {changeOrder.reason && (
              <div className="bg-amber-500/10 border-l-4 border-amber-500 p-6 rounded-r-lg">
                <p className="text-sm text-muted-foreground font-semibold mb-2">Reason for Change</p>
                <p className="text-base leading-relaxed">{changeOrder.reason}</p>
              </div>
            )}

            {changeOrder.scope_of_work && (
              <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg">
                <p className="text-sm text-muted-foreground font-semibold mb-2">Scope of Work</p>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{changeOrder.scope_of_work}</p>
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
                {lineItems.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-start py-3 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.description || item.item_description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit || item.unit_type} × ${(item.unit_price || item.unit_cost || 0).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold ml-4">
                      ${(item.total || item.line_total || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost Summary */}
        <Card className="border-2 shadow-2xl bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-b-2 border-amber-500/20 pb-6">
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-amber-500" />
              Additional Investment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            {changeOrder.subtotal && changeOrder.subtotal !== totalAmount && (
              <>
                <div className="flex justify-between text-lg py-2">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-bold text-foreground text-xl">
                    ${changeOrder.subtotal?.toFixed(2)}
                  </span>
                </div>
                {changeOrder.tax_amount && changeOrder.tax_amount > 0 && (
                  <div className="flex justify-between text-lg py-2">
                    <span className="text-muted-foreground font-medium">
                      Tax ({changeOrder.tax_rate}%)
                    </span>
                    <span className="font-bold text-foreground text-xl">
                      ${changeOrder.tax_amount?.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}
            <Separator className="my-6 bg-amber-500/20" />
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-white">Total Additional Cost</span>
                <span className="text-4xl font-black text-white">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        {changeOrder.terms_and_conditions && (
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                {changeOrder.terms_and_conditions}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Signature Section */}
        {!signed ? (
          <Card className="border-2 shadow-2xl bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-b-2 border-amber-500/20 pb-6">
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-amber-500" />
                Digital Signature Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <Alert className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-6">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <AlertDescription className="text-base leading-relaxed ml-2">
                  By signing below, you agree to the change order scope, terms, and additional cost 
                  outlined above. Your digital signature will approve this change order and modify 
                  your existing contract.
                </AlertDescription>
              </Alert>

              {/* Agreement Checkbox */}
              <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-background to-amber-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-500" />
                    Change Order Agreement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-background/80 p-4 rounded-lg border border-amber-500/20">
                    <p className="text-sm leading-relaxed text-foreground">
                      This change order modifies the original contract. By signing, I acknowledge 
                      that I understand and agree to the additional work described above, including 
                      the associated cost of <strong>${totalAmount.toFixed(2)}</strong>. This 
                      amount will be added to the total contract value and is due according to 
                      the payment terms of the original agreement.
                    </p>
                  </div>
                  
                  <div className="flex items-start space-x-3 bg-amber-500/5 p-4 rounded-lg border-2 border-amber-500/20">
                    <Checkbox
                      id="agreement"
                      checked={agreementAccepted}
                      onCheckedChange={(checked) => setAgreementAccepted(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="agreement"
                      className="text-sm font-medium leading-relaxed cursor-pointer text-foreground"
                    >
                      I have read and agree to the change order above. I understand that by signing, 
                      I am approving this modification to my contract.
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Signature Pad */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Please sign below to approve this change order:
                </p>
                <div className="border-2 border-dashed border-amber-500/30 rounded-lg p-2 bg-white">
                  <SignatureCanvas
                    ref={clientSigRef}
                    penColor="black"
                    canvasProps={{
                      className: 'w-full h-32 sm:h-40',
                      style: { width: '100%', height: '160px' }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearSignature} size="sm">
                    Clear Signature
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleSign}
                disabled={signing || !agreementAccepted}
                className="w-full h-14 text-lg font-bold bg-amber-500 hover:bg-amber-600"
              >
                {signing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Sign & Approve Change Order
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                Change Order Approved
              </h3>
              <p className="text-muted-foreground">
                Thank you for approving this change order. The contractor has been notified 
                and work will proceed according to the updated scope.
              </p>
              {changeOrder.signed_at && (
                <p className="text-sm text-muted-foreground mt-4">
                  Signed on: {new Date(changeOrder.signed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
