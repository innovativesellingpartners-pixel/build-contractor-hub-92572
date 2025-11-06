import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Calendar, DollarSign, Trash2, Eye } from 'lucide-react';
import { useEstimates } from '@/hooks/useEstimates';
import EstimateForm from '../EstimateForm';
import { format } from 'date-fns';

export default function EstimatesSection() {
  const { estimates, isLoading, createEstimate, updateEstimate, deleteEstimate } = useEstimates();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);

  const handleSubmit = (data: any, isDraft: boolean) => {
    if (selectedEstimate) {
      updateEstimate({ id: selectedEstimate.id, ...data });
    } else {
      createEstimate(data);
    }
    setIsFormOpen(false);
    setSelectedEstimate(null);
  };

  const handleEdit = (estimate: any) => {
    setSelectedEstimate(estimate);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setSelectedEstimate(null);
    setIsFormOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <div className="w-full h-full overflow-y-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Estimates</h1>
              <p className="text-muted-foreground">Create and manage project estimates</p>
            </div>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Estimate
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading estimates...</div>
          ) : estimates && estimates.length > 0 ? (
            <div className="grid gap-4">
              {estimates.map((estimate) => (
                <Card key={estimate.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {estimate.title}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                          {estimate.estimate_number && (
                            <span>#{estimate.estimate_number}</span>
                          )}
                          <Badge variant={getStatusColor(estimate.status)}>
                            {estimate.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ${estimate.total_amount?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {estimate.description && (
                        <p className="text-sm text-muted-foreground">{estimate.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        {estimate.created_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(estimate.created_at), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {estimate.valid_until && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Valid until:</span>
                            <span>{format(new Date(estimate.valid_until), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(estimate)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View/Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEstimate(estimate.id!)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  No estimates yet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create your first estimate to get started. Estimates help you provide
                  professional quotes to customers and track project profitability.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              {selectedEstimate ? 'Edit Estimate' : 'Create New Estimate'}
            </DialogTitle>
          </DialogHeader>
          <EstimateForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedEstimate(null);
            }}
            initialData={selectedEstimate}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
