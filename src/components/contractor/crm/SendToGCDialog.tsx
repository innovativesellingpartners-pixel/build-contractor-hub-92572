import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, FileText, UserPlus, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Estimate } from '@/hooks/useEstimates';
import { useGCContacts } from '@/hooks/useGCContacts';
import { useInvoiceWaivers } from '@/hooks/useInvoiceWaivers';
import { WaiverSelection, SelectedWaiver } from './WaiverSelection';
import { cn } from '@/lib/utils';

interface SendToGCDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: Estimate;
  onSuccess?: (invoiceId: string) => void;
}

export function SendToGCDialog({ open, onOpenChange, estimate, onSuccess }: SendToGCDialogProps) {
  const { gcContacts, addGCContact } = useGCContacts();
  const { generateWaivers, isGenerating: isGeneratingWaivers } = useInvoiceWaivers();
  const [step, setStep] = useState<'select-gc' | 'confirm'>('select-gc');
  const [selectedGCId, setSelectedGCId] = useState<string>('');
  const [gcEmail, setGCEmail] = useState('');
  const [gcName, setGCName] = useState('');
  const [gcCompany, setGCCompany] = useState('');
  const [sendViaEmail, setSendViaEmail] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gcSearchOpen, setGcSearchOpen] = useState(false);
  const [selectedWaivers, setSelectedWaivers] = useState<SelectedWaiver[]>([]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('select-gc');
      setSelectedGCId('');
      setGCEmail('');
      setGCName('');
      setGCCompany('');
      setSendViaEmail(true);
      setSelectedWaivers([]);
    }
  }, [open]);

  // Update email/name when GC is selected
  useEffect(() => {
    if (selectedGCId && selectedGCId !== 'new') {
      const gc = gcContacts?.find(c => c.id === selectedGCId);
      if (gc) {
        setGCEmail(gc.email || '');
        setGCName(gc.name || '');
        setGCCompany(gc.company || '');
      }
    }
  }, [selectedGCId, gcContacts]);

  const getSelectedGCLabel = () => {
    if (!selectedGCId) return 'Search GC contacts...';
    if (selectedGCId === 'new') return 'Add New GC';
    const gc = gcContacts?.find(c => c.id === selectedGCId);
    if (gc) {
      return `${gc.name}${gc.company ? ` - ${gc.company}` : ''}`;
    }
    return 'Search GC contacts...';
  };

  const handleSelectGC = () => {
    if (!selectedGCId) {
      toast.error('Please select a GC or enter details for a new one');
      return;
    }
    
    if (selectedGCId === 'new' && !gcEmail) {
      toast.error('Email is required for new GC');
      return;
    }
    
    setStep('confirm');
  };

  const handleGenerateInvoice = async () => {
    setIsGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let jobId = estimate.job_id;
      let customerId = estimate.customer_id;
      let gcContactId = selectedGCId !== 'new' ? selectedGCId : null;

      // Step 1: Create customer if needed
      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            user_id: user.id,
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

      // Step 2: Create job if needed
      if (!jobId) {
        const { data, error } = await supabase.functions.invoke('convert-estimate-to-job', {
          body: { estimateId: estimate.id }
        });
        if (error) throw error;
        jobId = data.jobId;
      }

      // Step 3: Create new GC contact if entering manually
      if (selectedGCId === 'new' && gcEmail) {
        try {
          const newGC = await addGCContact({
            name: gcName || 'GC',
            email: gcEmail,
            company: gcCompany || undefined,
          });
          gcContactId = newGC.id;
        } catch (gcError: any) {
          throw new Error(`Failed to create GC contact: ${gcError.message}`);
        }
      }

      // Step 4: Create invoice
      const lineItems = estimate.line_items as any[] || [];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          user_id: user.id,
          job_id: jobId,
          customer_id: gcContactId || customerId,
          amount_due: estimate.grand_total || estimate.total_amount || 0,
          amount_paid: 0,
          balance_due: estimate.grand_total || estimate.total_amount || 0,
          line_items: lineItems,
          status: sendViaEmail ? 'sent' : 'draft',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          notes: `Invoice for estimate: ${estimate.title}${gcName ? ` | GC: ${gcName}` : ''}`,
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Step 5: Generate waivers if selected
      if (selectedWaivers.length > 0 && gcContactId) {
        try {
          await generateWaivers(invoice.id, gcContactId, selectedWaivers);
          console.log(`Generated ${selectedWaivers.length} waivers for invoice ${invoice.id}`);
        } catch (waiverError: any) {
          console.warn('Invoice created but waiver generation failed:', waiverError);
        }
      }

      // Step 6: Send email if requested
      if (sendViaEmail && gcEmail) {
        const { error: emailError } = await supabase.functions.invoke('send-invoice-email', {
          body: {
            invoiceId: invoice.id,
            recipientEmail: gcEmail,
            recipientName: gcName,
          }
        });

        if (emailError) {
          console.warn('Invoice created but email failed:', emailError);
          toast.success(`Invoice ${invoice.invoice_number} created${selectedWaivers.length > 0 ? ` with ${selectedWaivers.length} waiver(s)` : ''}. Email may have failed to send.`);
        } else {
          toast.success(`Invoice ${invoice.invoice_number}${selectedWaivers.length > 0 ? ` with ${selectedWaivers.length} waiver(s)` : ''} sent to ${gcEmail}`);
        }
      } else {
        toast.success(`Invoice ${invoice.invoice_number} created${selectedWaivers.length > 0 ? ` with ${selectedWaivers.length} waiver(s)` : ''}`);
      }

      onOpenChange(false);
      onSuccess?.(invoice.id);
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      toast.error(`Failed to generate invoice: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        {step === 'select-gc' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Send Estimate as Invoice to GC
              </DialogTitle>
              <DialogDescription>
                Select a General Contractor and optional lien waivers
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select GC</Label>
                <Popover open={gcSearchOpen} onOpenChange={setGcSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={gcSearchOpen}
                      className="w-full justify-between"
                    >
                      {getSelectedGCLabel()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-popover" align="start">
                    <Command>
                      <CommandInput placeholder="Search GC contacts..." />
                      <CommandList>
                        <CommandEmpty>No GC contacts found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="new"
                            onSelect={() => {
                              setSelectedGCId('new');
                              setGCEmail('');
                              setGCName('');
                              setGCCompany('');
                              setGcSearchOpen(false);
                            }}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add New GC
                            <Check className={cn("ml-auto h-4 w-4", selectedGCId === 'new' ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                          {gcContacts?.map((gc) => (
                            <CommandItem
                              key={gc.id}
                              value={`${gc.name} ${gc.company || ''} ${gc.email || ''}`}
                              onSelect={() => {
                                setSelectedGCId(gc.id);
                                setGcSearchOpen(false);
                              }}
                            >
                              {gc.name}{gc.company ? ` - ${gc.company}` : ''} {gc.email && `(${gc.email})`}
                              <Check className={cn("ml-auto h-4 w-4", selectedGCId === gc.id ? "opacity-100" : "opacity-0")} />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedGCId === 'new' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gcName">GC Contact Name *</Label>
                    <Input
                      id="gcName"
                      placeholder="Contact person name"
                      value={gcName}
                      onChange={(e) => setGCName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gcCompany">Company Name</Label>
                    <Input
                      id="gcCompany"
                      placeholder="Company name (optional)"
                      value={gcCompany}
                      onChange={(e) => setGCCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gcEmail">GC Email *</Label>
                    <Input
                      id="gcEmail"
                      type="email"
                      placeholder="gc@example.com"
                      value={gcEmail}
                      onChange={(e) => setGCEmail(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Waiver Selection */}
              <div className="pt-4 border-t">
                <WaiverSelection
                  selectedWaivers={selectedWaivers}
                  onWaiversChange={setSelectedWaivers}
                  defaultAmount={estimate.grand_total || estimate.total_amount || 0}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSelectGC} disabled={!selectedGCId}>
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Estimate as Invoice to GC
              </DialogTitle>
              <DialogDescription>
                Confirm invoice details before sending
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="confirmEmail">Recipient Email</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  value={gcEmail}
                  onChange={(e) => setGCEmail(e.target.value)}
                />
              </div>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Invoice Summary</p>
                <p className="text-sm text-muted-foreground">
                  Estimate: {estimate.estimate_number || estimate.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: ${(estimate.grand_total || estimate.total_amount || 0).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendViaEmail"
                  checked={sendViaEmail}
                  onCheckedChange={(checked) => setSendViaEmail(checked === true)}
                />
                <Label htmlFor="sendViaEmail" className="text-sm cursor-pointer">
                  Send via email (opens email with invoice attached)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('select-gc')} disabled={isGenerating}>
                Back
              </Button>
              <Button onClick={handleGenerateInvoice} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
