import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Trash2, Eye, Send, CheckCircle, Clock, AlertCircle, RefreshCw, Users, Copy, ArrowLeft, Briefcase, ChevronRight, LayoutTemplate } from 'lucide-react';
import { useEstimates, EstimateLineItem } from '@/hooks/useEstimates';
import { useLeads } from '@/hooks/useLeads';
import EstimateBuilder from '../EstimateBuilder';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MobileOptimizedWrapper, MobileStack } from './MobileOptimizedWrapper';
import { supabase } from '@/integrations/supabase/client';
import { HorizontalRowCard, RowAvatar, RowContent, RowTitleLine, RowMetaLine, RowBadgeGroup, RowAmount, RowActions } from './HorizontalRowCard';
import { EstimateDetailViewBlue } from './EstimateDetailViewBlue';
import { TemplatesSection } from '../estimate/TemplatesSection';
import { PredictiveSearch } from '../PredictiveSearch';
import { SwipeToArchive } from '@/components/ui/swipe-to-archive';
import { CrmNavHeader } from '../CrmNavHeader';

interface EstimatesSectionProps {
  onSectionChange?: (section: string) => void;
  initialEstimateId?: string | null;
  onClearInitialEstimate?: () => void;
}

export default function EstimatesSection({ onSectionChange, initialEstimateId, onClearInitialEstimate }: EstimatesSectionProps) {
  const { estimates, isLoading, createEstimate, createEstimateAsync, updateEstimate, updateEstimateAsync, deleteEstimate, sendEstimate, sendEstimateAsync, isSendingEstimate, duplicateEstimate, duplicateEstimateAsync, isDuplicatingEstimate, archiveEstimate } = useEstimates();
  const { leads } = useLeads();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedEstimateForDetail, setSelectedEstimateForDetail] = useState<any>(null);
  const [isConverting, setIsConverting] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Handle initial estimate ID to auto-open the detail view
  React.useEffect(() => {
    if (initialEstimateId && estimates && estimates.length > 0) {
      const estimate = estimates.find(e => e.id === initialEstimateId);
      if (estimate) {
        setSelectedEstimateForDetail(estimate);
        setDetailViewOpen(true);
        // Clear the initial estimate ID after opening
        onClearInitialEstimate?.();
      }
    }
  }, [initialEstimateId, estimates, onClearInitialEstimate]);

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

  const handleOpenDetail = (estimate: any) => {
    setSelectedEstimateForDetail(estimate);
    setDetailViewOpen(true);
  };

  const handleEditFromDetail = (estimate: any) => {
    // Keep detail view reference, just open edit form
    setSelectedEstimate(estimate);
    setIsFormOpen(true);
  };

  // When closing edit form, return to detail view if we came from there
  const handleCloseEditForm = () => {
    setIsFormOpen(false);
    if (selectedEstimateForDetail) {
      // Refresh the estimate data and reopen detail view
      const updatedEstimate = estimates?.find(e => e.id === selectedEstimateForDetail.id);
      if (updatedEstimate) {
        setSelectedEstimateForDetail(updatedEstimate);
      }
      setDetailViewOpen(true);
    }
    setSelectedEstimate(null);
  };

  const handleSendFromDetail = async (estimate: any) => {
    await handleSendEstimate(estimate);
  };

  const handleDuplicateFromDetail = async (estimateId: string) => {
    try {
      const newEstimate = await duplicateEstimateAsync(estimateId);
      if (newEstimate) {
        setDetailViewOpen(false);
        // Open the new estimate in edit mode
        setSelectedEstimate(newEstimate);
        setIsFormOpen(true);
      }
    } catch (error) {
      console.error('Failed to duplicate estimate:', error);
    }
  };

  const handleDuplicateFromList = async (estimateId: string) => {
    try {
      const newEstimate = await duplicateEstimateAsync(estimateId);
      if (newEstimate) {
        // Open the new estimate in edit mode
        setSelectedEstimate(newEstimate);
        setIsFormOpen(true);
      }
    } catch (error) {
      console.error('Failed to duplicate estimate:', error);
    }
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

  // Show templates section if active
  if (showTemplates) {
    return (
      <TemplatesSection 
        onBack={() => setShowTemplates(false)} 
        onAddToEstimate={(lineItems, estimateId) => {
          // When template is added to an existing estimate, we'd update it
          // For now, this is handled within TemplatesSection
        }}
      />
    );
  }

  return (
    <MobileOptimizedWrapper
      title="Estimates"
      onBackClick={() => onSectionChange?.('dashboard')}
      actions={
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowTemplates(true)} className="w-full sm:w-auto">
            <LayoutTemplate className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={handleNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Estimate
          </Button>
        </div>
      }
    >
      {/* Navigation Header */}
      <div className="px-4 sm:px-0 mb-4">
        <CrmNavHeader
          back
          dashboard
          onBack={() => onSectionChange?.('dashboard')}
          onDashboard={() => onSectionChange?.('dashboard')}
          sectionLabel="Estimates"
        />
      </div>
      
      <CardDescription className="px-4 sm:px-0 mb-4">
        Create, manage, and track project estimates
      </CardDescription>

      {/* Predictive Search */}
      <div className="px-4 sm:px-0 mb-4">
        <PredictiveSearch
          items={estimates || []}
          placeholder="Search estimates by title, client, or status..."
          getLabel={(estimate: any) => estimate.title || 'Untitled'}
          getSublabel={(estimate: any) => [estimate.client_name, estimate.status, estimate.total_amount ? `$${estimate.total_amount.toLocaleString()}` : null].filter(Boolean).join(' • ')}
          filterFn={(estimate: any, query) => {
            const q = query.toLowerCase();
            return (
              estimate.title?.toLowerCase().includes(q) ||
              estimate.client_name?.toLowerCase().includes(q) ||
              estimate.client_email?.toLowerCase().includes(q) ||
              estimate.status?.toLowerCase().includes(q) ||
              estimate.project_name?.toLowerCase().includes(q)
            );
          }}
          onSelect={handleOpenDetail}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : estimates && estimates.length > 0 ? (
        <MobileStack className="space-y-2">
          {estimates.map((estimate: any) => (
            <SwipeToArchive 
              key={estimate.id} 
              onArchive={() => archiveEstimate(estimate.id)}
            >
              <HorizontalRowCard onClick={() => handleOpenDetail(estimate)}>
                {/* Avatar */}
                <RowAvatar initials={getInitials(estimate.client_name)} />

                {/* Main Content */}
                <RowContent>
                  <RowTitleLine>
                    <h3 className="font-semibold text-sm sm:text-base break-words">
                      {estimate.client_name || 'No Client'}
                    </h3>
                    <Badge variant={getStatusColor(estimate.status)} className="text-xs h-5">
                      {estimate.status}
                    </Badge>
                  </RowTitleLine>
                  
                  <RowMetaLine>
                    {estimate.estimate_number && <span className="font-medium">#{estimate.estimate_number}</span>}
                    <span className="truncate max-w-[180px]">
                      {estimate.title || estimate.project_name || 'Untitled'}
                    </span>
                  </RowMetaLine>
                </RowContent>

                {/* Amount & Chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RowAmount amount={estimate.total_amount} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Desktop Actions - hidden on mobile */}
                <RowActions>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleEdit(estimate); }}
                    title="Edit"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {estimate.client_email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); handleSendEstimate(estimate); }}
                      disabled={isSendingEstimate}
                      title={estimate.status === 'draft' ? 'Send' : 'Resend'}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleDuplicateFromList(estimate.id); }}
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
                      if (window.confirm('Delete this estimate?')) {
                        deleteEstimate(estimate.id);
                      }
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </RowActions>
              </HorizontalRowCard>
            </SwipeToArchive>
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

      {/* Estimate Builder Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseEditForm();
        } else {
          setIsFormOpen(open);
        }
      }}>
        <DialogContent className="w-full h-full max-w-full max-h-full rounded-none border-0 p-0 flex flex-col overflow-hidden fixed inset-0 translate-x-0 translate-y-0 top-0 left-0">
          <EstimateBuilder
            onSave={handleSubmit}
            onCancel={handleCloseEditForm}
            initialData={selectedEstimate}
          />
        </DialogContent>
      </Dialog>

      {/* Estimate Detail View Dialog */}
      <Dialog open={detailViewOpen} onOpenChange={setDetailViewOpen}>
        <DialogContent className="w-full h-full max-w-full max-h-full rounded-none border-0 p-0 flex flex-col overflow-hidden fixed inset-0 translate-x-0 translate-y-0 top-0 left-0">
          {selectedEstimateForDetail && (
            <EstimateDetailViewBlue
              estimate={selectedEstimateForDetail}
              onClose={() => setDetailViewOpen(false)}
              onSectionChange={onSectionChange}
              onNavigateToJob={(jobId) => {
                setDetailViewOpen(false);
                onSectionChange?.(`job:${jobId}`);
              }}
              onEdit={() => handleEditFromDetail(selectedEstimateForDetail)}
              onSend={() => handleSendFromDetail(selectedEstimateForDetail)}
              onDuplicate={() => handleDuplicateFromDetail(selectedEstimateForDetail.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </MobileOptimizedWrapper>
  );
}
