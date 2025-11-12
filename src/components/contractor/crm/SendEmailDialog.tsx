import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Opportunity } from '@/hooks/useOpportunities';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { Mail, Loader2 } from 'lucide-react';

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: Opportunity | null;
}

export function SendEmailDialog({ open, onOpenChange, opportunity }: SendEmailDialogProps) {
  const { templates, sendEmail } = useEmailTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSend = async () => {
    if (!opportunity || !opportunity.customer_email) {
      return;
    }

    setSending(true);
    try {
      await sendEmail(
        opportunity.id,
        selectedTemplateId || undefined,
        subject,
        body
      );
      onOpenChange(false);
      // Reset form
      setSelectedTemplateId('');
      setSubject('');
      setBody('');
    } catch (error) {
      // Error handled by hook
    } finally {
      setSending(false);
    }
  };

  // Filter templates by current opportunity stage
  const stageTemplates = templates.filter(t => 
    !t.stage || t.stage === opportunity?.stage
  );

  if (!opportunity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </DialogTitle>
          <DialogDescription>
            Send an email to {opportunity.customer_name} ({opportunity.customer_email || 'No email'})
          </DialogDescription>
        </DialogHeader>

        {!opportunity.customer_email && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            This opportunity doesn't have an email address. Please add one to send emails.
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template">Email Template (Optional)</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template or write custom email..." />
              </SelectTrigger>
              <SelectContent>
                {stageTemplates.length > 0 ? (
                  stageTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No templates available for this stage
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Templates support variables like {'{{customer_name}}'}, {'{{company_name}}'}, {'{{estimated_value}}'}, etc.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              placeholder="Write your email message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
            <p className="font-medium">Preview variables:</p>
            <p className="text-muted-foreground">
              • Customer: {opportunity.customer_name}<br />
              • Project: {opportunity.title}<br />
              • Value: ${opportunity.estimated_value?.toLocaleString() || 'TBD'}<br />
              • Stage: {opportunity.stage}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!opportunity.customer_email || !subject || !body || sending}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
