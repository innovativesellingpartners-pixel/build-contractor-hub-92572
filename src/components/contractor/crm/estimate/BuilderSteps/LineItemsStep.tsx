import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Copy, GripVertical, DollarSign } from 'lucide-react';
import { EstimateLineItem } from '@/hooks/useEstimates';
import { EstimateBuilderData } from '../../EstimateBuilder';
import { useEstimateMacros } from '@/hooks/useEstimateMacros';
import MacroSelector from '../MacroSelector';

const CATEGORIES = [
  'Materials',
  'Labor',
  'Labor & Materials',
  'Equipment',
  'Subcontractor',
  'Overhead',
  'Contingency',
  'Fees',
];

const UNITS = ['EA', 'LF', 'SF', 'SY', 'HR', 'DAY', 'LS', 'GAL', 'CY', 'TON'];

interface LineItemsStepProps {
  data: EstimateBuilderData;
  onChange: (updates: Partial<EstimateBuilderData>) => void;
}

export default function LineItemsStep({ data, onChange }: LineItemsStepProps) {
  const { macroGroups } = useEstimateMacros();
  const [focusedRow, setFocusedRow] = useState<number | null>(null);

  const updateLineItem = (index: number, field: keyof EstimateLineItem, value: any) => {
    const updated = [...data.line_items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate totals
    if (field === 'quantity' || field === 'unit_cost' || field === 'unitPrice') {
      const qty = updated[index].quantity || 0;
      const price = field === 'unit_cost' || field === 'unitPrice' 
        ? value 
        : (updated[index].unit_cost || updated[index].unitPrice || 0);
      updated[index].line_total = qty * price;
      updated[index].totalPrice = qty * price;
      updated[index].unit_cost = price;
      updated[index].unitPrice = price;
    }

    // Sync description fields
    if (field === 'description' || field === 'item_description') {
      updated[index].description = value;
      updated[index].item_description = value;
    }

    // Sync unit fields
    if (field === 'unit' || field === 'unit_type') {
      updated[index].unit = value;
      updated[index].unit_type = value;
    }

    onChange({ line_items: updated });
  };

  const addLineItem = () => {
    const newItem: EstimateLineItem = {
      id: `item-${Date.now()}`,
      itemNumber: `${data.line_items.length + 1}`,
      category: 'Materials',
      description: '',
      item_description: '',
      quantity: 1,
      unit: 'EA',
      unit_type: 'EA',
      unitPrice: 0,
      unit_cost: 0,
      totalPrice: 0,
      line_total: 0,
      included: true,
    };
    onChange({ line_items: [...data.line_items, newItem] });
  };

  const removeLineItem = (index: number) => {
    if (data.line_items.length > 1) {
      onChange({ line_items: data.line_items.filter((_, i) => i !== index) });
    }
  };

  const duplicateLineItem = (index: number) => {
    const itemToDuplicate = { 
      ...data.line_items[index], 
      id: `item-${Date.now()}`,
      itemNumber: `${data.line_items.length + 1}` 
    };
    onChange({ line_items: [...data.line_items, itemToDuplicate] });
  };

  const handleMacroSelect = (macroItems: any[]) => {
    const newItems = macroItems.map((macro, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      itemNumber: `${data.line_items.length + idx + 1}`,
      category: 'Materials',
      description: macro.description_template,
      item_description: macro.description_template,
      quantity: macro.default_quantity,
      unit: macro.default_unit,
      unit_type: macro.default_unit,
      unitPrice: macro.default_unit_price,
      unit_cost: macro.default_unit_price,
      totalPrice: macro.default_quantity * macro.default_unit_price,
      line_total: macro.default_quantity * macro.default_unit_price,
      included: true,
    }));
    onChange({ line_items: [...data.line_items, ...newItems] });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const includedTotal = data.line_items
    .filter(item => item.included !== false)
    .reduce((sum, item) => sum + (item.line_total || item.totalPrice || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Line Items
              </CardTitle>
              <CardDescription>
                Add the services, materials, and costs for this estimate
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {macroGroups.length > 0 && (
                <MacroSelector
                  macroGroups={macroGroups}
                  onSelectGroup={handleMacroSelect}
                />
              )}
              <Button onClick={addLineItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Header */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-2 mb-4">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-1">Unit</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-1">Actions</div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            {data.line_items.map((item, index) => (
              <div
                key={item.id || index}
                className={`relative p-4 border rounded-lg transition-all ${
                  focusedRow === index ? 'ring-2 ring-primary border-primary' : ''
                } ${!item.included ? 'opacity-50 bg-muted/30' : 'bg-card'}`}
                onFocus={() => setFocusedRow(index)}
                onBlur={() => setFocusedRow(null)}
              >
                {/* Mobile Layout */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm font-medium">Item {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox
                        checked={item.included !== false}
                        onCheckedChange={(checked) => updateLineItem(index, 'included', checked)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => duplicateLineItem(index)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeLineItem(index)}
                        disabled={data.line_items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Input
                    value={item.description || item.item_description || ''}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                    className="font-medium"
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Qty</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity || ''}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Unit</label>
                      <Select
                        value={item.unit || item.unit_type || 'EA'}
                        onValueChange={(value) => updateLineItem(index, 'unit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_cost || item.unitPrice || ''}
                        onChange={(e) => updateLineItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Select
                      value={item.category || 'Materials'}
                      onValueChange={(value) => updateLineItem(index, 'category', value)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-lg font-semibold">
                      {formatCurrency(item.line_total || item.totalPrice || 0)}
                    </span>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 flex items-center gap-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <Input
                      value={item.itemNumber || `${index + 1}`}
                      onChange={(e) => updateLineItem(index, 'itemNumber', e.target.value)}
                      className="h-9 w-12 text-center text-sm"
                    />
                  </div>
                  
                  <div className="col-span-4">
                    <Input
                      value={item.description || item.item_description || ''}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Enter item description..."
                      className="h-9"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity || ''}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="h-9 text-center"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Select
                      value={item.unit || item.unit_type || 'EA'}
                      onValueChange={(value) => updateLineItem(index, 'unit', value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_cost || item.unitPrice || ''}
                      onChange={(e) => updateLineItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-9"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <div className="h-9 flex items-center px-3 bg-muted rounded-md font-medium text-sm">
                      {formatCurrency(item.line_total || item.totalPrice || 0)}
                    </div>
                  </div>
                  
                  <div className="col-span-1 flex items-center gap-1">
                    <Checkbox
                      checked={item.included !== false}
                      onCheckedChange={(checked) => updateLineItem(index, 'included', checked)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => duplicateLineItem(index)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeLineItem(index)}
                      disabled={data.line_items.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <Button
            type="button"
            variant="outline"
            onClick={addLineItem}
            className="w-full mt-4 border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>

          {/* Summary Footer */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Subtotal (included items)</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(includedTotal)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
