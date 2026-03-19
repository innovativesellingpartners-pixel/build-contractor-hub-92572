import { useState, useEffect } from 'react';
import { TranslationPreviewDialog } from '../TranslationPreviewDialog';
import { Estimate, useEstimates } from '@/hooks/useEstimates';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Send, Users, Briefcase, Eye, Copy, FileText, Receipt, Save, Download, LayoutTemplate, BookmarkPlus, Camera, MessageSquare, Loader2, CheckCircle, CreditCard, AlertCircle, Pencil, Languages } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EstimatePhotosSection } from '../estimate/EstimatePhotosSection';
import { Button } from '@/components/ui/button';
import { CustomerDetailViewBlue } from './CustomerDetailViewBlue';
import { Customer } from '@/hooks/useCustomers';
import { SendToGCDialog } from '../SendToGCDialog';
import { TemplateSearchModal } from '../estimate/TemplateSearchModal';
import { SaveAsTemplateModal } from '../estimate/SaveAsTemplateModal';
import { EstimatePDFPreview } from '@/components/estimate-pdf';
import {
  BlueBackground,
  SectionHeader,
  InfoCard,
  InfoRow,
  EditableInfoRow,
  ActionButton,
  DetailHeader,
  StatusBadge,
  ActionButtonRow,
  MoneyDisplay,
} from './ProvenJobsTheme';

interface EstimateDetailViewBlueProps {
  estimate: Estimate;
  onClose: () => void;
  onSectionChange?: (section: string) => void;
  onNavigateToJob?: (jobId: string) => void;
  onEdit?: () => void;
  onSend?: () => void;
  onDuplicate?: () => void;
}

