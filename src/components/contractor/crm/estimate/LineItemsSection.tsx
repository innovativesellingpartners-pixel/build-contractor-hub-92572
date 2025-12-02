import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Plus, Trash2, Copy, List } from 'lucide-react';
import { EstimateLineItem } from '@/hooks/useEstimates';

const categories = [
  'Materials',
  'Labour',
  'Equipment',
  'Subcontractor',
  'Overhead',
  'Contingency',
  'Fees',
];

interface LineItemsSectionProps {
  lineItems: EstimateLineItem[];
  onChange: (items: EstimateLineItem[]) => void;
}

export default function LineItemsSection({ lineItems, onChange }: LineItemsSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  const addLineItem = () => {
    const newItemNumber = `${lineItems.length + 1}.0`;
    onChange([
      ...lineItems,
      {
        itemNumber: newItemNumber,
        category: 'Materials',
        item_description: '',
        description: '',
        quantity: 1,
        unit_type: '',
        unit: '',
        unit_cost: 0,
        unitPrice: 0,
        line_total: 0,
        totalPrice: 0,
        included: true,
      },
    ]);
  };

  const updateLineItem = (index: number, field: keyof EstimateLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate totals
    if (field === 'quantity' || field === 'unit_cost' || field === 'unitPrice') {
      const qty = updated[index].quantity || 0;
      const price = updated[index].unit_cost || updated[index].unitPrice || 0;
      updated[index].line_total = qty * price;
      updated[index].totalPrice = qty * price;
    }

    // Sync field aliases
    if (field === 'unit_cost') {
      updated[index].unitPrice = value;
    }
    if (field === 'unitPrice') {
      updated[index].unit_cost = value;
    }
    if (field === 'unit_type') {
      updated[index].unit = value;
    }
    if (field === 'unit') {
      updated[index].unit_type = value;
    }
    if (field === 'item_description') {
      updated[index].description = value;
    }
    if (field === 'description') {
      updated[index].item_description = value;
    }

    onChange(updated);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      onChange(lineItems.filter((_, i) => i !== index));
    }
  };

  const duplicateLineItem = (index: number) => {
    const itemToDuplicate = { ...lineItems[index] };
    itemToDuplicate.itemNumber = `${lineItems.length + 1}.0`;
    onChange([...lineItems, itemToDuplicate]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalIncluded = lineItems
    .filter((item) => item.included)
    .reduce((sum, item) => sum + (item.line_total || item.totalPrice || 0), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2 border-border/50">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <List className="h-5 w-5 text-primary" />
              Line Items
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({lineItems.length} items • {formatCurrency(totalIncluded)})
              </span>
            </CardTitle>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground border-b pb-2">
              <div className="col-span-1">Item #</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1">Qty</div>
              <div className="col-span-1">Unit</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Line Items */}
            {lineItems.map((item, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg space-y-3 ${!item.included ? 'opacity-50 bg-muted/30' : ''}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Item Number */}
                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-xs md:hidden">Item #</Label>
                    <Input
                      value={item.itemNumber || `${index + 1}.0`}
                      onChange={(e) => updateLineItem(index, 'itemNumber', e.target.value)}
                      placeholder="1.1"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-xs md:hidden">Description</Label>
                    <Input
                      value={item.item_description || item.description || ''}
                      onChange={(e) => updateLineItem(index, 'item_description', e.target.value)}
                      placeholder="Custom Brass Railing (Fabrication & Install)"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-xs md:hidden">Qty</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity || ''}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Unit */}
                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-xs md:hidden">Unit</Label>
                    <Input
                      value={item.unit_type || item.unit || ''}
                      onChange={(e) => updateLineItem(index, 'unit_type', e.target.value)}
                      placeholder="LF"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs md:hidden">Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_cost || item.unitPrice || ''}
                      onChange={(e) => updateLineItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Total */}
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs md:hidden">Total</Label>
                    <div className="h-9 flex items-center px-3 bg-muted rounded-md font-medium text-sm">
                      {formatCurrency(item.line_total || item.totalPrice || 0)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Checkbox
                        checked={item.included}
                        onCheckedChange={(checked) => updateLineItem(index, 'included', checked)}
                        id={`include-${index}`}
                      />
                      <Label htmlFor={`include-${index}`} className="text-xs cursor-pointer">
                        Include
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateLineItem(index)}
                      className="h-8 w-8 p-0"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Category (collapsible detail) */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Category:</Label>
                    <Select
                      value={item.category || 'Materials'}
                      onValueChange={(value) => updateLineItem(index, 'category', value)}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addLineItem}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
