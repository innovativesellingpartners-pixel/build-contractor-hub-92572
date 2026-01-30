import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText, Send, Download, ArrowLeft, Mail, ExternalLink, Loader2, Eye, Paperclip, Plus, FileCheck, ScrollText, DollarSign, MessageSquare, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, useInvoices } from '@/hooks/useInvoices';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { WaiverSelection, SelectedWaiver, WAIVER_TYPES } from '../WaiverSelection';
import { WaiverPreview } from '../WaiverPreview';
import { useContractorProfile } from '@/hooks/useContractorProfile';
import { useGCContacts, GCContact } from '@/hooks/useGCContacts';
import { useInvoiceWaivers } from '@/hooks/useInvoiceWaivers';
import { RequestPaymentDialog } from '../RequestPaymentDialog';
import {
  BlueBackground,
  SectionHeader,
  InfoCard,
  InfoRow,
  ActionButton,
  DetailHeader,
  StatusBadge,
  ActionButtonRow,
  MoneyDisplay,
} from './ProvenJobsTheme';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  onClose: () => void;
  onSectionChange?: (section: string) => void;
}

interface JobData {
  id: string;
  name: string;
  job_number?: string;
  address?: string;
}

interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface EstimateData {
  id: string;
  title: string;
  estimate_number?: string;
}

