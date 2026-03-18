import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Check, X, Clock, Trash2, Send, FileEdit, History, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { useChangeOrders, ChangeOrder, ChangeOrderStatus } from '@/hooks/useChangeOrders';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { VoiceInputField } from '@/components/ui/voice-input-field';
import { VoiceTextareaField } from '@/components/ui/voice-textarea-field';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChangeOrdersTabProps {
  jobId: string;
}

export default function ChangeOrdersTab({ jobId }: ChangeOrdersTabProps) {
  const { changeOrders, changeOrderHistory, isLoading, createChangeOrder, updateChangeOrder, deleteChangeOrder, sendChangeOrder, isSending } = useChangeOrders(jobId);
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChangeOrder, setEditingChangeOrder] = useState<ChangeOrder | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState<string | null>(null);

  // Fetch contractor profile for sending
  const { data: profile } = useQuery({
    queryKey: ['profile-for-co', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('company_name, contact_name, business_email')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState<ChangeOrder>({
    job_id: jobId,
    description: '',
    reason: '',
    additional_cost: 0,
    status: 'draft',
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { variant: 'secondary', label: 'Draft', icon: FileEdit },
      requested: { variant: 'secondary', label: 'Requested', icon: Clock },
      pending_approval: { variant: 'warning', label: 'Pending Approval', icon: Clock },
      sent: { variant: 'info', label: 'Sent', icon: Send },
      viewed: { variant: 'info', label: 'Viewed', icon: Eye },
      signed: { variant: 'success', label: 'Signed', icon: Check },
      approved: { variant: 'success', label: 'Approved', icon: Check },
      rejected: { variant: 'destructive', label: 'Rejected', icon: X },
      revision_requested: { variant: 'warning', label: 'Revision Requested', icon: AlertCircle },
    };
    const c = config[status] || config.draft;
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {c.label}
      </Badge>
    );
  };

  const handleSubmit = () => {
    if (editingChangeOrder) {
      updateChangeOrder({ ...formData, id: editingChangeOrder.id! });
    } else {
      createChangeOrder(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      job_id: jobId,
      description: '',
      reason: '',
      additional_cost: 0,
      status: 'draft',
    });
    setEditingChangeOrder(null);
  };

  const handleEdit = (changeOrder: ChangeOrder) => {
    setEditingChangeOrder(changeOrder);
    setFormData(changeOrder);
    setIsDialogOpen(true);
  };

  const handleApprove = (changeOrder: ChangeOrder) => {
    updateChangeOrder({
      ...changeOrder,
      id: changeOrder.id!,
      status: 'approved',
    });
  };

  const handleReject = (changeOrder: ChangeOrder) => {
    updateChangeOrder({
      ...changeOrder,
      id: changeOrder.id!,
      status: 'rejected',
    });
  };

  const handleSendForApproval = (changeOrder: ChangeOrder) => {
    if (!changeOrder.client_email) {
      // Try to send anyway - edge function will pull from job/customer
    }
    sendChangeOrder({
      changeOrderId: changeOrder.id!,
      contractorName: profile?.contact_name || profile?.company_name || '',
      contractorEmail: profile?.business_email || user?.email || '',
    });
  };

  const canSendForApproval = (status: string) => {
    return ['draft', 'requested', 'revision_requested'].includes(status);
  };

  const totalApprovedCost = changeOrders?.filter(co => co.status === 'approved')
    .reduce((sum, co) => sum + co.additional_cost, 0) || 0;

  const getHistoryForOrder = (coId: string) => {
    return changeOrderHistory?.filter(h => h.change_order_id === coId) || [];
  };

  if (isLoading) return <div className="p-4">Loading change orders...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Change Orders</h3>
          <p className="text-sm text-muted-foreground">
            Approved Additional Cost: <span className="font-semibold text-primary">${totalApprovedCost.toFixed(2)}</span>
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Change Order
        </Button>
      </div>

      <div className="space-y-3">
        {changeOrders && changeOrders.length > 0 ? (
          changeOrders.map((co) => {
            const history = getHistoryForOrder(co.id!);
            return (
              <Card key={co.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-medium truncate">{co.description}</h4>
                        {getStatusBadge(co.status)}
                        <span className="text-lg font-bold text-primary ml-auto whitespace-nowrap">
                          +${co.additional_cost.toFixed(2)}
                        </span>
                      </div>
                      {co.change_order_number && (
                        <p className="text-xs text-muted-foreground mb-1">#{co.change_order_number}</p>
                      )}
                      {co.reason && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Reason:</span> {co.reason}
                        </p>
                      )}
                      {co.revision_notes && co.status === 'revision_requested' && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mb-2">
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                            <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                            Revision Requested by Customer
                          </p>
                          <p className="text-sm text-muted-foreground">{co.revision_notes}</p>
                        </div>
                      )}
                      {co.notes && (
                        <p className="text-sm text-muted-foreground mb-2">{co.notes}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Created: {format(new Date(co.date_requested || co.created_at!), 'MMM d, yyyy')}</span>
                        {co.sent_at && <span>Sent: {format(new Date(co.sent_at), 'MMM d, yyyy')}</span>}
                        {co.viewed_at && <span>Viewed: {format(new Date(co.viewed_at), 'MMM d, yyyy')}</span>}
                        {co.date_approved && <span>Approved: {format(new Date(co.date_approved), 'MMM d, yyyy')}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {canSendForApproval(co.status) && (
                        <Button
                          size="sm"
                          onClick={() => handleSendForApproval(co)}
                          disabled={isSending}
                          className="gap-1"
                        >
                          {isSending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          Send for Approval
                        </Button>
                      )}
                      {co.status === 'requested' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleApprove(co)} className="gap-1">
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(co)} className="gap-1">
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(co)}>
                          <FileEdit className="h-3.5 w-3.5" />
                        </Button>
                        {history.length > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(co.id!)}>
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => deleteChangeOrder(co.id!)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No change orders yet. Create a change order when scope changes.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingChangeOrder ? 'Edit Change Order' : 'New Change Order'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <VoiceInputField
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                onVoiceInput={(text) => setFormData({ ...formData, description: text })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Change</Label>
              <VoiceTextareaField
                id="reason"
                value={formData.reason || ''}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                onVoiceInput={(text) => setFormData({ ...formData, reason: text })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_cost">Additional Cost *</Label>
              <Input
                id="additional_cost"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={formData.additional_cost === 0 ? '' : formData.additional_cost}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                    setFormData({ ...formData, additional_cost: value === '' ? 0 : parseFloat(value) || 0 });
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  value={formData.client_name || ''}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_email">Client Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email || ''}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  placeholder="customer@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <VoiceTextareaField
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                onVoiceInput={(text) => setFormData({ ...formData, notes: text })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingChangeOrder ? 'Update' : 'Create'} Change Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyDialogOpen} onOpenChange={() => setHistoryDialogOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Change Order History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {historyDialogOpen && getHistoryForOrder(historyDialogOpen).map((entry) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <div className="w-1.5 rounded-full bg-primary/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{entry.action}</p>
                  {entry.performed_by && (
                    <p className="text-xs text-muted-foreground">by {entry.performed_by}</p>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>
                  )}
                  {entry.from_status && entry.to_status && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.from_status} → {entry.to_status}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            {historyDialogOpen && getHistoryForOrder(historyDialogOpen).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No history recorded yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
