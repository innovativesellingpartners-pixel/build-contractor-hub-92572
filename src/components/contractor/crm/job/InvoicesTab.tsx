import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, FileText, Trash2, ChevronDown, ChevronUp, Download, Printer, FileCheck, Loader2, Send, Mail, AlertCircle } from 'lucide-react';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useInvoiceWaivers, InvoiceWaiver, WaiverSignatureData } from '@/hooks/useInvoiceWaivers';
import { useGCContacts } from '@/hooks/useGCContacts';
import { useContractorProfile } from '@/hooks/useContractorProfile';
import { useJobs } from '@/hooks/useJobs';
import { WaiverSelection, SelectedWaiver, WAIVER_TYPES } from '@/components/contractor/crm/WaiverSelection';
import { WaiverPreview } from '@/components/contractor/crm/WaiverPreview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
interface InvoicesTabProps {
  jobId: string;
  customerId?: string;
}

function parseMoneyInput(value: string): number {
  // Keep it permissive; validation handled elsewhere.
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

export default function InvoicesTab({ jobId, customerId }: InvoicesTabProps) {
  const { invoices, isLoading, createInvoice, updateInvoice, deleteInvoice } = useInvoices(jobId);
  const { isGenerating, isSending, generateWaivers, fetchInvoiceWaivers, downloadWaiverAsHtml, printWaiver, sendInvoiceWithWaivers } = useInvoiceWaivers();
  const { gcContacts } = useGCContacts();
  const { profile } = useContractorProfile();
  const { jobs } = useJobs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [expandedWaivers, setExpandedWaivers] = useState<Record<string, boolean>>({});
  const [invoiceWaivers, setInvoiceWaivers] = useState<Record<string, InvoiceWaiver[]>>({});

  // Waiver generation state
  const [waiverDialogOpen, setWaiverDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedGcId, setSelectedGcId] = useState<string>('');
  const [selectedWaivers, setSelectedWaivers] = useState<SelectedWaiver[]>([]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signerInfo, setSignerInfo] = useState<{ name: string; title: string }>({ name: '', title: '' });

  // Get current job info
  const currentJob = jobs?.find(j => j.id === jobId);

  // Invoice form state with localStorage draft persistence
  const draftKey = `ct1-draft-invoice-${jobId}`;
  const [formData, setFormData] = useState<Invoice>(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) return { ...JSON.parse(saved), job_id: jobId, customer_id: customerId };
    } catch { /* ignore */ }
    return {
      job_id: jobId,
      customer_id: customerId,
      issue_date: new Date().toISOString().split('T')[0],
      amount_due: 0,
      amount_paid: 0,
      status: 'draft',
    };
  });
  const [amountDueInput, setAmountDueInput] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) { const p = JSON.parse(saved); return p.amount_due ? String(p.amount_due) : ''; }
    } catch { /* ignore */ }
    return '';
  });
  const [amountPaidInput, setAmountPaidInput] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) { const p = JSON.parse(saved); return p.amount_paid ? String(p.amount_paid) : ''; }
    } catch { /* ignore */ }
    return '';
  });

  // Auto-save invoice draft
  useEffect(() => {
    if (editingInvoice) return; // Don't draft-save edits
    const hasData = formData.status !== 'draft' || amountDueInput.trim() !== '' || amountPaidInput.trim() !== '';
    if (!hasData) {
      localStorage.removeItem(draftKey);
      return;
    }
    const timer = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify({ ...formData, amount_due: parseFloat(amountDueInput) || 0, amount_paid: parseFloat(amountPaidInput) || 0 })); } catch { /* ignore */ }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, amountDueInput, amountPaidInput, draftKey, editingInvoice]);

  // Estimate waiver data for auto-attaching to invoices
  const [estimateWaiver, setEstimateWaiver] = useState<{
    type: string;
    amount: number;
    billingPeriodEnd?: string;
    retainage?: number;
  } | null>(null);

  // Load estimate waiver data for this job
  useEffect(() => {
    const fetchEstimateWaiver = async () => {
      if (!jobId) return;
      
      const { data, error } = await supabase
        .from('estimates')
        .select('selected_waiver_type, selected_waiver_amount, selected_waiver_billing_period_end, selected_waiver_retainage')
        .eq('job_id', jobId)
        .not('selected_waiver_type', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data && data.selected_waiver_type) {
        setEstimateWaiver({
          type: data.selected_waiver_type,
          amount: data.selected_waiver_amount || 0,
          billingPeriodEnd: data.selected_waiver_billing_period_end,
          retainage: data.selected_waiver_retainage,
        });
      }
    };
    
    fetchEstimateWaiver();
  }, [jobId]);

  // Load waivers for all invoices
  useEffect(() => {
    if (invoices && invoices.length > 0) {
      invoices.forEach(async (invoice) => {
        if (invoice.id) {
          const waivers = await fetchInvoiceWaivers(invoice.id);
          setInvoiceWaivers(prev => ({ ...prev, [invoice.id!]: waivers }));
        }
      });
    }
  }, [invoices]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      paid: 'default',
      partial: 'default',
      sent: 'secondary',
      draft: 'secondary',
      overdue: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const handleSubmit = async () => {
    const amount_due = parseMoneyInput(amountDueInput);
    const amount_paid = amountPaidInput.trim() === '' ? 0 : parseMoneyInput(amountPaidInput);

    if (!Number.isFinite(amount_due) || amountDueInput.trim() === '') {
      toast.error('Amount Due is required');
      return;
    }
    if (amountPaidInput.trim() !== '' && !Number.isFinite(amount_paid)) {
      toast.error('Amount Paid must be a valid number');
      return;
    }

    const payload: Invoice = {
      ...formData,
      amount_due,
      amount_paid: Number.isFinite(amount_paid) ? amount_paid : 0,
    };

    try {
      if (editingInvoice) {
        await updateInvoice({ ...payload, id: editingInvoice.id! });
      } else {
        const newInvoice = await createInvoice(payload);
        // Expand the newly created invoice to show it
        if (newInvoice?.id) {
          setExpandedWaivers(prev => ({ ...prev, [newInvoice.id!]: true }));
        }
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      job_id: jobId,
      customer_id: customerId,
      issue_date: new Date().toISOString().split('T')[0],
      amount_due: 0,
      amount_paid: 0,
      status: 'draft',
    });
    setAmountDueInput('');
    setAmountPaidInput('');
    setEditingInvoice(null);
    localStorage.removeItem(draftKey);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData(invoice);
    setAmountDueInput(invoice.amount_due != null ? String(invoice.amount_due) : '');
    setAmountPaidInput(invoice.amount_paid != null && invoice.amount_paid !== 0 ? String(invoice.amount_paid) : '');
    setIsDialogOpen(true);
  };

  const handleOpenWaiverDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSelectedGcId(gcContacts[0]?.id || '');
    
    // Use estimate waiver if available, otherwise auto-select based on invoice status
    const defaultWaivers: SelectedWaiver[] = [];
    
    if (estimateWaiver) {
      // Pre-populate from estimate waiver configuration
      defaultWaivers.push({
        type: estimateWaiver.type as SelectedWaiver['type'],
        amount: estimateWaiver.amount || invoice.amount_due,
        billingPeriodEnd: estimateWaiver.billingPeriodEnd || new Date().toISOString().split('T')[0],
        retainage: estimateWaiver.retainage || 0,
      });
    } else if (invoice.status === 'paid') {
      // For paid invoices, suggest unconditional waiver
      defaultWaivers.push({
        type: 'unconditional_progress',
        amount: invoice.amount_paid || invoice.amount_due,
        billingPeriodEnd: new Date().toISOString().split('T')[0],
        retainage: 0,
      });
    } else if (invoice.status === 'partial') {
      // For partial payment, suggest conditional for remaining
      defaultWaivers.push({
        type: 'conditional_progress',
        amount: invoice.amount_due - invoice.amount_paid,
        billingPeriodEnd: new Date().toISOString().split('T')[0],
        retainage: 0,
      });
    } else {
      // For sent/draft, suggest conditional waiver
      defaultWaivers.push({
        type: 'conditional_progress',
        amount: invoice.amount_due,
        billingPeriodEnd: new Date().toISOString().split('T')[0],
        retainage: 0,
      });
    }
    
    setSelectedWaivers(defaultWaivers);
    setWaiverDialogOpen(true);
  };

  const handleGenerateWaivers = async () => {
    if (!selectedInvoice?.id || !selectedGcId || selectedWaivers.length === 0) {
      toast.error('Please select a GC and at least one waiver type');
      return;
    }

    try {
      const signatureInfo: WaiverSignatureData = {
        signatureData: signatureData || undefined,
        signerName: signerInfo.name || undefined,
        signerTitle: signerInfo.title || undefined,
      };

      const generated = await generateWaivers(selectedInvoice.id, selectedGcId, selectedWaivers, signatureInfo);
      
      // Update local state with new waivers
      setInvoiceWaivers(prev => ({
        ...prev,
        [selectedInvoice.id!]: [...(prev[selectedInvoice.id!] || []), ...generated],
      }));
      
      toast.success(`Generated ${generated.length} waiver(s) successfully`);
      setWaiverDialogOpen(false);
      setSelectedWaivers([]);
      setSignatureData(null);
      setSignerInfo({ name: '', title: '' });
      
      // Auto-expand waivers for this invoice
      setExpandedWaivers(prev => ({ ...prev, [selectedInvoice.id!]: true }));
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleSendInvoice = async (invoice: Invoice, includeWaivers: boolean, mode: 'combined' | 'separate' = 'combined') => {
    const waivers = invoiceWaivers[invoice.id!] || [];
    const gc = waivers.length > 0 && waivers[0].gc_id 
      ? gcContacts.find(g => g.id === waivers[0].gc_id)
      : null;
    
    const email = gc?.email;
    if (!email) {
      toast.error('No email address found. Please add an email to the contact.');
      return;
    }

    try {
      await sendInvoiceWithWaivers(invoice.id!, email, gc?.name, includeWaivers, mode);
    } catch (error) {
      // Error handled in hook
    }
  };

  const toggleWaiverExpand = (invoiceId: string) => {
    setExpandedWaivers(prev => ({ ...prev, [invoiceId]: !prev[invoiceId] }));
  };

  const getWaiverTypeLabel = (type: string) => {
    const waiver = WAIVER_TYPES.find(w => w.id === type);
    return waiver?.label.split(' on ')[0] || type;
  };

  const totalDue = invoices?.reduce((sum, inv) => sum + inv.amount_due, 0) || 0;
  const totalPaid = invoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;
  const balance = totalDue - totalPaid;

  if (isLoading) return <div className="p-4">Loading invoices...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Invoices</h3>
          <div className="text-sm text-muted-foreground space-x-4">
            <span>Total Due: <span className="font-semibold">${totalDue.toFixed(2)}</span></span>
            <span>Paid: <span className="font-semibold text-green-600">${totalPaid.toFixed(2)}</span></span>
            <span>Balance: <span className="font-semibold text-primary">${balance.toFixed(2)}</span></span>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="space-y-3">
        {invoices && invoices.length > 0 ? (
          invoices.map((invoice) => {
            const waivers = invoiceWaivers[invoice.id!] || [];
            const isExpanded = expandedWaivers[invoice.id!];
            
            return (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">
                            {invoice.invoice_number || `Invoice #${invoice.id?.slice(0, 8)}`}
                          </h4>
                          {getStatusBadge(invoice.status)}
                          {waivers.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                              <FileCheck className="h-3 w-3 mr-1" />
                              {waivers.length} Waiver{waivers.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-xs text-muted-foreground">Issue Date:</span>
                            <p className="font-medium">{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</p>
                          </div>
                          {invoice.due_date && (
                            <div>
                              <span className="text-xs text-muted-foreground">Due Date:</span>
                              <p className="font-medium">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs text-muted-foreground">Amount Due:</span>
                            <p className="font-medium text-primary">${invoice.amount_due.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Amount Paid:</span>
                            <p className="font-medium text-green-600">${invoice.amount_paid.toFixed(2)}</p>
                          </div>
                        </div>
                        {invoice.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{invoice.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button 
                        variant="default" 
                        onClick={() => handleOpenWaiverDialog(invoice)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <FileCheck className="h-4 w-4 mr-2" />
                        Attach Waiver
                      </Button>
                      {/* Send Invoice Dropdown */}
                      {(invoiceWaivers[invoice.id!] || []).length > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isSending}>
                              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                              Send
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSendInvoice(invoice, false)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Invoice Only
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendInvoice(invoice, true, 'combined')}>
                              <FileText className="h-4 w-4 mr-2" />
                              Invoice + Waivers (Combined)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendInvoice(invoice, true, 'separate')}>
                              <FileCheck className="h-4 w-4 mr-2" />
                              Invoice + Waivers (Separate)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSendInvoice(invoice, false)}
                          disabled={isSending}
                        >
                          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                          Send
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(invoice)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteInvoice(invoice.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Waivers Section */}
                  {waivers.length > 0 && (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleWaiverExpand(invoice.id!)}>
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 mt-3 pt-3 border-t w-full text-left text-sm text-muted-foreground hover:text-foreground">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <span>{waivers.length} Lien Waiver{waivers.length > 1 ? 's' : ''}</span>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 space-y-2">
                          {waivers.map((waiver) => (
                            <div 
                              key={waiver.id} 
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{getWaiverTypeLabel(waiver.waiver_type)}</p>
                                <p className="text-xs text-muted-foreground">
                                  Amount: ${waiver.amount.toFixed(2)}
                                  {waiver.billing_period_end && ` • Through: ${format(new Date(waiver.billing_period_end), 'MMM d, yyyy')}`}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadWaiverAsHtml(waiver)}
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => printWaiver(waiver)}
                                  title="Print"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No invoices yet. Create an invoice to bill for this job.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date *</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount_due">Amount Due *</Label>
                <Input
                  id="amount_due"
                  type="text"
                  inputMode="decimal"
                  placeholder=""
                  value={amountDueInput}
                  onChange={(e) => setAmountDueInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount_paid">Amount Paid</Label>
                <Input
                  id="amount_paid"
                  type="text"
                  inputMode="decimal"
                  placeholder=""
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="partial">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                Balance Due: <span className="font-bold text-primary">
                  ${((formData.amount_due || 0) - (formData.amount_paid || 0)).toFixed(2)}
                </span>
              </p>
            </div>

            {/* Show estimate waiver notice */}
            {estimateWaiver && !editingInvoice && (
              <Alert className="border-emerald-200 bg-emerald-50">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  <span className="font-medium">Lien Waiver from Estimate</span>
                  <p className="text-sm mt-1">
                    A {estimateWaiver.type?.replace(/_/g, ' ')} waiver for ${estimateWaiver.amount?.toFixed(2) || '0.00'} was configured on the estimate. 
                    After creating this invoice, use "Attach Waiver" to include it.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingInvoice ? 'Update' : 'Create'} Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Waivers Dialog with Preview */}
      <Dialog open={waiverDialogOpen} onOpenChange={setWaiverDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Attach Lien Waiver</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {/* Left: Selection */}
            <div className="space-y-4">
              {selectedInvoice && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">
                    {selectedInvoice.invoice_number || `Invoice #${selectedInvoice.id?.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Amount: ${selectedInvoice.amount_due.toFixed(2)} • 
                    Paid: ${selectedInvoice.amount_paid.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Send to Requiring Party *</Label>
                {gcContacts.length > 0 ? (
                  <Select value={selectedGcId} onValueChange={setSelectedGcId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {gcContacts.map((gc) => (
                        <SelectItem key={gc.id} value={gc.id}>
                          {gc.name} {gc.company ? `(${gc.company})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    No contacts found. Add a contact in the More section first.
                  </p>
                )}
              </div>

              <WaiverSelection
                selectedWaivers={selectedWaivers}
                onWaiversChange={setSelectedWaivers}
                defaultAmount={selectedInvoice?.amount_due || 0}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setWaiverDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateWaivers}
                  disabled={isGenerating || !selectedGcId || selectedWaivers.length === 0}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate {selectedWaivers.length} Waiver{selectedWaivers.length > 1 ? 's' : ''}</>
                  )}
                </Button>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="hidden lg:block">
              <WaiverPreview
                invoice={selectedInvoice}
                waiver={selectedWaivers[0] || null}
                gcName={gcContacts.find(g => g.id === selectedGcId)?.name}
                gcCompany={gcContacts.find(g => g.id === selectedGcId)?.company || undefined}
                contractorName={profile?.company_name || 'Contractor'}
                contractorAddress={profile?.business_address || ''}
                jobName={currentJob?.name || 'Project'}
                jobAddress={currentJob?.address || ''}
                onSignatureChange={setSignatureData}
                onSignerInfoChange={setSignerInfo}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