export function InvoiceDetailView({ invoice, onClose, onSectionChange }: InvoiceDetailViewProps) {
  const { updateInvoice } = useInvoices();
  const { profile } = useContractorProfile();
  const { gcContacts, addGCContact, refreshGCContacts } = useGCContacts();
  const { generateWaivers, isGenerating: waiverGenerating, fetchInvoiceWaivers, sendInvoiceWithWaivers, isSending: waiverSending } = useInvoiceWaivers();
  const [job, setJob] = useState<JobData | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [sourceEstimate, setSourceEstimate] = useState<EstimateData | null>(null);
  const [attachedWaivers, setAttachedWaivers] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendData, setSendData] = useState({
    recipientEmail: '',
    recipientName: '',
    subject: '',
    body: '',
  });
  // Document selection state for send dialog
  const [documentsToSend, setDocumentsToSend] = useState({
    invoice: true,
    waivers: false,
    estimate: false,
  });
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfZoom, setPdfZoom] = useState(1);
  const [showWaiverDialog, setShowWaiverDialog] = useState(false);
  const [selectedWaivers, setSelectedWaivers] = useState<SelectedWaiver[]>([]);
  const [selectedGcId, setSelectedGcId] = useState<string>('');
  const [waiverStep, setWaiverStep] = useState<'select' | 'preview'>('select');
  const [signatureData, setSignatureData] = useState<string>('');
  const [signerName, setSignerName] = useState<string>('');
  const [signerTitle, setSignerTitle] = useState<string>('');
  const [showAddGCDialog, setShowAddGCDialog] = useState(false);
  const [newGCData, setNewGCData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
  });
  const [savingGC, setSavingGC] = useState(false);
  const [showPaymentRequestDialog, setShowPaymentRequestDialog] = useState(false);

  useEffect(() => {
    const fetchRelatedData = async () => {
      // Fetch job
      if (invoice.job_id) {
        const { data: jobData } = await supabase
          .from('jobs')
          .select('id, name, job_number, address')
          .eq('id', invoice.job_id)
          .single();
        if (jobData) setJob(jobData);
      }

      // Fetch customer
      if (invoice.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id, name, email, phone')
          .eq('id', invoice.customer_id)
          .single();
        if (customerData) setCustomer(customerData);
      }

      // Check if this invoice was created from an estimate (by matching job_id)
      if (invoice.job_id) {
        const { data: estimateData } = await supabase
          .from('estimates')
          .select('id, title, estimate_number')
          .eq('job_id', invoice.job_id)
          .single();
        if (estimateData) setSourceEstimate(estimateData);
      }

      // Fetch attached waivers for this invoice
      const waivers = await fetchInvoiceWaivers(invoice.id);
      setAttachedWaivers(waivers);
    };

    fetchRelatedData();
  }, [invoice]);

  const handleSendInvoice = async () => {
    if (!sendData.recipientEmail) {
      toast.error('Recipient email is required');
      return;
    }

    setSending(true);
    try {
      // Use sendInvoiceWithWaivers if waivers are selected
      if (documentsToSend.waivers && attachedWaivers.length > 0) {
        await sendInvoiceWithWaivers(
          invoice.id,
          sendData.recipientEmail,
          sendData.recipientName || customer?.name,
          true, // includeWaivers
          'combined'
        );
      } else {
        const { error } = await supabase.functions.invoke('send-invoice-email', {
          body: {
            invoiceId: invoice.id,
            recipientEmail: sendData.recipientEmail,
            recipientName: sendData.recipientName || customer?.name,
          }
        });
        if (error) throw error;
        toast.success(`Invoice sent to ${sendData.recipientEmail}`);
      }

      setShowSendDialog(false);
      
      // Refresh to show updated status
      window.location.reload();
    } catch (error: any) {
      toast.error(`Failed to send invoice: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const generatePdf = async (): Promise<Blob | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        toast.error('Please log in to generate PDF');
        return null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-invoice-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ invoiceId: invoice.id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      return await response.blob();
    } catch (error: any) {
      console.error('PDF generation error:', error);
      throw error;
    }
  };

  const handleViewPdf = async () => {
    setPdfLoading(true);
    try {
      const blob = await generatePdf();
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setShowPdfPreview(true);
      }
    } catch (error: any) {
      toast.error(`Failed to generate PDF: ${error.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownload = async () => {
    setPdfLoading(true);
    try {
      const blob = await generatePdf();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${invoice.invoice_number || invoice.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Invoice PDF downloaded');
      }
    } catch (error: any) {
      toast.error(`Failed to download PDF: ${error.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const openSendDialog = () => {
    setSendData({
      recipientEmail: customer?.email || '',
      recipientName: customer?.name || '',
      subject: `Invoice ${invoice.invoice_number} for ${job?.name || 'your project'}`,
      body: `Please find attached the invoice for your project. Contact us with any questions.`,
    });
    // Reset document selection with intelligent defaults
    setDocumentsToSend({
      invoice: true,
      waivers: attachedWaivers.length > 0, // Default on if waivers exist
      estimate: false,
    });
    setShowSendDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'viewed': return 'bg-purple-100 text-purple-700';
      case 'partial': return 'bg-amber-100 text-amber-700';
      case 'paid': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'void': return 'bg-gray-100 text-gray-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number | null) => {
    return `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Parse line items
  const lineItems = (invoice.line_items as any[]) || [];

  return (
    <BlueBackground className="min-h-full">
      {/* Header */}
      <DetailHeader
        title={invoice.invoice_number || 'Invoice'}
        subtitle={job?.name || undefined}
        onBack={onClose}
        rightContent={
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status.toUpperCase()}
          </Badge>
        }
      />

      {/* Action Buttons */}
      <ActionButtonRow className="flex-wrap">
        <ActionButton 
          variant="primary" 
          onClick={handleViewPdf}
          className="flex items-center gap-2"
          disabled={pdfLoading}
        >
          {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          VIEW PDF
        </ActionButton>
        <ActionButton 
          variant="success" 
          onClick={openSendDialog}
          className="flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {invoice.status === 'sent' ? 'RESEND' : 'SEND TO REQUIRED'}
        </ActionButton>
        <ActionButton 
          variant="secondary" 
          onClick={handleDownload}
          className="flex items-center gap-2"
          disabled={pdfLoading}
        >
          {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          DOWNLOAD
        </ActionButton>
        {sourceEstimate && (
          <ActionButton 
            variant="muted" 
            onClick={() => onSectionChange?.('estimates')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            VIEW ESTIMATE
          </ActionButton>
        )}
        <ActionButton 
          variant="secondary" 
          onClick={() => setShowWaiverDialog(true)}
          className="flex items-center gap-2"
        >
          <Paperclip className="w-4 h-4" />
          ATTACH WAIVER
        </ActionButton>
        {/* Show Request Remainder Payment when there's a balance due */}
        {(invoice.amount_due - invoice.amount_paid) > 0 && (
          <ActionButton 
            variant="success" 
            onClick={() => setShowPaymentRequestDialog(true)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            REQUEST REMAINDER PAYMENT
          </ActionButton>
        )}
      </ActionButtonRow>

      {/* Content */}
      <div className="space-y-0">
        {/* Invoice Information */}
        <SectionHeader>INVOICE DETAILS</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow label="Invoice #" value={invoice.invoice_number} />
          <InfoRow 
            label="Status" 
            value={
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status.toUpperCase()}
              </Badge>
            } 
          />
          <InfoRow 
            label="Issue Date" 
            value={format(new Date(invoice.issue_date), 'MMM d, yyyy')} 
          />
          {invoice.due_date && (
            <InfoRow 
              label="Due Date" 
              value={format(new Date(invoice.due_date), 'MMM d, yyyy')} 
            />
          )}
        </InfoCard>

        {/* GC/Customer Information */}
        {customer && (
          <>
            <SectionHeader>GC / CUSTOMER</SectionHeader>
            <InfoCard className="rounded-none">
              <InfoRow label="Name" value={customer.name} />
              {customer.email && (
                <InfoRow 
                  label="Email" 
                  value={
                    <a href={`mailto:${customer.email}`} className="text-sky-600 underline">
                      {customer.email}
                    </a>
                  } 
                />
              )}
              {customer.phone && (
                <InfoRow 
                  label="Phone" 
                  value={
                    <a href={`tel:${customer.phone}`} className="text-sky-600 underline">
                      {customer.phone}
                    </a>
                  } 
                />
              )}
            </InfoCard>
          </>
        )}

        {/* Job Information */}
        {job && (
          <>
            <SectionHeader>JOB INFORMATION</SectionHeader>
            <InfoCard className="rounded-none">
              <InfoRow label="Job Name" value={job.name} />
              {job.job_number && <InfoRow label="Job #" value={job.job_number} />}
              {job.address && <InfoRow label="Address" value={job.address} />}
            </InfoCard>
          </>
        )}

        {/* Financial Summary */}
        <SectionHeader>FINANCIAL SUMMARY</SectionHeader>
        <InfoCard className="rounded-none">
          <div className="grid grid-cols-2 gap-4 p-4">
            <MoneyDisplay amount={invoice.amount_due} label="Amount Due" size="lg" />
            <MoneyDisplay amount={invoice.amount_paid} label="Amount Paid" />
            <MoneyDisplay 
              amount={(invoice.amount_due || 0) - (invoice.amount_paid || 0)} 
              label="Balance Due" 
              size="lg" 
            />
          </div>
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

        {/* Notes */}
        {invoice.notes && (
          <>
            <SectionHeader>NOTES</SectionHeader>
            <InfoCard className="rounded-none">
              <div className="p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </InfoCard>
          </>
        )}

        {/* Source Estimate Link */}
        {sourceEstimate && (
          <>
            <SectionHeader>SOURCE ESTIMATE</SectionHeader>
            <InfoCard className="rounded-none">
              <InfoRow 
                label="Estimate" 
                value={
                  <span 
                    className="text-sky-600 cursor-pointer"
                    onClick={() => onSectionChange?.('estimates')}
                  >
                    {sourceEstimate.estimate_number || sourceEstimate.title} →
                  </span>
                }
                isClickable
                onClick={() => onSectionChange?.('estimates')}
              />
            </InfoCard>
          </>
        )}
      </div>

      {/* Send Invoice Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Documents to GC
            </DialogTitle>
            <DialogDescription>
              Select documents to send with invoice {invoice.invoice_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Document Selection Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Documents to Include</Label>
              <div className="border rounded-lg divide-y bg-muted/30">
                {/* Invoice - Always available */}
                <div className="flex items-center gap-3 p-3">
                  <Checkbox 
                    id="doc-invoice"
                    checked={documentsToSend.invoice}
                    onCheckedChange={(checked) => setDocumentsToSend(prev => ({ ...prev, invoice: !!checked }))}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="doc-invoice" className="font-medium cursor-pointer">Invoice</Label>
                      <p className="text-xs text-muted-foreground">Invoice {invoice.invoice_number}</p>
                    </div>
                  </div>
                </div>

                {/* Waivers - Show count if any */}
                <div className="flex items-center gap-3 p-3">
                  <Checkbox 
                    id="doc-waivers"
                    checked={documentsToSend.waivers}
                    onCheckedChange={(checked) => setDocumentsToSend(prev => ({ ...prev, waivers: !!checked }))}
                    disabled={attachedWaivers.length === 0}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`p-2 rounded ${attachedWaivers.length > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                      <FileCheck className={`h-4 w-4 ${attachedWaivers.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="doc-waivers" className={`font-medium cursor-pointer ${attachedWaivers.length === 0 ? 'text-muted-foreground' : ''}`}>
                        Lien Waivers
                      </Label>
                      {attachedWaivers.length > 0 ? (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {attachedWaivers.length} waiver{attachedWaivers.length > 1 ? 's' : ''} attached
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No waivers attached</p>
                      )}
                    </div>
                    {attachedWaivers.length === 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={() => {
                          setShowSendDialog(false);
                          setShowWaiverDialog(true);
                        }}
                      >
                        <Paperclip className="h-3 w-3 mr-1" />
                        Attach
                      </Button>
                    )}
                  </div>
                </div>

                {/* Estimate - If exists */}
                <div className="flex items-center gap-3 p-3">
                  <Checkbox 
                    id="doc-estimate"
                    checked={documentsToSend.estimate}
                    onCheckedChange={(checked) => setDocumentsToSend(prev => ({ ...prev, estimate: !!checked }))}
                    disabled={!sourceEstimate}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`p-2 rounded ${sourceEstimate ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted'}`}>
                      <ScrollText className={`h-4 w-4 ${sourceEstimate ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="doc-estimate" className={`font-medium cursor-pointer ${!sourceEstimate ? 'text-muted-foreground' : ''}`}>
                        Estimate
                      </Label>
                      {sourceEstimate ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {sourceEstimate.estimate_number || sourceEstimate.title}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No linked estimate</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Recipient Email *</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="gc@example.com"
                value={sendData.recipientEmail}
                onChange={(e) => setSendData(prev => ({ ...prev, recipientEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                placeholder="GC Name"
                value={sendData.recipientName}
                onChange={(e) => setSendData(prev => ({ ...prev, recipientName: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)} disabled={sending || waiverSending}>
              Cancel
            </Button>
            <Button onClick={handleSendInvoice} disabled={sending || waiverSending || !sendData.recipientEmail || !documentsToSend.invoice}>
              {sending || waiverSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send {documentsToSend.waivers && attachedWaivers.length > 0 ? 'Documents' : 'Invoice'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog - Full Screen with Zoom Controls */}
      <Dialog open={showPdfPreview} onOpenChange={(open) => {
        setShowPdfPreview(open);
        if (!open) {
          if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
          }
          setPdfZoom(1); // Reset zoom when closing
        }
      }}>
        <DialogContent className="w-full h-full max-w-full max-h-full rounded-none border-0 p-0 overflow-hidden fixed inset-0 translate-x-0 translate-y-0 top-0 left-0">
          <div className="h-full flex flex-col bg-muted">
            {/* Header with controls */}
            <div className="flex-shrink-0 bg-white border-b shadow-sm z-50">
              <div className="px-4 py-3">
                {/* Top row - Back and title */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Button variant="ghost" size="sm" onClick={() => setShowPdfPreview(false)} className="px-2">
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Back</span>
                    </Button>
                    <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Invoice Preview - {invoice.invoice_number}
                    </h1>
                  </div>
                </div>
                
                {/* Bottom row - Zoom and action controls */}
                <div className="flex items-center justify-between gap-2">
                  {/* Zoom controls */}
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPdfZoom(prev => Math.max(prev - 0.25, 0.5))}
                      className="h-8 w-8 p-0"
                      title="Zoom out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                      {Math.round(pdfZoom * 100)}%
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPdfZoom(prev => Math.min(prev + 0.25, 3))}
                      className="h-8 w-8 p-0"
                      title="Zoom in"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm" 
                      onClick={() => setPdfZoom(1)}
                      className="h-8 px-2 text-xs"
                      title="Fit to width"
                    >
                      Fit
                    </Button>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleDownload}
                      disabled={pdfLoading}
                      className="h-8 px-2"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Download</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Preview - Scrollable container with zoom */}
            <div 
              className="flex-1 overflow-auto py-4 px-2 sm:px-4"
              style={{
                touchAction: 'pan-x pan-y pinch-zoom',
              }}
            >
              {pdfUrl && (
                <div 
                  style={{ 
                    transform: `scale(${pdfZoom})`,
                    transformOrigin: 'top center',
                    width: pdfZoom < 1 ? `${100 / pdfZoom}%` : '100%',
                    minWidth: pdfZoom > 1 ? `${816 * pdfZoom}px` : undefined,
                  }}
                  className="mx-auto"
                >
                  <iframe
                    src={pdfUrl}
                    className="w-full border-0 bg-white shadow-lg rounded-lg"
                    style={{ height: `${1056 * Math.max(pdfZoom, 1)}px`, minHeight: '100vh' }}
                    title="Invoice PDF Preview"
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attach Waiver Dialog */}
      <Dialog open={showWaiverDialog} onOpenChange={(open) => {
        setShowWaiverDialog(open);
        if (!open) {
          setWaiverStep('select');
          setSelectedWaivers([]);
          setSelectedGcId('');
          setSignatureData('');
          setSignerName('');
          setSignerTitle('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              {waiverStep === 'select' ? 'Attach Waiver to Invoice' : 'Preview & Sign Waiver'}
            </DialogTitle>
            <DialogDescription>
              {waiverStep === 'select' 
                ? 'Select the waiver type(s) to attach to this invoice'
                : 'Review the waiver and add your signature'}
            </DialogDescription>
          </DialogHeader>

          {waiverStep === 'select' && (
            <div className="space-y-4 py-4">
              {/* GC Selection */}
              <div className="space-y-2">
                <Label>Select GC / Recipient</Label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background"
                    value={selectedGcId}
                    onChange={(e) => setSelectedGcId(e.target.value)}
                  >
                    <option value="">Select a GC...</option>
                    {gcContacts.map(gc => (
                      <option key={gc.id} value={gc.id}>
                        {gc.name} {gc.company ? `(${gc.company})` : ''}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddGCDialog(true)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add GC
                  </Button>
                </div>
              </div>

              {/* Waiver Selection */}
              <WaiverSelection
                selectedWaivers={selectedWaivers}
                onWaiversChange={setSelectedWaivers}
                defaultAmount={invoice.amount_due || 0}
              />
            </div>
          )}

          {waiverStep === 'preview' && selectedWaivers.length > 0 && (
            <div className="py-4">
              <WaiverPreview
                invoice={invoice}
                waiver={selectedWaivers[0]}
                gcName={gcContacts.find(g => g.id === selectedGcId)?.name}
                gcCompany={gcContacts.find(g => g.id === selectedGcId)?.company || undefined}
                contractorName={profile?.company_name || 'Contractor'}
                contractorAddress={profile?.business_address || ''}
                jobName={job?.name || 'Project'}
                jobAddress={job?.address || ''}
                onSignatureChange={setSignatureData}
                onSignerInfoChange={(info) => {
                  setSignerName(info.name);
                  setSignerTitle(info.title);
                }}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            {waiverStep === 'select' ? (
              <>
                <Button variant="outline" onClick={() => setShowWaiverDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setWaiverStep('preview')}
                  disabled={selectedWaivers.length === 0 || !selectedGcId}
                >
                  Preview Waiver
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setWaiverStep('select')}>
                  Back
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      await generateWaivers(
                        invoice.id,
                        selectedGcId,
                        selectedWaivers,
                        {
                          signatureData,
                          signerName,
                          signerTitle,
                        }
                      );
                      toast.success('Waiver(s) attached to invoice');
                      setShowWaiverDialog(false);
                    } catch (error) {
                      // Error already handled in hook
                    }
                  }}
                  disabled={waiverGenerating || !signatureData || !signerName}
                >
                  {waiverGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Paperclip className="mr-2 h-4 w-4" />
                      Attach Waiver
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New GC Dialog */}
      <Dialog open={showAddGCDialog} onOpenChange={setShowAddGCDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add New GC Contact</DialogTitle>
            <DialogDescription>
              Add a new general contractor to your contacts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gcName">Name *</Label>
              <Input
                id="gcName"
                placeholder="Contact name"
                value={newGCData.name}
                onChange={(e) => setNewGCData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gcCompany">Company</Label>
              <Input
                id="gcCompany"
                placeholder="Company name"
                value={newGCData.company}
                onChange={(e) => setNewGCData(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gcEmail">Email</Label>
                <Input
                  id="gcEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={newGCData.email}
                  onChange={(e) => setNewGCData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gcPhone">Phone</Label>
                <Input
                  id="gcPhone"
                  placeholder="(555) 123-4567"
                  value={newGCData.phone}
                  onChange={(e) => setNewGCData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGCDialog(false)} disabled={savingGC}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!newGCData.name.trim()) {
                  toast.error('Name is required');
                  return;
                }
                setSavingGC(true);
                try {
                  const newGC = await addGCContact(newGCData);
                  setSelectedGcId(newGC.id);
                  setShowAddGCDialog(false);
                  setNewGCData({ name: '', company: '', email: '', phone: '', address: '' });
                  toast.success('GC contact added');
                } catch (error: any) {
                  toast.error(error.message || 'Failed to add GC');
                } finally {
                  setSavingGC(false);
                }
              }}
              disabled={savingGC || !newGCData.name.trim()}
            >
              {savingGC ? 'Adding...' : 'Add GC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Payment Dialog */}
      <RequestPaymentDialog
        open={showPaymentRequestDialog}
        onOpenChange={setShowPaymentRequestDialog}
        invoice={{
          id: invoice.id || '',
          invoice_number: invoice.invoice_number,
          amount_due: invoice.amount_due,
          amount_paid: invoice.amount_paid,
        }}
        customer={customer}
        job={job}
      />
    </BlueBackground>
  );
}
