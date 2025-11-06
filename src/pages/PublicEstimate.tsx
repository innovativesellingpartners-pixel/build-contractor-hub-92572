import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, FileText, Loader2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';

export default function PublicEstimate() {
  const { token } = useParams();
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const clientSigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (token) {
      fetchEstimate();
      logView();
    }
  }, [token]);

  const fetchEstimate = async () => {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('public_token', token)
        .single();

      if (error) throw error;
      
      setEstimate(data);
      setSigned(!!data.signed_at);

      // Update viewed_at if not already viewed
      if (!data.viewed_at) {
        await supabase
          .from('estimates')
          .update({ viewed_at: new Date().toISOString() })
          .eq('id', data.id);
      }
    } catch (error) {
      console.error('Error fetching estimate:', error);
      toast.error('Failed to load estimate');
    } finally {
      setLoading(false);
    }
  };

  const logView = async () => {
    try {
      await supabase.from('estimate_views').insert({
        estimate_id: estimate?.id,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error logging view:', error);
    }
  };

  const handleSign = async () => {
    if (!clientSigRef.current?.toDataURL()) {
      toast.error('Please provide your signature');
      return;
    }

    setSigning(true);
    try {
      const { error } = await supabase
        .from('estimates')
        .update({
          client_signature: clientSigRef.current.toDataURL(),
          signed_at: new Date().toISOString(),
          status: 'accepted',
        })
        .eq('id', estimate.id);

      if (error) throw error;

      setSigned(true);
      toast.success('Estimate signed successfully!');
      fetchEstimate();
    } catch (error) {
      console.error('Error signing estimate:', error);
      toast.error('Failed to sign estimate');
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

  return (
    <div className="min-h-screen bg-muted py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Professional Header with Branding */}
        <Card className="overflow-hidden border-2">
          <div className="bg-gradient-to-r from-primary to-primary-hover p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <img 
                  src="/src/assets/ct1-logo-circle.png" 
                  alt="CT1 Logo" 
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full p-2 shadow-lg"
                />
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-primary-foreground">
                    Professional Estimate
                  </h1>
                  {estimate.estimate_number && (
                    <p className="text-primary-foreground/90 text-lg mt-1">
                      #{estimate.estimate_number}
                    </p>
                  )}
                </div>
              </div>
              {signed ? (
                <Badge className="bg-green-600 text-white border-0 text-base px-4 py-2">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Signed
                </Badge>
              ) : (
                <Badge className="bg-white/20 text-primary-foreground border-white/30 text-base px-4 py-2">
                  Awaiting Signature
                </Badge>
              )}
            </div>
          </div>
          <CardContent className="p-6 sm:p-8 bg-card">
            <div className="border-l-4 border-primary pl-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {estimate.title}
              </h2>
              <p className="text-muted-foreground text-base">
                Prepared for {estimate.client_name}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Client Name</p>
                <p className="font-semibold">{estimate.client_name}</p>
              </div>
              {estimate.site_address && (
                <div>
                  <p className="text-sm text-muted-foreground">Site Address</p>
                  <p className="font-semibold">{estimate.site_address}</p>
                </div>
              )}
              {estimate.trade_type && (
                <div>
                  <p className="text-sm text-muted-foreground">Trade Type</p>
                  <p className="font-semibold">{estimate.trade_type}</p>
                </div>
              )}
              {estimate.valid_until && (
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p className="font-semibold">
                    {new Date(estimate.valid_until).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            {estimate.project_description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1">{estimate.project_description}</p>
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
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-xl">Investment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {costSummary.subtotal > 0 && (
              <>
                <div className="flex justify-between text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    ${costSummary.subtotal?.toFixed(2)}
                  </span>
                </div>
                {costSummary.profit_markup_percentage > 0 && (
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground">
                      Profit/Markup ({costSummary.profit_markup_percentage}%)
                    </span>
                    <span className="font-semibold text-foreground">
                      ${costSummary.profit_markup_amount?.toFixed(2)}
                    </span>
                  </div>
                )}
                {costSummary.tax_and_fees > 0 && (
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground">Tax & Fees</span>
                    <span className="font-semibold text-foreground">
                      ${costSummary.tax_and_fees?.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}
            <Separator className="my-4" />
            <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
              <span className="text-xl font-bold text-foreground">Total Investment</span>
              <span className="text-3xl font-bold text-primary">
                ${estimate.total_amount?.toFixed(2) || '0.00'}
              </span>
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
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-xl">Digital Signature Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <Alert className="border-primary/20 bg-primary/5">
                <FileText className="h-5 w-5 text-primary" />
                <AlertDescription className="text-base">
                  By signing below, you agree to the scope of work, terms, and total investment amount 
                  outlined in this estimate. Your digital signature is legally binding.
                </AlertDescription>
              </Alert>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Sign below using your mouse or finger:
                </label>
                <div className="border-2 border-input rounded-lg p-3 bg-background shadow-inner">
                  <SignatureCanvas
                    ref={clientSigRef}
                    canvasProps={{
                      className: 'w-full h-48 border-2 border-dashed border-muted-foreground/20 rounded bg-white',
                      style: { touchAction: 'none' },
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={clearSignature}
                  className="flex-1 h-12 text-base"
                  size="lg"
                >
                  Clear Signature
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={signing}
                  className="flex-1 h-12 text-base font-bold"
                  size="lg"
                >
                  {signing && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                  Accept & Sign Estimate
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-green-500 bg-green-50">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-600 rounded-full">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    Estimate Successfully Accepted
                  </h3>
                  <p className="text-green-700 text-base mb-3">
                    Thank you for accepting this estimate. We'll be in touch shortly to schedule the work.
                  </p>
                  <div className="bg-white/60 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>Signed:</strong> {new Date(estimate.signed_at).toLocaleString('en-US', { 
                        dateStyle: 'full', 
                        timeStyle: 'short' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Branding */}
        <Card className="bg-gradient-to-r from-muted to-background border-primary/10">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <img 
                src="/src/assets/ct1-logo-circle.png" 
                alt="CT1" 
                className="w-10 h-10"
              />
              <span className="text-xl font-bold text-foreground">CT1</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional Contractor Management Platform
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This estimate is confidential and prepared exclusively for {estimate.client_name}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
