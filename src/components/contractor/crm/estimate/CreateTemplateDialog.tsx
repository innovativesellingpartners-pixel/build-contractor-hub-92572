import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, X, GripVertical } from 'lucide-react';
import { TRADES, Trade, useEstimateTemplates } from '@/hooks/useEstimateTemplates';
import { EstimateLineItem } from '@/hooks/useEstimates';
import { toast } from 'sonner';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const UNIT_OPTIONS = ['EA', 'SF', 'SY', 'LF', 'HR', 'DAY', 'LS', 'CY', 'GAL', 'TON'];

export function CreateTemplateDialog({ open, onOpenChange, onSuccess }: CreateTemplateDialogProps) {
  const { createTemplate } = useEstimateTemplates();
  
  const [name, setName] = useState('');
  const [trade, setTrade] = useState<Trade | ''>('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'private' | 'account'>('private');
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        itemNumber: `${lineItems.length + 1}`,
        description: '',
        quantity: 1,
        unit: 'EA',
        unitPrice: 0,
        totalPrice: 0,
        included: true,
      },
    ]);
  };

  const handleUpdateLineItem = (index: number, field: keyof EstimateLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].totalPrice = (updated[index].quantity || 0) * (updated[index].unitPrice || 0);
    }
    
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!trade) {
      toast.error('Please select a trade');
      return;
    }
    if (lineItems.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    try {
      await createTemplate.mutateAsync({
        name: name.trim(),
        trade: trade as Trade,
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        visibility,
        line_items: lineItems,
      });
      
      // Reset form
      setName('');
      setTrade('');
      setDescription('');
      setTags([]);
      setLineItems([]);
      setVisibility('private');
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const totalValue = lineItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Build a reusable template with line items for quick estimate creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
                placeholder="e.g., Standard Roof Replacement"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trade">Trade *</Label>
              <Select value={trade} onValueChange={(v) => setTrade(v as Trade)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trade" />
                </SelectTrigger>
                <SelectContent>
                  {TRADES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
              placeholder="Brief description of what this template includes..."
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as 'private' | 'account')}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (Only me)</SelectItem>
                <SelectItem value="account">Shared (All team members)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {lineItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No line items yet. Click "Add Item" to start building your template.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {lineItems.map((item, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
                        
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                          {/* Item Number */}
                          <div className="sm:col-span-1">
                            <Input
                              value={item.itemNumber || ''}
                              onChange={(e) => handleUpdateLineItem(index, 'itemNumber', e.target.value)}
                              placeholder="#"
                              className="text-center text-sm"
                            />
                          </div>
                          
                          {/* Description */}
                          <div className="sm:col-span-5">
                            <Input
                              value={item.description || ''}
                              onChange={(e) => handleUpdateLineItem(index, 'description', e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
                              placeholder="Item description"
                            />
                          </div>
                          
                          {/* Quantity */}
                          <div className="sm:col-span-1">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="Qty"
                              min={0}
                            />
                          </div>
                          
                          {/* Unit */}
                          <div className="sm:col-span-1">
                            <Select value={item.unit || 'EA'} onValueChange={(v) => handleUpdateLineItem(index, 'unit', v)}>
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {UNIT_OPTIONS.map((u) => (
                                  <SelectItem key={u} value={u}>{u}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Unit Price */}
                          <div className="sm:col-span-2">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                value={item.unitPrice || 0}
                                onChange={(e) => handleUpdateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="pl-7"
                                min={0}
                                step={0.01}
                              />
                            </div>
                          </div>
                          
                          {/* Total */}
                          <div className="sm:col-span-2 flex items-center justify-end gap-2">
                            <span className="font-medium text-sm">
                              ${(item.totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleRemoveLineItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Total */}
                <div className="flex justify-end pt-2 pr-2">
                  <div className="text-right">
                    <span className="text-muted-foreground text-sm mr-4">Template Total:</span>
                    <span className="font-bold text-lg">
                      ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createTemplate.isPending}>
            {createTemplate.isPending ? 'Creating...' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
