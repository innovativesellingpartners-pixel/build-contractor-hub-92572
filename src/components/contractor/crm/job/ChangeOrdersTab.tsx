import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileEdit, Check, X, Clock, Trash2 } from 'lucide-react';
import { useChangeOrders, ChangeOrder } from '@/hooks/useChangeOrders';
import { format } from 'date-fns';

interface ChangeOrdersTabProps {
  jobId: string;
}

export default function ChangeOrdersTab({ jobId }: ChangeOrdersTabProps) {
  const { changeOrders, isLoading, createChangeOrder, updateChangeOrder, deleteChangeOrder } = useChangeOrders(jobId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChangeOrder, setEditingChangeOrder] = useState<ChangeOrder | null>(null);

  const [formData, setFormData] = useState<ChangeOrder>({
    job_id: jobId,
    description: '',
    reason: '',
    additional_cost: 0,
    status: 'requested',
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      approved: 'default',
      rejected: 'destructive',
      requested: 'secondary',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
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
      status: 'requested',
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

  const totalApprovedCost = changeOrders?.filter(co => co.status === 'approved')
    .reduce((sum, co) => sum + co.additional_cost, 0) || 0;

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
          Request Change Order
        </Button>
      </div>

      <div className="space-y-3">
        {changeOrders && changeOrders.length > 0 ? (
          changeOrders.map((co) => (
            <Card key={co.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(co.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{co.description}</h4>
                        {getStatusBadge(co.status)}
                        <span className="text-lg font-bold text-primary ml-auto">
                          +${co.additional_cost.toFixed(2)}
                        </span>
                      </div>
                      {co.reason && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Reason:</span> {co.reason}
                        </p>
                      )}
                      {co.notes && (
                        <p className="text-sm text-muted-foreground mb-2">{co.notes}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Requested: {format(new Date(co.date_requested!), 'MMM d, yyyy')}</span>
                        {co.date_approved && (
                          <span>Approved: {format(new Date(co.date_approved), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {co.status === 'requested' && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(co)}>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(co)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleEdit(co)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteChangeOrder(co.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No change orders yet. Request a change order when scope changes.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingChangeOrder ? 'Edit Change Order' : 'Request Change Order'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Change</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_cost">Additional Cost *</Label>
              <Input
                id="additional_cost"
                type="number"
                step="0.01"
                value={formData.additional_cost}
                onChange={(e) => setFormData({ ...formData, additional_cost: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                {editingChangeOrder ? 'Update' : 'Request'} Change Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
