import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, ChevronDown, Save, Send, FileText } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { EstimateLineItem } from '@/hooks/useEstimates';

const tradeTypes = [
  'General Remodel',
  'Roofing',
  'Plumbing',
  'Electrical',
  'Painting',
  'HVAC',
  'Flooring',
  'Landscaping',
  'Other',
];

const categories = [
  'Materials',
  'Labour',
  'Equipment',
  'Subcontractor',
  'Overhead',
  'Contingency',
  'Fees',
];

const estimateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  client_name: z.string().min(1, 'Client name is required'),
  client_email: z.string().email('Invalid email').optional().or(z.literal('')),
  client_address: z.string().optional(),
  site_address: z.string().optional(),
  trade_type: z.string().min(1, 'Trade type is required'),
  project_description: z.string().optional(),
  assumptions_and_exclusions: z.string().optional(),
  valid_until: z.string().optional(),
  profit_markup_percentage: z.number().min(0).max(100),
  tax_and_fees: z.number().min(0),
});

type EstimateFormData = z.infer<typeof estimateSchema>;

interface EstimateFormProps {
  onSubmit: (data: any, isDraft: boolean) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function EstimateForm({ onSubmit, onCancel, initialData }: EstimateFormProps) {
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([
    {
      category: 'Materials',
      item_description: '',
      quantity: 0,
      unit_type: '',
      unit_cost: 0,
      line_total: 0,
      included: true,
    },
  ]);

  const [tradeSpecific, setTradeSpecific] = useState<any>({});
  const [projectInfoOpen, setProjectInfoOpen] = useState(true);
  const [lineItemsOpen, setLineItemsOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [tradeSpecificOpen, setTradeSpecificOpen] = useState(false);

  const contractorSigRef = useRef<SignatureCanvas>(null);
  const clientSigRef = useRef<SignatureCanvas>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EstimateFormData>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      title: '',
      client_name: '',
      client_email: '',
      client_address: '',
      site_address: '',
      trade_type: '',
      project_description: '',
      assumptions_and_exclusions: '',
      valid_until: '',
      profit_markup_percentage: 15,
      tax_and_fees: 0,
    },
  });

  const tradeType = watch('trade_type');
  const profitMarkupPercentage = watch('profit_markup_percentage');
  const taxAndFees = watch('tax_and_fees');

  // Load initialData when it changes (for editing existing estimates)
  useEffect(() => {
    if (initialData) {
      // Reset form fields
      reset({
        title: initialData.title || '',
        client_name: initialData.client_name || '',
        client_email: initialData.client_email || '',
        client_address: initialData.client_address || '',
        site_address: initialData.site_address || '',
        trade_type: initialData.trade_type || '',
        project_description: initialData.project_description || '',
        assumptions_and_exclusions: initialData.assumptions_and_exclusions || '',
        valid_until: initialData.valid_until || '',
        profit_markup_percentage: initialData.cost_summary?.profit_markup_percentage || 15,
        tax_and_fees: initialData.cost_summary?.tax_and_fees || 0,
      });

      // Load line items
      if (initialData.line_items && initialData.line_items.length > 0) {
        setLineItems(initialData.line_items);
      } else {
        // Reset to default empty line item if no line items exist
        setLineItems([{
          category: 'Materials',
          item_description: '',
          quantity: 0,
          unit_type: '',
          unit_cost: 0,
          line_total: 0,
          included: true,
        }]);
      }

      // Load trade-specific data
      if (initialData.trade_specific) {
        setTradeSpecific(initialData.trade_specific);
      } else {
        setTradeSpecific({});
      }

      // Load signatures if they exist
      if (initialData.contractor_signature && contractorSigRef.current) {
        contractorSigRef.current.fromDataURL(initialData.contractor_signature);
      }
      if (initialData.client_signature && clientSigRef.current) {
        clientSigRef.current.fromDataURL(initialData.client_signature);
      }
    } else {
      // Reset to defaults for new estimate
      reset({
        title: '',
        client_name: '',
        client_email: '',
        client_address: '',
        site_address: '',
        trade_type: '',
        project_description: '',
        assumptions_and_exclusions: '',
        valid_until: '',
        profit_markup_percentage: 15,
        tax_and_fees: 0,
      });
      setLineItems([{
        category: 'Materials',
        item_description: '',
        quantity: 0,
        unit_type: '',
        unit_cost: 0,
        line_total: 0,
        included: true,
      }]);
      setTradeSpecific({});
      contractorSigRef.current?.clear();
      clientSigRef.current?.clear();
    }
  }, [initialData, reset]);

  // Auto-calculate line totals and cost summary
  const calculateTotals = () => {
    const materialsTotal = lineItems
      .filter(item => item.category === 'Materials' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const labourTotal = lineItems
      .filter(item => item.category === 'Labour' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const equipmentTotal = lineItems
      .filter(item => item.category === 'Equipment' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const subcontractorTotal = lineItems
      .filter(item => item.category === 'Subcontractor' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const overheadTotal = lineItems
      .filter(item => item.category === 'Overhead' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);
    
    const contingencyTotal = lineItems
      .filter(item => item.category === 'Contingency' && item.included)
      .reduce((sum, item) => sum + item.line_total, 0);

    const subtotal = materialsTotal + labourTotal + equipmentTotal + 
                     subcontractorTotal + overheadTotal + contingencyTotal;
    
    const profitMarkupAmount = subtotal * (profitMarkupPercentage / 100);
    const grandTotal = subtotal + profitMarkupAmount + taxAndFees;

    return {
      materialsTotal,
      labourTotal,
      equipmentTotal,
      subcontractorTotal,
      overheadTotal,
      contingencyTotal,
      subtotal,
      profitMarkupAmount,
      grandTotal,
    };
  };

  const totals = calculateTotals();

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        category: 'Materials',
        item_description: '',
        quantity: 0,
        unit_type: '',
        unit_cost: 0,
        line_total: 0,
        included: true,
      },
    ]);
  };

  const updateLineItem = (index: number, field: keyof EstimateLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_cost') {
      updated[index].line_total = updated[index].quantity * updated[index].unit_cost;
    }
    
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const duplicateLineItem = (index: number) => {
    const itemToDuplicate = { ...lineItems[index] };
    setLineItems([...lineItems, itemToDuplicate]);
  };

  const handleFormSubmit = (data: EstimateFormData, isDraft: boolean) => {
    const formData = {
      ...data,
      line_items: lineItems,
      cost_summary: {
        materials_total: totals.materialsTotal,
        labour_total: totals.labourTotal,
        equipment_total: totals.equipmentTotal,
        subcontractor_total: totals.subcontractorTotal,
        overhead_total: totals.overheadTotal,
        contingency_total: totals.contingencyTotal,
        subtotal: totals.subtotal,
        profit_markup_percentage: profitMarkupPercentage,
        profit_markup_amount: totals.profitMarkupAmount,
        tax_and_fees: taxAndFees,
        grand_total: totals.grandTotal,
      },
      trade_specific: tradeSpecific,
      contractor_signature: contractorSigRef.current?.toDataURL(),
      client_signature: clientSigRef.current?.toDataURL(),
      status: isDraft ? 'draft' : 'sent',
      total_amount: totals.grandTotal,
    };

    onSubmit(formData, isDraft);
  };

  // Autosave to localStorage
  useEffect(() => {
    const autoSaveData = {
      formData: watch(),
      lineItems,
      tradeSpecific,
    };
    localStorage.setItem('estimate_autosave', JSON.stringify(autoSaveData));
  }, [watch(), lineItems, tradeSpecific]);

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <form onSubmit={handleSubmit((data) => handleFormSubmit(data, false))} className="space-y-4">
          {/* Project Info Section */}
          <Collapsible open={projectInfoOpen} onOpenChange={setProjectInfoOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Project Information</CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${projectInfoOpen ? 'rotate-180' : ''}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Estimate Title *</Label>
                      <Input id="title" {...register('title')} />
                      {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="trade_type">Trade Type *</Label>
                      <Select onValueChange={(value) => setValue('trade_type', value)} value={watch('trade_type')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trade" />
                        </SelectTrigger>
                        <SelectContent>
                          {tradeTypes.map((trade) => (
                            <SelectItem key={trade} value={trade}>
                              {trade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.trade_type && <p className="text-sm text-destructive">{errors.trade_type.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_name">Client Name *</Label>
                      <Input id="client_name" {...register('client_name')} />
                      {errors.client_name && <p className="text-sm text-destructive">{errors.client_name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_email">Client Email</Label>
                      <Input id="client_email" type="email" {...register('client_email')} />
                      {errors.client_email && <p className="text-sm text-destructive">{errors.client_email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_address">Client Address</Label>
                      <Input id="client_address" {...register('client_address')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="site_address">Site Address</Label>
                      <Input id="site_address" {...register('site_address')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valid_until">Valid Until</Label>
                      <Input id="valid_until" type="date" {...register('valid_until')} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project_description">Project Description</Label>
                    <Textarea id="project_description" {...register('project_description')} rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assumptions_and_exclusions">Assumptions & Exclusions</Label>
                    <Textarea id="assumptions_and_exclusions" {...register('assumptions_and_exclusions')} rows={3} />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Line Items Section */}
          <Collapsible open={lineItemsOpen} onOpenChange={setLineItemsOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Line Items</CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${lineItemsOpen ? 'rotate-180' : ''}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={item.category}
                            onValueChange={(value) => updateLineItem(index, 'category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Description</Label>
                          <Input
                            value={item.item_description}
                            onChange={(e) => updateLineItem(index, 'item_description', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Input
                            value={item.unit_type}
                            onChange={(e) => updateLineItem(index, 'unit_type', e.target.value)}
                            placeholder="sq ft, hrs, units"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Unit Cost</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => updateLineItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Line Total</Label>
                          <Input value={`$${item.line_total.toFixed(2)}`} disabled />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.included}
                            onCheckedChange={(checked) => updateLineItem(index, 'included', checked)}
                          />
                          <Label>Include</Label>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateLineItem(index)}
                        >
                          Duplicate
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addLineItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Cost Summary Section */}
          <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Cost Summary</CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Materials:</span>
                    <span className="font-semibold">${totals.materialsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labour:</span>
                    <span className="font-semibold">${totals.labourTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equipment:</span>
                    <span className="font-semibold">${totals.equipmentTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subcontractor:</span>
                    <span className="font-semibold">${totals.subcontractorTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead:</span>
                    <span className="font-semibold">${totals.overheadTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contingency:</span>
                    <span className="font-semibold">${totals.contingencyTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profit_markup_percentage">Profit Markup %</Label>
                      <Input
                        id="profit_markup_percentage"
                        type="number"
                        step="0.1"
                        {...register('profit_markup_percentage', { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Profit Amount</Label>
                      <Input value={`$${totals.profitMarkupAmount.toFixed(2)}`} disabled />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_and_fees">Tax & Fees</Label>
                    <Input
                      id="tax_and_fees"
                      type="number"
                      step="0.01"
                      {...register('tax_and_fees', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="border-t pt-3 flex justify-between text-lg">
                    <span className="font-bold">Grand Total:</span>
                    <span className="font-bold text-primary">${totals.grandTotal.toFixed(2)}</span>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Trade-Specific Fields */}
          {tradeType && tradeType !== 'Other' && (
            <Collapsible open={tradeSpecificOpen} onOpenChange={setTradeSpecificOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">{tradeType} Specific Fields</CardTitle>
                    <ChevronDown className={`h-5 w-5 transition-transform ${tradeSpecificOpen ? 'rotate-180' : ''}`} />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {tradeType === 'Roofing' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Roof Pitch</Label>
                          <Input
                            value={tradeSpecific.roof_pitch || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, roof_pitch: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tear-off Layers</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.tear_off_layers || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, tear_off_layers: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Shingle Type</Label>
                          <Input
                            value={tradeSpecific.shingle_type || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, shingle_type: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {tradeType === 'Painting' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Wall Area (sq ft)</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.wall_area_sqft || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, wall_area_sqft: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Coats</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.coats || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, coats: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Finish Type</Label>
                          <Input
                            value={tradeSpecific.finish_type || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, finish_type: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {tradeType === 'Electrical' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Number of Outlets</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.number_of_outlets || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, number_of_outlets: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Circuits</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.circuits || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, circuits: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Checkbox
                            checked={tradeSpecific.panel_upgrade || false}
                            onCheckedChange={(checked) => setTradeSpecific({ ...tradeSpecific, panel_upgrade: checked })}
                          />
                          <Label>Panel Upgrade</Label>
                        </div>
                      </div>
                    )}

                    {tradeType === 'Plumbing' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Fixtures Count</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.fixtures_count || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, fixtures_count: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pipe Type</Label>
                          <Input
                            value={tradeSpecific.pipe_type || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, pipe_type: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Checkbox
                            checked={tradeSpecific.under_slab_work || false}
                            onCheckedChange={(checked) => setTradeSpecific({ ...tradeSpecific, under_slab_work: checked })}
                          />
                          <Label>Under Slab Work</Label>
                        </div>
                      </div>
                    )}

                    {tradeType === 'General Remodel' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Demo Hours</Label>
                          <Input
                            type="number"
                            value={tradeSpecific.demo_hours || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, demo_hours: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Checkbox
                            checked={tradeSpecific.structural_mods || false}
                            onCheckedChange={(checked) => setTradeSpecific({ ...tradeSpecific, structural_mods: checked })}
                          />
                          <Label>Structural Modifications</Label>
                        </div>
                        <div className="space-y-2">
                          <Label>Finish Level</Label>
                          <Input
                            value={tradeSpecific.finish_level || ''}
                            onChange={(e) => setTradeSpecific({ ...tradeSpecific, finish_level: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Signatures */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Signatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contractor Signature</Label>
                <div className="border rounded-lg">
                  <SignatureCanvas
                    ref={contractorSigRef}
                    canvasProps={{ className: 'w-full h-32 bg-background' }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => contractorSigRef.current?.clear()}
                >
                  Clear
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Client Signature</Label>
                <div className="border rounded-lg">
                  <SignatureCanvas
                    ref={clientSigRef}
                    canvasProps={{ className: 'w-full h-32 bg-background' }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => clientSigRef.current?.clear()}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fixed Bottom Bar with Total and Actions */}
          <div className="sticky bottom-0 bg-background border-t p-4 shadow-lg">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-xl font-bold text-center sm:text-left">
                Grand Total: <span className="text-primary">${totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSubmit((data) => handleFormSubmit(data, true))}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </ScrollArea>
  );
}
