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
        {/* Header */}
        <Card>
          <CardHeader className="bg-primary text-primary-foreground">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl sm:text-3xl">
                  {estimate.title}
                </CardTitle>
                {estimate.estimate_number && (
                  <p className="text-primary-foreground/80 mt-2">
                    Estimate #{estimate.estimate_number}
                  </p>
                )}
              </div>
              {signed ? (
                <Badge variant="secondary" className="bg-green-500 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Signed
                </Badge>
              ) : (
                <Badge variant="secondary">Pending</Badge>
              )}
            </div>
          </CardHeader>
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

        {/* Cost Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {costSummary.subtotal > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    ${costSummary.subtotal?.toFixed(2)}
                  </span>
                </div>
                {costSummary.profit_markup_percentage > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Profit/Markup ({costSummary.profit_markup_percentage}%)
                    </span>
                    <span>
                      ${costSummary.profit_markup_amount?.toFixed(2)}
                    </span>
                  </div>
                )}
                {costSummary.tax_and_fees > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax & Fees</span>
                    <span>${costSummary.tax_and_fees?.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">
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
          <Card>
            <CardHeader>
              <CardTitle>Sign to Accept Estimate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  By signing below, you agree to the terms and total amount of
                  this estimate.
                </AlertDescription>
              </Alert>
              <div className="border rounded-lg p-2 bg-background">
                <SignatureCanvas
                  ref={clientSigRef}
                  canvasProps={{
                    className: 'w-full h-40 border rounded',
                    style: { touchAction: 'none' },
                  }}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={clearSignature}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={signing}
                  className="flex-1"
                >
                  {signing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Sign & Accept
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">
                    Estimate Accepted
                  </p>
                  <p className="text-sm text-green-700">
                    Signed on{' '}
                    {new Date(estimate.signed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
