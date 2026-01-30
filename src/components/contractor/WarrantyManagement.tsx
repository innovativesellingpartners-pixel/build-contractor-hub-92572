import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Shield, Pencil, Trash2, Star, Loader2 } from 'lucide-react';
import { useWarranties, ContractorWarranty, CreateWarrantyInput } from '@/hooks/useWarranties';
import { Skeleton } from '@/components/ui/skeleton';

export function WarrantyManagement() {
  const { 
    warranties, 
    isLoading, 
    createWarrantyAsync, 
    updateWarrantyAsync, 
    deleteWarranty,
    isCreating,
    isUpdating 
  } = useWarranties();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<ContractorWarranty | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<CreateWarrantyInput>({
    name: '',
    description: '',
    warranty_text: '',
    duration_years: 1,
    duration_months: 0,
    is_default: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      warranty_text: '',
      duration_years: 1,
      duration_months: 0,
      is_default: false,
    });
    setSelectedWarranty(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (warranty: ContractorWarranty) => {
    setSelectedWarranty(warranty);
    setFormData({
      name: warranty.name,
      description: warranty.description || '',
      warranty_text: warranty.warranty_text,
      duration_years: warranty.duration_years,
      duration_months: warranty.duration_months,
      is_default: warranty.is_default,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.warranty_text.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (selectedWarranty) {
        await updateWarrantyAsync({ 
          id: selectedWarranty.id, 
          ...formData 
        });
      } else {
        await createWarrantyAsync(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving warranty:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (warranty: ContractorWarranty) => {
    setSelectedWarranty(warranty);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedWarranty) {
      deleteWarranty(selectedWarranty.id);
      setDeleteDialogOpen(false);
      setSelectedWarranty(null);
    }
  };

  const formatDuration = (years: number, months: number) => {
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    return parts.join(' ') || 'No duration set';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Warranty Templates
          </h3>
          <p className="text-sm text-muted-foreground">
            Create custom warranty templates to include in your estimates
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Warranty
        </Button>
      </div>

      {warranties && warranties.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {warranties.map((warranty) => (
            <Card key={warranty.id} className={warranty.is_default ? 'border-primary/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {warranty.name}
                      {warranty.is_default && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </CardTitle>
                    {warranty.description && (
                      <CardDescription className="mt-1">
                        {warranty.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(warranty)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(warranty)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {formatDuration(warranty.duration_years, warranty.duration_months)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {warranty.warranty_text}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium mb-1">No Warranties Yet</h4>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create your first warranty template to include in estimates
            </p>
            <Button onClick={openCreateDialog} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Warranty Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedWarranty ? 'Edit Warranty Template' : 'Create Warranty Template'}
            </DialogTitle>
            <DialogDescription>
              Create a custom warranty to include in your estimates and contracts.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="warranty-name">Warranty Name *</Label>
              <Input
                id="warranty-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Workmanship Warranty"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty-description">Description (optional)</Label>
              <Input
                id="warranty-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description for your reference"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration-years">Duration (Years)</Label>
                <Input
                  id="duration-years"
                  type="number"
                  min="0"
                  max="99"
                  value={formData.duration_years}
                  onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration-months">Duration (Months)</Label>
                <Input
                  id="duration-months"
                  type="number"
                  min="0"
                  max="11"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty-text">Warranty Text *</Label>
              <Textarea
                id="warranty-text"
                value={formData.warranty_text}
                onChange={(e) => setFormData({ ...formData, warranty_text: e.target.value })}
                placeholder="Enter the full warranty terms that will appear on estimates..."
                rows={6}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label htmlFor="is-default" className="font-medium">Set as Default</Label>
                <p className="text-xs text-muted-foreground">
                  Auto-select this warranty for new estimates
                </p>
              </div>
              <Switch
                id="is-default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSaving || !formData.name.trim() || !formData.warranty_text.trim()}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedWarranty ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warranty Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedWarranty?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
