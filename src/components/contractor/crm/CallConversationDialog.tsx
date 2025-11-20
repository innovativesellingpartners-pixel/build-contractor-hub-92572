import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Phone, User } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { CallSession } from '@/hooks/useCallSessions';

type CallConversationDialogProps = {
  call: CallSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CallConversationDialog = ({
  call,
  open,
  onOpenChange,
}: CallConversationDialogProps) => {
  const conversationHistory = Array.isArray(call.conversation_history) 
    ? call.conversation_history 
    : [];

  const copyTranscript = () => {
    const transcript = conversationHistory
      .map((msg: any) => {
        const role = msg.role === 'user' ? 'Caller' : 'AI';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(transcript);
    toast.success('Transcript copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call with{' '}
            <a 
              href={`tel:${call.from_number}`}
              className="text-primary hover:underline cursor-pointer"
            >
              {formatPhoneNumber(call.from_number)}
            </a>
          </DialogTitle>
          <DialogDescription>
            {format(new Date(call.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Call Summary */}
          {call.ai_summary && (
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="font-medium mb-2">Call Summary</div>
              <p className="text-sm text-muted-foreground">{call.ai_summary}</p>
            </div>
          )}

          {/* Outcome & Action */}
          {(call.outcome || call.action_taken) && (
            <div className="grid gap-2">
              {call.outcome && (
                <div className="flex gap-2">
                  <span className="text-sm font-medium min-w-20">Outcome:</span>
                  <span className="text-sm text-muted-foreground">{call.outcome}</span>
                </div>
              )}
              {call.action_taken && (
                <div className="flex gap-2">
                  <span className="text-sm font-medium min-w-20">Action:</span>
                  <span className="text-sm text-muted-foreground">{call.action_taken}</span>
                </div>
              )}
            </div>
          )}

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Conversation Transcript</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyTranscript}
                  className="h-8"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy
                </Button>
              </div>

              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {conversationHistory.map((message: any, index: number) => {
                    const isUser = message.role === 'user';
                    return (
                      <div
                        key={index}
                        className={`flex gap-3 ${isUser ? '' : 'flex-row-reverse'}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isUser ? 'bg-primary/10' : 'bg-secondary/50'
                        }`}>
                          {isUser ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Phone className="h-4 w-4" />
                          )}
                        </div>
                        <div className={`flex-1 space-y-1 ${isUser ? '' : 'items-end'}`}>
                          <div className={`text-xs font-medium ${isUser ? '' : 'text-right'}`}>
                            {isUser ? 'Caller' : 'AI Assistant'}
                          </div>
                          <div className={`rounded-lg p-3 text-sm ${
                            isUser 
                              ? 'bg-primary/10 text-foreground' 
                              : 'bg-secondary/50 text-foreground'
                          }`}>
                            {message.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {conversationHistory.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No conversation transcript available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
