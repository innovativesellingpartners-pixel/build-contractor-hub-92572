import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { Mail, Loader2 } from 'lucide-react';

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'lead' | 'job' | 'customer';
  entity: {
    id: string;
    name?: string;
    customer_name?: string;
    email?: string;
    customer_email?: string;
    company_name?: string;
  } | null;
}

export function SendEmailDialog({ open, onOpenChange, entityType, entity }: SendEmailDialogProps) {
  const { templates, sendEmail } = useEmailTemplates(entityType);
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
    if (!entity) return;

    const recipientEmail = entity.email || entity.customer_email;
    if (!recipientEmail) return;

    setSending(true);
    try {
      await sendEmail(
        entityType,
        entity.id,
        selectedTemplateId || undefined,
        subject,
        body
      );
      onOpenChange(false);
      setSelectedTemplateId('');
      setSubject('');
      setBody('');
    } catch (error) {
      // Error handled by hook
    } finally {
      setSending(false);
    }
  };

  if (!entity) return null;

  const recipientName = entity.name || entity.customer_name || entity.company_name;
  const recipientEmail = entity.email || entity.customer_email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </DialogTitle>
          <DialogDescription>
            Send an email to {recipientName} ({recipientEmail || 'No email'})
          </DialogDescription>
        </DialogHeader>

        {!recipientEmail && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            This {entityType} doesn't have an email address. Please add one to send emails.
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
                {templates.length > 0 ? (
                  templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No templates available for {entityType}s
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Templates support variables like {'{{customer_name}}'}, {'{{company_name}}'}, {'{{value}}'}, etc.
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
            <p className="font-medium">Available variables:</p>
            <p className="text-muted-foreground">
              • {'{{customer_name}}'} - Recipient name<br />
              • {'{{company_name}}'} - Your company name<br />
              • {'{{user_name}}'} - Your name<br />
              • {'{{value}}'} - Project/job value<br />
              • {'{{address}}'} - Address<br />
              • {'{{status}}'} - Current status
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!recipientEmail || !subject || !body || sending}
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
