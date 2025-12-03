import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Trash2, Eye, Send, CheckCircle, Clock, AlertCircle, RefreshCw, Users, Copy, ArrowLeft, Briefcase, ChevronRight } from 'lucide-react';
import { useEstimates } from '@/hooks/useEstimates';
import { useLeads } from '@/hooks/useLeads';
import EstimateForm from '../EstimateForm';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MobileOptimizedWrapper, MobileStack } from './MobileOptimizedWrapper';
import { supabase } from '@/integrations/supabase/client';
import { HorizontalRowCard, RowAvatar, RowContent, RowTitleLine, RowMetaLine, RowBadgeGroup, RowAmount, RowActions } from './HorizontalRowCard';

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
    if (estimate.signed_at) return <CheckCircle className="h-3 w-3 text-green-600" />;
    if (estimate.viewed_at) return <Eye className="h-3 w-3 text-blue-600" />;
    if (estimate.sent_at) return <Send className="h-3 w-3 text-muted-foreground" />;
    return <Clock className="h-3 w-3 text-muted-foreground" />;
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getDeliveryBadge = (estimate: any) => {
    if (estimate.email_send_error) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="h-2.5 w-2.5 mr-1" />
          Failed
        </Badge>
      );
    }
    if (estimate.signed_at) {
      return (
        <Badge variant="outline" className="text-xs border-green-600 text-green-600">
          <CheckCircle className="h-2.5 w-2.5 mr-1" />
          Signed
        </Badge>
      );
    }
    if (estimate.viewed_at) {
      return (
        <Badge variant="outline" className="text-xs">
          <Eye className="h-2.5 w-2.5 mr-1" />
          Viewed
        </Badge>
      );
    }
    return null;
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
        <MobileStack className="space-y-3">
          {estimates.map((estimate: any) => (
            <HorizontalRowCard key={estimate.id} onClick={() => handleEdit(estimate)}>
              {/* Avatar */}
              <RowAvatar initials={getInitials(estimate.client_name)} />

              {/* Main Content */}
              <RowContent>
                <RowTitleLine>
                  <h3 className="font-semibold text-sm sm:text-base truncate max-w-[200px]">
                    {estimate.title}
                  </h3>
                  {estimate.estimate_number && (
                    <span className="text-xs text-muted-foreground">#{estimate.estimate_number}</span>
                  )}
                </RowTitleLine>
                
                <RowMetaLine>
                  <span className="truncate max-w-[140px]">
                    {estimate.client_name || 'No client'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {getStatusIcon(estimate)}
                    <Badge variant={getStatusColor(estimate.status)} className="text-xs">
                      {estimate.status}
                    </Badge>
                  </span>
                </RowMetaLine>

                {/* Linked badges & date */}
                <RowBadgeGroup>
                  {estimate.lead_id && (
                    <Badge 
                      variant="outline" 
                      className="text-xs gap-1 cursor-pointer hover:bg-muted"
                      onClick={(e) => { e.stopPropagation(); onSectionChange?.('leads'); }}
                    >
                      <ArrowLeft className="h-2.5 w-2.5" />
                      Lead
                    </Badge>
                  )}
                  {estimate.customer_id && (
                    <Badge 
                      variant="outline" 
                      className="text-xs gap-1 border-blue-600 text-blue-600 cursor-pointer hover:bg-muted"
                      onClick={(e) => { e.stopPropagation(); onSectionChange?.('customers'); }}
                    >
                      <Users className="h-2.5 w-2.5" />
                      Customer
                    </Badge>
                  )}
                  {estimate.job_id && (
                    <Badge 
                      variant="outline" 
                      className="text-xs gap-1 border-green-600 text-green-600 cursor-pointer hover:bg-muted"
                      onClick={(e) => { e.stopPropagation(); onSectionChange?.('jobs'); }}
                    >
                      <Briefcase className="h-2.5 w-2.5" />
                      Job
                    </Badge>
                  )}
                  {estimate.valid_until && (
                    <span className="text-xs text-muted-foreground">
                      Valid until {format(new Date(estimate.valid_until), 'MMM dd, yyyy')}
                    </span>
                  )}
                </RowBadgeGroup>
              </RowContent>

              {/* Amount */}
              <RowAmount 
                amount={estimate.total_amount} 
                badge={getDeliveryBadge(estimate)}
              />

              {/* Actions */}
              <RowActions>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); handleEdit(estimate); }}
                  title="View/Edit"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                {estimate.client_email && estimate.status === 'draft' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleSendEstimate(estimate); }}
                    disabled={isSendingEstimate}
                    title="Send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}

                {estimate.client_email && estimate.status !== 'draft' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleSendEstimate(estimate); }}
                    disabled={isSendingEstimate}
                    title="Resend"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSendingEstimate ? 'animate-spin' : ''}`} />
                  </Button>
                )}

                {/* Convert to Customer button */}
                {(estimate.status === 'sent' || estimate.status === 'accepted' || estimate.signed_at) && !estimate.customer_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={(e) => { e.stopPropagation(); handleConvertToCustomer(estimate); }}
                    disabled={isConverting === estimate.id}
                    title="Convert to Customer"
                  >
                    {isConverting === estimate.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); duplicateEstimate(estimate.id); }}
                  disabled={isDuplicatingEstimate}
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this estimate?')) {
                      deleteEstimate(estimate.id);
                    }
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
              </RowActions>
            </HorizontalRowCard>
          ))}
        </MobileStack>
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