export function EstimateDetailViewBlue({ 
  estimate, 
  onClose, 
  onSectionChange,
  onNavigateToJob,
  onEdit,
  onSend,
  onDuplicate
}: EstimateDetailViewBlueProps) {
  const { user } = useAuth();
  const { updateEstimate } = useEstimates();
  const [isConverting, setIsConverting] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  const [showSendToGCDialog, setShowSendToGCDialog] = useState(false);
  const [templateSearchOpen, setTemplateSearchOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [showSMSConfirmDialog, setShowSMSConfirmDialog] = useState(false);
  const [showPaymentRequiredDialog, setShowPaymentRequiredDialog] = useState(false);
  const [isClosingWon, setIsClosingWon] = useState(false);

  // Check if estimate is paid (payment_amount > 0 indicates deposit/payment received)
  const isPaid = estimate.paid_at != null || (estimate.payment_amount != null && estimate.payment_amount > 0);

  // Fetch linked customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      if (estimate.customer_id) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('id', estimate.customer_id)
          .single();
        if (data) setLinkedCustomer(data as Customer);
      }
    };
    fetchCustomer();
  }, [estimate.customer_id]);

  const handleConvertToCustomer = async () => {
    if (estimate.customer_id) {
      toast.info('This estimate already has a customer');
      onSectionChange?.('customers');
      return;
    }

    setIsConverting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

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

      await supabase
        .from('estimates')
        .update({ customer_id: newCustomer.id, status: 'accepted' })
        .eq('id', estimate.id);

      if (estimate.lead_id) {
        await supabase
          .from('leads')
          .update({ customer_id: newCustomer.id, converted_to_customer: true, status: 'won' })
          .eq('id', estimate.lead_id);
      }

      toast.success('Customer created from estimate!');
      onSectionChange?.('customers');
    } catch (error: any) {
      toast.error(`Failed to create customer: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertToJob = async () => {
    if (estimate.job_id) {
      toast.info('This estimate already has a job');
      // Navigate directly to the existing job
      if (onNavigateToJob) {
        onNavigateToJob(estimate.job_id);
      } else {
        onSectionChange?.('jobs');
      }
      return;
    }

    setIsConverting(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-estimate-to-job', {
        body: { estimateId: estimate.id }
      });

      if (error) throw error;
      toast.success('Job created from estimate!');
      
      // Navigate directly to the newly created job
      if (data?.jobId && onNavigateToJob) {
        onNavigateToJob(data.jobId);
      } else {
        onSectionChange?.('jobs');
      }
    } catch (error: any) {
      toast.error(`Failed to create job: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  // Handle "Closed Won" - creates customer and marks estimate as sold
  const handleClosedWon = async () => {
    // If not paid, show payment required dialog
    if (!isPaid) {
      setShowPaymentRequiredDialog(true);
      return;
    }

    // If already has customer, just update status and navigate
    if (estimate.customer_id) {
      try {
        await supabase
          .from('estimates')
          .update({ status: 'sold' })
          .eq('id', estimate.id);
        toast.success('Estimate marked as Closed Won!');
        onSectionChange?.('customers');
      } catch (error: any) {
        toast.error(`Failed to update estimate: ${error.message}`);
      }
      return;
    }

    setIsClosingWon(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Create customer from estimate
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
          lifetime_value: estimate.payment_amount || estimate.grand_total || estimate.total_amount,
          notes: `Closed Won from estimate: ${estimate.title}`,
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // Update estimate with customer link and sold status
      await supabase
        .from('estimates')
        .update({ 
          customer_id: newCustomer.id, 
          status: 'sold' 
        })
        .eq('id', estimate.id);

      // Update lead if exists
      if (estimate.lead_id) {
        await supabase
          .from('leads')
          .update({ customer_id: newCustomer.id, converted_to_customer: true, status: 'won' })
          .eq('id', estimate.lead_id);
      }

      toast.success('Closed Won! Customer created successfully.');
      onSectionChange?.('customers');
    } catch (error: any) {
      toast.error(`Failed to close won: ${error.message}`);
    } finally {
      setIsClosingWon(false);
    }
  };

  // Open public estimate page for signing/payment
  const handleViewAndSign = () => {
    if (estimate.public_token) {
      window.open(`/estimate/${estimate.public_token}`, '_blank');
    } else {
      toast.error('No public link available. Please send the estimate first.');
    }
  };
  const handleSaveAsInvoice = async () => {
    setIsCreatingInvoice(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      let jobId = estimate.job_id;
      let customerId = estimate.customer_id;

      // Create customer if needed
      if (!customerId) {
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
          }])
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;

        await supabase
          .from('estimates')
          .update({ customer_id: customerId, status: 'accepted' })
          .eq('id', estimate.id);
      }

      // Create job if needed
      if (!jobId) {
        const { data, error } = await supabase.functions.invoke('convert-estimate-to-job', {
          body: { estimateId: estimate.id }
        });
        if (error) throw error;
        jobId = data.jobId;
      }

      const lineItems = estimate.line_items as any[] || [];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert([{
          user_id: currentUser.id,
          job_id: jobId,
          customer_id: customerId,
          amount_due: estimate.grand_total || estimate.total_amount || 0,
          amount_paid: estimate.payment_amount || 0,
          balance_due: (estimate.grand_total || estimate.total_amount || 0) - (estimate.payment_amount || 0),
          line_items: lineItems,
          status: 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          notes: `Invoice for estimate: ${estimate.title}`,
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success(`Invoice ${invoice.invoice_number || 'draft'} saved! You can send it later from the Invoices section.`);
      onSectionChange?.('invoices');
    } catch (error: any) {
      toast.error(`Failed to save invoice: ${error.message}`);
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Parse line items
  const lineItems = estimate.line_items as any[] || [];

  const getDeliveryStatus = () => {
    if (estimate.signed_at) return 'Signed';
    if (estimate.viewed_at) return 'Viewed';
    if (estimate.sent_at) return 'Sent';
    return 'Draft';
  };

  // Show "Save as Invoice" when estimate is accepted/signed
  const canSaveAsInvoice = estimate.signed_at || estimate.status === 'accepted' || estimate.status === 'sold';
  // Show "Send Invoice to GC" when estimate is accepted/signed (no payment requirement)
  const canSendToGC = estimate.signed_at || estimate.status === 'accepted' || estimate.status === 'sold';

  // PDF Action handlers
  const handlePDFAction = async (mode: 'preview' | 'download') => {
    if (!estimate.id) {
      toast.error('Estimate not saved yet');
      return;
    }

    setIsPdfLoading(true);
    toast.loading('Generating PDF...', { id: 'pdf-gen' });

    try {
      const { data, error } = await supabase.functions.invoke('generate-estimate-pdf', {
        body: {
          estimateId: estimate.id,
          includePaymentLink: true,
        },
      });

      if (error) throw error;

      if (data?.pdfBase64) {
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        if (mode === 'preview') {
          window.open(url, '_blank');
          toast.success('PDF opened for review', { id: 'pdf-gen' });
        } else {
          const link = document.createElement('a');
          link.href = url;
          const filename = `Estimate_${estimate.estimate_number || estimate.id}_${estimate.client_name?.replace(/\s+/g, '_')}.pdf`;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('PDF downloaded successfully', { id: 'pdf-gen' });
        }
      } else {
        throw new Error('PDF generation failed - no PDF data returned');
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message, { id: 'pdf-gen' });
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handlePreviewPDF = () => setShowPdfPreview(true);
  const handleDownloadPDF = () => handlePDFAction('download');

  // Send Estimate via SMS
  const handleSendSMS = async () => {
    if (!estimate.client_phone) {
      toast.error('Client phone number is required to send SMS');
      return;
    }

    setIsSendingSMS(true);
    try {
      // Get contractor profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, contact_name')
        .eq('user_id', user?.id)
        .single();

      const contractorName = profile?.company_name || 
        profile?.contact_name || 
        user?.user_metadata?.full_name || 
        'Your Contractor';

      const { data, error } = await supabase.functions.invoke('send-estimate-sms', {
        body: {
          estimateId: estimate.id,
          phoneNumber: estimate.client_phone,
          contractorName,
        },
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success('Estimate sent via SMS!');
        setShowSMSConfirmDialog(false);
      } else {
        throw new Error(data?.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('SMS send error:', error);
      toast.error(error.message || 'Failed to send SMS');
    } finally {
      setIsSendingSMS(false);
    }
  };

  return (
    <BlueBackground className="min-h-full flex flex-col">
      {/* Header - Fixed */}
      <DetailHeader
        title={estimate.title}
        subtitle={estimate.estimate_number || undefined}
        onBack={onClose}
        onDashboard={onSectionChange ? () => { onSectionChange('dashboard'); onClose(); } : undefined}
        rightContent={<StatusBadge status={estimate.status} />}
      />

      {/* Scrollable Content - extra bottom padding to clear nav bar */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-32">
        {/* Action Buttons - scrolls with content */}
        <ActionButtonRow className="flex-wrap">
          {/* 1. Edit Estimate */}
          {onEdit && (
            <ActionButton variant="primary" onClick={onEdit} className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              EDIT ESTIMATE
            </ActionButton>
          )}
          {/* View & Sign Online */}
          {estimate.public_token && (
            <ActionButton variant="success" onClick={handleViewAndSign} className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              VIEW & SIGN ONLINE
            </ActionButton>
          )}
          {/* Copy Public Link */}
          {estimate.public_token && (
            <ActionButton 
              variant="muted" 
              onClick={() => {
                const link = `${window.location.origin}/estimate/${estimate.public_token}`;
                navigator.clipboard.writeText(link);
                toast.success('Public link copied to clipboard!');
              }}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              COPY LINK
            </ActionButton>
          )}
          {/* 2. Send Estimate */}
          {onSend && estimate.client_email && (
            <ActionButton variant="success" onClick={onSend} className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              {estimate.sent_at ? 'RESEND ESTIMATE' : 'SEND ESTIMATE'}
            </ActionButton>
          )}
          {/* 3. Send Invoice */}
          {canSendToGC && (
            <ActionButton 
              variant="success" 
              onClick={() => setShowSendToGCDialog(true)}
              className="flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              SEND INVOICE
            </ActionButton>
          )}
          {/* 4. Send SMS */}
          {estimate.client_phone && (
            <ActionButton 
              variant="secondary" 
              onClick={() => setShowSMSConfirmDialog(true)}
              disabled={isSendingSMS}
              className="flex items-center gap-2"
            >
              {isSendingSMS ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {isSendingSMS ? 'SENDING...' : 'SEND SMS'}
            </ActionButton>
          )}
          {/* 5. Review PDF */}
          <ActionButton 
            variant="muted" 
            onClick={handlePreviewPDF}
            disabled={isPdfLoading}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {isPdfLoading ? 'LOADING...' : 'REVIEW PDF'}
          </ActionButton>
          {/* 6. Save Template */}
          <ActionButton 
            variant="muted" 
            onClick={() => setSaveTemplateOpen(true)}
            className="flex items-center gap-2"
          >
            <BookmarkPlus className="w-4 h-4" />
            SAVE TEMPLATE
          </ActionButton>
          {/* 7. Duplicate */}
          {onDuplicate && (
            <ActionButton variant="muted" onClick={onDuplicate} className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              DUPLICATE
            </ActionButton>
          )}
          {/* Secondary Actions */}
          <ActionButton 
            variant="muted" 
            onClick={handleDownloadPDF}
            disabled={isPdfLoading}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            DOWNLOAD PDF
          </ActionButton>
          {!estimate.customer_id && (estimate.status === 'sent' || estimate.status === 'accepted' || estimate.signed_at) && (
            <ActionButton 
              variant="primary" 
              onClick={handleConvertToCustomer}
              disabled={isConverting}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              TO CUSTOMER
            </ActionButton>
          )}
          {!estimate.job_id && (
            <ActionButton 
              variant="primary" 
              onClick={handleConvertToJob}
              disabled={isConverting}
              className="flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              {isConverting ? 'CONVERTING...' : 'CONVERT TO JOB'}
            </ActionButton>
          )}
          {canSaveAsInvoice && (
            <ActionButton 
              variant="secondary" 
              onClick={handleSaveAsInvoice}
              disabled={isCreatingInvoice}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isCreatingInvoice ? 'SAVING...' : 'SAVE AS INVOICE'}
            </ActionButton>
          )}
        </ActionButtonRow>

        <div className="space-y-0">
          {/* Estimate Information */}
          <SectionHeader>ESTIMATE DETAILS</SectionHeader>
        <InfoCard className="rounded-none">
          <EditableInfoRow label="Title" value={estimate.title} onSave={(v) => updateEstimate({ id: estimate.id!, title: v } as any)} placeholder="Estimate title" />
          <InfoRow label="Estimate #" value={estimate.estimate_number} />
          <EditableInfoRow 
            label="Status" 
            value={estimate.status} 
            onSave={(v) => updateEstimate({ id: estimate.id!, status: v } as any)}
            selectOptions={[
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'sold', label: 'Sold' },
            ]}
          />
          <InfoRow label="Delivery" value={getDeliveryStatus()} />
          <EditableInfoRow label="Project" value={estimate.project_name} onSave={(v) => updateEstimate({ id: estimate.id!, project_name: v || null } as any)} placeholder="Project name" />
          <EditableInfoRow label="Valid Until" value={estimate.valid_until} type="date" onSave={(v) => updateEstimate({ id: estimate.id!, valid_until: v || null } as any)} />
        </InfoCard>

        {/* Client Information */}
        <SectionHeader>CLIENT INFORMATION</SectionHeader>
        <InfoCard className="rounded-none">
          <EditableInfoRow label="Name" value={estimate.client_name} onSave={(v) => updateEstimate({ id: estimate.id!, client_name: v || null } as any)} placeholder="Client name" />
          <EditableInfoRow label="Email" value={estimate.client_email} type="email" onSave={(v) => updateEstimate({ id: estimate.id!, client_email: v || null } as any)} placeholder="Email address" />
          <EditableInfoRow label="Phone" value={estimate.client_phone} type="tel" onSave={(v) => updateEstimate({ id: estimate.id!, client_phone: v || null } as any)} placeholder="Phone number" />
          <EditableInfoRow label="Site Address" value={estimate.site_address} onSave={(v) => updateEstimate({ id: estimate.id!, site_address: v || null } as any)} placeholder="Site address" />
        </InfoCard>

        {/* Financial Summary */}
        <SectionHeader>FINANCIAL SUMMARY</SectionHeader>
        <InfoCard className="rounded-none">
          <div className="grid grid-cols-2 gap-4 p-4">
            <MoneyDisplay amount={estimate.subtotal} label="Subtotal" />
            <MoneyDisplay amount={estimate.tax_amount} label="Tax" />
            <MoneyDisplay amount={estimate.grand_total || estimate.total_amount} label="Grand Total" size="lg" />
            <MoneyDisplay amount={estimate.required_deposit} label="Deposit Required" />
          </div>
          {estimate.payment_amount && (
            <InfoRow label="Amount Paid" value={`$${estimate.payment_amount.toFixed(2)}`} />
          )}
        </InfoCard>

        {/* Line Items */}
        {lineItems.length > 0 && (
          <>
            <SectionHeader>LINE ITEMS ({lineItems.length})</SectionHeader>
            <InfoCard className="rounded-none">
              {lineItems.map((item, index) => (
                <div key={index} className="px-4 py-3 border-b border-sky-50 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium text-slate-800 text-sm">{item.description || item.name}</p>
                      {item.item_code && (
                        <p className="text-xs text-slate-500">{item.item_code}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sky-600 text-sm">
                        ${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantity || 1} × ${(item.unit_price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </InfoCard>
          </>
        )}

        {/* Scope of Work */}
        {estimate.scope_objective && (
          <>
            <SectionHeader>SCOPE OF WORK</SectionHeader>
            <InfoCard className="rounded-none">
              <div className="p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{estimate.scope_objective}</p>
              </div>
            </InfoCard>
          </>
        )}

        {/* Linked Records */}
        {(estimate.lead_id || estimate.customer_id || estimate.job_id) && (
          <>
            <SectionHeader>LINKED RECORDS</SectionHeader>
            <InfoCard className="rounded-none">
              {estimate.lead_id && (
                <InfoRow 
                  label="Lead" 
                  value={
                    <span 
                      className="text-sky-600 cursor-pointer"
                      onClick={() => onSectionChange?.('leads')}
                    >
                      View Lead →
                    </span>
                  }
                  isClickable
                  onClick={() => onSectionChange?.('leads')}
                />
              )}
              {estimate.customer_id && linkedCustomer && (
                <InfoRow 
                  label="Customer" 
                  value={
                    <span 
                      className="text-sky-600 cursor-pointer"
                      onClick={() => setCustomerDialogOpen(true)}
                    >
                      View Customer →
                    </span>
                  }
                  isClickable
                  onClick={() => setCustomerDialogOpen(true)}
                />
              )}
              {estimate.job_id && (
                <InfoRow 
                  label="Job" 
                  value={
                    <span 
                      className="text-sky-600 cursor-pointer"
                      onClick={() => onSectionChange?.('jobs')}
                    >
                      View Job →
                    </span>
                  }
                  isClickable
                  onClick={() => onSectionChange?.('jobs')}
                />
              )}
            </InfoCard>
          </>
        )}

        {/* Timeline */}
        <SectionHeader>TIMELINE</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow 
            label="Created" 
            value={format(new Date(estimate.created_at), 'MMM d, yyyy')} 
          />
          {estimate.sent_at && (
            <InfoRow 
              label="Sent" 
              value={format(new Date(estimate.sent_at), 'MMM d, yyyy h:mm a')} 
            />
          )}
          {estimate.viewed_at && (
            <InfoRow 
              label="Viewed" 
              value={format(new Date(estimate.viewed_at), 'MMM d, yyyy h:mm a')} 
            />
          )}
          {estimate.signed_at && (
            <InfoRow 
              label="Signed" 
              value={format(new Date(estimate.signed_at), 'MMM d, yyyy h:mm a')} 
            />
          )}
        </InfoCard>

        {/* Photos Section - Mirroring Jobs */}
        <SectionHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            SITE PHOTOS
          </div>
        </SectionHeader>
        <InfoCard className="rounded-none">
          <div className="p-4">
            <EstimatePhotosSection estimateId={estimate.id} showRiskShotWarning={true} />
          </div>
        </InfoCard>
        </div>
      </div>

      {/* Customer Detail Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] p-0 overflow-hidden">
          {linkedCustomer && (
            <CustomerDetailViewBlue
              customer={linkedCustomer}
              onClose={() => setCustomerDialogOpen(false)}
              onSectionChange={onSectionChange}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Send to GC Dialog */}
      <SendToGCDialog 
        open={showSendToGCDialog}
        onOpenChange={setShowSendToGCDialog}
        estimate={estimate}
        onSuccess={() => {
          onSectionChange?.('invoices');
        }}
      />

      {/* Save as Template Modal */}
      <SaveAsTemplateModal
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        lineItems={lineItems}
        defaultName={estimate.title}
        defaultTrade={estimate.trade_type || 'General Contracting'}
      />

      {/* PDF Preview Dialog - Full screen on mobile */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-[900px] w-[100vw] h-[100dvh] max-h-[100dvh] md:h-[95vh] md:max-h-[95vh] p-0 overflow-hidden">
          <EstimatePDFPreview 
            estimate={estimate} 
            onClose={() => setShowPdfPreview(false)}
            onDownload={handleDownloadPDF}
          />
        </DialogContent>
      </Dialog>

      {/* SMS Confirmation Dialog */}
      <Dialog open={showSMSConfirmDialog} onOpenChange={setShowSMSConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Send Estimate via SMS</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">To:</span> {estimate.client_name || 'Customer'}</p>
              <p><span className="font-medium">Phone:</span> {estimate.client_phone}</p>
              <p><span className="font-medium">Amount:</span> ${(estimate.grand_total || estimate.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              {estimate.required_deposit && estimate.required_deposit > 0 && (
                <p><span className="font-medium">Deposit:</span> ${estimate.required_deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              The customer will receive a text message with a link to view, sign, and pay this estimate.
            </p>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowSMSConfirmDialog(false)}
                disabled={isSendingSMS}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSendSMS}
                disabled={isSendingSMS}
              >
                {isSendingSMS ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send SMS
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Required Dialog */}
      <Dialog open={showPaymentRequiredDialog} onOpenChange={setShowPaymentRequiredDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Payment Required
            </DialogTitle>
            <DialogDescription>
              This estimate must be paid before it can be marked as Closed Won.
            </DialogDescription>
          </DialogHeader>
          <Alert className="border-amber-200 bg-amber-50">
            <CreditCard className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              The customer needs to view, sign, and pay the estimate first. Send them the estimate link or use the button below to open the payment page.
            </AlertDescription>
          </Alert>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Customer:</span> {estimate.client_name || 'Unknown'}</p>
            <p><span className="font-medium">Total:</span> ${(estimate.grand_total || estimate.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            {estimate.required_deposit && estimate.required_deposit > 0 && (
              <p><span className="font-medium">Deposit Required:</span> ${estimate.required_deposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowPaymentRequiredDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={() => {
                handleViewAndSign();
                setShowPaymentRequiredDialog(false);
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              View & Sign Online
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BlueBackground>
  );
}
