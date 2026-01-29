import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, MessageSquare, Send, DollarSign, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RequestPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number?: string;
    amount_due: number;
    amount_paid: number;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  job?: {
    name?: string;
  } | null;
}

export function RequestPaymentDialog({
  open,
  onOpenChange,
  invoice,
  customer,
  job,
}: RequestPaymentDialogProps) {
  const [sending, setSending] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(!!customer?.phone);
  const [recipientEmail, setRecipientEmail] = useState(customer?.email || '');
  const [recipientPhone, setRecipientPhone] = useState(customer?.phone || '');
  const [recipientName, setRecipientName] = useState(customer?.name || '');
  const [customMessage, setCustomMessage] = useState('');

  const remainingBalance = Math.max(0, (invoice.amount_due || 0) - (invoice.amount_paid || 0));

  const handleSend = async () => {
    if (sendEmail && !recipientEmail) {
      toast.error('Email address is required when sending by email');
      return;
    }
    if (sendSms && !recipientPhone) {
      toast.error('Phone number is required when sending by SMS');
      return;
    }
    if (!sendEmail && !sendSms) {
      toast.error('Please select at least one delivery method');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-payment-request', {
        body: {
          invoiceId: invoice.id,
          recipientEmail: sendEmail ? recipientEmail : undefined,
          recipientPhone: sendSms ? recipientPhone : undefined,
          recipientName,
          sendEmail,
          sendSms,
          customMessage: customMessage || undefined,
        }
      });

      if (error) throw error;

      const methods: string[] = [];
      if (data.email_sent) methods.push('email');
      if (data.sms_sent) methods.push('SMS');

      if (methods.length > 0) {
        toast.success(`Payment request sent via ${methods.join(' and ')}`);
        onOpenChange(false);
      } else {
        toast.error('Failed to send payment request. Please try again.');
      }
    } catch (error: any) {
      console.error('Error sending payment request:', error);
      toast.error(error.message || 'Failed to send payment request');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Request Remainder Payment
          </DialogTitle>
          <DialogDescription>
            Send a payment request to the customer for the outstanding balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount Summary */}
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount Due</span>
              <span className="text-2xl font-bold text-primary">
                ${remainingBalance.toFixed(2)}
              </span>
            </div>
            {invoice.amount_paid > 0 && (
              <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                <span>Total: ${invoice.amount_due.toFixed(2)}</span>
                <span>Already Paid: ${invoice.amount_paid.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Recipient Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipientName">Recipient Name</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Customer name"
              />
            </div>

            <div>
              <Label htmlFor="recipientEmail">Email Address</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <Label htmlFor="recipientPhone">Phone Number</Label>
              <Input
                id="recipientPhone"
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          {/* Delivery Methods */}
          <div className="space-y-3">
            <Label>Delivery Method</Label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sendEmail"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked === true)}
                />
                <Label htmlFor="sendEmail" className="flex items-center gap-2 cursor-pointer font-normal">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Send Email
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sendSms"
                  checked={sendSms}
                  onCheckedChange={(checked) => setSendSms(checked === true)}
                />
                <Label htmlFor="sendSms" className="flex items-center gap-2 cursor-pointer font-normal">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Send SMS
                </Label>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <Label htmlFor="customMessage">Custom Message (optional)</Label>
            <Textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message to the payment request..."
              className="min-h-[80px]"
            />
          </div>

          {/* Warning for no phone configured */}
          {sendSms && !recipientPhone && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A phone number is required to send SMS.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
