import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Copy, ExternalLink, Loader2, Link2, Send, Trash2, MessageCircle, CheckCircle2, Eye, Mail, UserPlus, Users, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ct1Logo from '@/assets/ct1-round-logo-new.png';
import { HelpChatbot } from '@/components/help/HelpChatbot';

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
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);

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

  const hasActivePortal = existingTokens && existingTokens.length > 0;

  const createTokenMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (hasActivePortal) throw new Error('This job already has an active customer portal');
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
      toast.success('Customer portal created!');
    },
    onError: () => toast.error('Failed to create customer portal'),
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
      toast.success('Link revoked');
    },
  });

  const getPortalUrl = (token: string) => {
    return `https://myct1.com/portal/${token}`;
  };

  const copyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(getPortalUrl(token));
    setCopiedId(id);
    toast.success('Customer portal link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendViaSms = async (token: string) => {
    if (!customerPhone) {
      toast.error('No customer phone number available. Add a phone number to the customer record first.');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('send-portal-sms', {
        body: {
          to: customerPhone,
          message: `View your project portal here: ${getPortalUrl(token)}`,
        },
      });
      if (error) {
        console.error('send-portal-sms error:', error);
        throw error;
      }
      if (data?.error) {
        console.error('send-portal-sms response error:', data.error);
        toast.error(data.error);
        return;
      }
      toast.success('Customer portal sent via SMS!');
    } catch (err: any) {
      console.error('send-portal-sms catch:', err);
      toast.error(err?.message || 'Failed to send SMS');
    }
  };

  const sendViaEmail = async (token: string) => {
    if (!customerEmail) {
      toast.error('No customer email available. Add an email to the customer record first.');
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('send-portal-email', {
        body: {
          to: customerEmail,
          portalUrl: getPortalUrl(token),
        },
      });
      if (error) throw error;
      toast.success('Customer portal sent via email!');
    } catch {
      toast.error('Failed to send email');
    }
  };

  const contractorLogo = (profile as any)?.logo_url;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-background p-0 overflow-hidden">
          {/* Branded Header */}
          <div className="px-6 pt-6 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {contractorLogo ? (
                  <img src={contractorLogo} alt="Business logo" className="h-10 w-10 rounded-lg object-contain border" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <DialogHeader className="p-0 space-y-0">
                    <DialogTitle className="text-lg font-semibold">Customer Portal</DialogTitle>
                    <DialogDescription className="text-xs">
                      Share a secure link for your customer to view their project
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>
              <img src={ct1Logo} alt="CT1" className="h-8 w-8 opacity-60" />
            </div>
          </div>

          <Separator />

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Active Links */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : existingTokens && existingTokens.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Active Links</p>
                  <Badge variant="secondary" className="text-xs">
                    {existingTokens.length} active
                  </Badge>
                </div>
                {existingTokens.map((t) => (
                  <div key={t.id} className="rounded-xl border bg-card p-4 space-y-3">
                    {/* Link URL - clickable */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Link2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          myct1.com/portal/{t.token.slice(0, 8)}...
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            Created {format(new Date(t.created_at), 'MMM d, yyyy')}
                          </p>
                          {t.last_accessed_at && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Viewed {format(new Date(t.last_accessed_at), 'MMM d')}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 pl-11">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={copiedId === t.id ? "default" : "outline"}
                          className="h-8 text-xs gap-1.5 flex-1"
                          onClick={() => copyLink(t.token, t.id)}
                        >
                          {copiedId === t.id ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copiedId === t.id ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          asChild
                        >
                          <a href={getPortalUrl(t.token)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Preview
                          </a>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                          onClick={() => deactivateMutation.mutate(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 flex-1"
                          onClick={() => sendViaSms(t.token)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send via SMS
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 flex-1"
                          onClick={() => sendViaEmail(t.token)}
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Send via Email
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Link2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No active customer portals</p>
                <p className="text-xs text-muted-foreground">
                  Generate a link to give your customer access to their project portal
                </p>
              </div>
            )}

            {/* Generate Button - only show if no active portal exists */}
            {!hasActivePortal && (
              <Button
                className="w-full h-11 gap-2 font-medium"
                onClick={() => createTokenMutation.mutate()}
                disabled={createTokenMutation.isPending}
              >
                {createTokenMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Generate Customer Portal
              </Button>
            )}
          </div>

          <Separator />

          {/* Footer with support */}
          <div className="px-6 py-3 flex items-center justify-between bg-muted/30">
            <p className="text-[11px] text-muted-foreground">
              Powered by myct1.com
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setChatbotOpen(true)}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Contact Support
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Chatbot */}
      <HelpChatbot
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        onNavigateToArticle={() => {}}
        onNavigateToSupport={() => {}}
      />
    </>
  );
}
