import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Copy, ExternalLink, Loader2, Link2, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface GeneratePortalLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  customerId?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
}

export default function GeneratePortalLinkDialog({
  open,
  onOpenChange,
  jobId,
  customerId,
  customerPhone,
  customerEmail,
}: GeneratePortalLinkDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sendMethod, setSendMethod] = useState<'copy' | 'sms' | 'email' | null>(null);

  // Fetch existing tokens for this job
  const { data: existingTokens, isLoading } = useQuery({
    queryKey: ['portal-tokens', jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('customer_portal_tokens')
        .select('*')
        .eq('job_id', jobId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: open,
  });

  const createTokenMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('customer_portal_tokens')
        .insert({
          job_id: jobId,
          customer_id: customerId || null,
          contractor_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-tokens', jobId] });
      toast.success('Portal link created!');
    },
    onError: () => toast.error('Failed to create portal link'),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from('customer_portal_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-tokens', jobId] });
      toast.success('Link deactivated');
    },
  });

  const getPortalUrl = (token: string) => {
    return `${window.location.origin}/portal/${token}`;
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getPortalUrl(token));
    toast.success('Portal link copied to clipboard!');
  };

  const sendViaSms = async (token: string) => {
    if (!customerPhone) {
      toast.error('No customer phone number available');
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('send-meeting-sms', {
        body: {
          to: customerPhone,
          message: `View your project portal here: ${getPortalUrl(token)}`,
        },
      });
      if (error) throw error;
      toast.success('Portal link sent via SMS!');
    } catch {
      toast.error('Failed to send SMS');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Customer Portal Link
          </DialogTitle>
          <DialogDescription>
            Generate a secure link for your customer to access their project portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing links */}
          {existingTokens && existingTokens.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Active Links</Label>
              {existingTokens.map((t) => (
                <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{getPortalUrl(t.token)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Created {format(new Date(t.created_at), 'MMM d, yyyy')}
                      {t.last_accessed_at && ` • Last viewed ${format(new Date(t.last_accessed_at), 'MMM d')}`}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => copyLink(t.token)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" asChild>
                    <a href={getPortalUrl(t.token)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  {customerPhone && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => sendViaSms(t.token)}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive text-xs h-7 px-2 shrink-0"
                    onClick={() => deactivateMutation.mutate(t.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Generate new */}
          <Button
            className="w-full"
            onClick={() => createTokenMutation.mutate()}
            disabled={createTokenMutation.isPending}
          >
            {createTokenMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Generate New Portal Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
