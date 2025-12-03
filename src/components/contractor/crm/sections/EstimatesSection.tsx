import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Calendar, DollarSign, Trash2, Eye, Send, CheckCircle, Clock, AlertCircle, RefreshCw, Home, Users, Copy, ArrowRight, ArrowLeft, Briefcase } from 'lucide-react';
import { useEstimates } from '@/hooks/useEstimates';
import { useLeads } from '@/hooks/useLeads';
import EstimateForm from '../EstimateForm';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MobileOptimizedWrapper, MobileCard, MobileGrid } from './MobileOptimizedWrapper';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

export default function EstimatesSection({ onSectionChange }: { onSectionChange?: (section: string) => void }) {
  const { estimates, isLoading, createEstimate, createEstimateAsync, updateEstimate, updateEstimateAsync, deleteEstimate, sendEstimate, sendEstimateAsync, isSendingEstimate, duplicateEstimate, isDuplicatingEstimate } = useEstimates();
  const { leads } = useLeads();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [isConverting, setIsConverting] = useState<string | null>(null);

  // Convert estimate to customer (new linear flow)
  const handleConvertToCustomer = async (estimate: any) => {
    if (estimate.customer_id) {
      toast.info('This estimate already has a customer');
      onSectionChange?.('customers');
      return;
    }

    setIsConverting(estimate.id);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Create customer from estimate data
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([{
          user_id: currentUser.id,
          name: estimate.client_name || 'Unknown Customer',
          email: estimate.client_email || null,
          phone: estimate.client_phone || null,
          address: estimate.site_address || estimate.client_address || null,
          customer_type: 'residential',
          estimate_id: estimate.id,
          notes: `Created from estimate: ${estimate.title}`,
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // Update estimate to link to customer and mark as accepted
      const { error: updateError } = await supabase
        .from('estimates')
        .update({ 
          customer_id: newCustomer.id, 
          status: 'accepted' 
        })
        .eq('id', estimate.id);

      if (updateError) throw updateError;

      // If estimate was linked to a lead, update the lead
      if (estimate.lead_id) {
        await supabase
          .from('leads')
          .update({ 
            customer_id: newCustomer.id, 
            converted_to_customer: true,
            status: 'won'
          })
          .eq('id', estimate.lead_id);
      }

      toast.success('Customer created from estimate!');
      onSectionChange?.('customers');
    } catch (error: any) {
      console.error('Error converting estimate to customer:', error);
      toast.error(`Failed to create customer: ${error.message}`);
    } finally {
      setIsConverting(null);
    }
  };

  // Legacy: Convert estimate directly to job (skip customer)
  const handleConvertToJob = async (estimate: any) => {
    if (estimate.job_id) {
      toast.info('This estimate has already been converted to a job');
      return;
    }

    setIsConverting(estimate.id);
    try {
      const { data, error } = await supabase.functions.invoke('convert-estimate-to-job', {
        body: { estimateId: estimate.id }
      });

      if (error) throw error;

      toast.success('Estimate converted to job successfully!');
      onSectionChange?.('jobs');
    } catch (error: any) {
      console.error('Error converting estimate to job:', error);
      toast.error(`Failed to convert estimate: ${error.message}`);
    } finally {
      setIsConverting(null);
    }
  };

  const getLinkedLead = (estimate: any) => {
    return leads?.find(l => l.id === estimate.lead_id);
  };

  const handleSubmit = async (data: any, isDraft: boolean) => {
    try {
      let saved: any;
      if (selectedEstimate) {
        saved = await updateEstimateAsync({ id: selectedEstimate.id, ...data });
      } else {
        saved = await createEstimateAsync(data);
      }

      // If the user clicked "Send to Client", actually send the email now
      if (!isDraft && saved?.id) {
        await sendEstimateAsync({
          estimateId: saved.id,
          contractorName: user?.user_metadata?.full_name || 'CT1 Contractor',
          contractorEmail: user?.email || '',
        });
      }

      setIsFormOpen(false);
      setSelectedEstimate(null);
    } catch (error) {
      console.error('Error saving or sending estimate:', error);
    }
  };

  const handleSendEstimate = async (estimate: any) => {
    if (!estimate.client_email) {
      toast.error('Client email is required to send estimate');
      return;
    }

    try {
      await sendEstimate({
        estimateId: estimate.id,
        contractorName: user?.user_metadata?.full_name || 'CT1 Contractor',
        contractorEmail: user?.email || '',
      });
    } catch (error) {
      console.error('Error sending estimate:', error);
    }
  };

  const handleEdit = (estimate: any) => {
    setSelectedEstimate(estimate);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setSelectedEstimate(null);
    setIsFormOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (estimate: any) => {
    if (estimate.signed_at) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (estimate.viewed_at) return <Eye className="h-4 w-4 text-blue-600" />;
    if (estimate.sent_at) return <Send className="h-4 w-4 text-gray-600" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <MobileOptimizedWrapper
      title="Estimates"
      onBackClick={() => onSectionChange?.('dashboard')}
      actions={
        <Button onClick={handleNew} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Estimate
        </Button>
      }
    >
      <CardDescription className="px-4 sm:px-0 mb-4">
        Create, manage, and track project estimates
      </CardDescription>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : estimates && estimates.length > 0 ? (
        <MobileGrid>
          {estimates.map((estimate: any) => (
            <MobileCard key={estimate.id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{estimate.title}</h3>
                    {estimate.estimate_number && (
                      <p className="text-sm text-muted-foreground">#{estimate.estimate_number}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(estimate)}
                    <Badge variant={getStatusColor(estimate.status)}>
                      {estimate.status}
                    </Badge>
                  </div>
                </div>

                {/* Client Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium truncate">{estimate.client_name}</span>
                  </div>
                  {estimate.client_email && (
                    <div className="text-sm text-muted-foreground truncate">
                      {estimate.client_email}
                    </div>
                  )}
                </div>

                {/* Amount & Date */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold text-primary">
                      ${estimate.total_amount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  {estimate.valid_until && (
                    <div className="text-xs text-muted-foreground">
                      Valid until {format(new Date(estimate.valid_until), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>

                {/* Delivery Status Panel */}
                {(estimate.last_send_attempt || estimate.sent_at || estimate.viewed_at || estimate.signed_at) && (
                  <div className="space-y-3">
                    {/* Email Delivery Status */}
                    {estimate.last_send_attempt && (
                      <Alert className={estimate.email_send_error ? "border-destructive" : "border-primary"}>
                        <AlertDescription className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs font-medium">
                                {estimate.email_send_error ? (
                                  <>
                                    <AlertCircle className="h-3 w-3 text-destructive" />
                                    <span className="text-destructive">Send Failed</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span className="text-green-600">Delivered</span>
                                  </>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Last attempt: {format(new Date(estimate.last_send_attempt), 'MMM dd, yyyy h:mm a')}
                              </div>
                              {estimate.email_send_error && (
                                <div className="text-xs text-destructive mt-1">
                                  Failed to deliver
                                </div>
                              )}
                            </div>
                            {estimate.client_email && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendEstimate(estimate)}
                                disabled={isSendingEstimate}
                                className="gap-2"
                              >
                                <RefreshCw className={`h-3 w-3 ${isSendingEstimate ? 'animate-spin' : ''}`} />
                                Resend
                              </Button>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Status Indicators */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {estimate.sent_at && (
                        <Badge variant="outline" className="gap-1">
                          <Send className="h-3 w-3" />
                          Sent {format(new Date(estimate.sent_at), 'MMM dd')}
                        </Badge>
                      )}
                      {estimate.viewed_at && (
                        <Badge variant="outline" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Viewed {format(new Date(estimate.viewed_at), 'MMM dd')}
                        </Badge>
                      )}
                      {estimate.signed_at && (
                        <Badge variant="outline" className="gap-1 border-green-600 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Signed {format(new Date(estimate.signed_at), 'MMM dd')}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {/* Linked Lead indicator */}
                  {estimate.lead_id && (
                    <Badge 
                      variant="outline" 
                      className="gap-1 cursor-pointer hover:bg-muted"
                      onClick={() => onSectionChange?.('leads')}
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Lead
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(estimate)}
                    className="flex-1 min-w-[100px]"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View/Edit
                  </Button>
                  {estimate.client_email && (
                    <>
                      {estimate.status === 'draft' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSendEstimate(estimate)}
                          disabled={isSendingEstimate}
                          className="flex-1 min-w-[100px]"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      )}
                      {(estimate.status === 'sent' || estimate.status === 'accepted') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendEstimate(estimate)}
                          disabled={isSendingEstimate}
                          className="gap-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${isSendingEstimate ? 'animate-spin' : ''}`} />
                          Resend
                        </Button>
                      )}
                    </>
                  )}
                  {/* PRIMARY: Convert to Customer - Linear flow */}
                  {(estimate.status === 'sent' || estimate.status === 'accepted' || estimate.signed_at) && !estimate.customer_id && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleConvertToCustomer(estimate)}
                      disabled={isConverting === estimate.id}
                      className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700"
                    >
                      {isConverting === estimate.id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      Convert to Customer
                    </Button>
                  )}
                  {/* Show linked customer indicator */}
                  {estimate.customer_id && !estimate.job_id && (
                    <Badge 
                      variant="outline" 
                      className="gap-1 border-blue-600 text-blue-600 cursor-pointer hover:bg-muted"
                      onClick={() => onSectionChange?.('customers')}
                    >
                      <Users className="h-3 w-3" />
                      Customer
                      <ArrowRight className="h-3 w-3" />
                    </Badge>
                  )}
                  {/* Show linked job indicator */}
                  {estimate.job_id && (
                    <Badge 
                      variant="outline" 
                      className="gap-1 border-green-600 text-green-600 cursor-pointer hover:bg-muted"
                      onClick={() => onSectionChange?.('jobs')}
                    >
                      <Briefcase className="h-3 w-3" />
                      Job
                      <ArrowRight className="h-3 w-3" />
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateEstimate(estimate.id)}
                    disabled={isDuplicatingEstimate}
                    className="shrink-0"
                    aria-label="Duplicate estimate"
                    title="Duplicate estimate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this estimate?')) {
                        deleteEstimate(estimate.id);
                      }
                    }}
                    className="shrink-0"
                    aria-label="Delete estimate"
                    title="Delete estimate"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </MobileCard>
          ))}
        </MobileGrid>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No estimates yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first estimate to get started
            </p>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Estimate
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estimate Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              {selectedEstimate ? 'Edit Estimate' : 'Create New Estimate'}
            </DialogTitle>
          </DialogHeader>
          <EstimateForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedEstimate(null);
            }}
            initialData={selectedEstimate}
          />
        </DialogContent>
      </Dialog>
    </MobileOptimizedWrapper>
  );
}
