import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Opportunity } from '@/hooks/useOpportunities';

interface WinLossReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: Opportunity | null;
  isWin: boolean;
  onSubmit: (reason: string, details: string) => void;
}

const WIN_REASONS = [
  { value: 'price', label: 'Competitive Pricing' },
  { value: 'quality', label: 'Quality/Expertise' },
  { value: 'timing', label: 'Right Timing' },
  { value: 'relationship', label: 'Strong Relationship' },
  { value: 'scope', label: 'Best Scope Match' },
  { value: 'referral', label: 'Referral/Reputation' },
  { value: 'other', label: 'Other' },
];

const LOSS_REASONS = [
  { value: 'price', label: 'Price Too High' },
  { value: 'timing', label: 'Wrong Timing' },
  { value: 'competition', label: 'Lost to Competitor' },
  { value: 'budget', label: 'Budget Constraints' },
  { value: 'scope', label: 'Scope Mismatch' },
  { value: 'quality', label: 'Quality Concerns' },
  { value: 'no_response', label: 'No Response' },
  { value: 'other', label: 'Other' },
];

export function WinLossReasonDialog({ open, onOpenChange, opportunity, isWin, onSubmit }: WinLossReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, details);
    setReason('');
    setDetails('');
  };

  const reasons = isWin ? WIN_REASONS : LOSS_REASONS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isWin ? 'Why did we win?' : 'Why did we lose?'}
          </DialogTitle>
          <DialogDescription>
            Help us learn by recording why this opportunity was {isWin ? 'won' : 'lost'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Primary Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {reasons.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder={isWin 
                ? "What made this deal successful? Any key factors or learnings..." 
                : "What could we have done differently? Any competitor info or client feedback..."
              }
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </div>

          {opportunity && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{opportunity.title}</p>
              <p className="text-muted-foreground">
                {opportunity.customer_name}
                {opportunity.estimated_value && ` • ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(opportunity.estimated_value)}`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
