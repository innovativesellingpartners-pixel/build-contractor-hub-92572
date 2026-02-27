import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Mail, X, Users, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCrewMembers } from '@/hooks/useCrewMembers';
import { toast } from 'sonner';
import { DailyLog } from '@/hooks/useDailyLogs';
import { format } from 'date-fns';

interface SendLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: DailyLog[];
  jobId: string;
  jobName: string;
}

export default function SendLogsDialog({ open, onOpenChange, logs, jobId, jobName }: SendLogsDialogProps) {
  const { crewMembers } = useCrewMembers();
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [sendAll, setSendAll] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Extract emails from crew members' contact_info
  const crewEmails = (crewMembers || [])
    .map((m) => {
      const info = m.contact_info as any;
      const email = info?.email || info?.Email;
      return email ? { name: m.name, email: email as string } : null;
    })
    .filter(Boolean) as { name: string; email: string }[];

  const handleAddEmail = () => {
    const email = newEmail.trim();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (recipientEmails.includes(email)) {
      toast.error('Email already added');
      return;
    }
    setRecipientEmails([...recipientEmails, email]);
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    setRecipientEmails(recipientEmails.filter(e => e !== email));
  };

  const handleAddCrewEmail = (email: string) => {
    if (!recipientEmails.includes(email)) {
      setRecipientEmails([...recipientEmails, email]);
    }
  };

  const handleAddAllCrew = () => {
    const newEmails = crewEmails
      .map(c => c.email)
      .filter(e => !recipientEmails.includes(e));
    setRecipientEmails([...recipientEmails, ...newEmails]);
  };

  const toggleLogSelection = (logId: string) => {
    setSelectedLogIds(prev =>
      prev.includes(logId)
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const handleSend = async () => {
    if (!recipientEmails.length) {
      toast.error('Add at least one recipient email');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-logs', {
        body: {
          jobId,
          logIds: sendAll ? undefined : selectedLogIds,
          recipientEmails,
          jobName,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.message || data.error);

      toast.success(data.message || 'Logs sent successfully!');
      onOpenChange(false);
      setRecipientEmails([]);
      setSelectedLogIds([]);
      setSendAll(true);
    } catch (error: any) {
      console.error('Error sending logs:', error);
      toast.error(error.message || 'Failed to send logs');
    } finally {
      setIsSending(false);
    }
  };

  const logCount = sendAll ? logs.length : selectedLogIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Daily Logs
          </DialogTitle>
          <DialogDescription>
            Email logs for <strong>{jobName}</strong> to crew members or other recipients.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-2">
          <div className="space-y-5 py-2">
            {/* Recipients */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Recipients</Label>
              
              {/* Added emails */}
              {recipientEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {recipientEmails.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1 pr-1">
                      {email}
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add email input */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleAddEmail} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Crew members quick-add */}
              {crewEmails.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" /> Crew Members
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={handleAddAllCrew}
                    >
                      Add All Crew
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {crewEmails.map((crew) => (
                      <Button
                        key={crew.email}
                        variant={recipientEmails.includes(crew.email) ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAddCrewEmail(crew.email)}
                        disabled={recipientEmails.includes(crew.email)}
                      >
                        {crew.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Log Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Logs to Send</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-all"
                  checked={sendAll}
                  onCheckedChange={(checked) => {
                    setSendAll(!!checked);
                    if (checked) setSelectedLogIds([]);
                  }}
                />
                <label htmlFor="send-all" className="text-sm cursor-pointer">
                  Send all logs ({logs.length})
                </label>
              </div>

              {!sendAll && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-md p-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center space-x-2 py-1"
                    >
                      <Checkbox
                        id={`log-${log.id}`}
                        checked={selectedLogIds.includes(log.id)}
                        onCheckedChange={() => toggleLogSelection(log.id)}
                      />
                      <label htmlFor={`log-${log.id}`} className="text-sm cursor-pointer flex-1">
                        <span className="font-medium">{format(new Date(log.log_date), 'MMM d, yyyy')}</span>
                        {log.work_completed && (
                          <span className="text-muted-foreground ml-2 truncate">
                            — {log.work_completed.substring(0, 50)}
                            {log.work_completed.length > 50 ? '...' : ''}
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || recipientEmails.length === 0 || (!sendAll && selectedLogIds.length === 0)}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send {logCount} Log{logCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
