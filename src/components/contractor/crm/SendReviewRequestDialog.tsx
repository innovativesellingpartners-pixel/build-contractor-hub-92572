import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star, MessageSquare, Copy, Check } from 'lucide-react';

interface SendReviewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobName: string;
  customerName?: string;
  customerPhone?: string;
}

export default function SendReviewRequestDialog({
  open, onOpenChange, jobId, jobName, customerName, customerPhone,
}: SendReviewRequestDialogProps) {
  const [phone, setPhone] = useState(customerPhone || '');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const reviewUrl = `${window.location.origin}/review/${jobId}`;

  const handleSendSMS = async () => {
    if (!phone) {
      toast.error('Phone number is required');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-meeting-sms', {
        body: {
          meetingId: jobId,
          recipientPhone: phone,
          recipientName: customerName || 'Customer',
          meetingTitle: `Review Request for ${jobName}`,
          meetingDate: new Date().toLocaleDateString(),
          meetingTime: '',
          location: reviewUrl,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Review request sent via SMS!');
        onOpenChange(false);
      } else {
        throw new Error(data?.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send review request');
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    toast.success('Review link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Request Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">{jobName}</p>
            {customerName && <p className="text-xs text-muted-foreground">Customer: {customerName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm">Customer Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Review Link</Label>
            <div className="flex gap-2">
              <Input readOnly value={reviewUrl} className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSendSMS} disabled={sending || !phone} className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send via SMS'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
