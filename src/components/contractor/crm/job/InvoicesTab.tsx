import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, FileText, Trash2, ChevronDown, ChevronUp, Download, Printer, FileCheck, Loader2 } from 'lucide-react';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useInvoiceWaivers, InvoiceWaiver } from '@/hooks/useInvoiceWaivers';
import { useGCContacts } from '@/hooks/useGCContacts';
import { WaiverSelection, SelectedWaiver, WAIVER_TYPES } from '@/components/contractor/crm/WaiverSelection';
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
  const { isGenerating, generateWaivers, fetchInvoiceWaivers, downloadWaiverAsHtml, printWaiver } = useInvoiceWaivers();
  const { gcContacts } = useGCContacts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [expandedWaivers, setExpandedWaivers] = useState<Record<string, boolean>>({});
  const [invoiceWaivers, setInvoiceWaivers] = useState<Record<string, InvoiceWaiver[]>>({});

  // Waiver generation state
  const [waiverDialogOpen, setWaiverDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedGcId, setSelectedGcId] = useState<string>('');
  const [selectedWaivers, setSelectedWaivers] = useState<SelectedWaiver[]>([]);

  // Invoice form state (keep numeric inputs free-form; do NOT auto-populate 0s)
  const [formData, setFormData] = useState<Invoice>({
    job_id: jobId,
    customer_id: customerId,
    issue_date: new Date().toISOString().split('T')[0],
    amount_due: 0,
    amount_paid: 0,
    status: 'draft',
  });
  const [amountDueInput, setAmountDueInput] = useState<string>('');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');

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

  const handleSubmit = () => {
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

    if (editingInvoice) {
      updateInvoice({ ...payload, id: editingInvoice.id! });
    } else {
      createInvoice(payload);
    }
    setIsDialogOpen(false);
    resetForm();
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
    
    // Auto-select appropriate waiver type based on invoice status
    const defaultWaivers: SelectedWaiver[] = [];
    if (invoice.status === 'paid') {
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
      const generated = await generateWaivers(selectedInvoice.id, selectedGcId, selectedWaivers);
      
      // Update local state with new waivers
      setInvoiceWaivers(prev => ({
        ...prev,
        [selectedInvoice.id!]: [...(prev[selectedInvoice.id!] || []), ...generated],
      }));
      
      toast.success(`Generated ${generated.length} waiver(s) successfully`);
      setWaiverDialogOpen(false);
      setSelectedWaivers([]);
      
      // Auto-expand waivers for this invoice
      setExpandedWaivers(prev => ({ ...prev, [selectedInvoice.id!]: true }));
    } catch (error) {
      // Error already handled in hook
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

      {/* Generate Waivers Dialog */}
      <Dialog open={waiverDialogOpen} onOpenChange={setWaiverDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Lien Waivers</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
