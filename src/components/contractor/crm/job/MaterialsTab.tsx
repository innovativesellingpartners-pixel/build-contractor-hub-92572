import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Package, Trash2 } from 'lucide-react';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { format } from 'date-fns';

interface MaterialsTabProps {
  jobId: string;
}

export default function MaterialsTab({ jobId }: MaterialsTabProps) {
  const { materials, isLoading, createMaterial, updateMaterial, deleteMaterial } = useMaterials(jobId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [formData, setFormData] = useState<Material>({
    job_id: jobId,
    description: '',
    quantity_ordered: 0,
    quantity_used: 0,
    cost_per_unit: 0,
    unit_type: '',
    supplier_name: '',
  });

  const handleSubmit = () => {
    if (editingMaterial) {
      updateMaterial({ ...formData, id: editingMaterial.id! });
    } else {
      createMaterial(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      job_id: jobId,
      description: '',
      quantity_ordered: 0,
      quantity_used: 0,
      cost_per_unit: 0,
      unit_type: '',
      supplier_name: '',
    });
    setEditingMaterial(null);
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData(material);
    setIsDialogOpen(true);
  };

  const totalCost = materials?.reduce((sum, m) => sum + (m.total_cost || 0), 0) || 0;

  if (isLoading) return <div className="p-4">Loading materials...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Materials</h3>
          <p className="text-sm text-muted-foreground">
            Total Cost: <span className="font-semibold text-primary">${totalCost.toFixed(2)}</span>
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      <div className="space-y-3">
        {materials && materials.length > 0 ? (
          materials.map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{material.description}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="text-xs">Ordered:</span>
                          <p className="font-medium text-foreground">
                            {material.quantity_ordered} {material.unit_type}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs">Used:</span>
                          <p className="font-medium text-foreground">
                            {material.quantity_used} {material.unit_type}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs">Cost/Unit:</span>
                          <p className="font-medium text-foreground">${material.cost_per_unit}</p>
                        </div>
                        <div>
                          <span className="text-xs">Total:</span>
                          <p className="font-medium text-primary">${material.total_cost?.toFixed(2)}</p>
                        </div>
                      </div>
                      {material.supplier_name && (
                        <p className="text-sm mt-2">Supplier: {material.supplier_name}</p>
                      )}
                      {material.date_used && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Used: {format(new Date(material.date_used), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(material)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMaterial(material.id!)}
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
              No materials yet. Add materials to track costs and usage.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity_ordered">Qty Ordered</Label>
                <Input
                  id="quantity_ordered"
                  type="number"
                  step="0.01"
                  value={formData.quantity_ordered}
                  onChange={(e) => setFormData({ ...formData, quantity_ordered: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_used">Qty Used</Label>
                <Input
                  id="quantity_used"
                  type="number"
                  step="0.01"
                  value={formData.quantity_used}
                  onChange={(e) => setFormData({ ...formData, quantity_used: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_type">Unit</Label>
                <Input
                  id="unit_type"
                  placeholder="sq ft, lbs"
                  value={formData.unit_type}
                  onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_per_unit">Cost Per Unit</Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_name">Supplier Name</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_ordered">Date Ordered</Label>
                <Input
                  id="date_ordered"
                  type="date"
                  value={formData.date_ordered}
                  onChange={(e) => setFormData({ ...formData, date_ordered: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_used">Date Used</Label>
                <Input
                  id="date_used"
                  type="date"
                  value={formData.date_used}
                  onChange={(e) => setFormData({ ...formData, date_used: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                Total Cost: ${((formData.quantity_used || 0) * (formData.cost_per_unit || 0)).toFixed(2)}
              </p>
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
                {editingMaterial ? 'Update' : 'Add'} Material
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
