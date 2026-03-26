import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VoiceTextareaField } from '@/components/ui/voice-textarea-field';
import { Sparkles, Loader2, Plus, Trash2, ArrowLeft, AlertTriangle, Info, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AILineItem {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total: number;
  notes: string | null;
}

interface AIEstimateResult {
  line_items: AILineItem[];
  labor_hours: number;
  labor_rate_suggestion: number;
  subtotal_materials: number;
  subtotal_labor: number;
  overhead_percent: number;
  profit_margin_percent: number;
  total_estimate: number;
  assumptions: string[];
  warnings: string[];
}

interface AIEstimateGeneratorProps {
  onBack: () => void;
  onApplyToEstimate?: (lineItems: any[]) => void;
  onStartNewEstimate?: (lineItems: any[], metadata: Record<string, any>) => void;
}

const JOB_TYPES = [
  'Bathroom Remodel', 'Kitchen Remodel', 'Room Addition', 'Deck/Patio',
  'Roofing', 'Siding', 'Painting (Interior)', 'Painting (Exterior)',
  'Flooring', 'Electrical', 'Plumbing', 'HVAC', 'Concrete/Foundation',
  'Landscaping', 'Fence', 'Window/Door Replacement', 'Basement Finishing',
  'Garage Build', 'General Renovation', 'Commercial Buildout', 'Other',
];

const TRADES = [
  'General', 'Electrical', 'Plumbing', 'HVAC', 'Roofing', 'Concrete',
  'Landscaping', 'Painting', 'Carpentry', 'Flooring', 'Drywall', 'Masonry',
];

export default function AIEstimateGenerator({ onBack, onApplyToEstimate, onStartNewEstimate }: AIEstimateGeneratorProps) {
  const { user } = useAuth();
  const [jobType, setJobType] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [scopeDescription, setScopeDescription] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [trade, setTrade] = useState('General');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AIEstimateResult | null>(null);
  const [editableItems, setEditableItems] = useState<AILineItem[]>([]);

  const handleGenerate = useCallback(async () => {
    if (!scopeDescription.trim()) {
      toast.error('Please describe the scope of work');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-ai-generate', {
        body: {
          job_type: jobType,
          square_footage: squareFootage ? Number(squareFootage) : null,
          scope_description: scopeDescription,
          zip_code: zipCode,
          trade,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResult(data);
      setEditableItems([...data.line_items]);
      toast.success('Estimate generated! Review and adjust as needed.');
    } catch (err: any) {
      console.error('AI generation error:', err);
      toast.error(err.message || 'Failed to generate estimate');
    } finally {
      setIsGenerating(false);
    }
  }, [jobType, squareFootage, scopeDescription, zipCode, trade]);

  const updateItem = useCallback((index: number, field: keyof AILineItem, value: any) => {
    setEditableItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unit_cost') {
        updated[index].total = Number(updated[index].quantity) * Number(updated[index].unit_cost);
      }
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setEditableItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addItem = useCallback(() => {
    setEditableItems(prev => [...prev, {
      category: 'Materials',
      description: '',
      quantity: 1,
      unit: 'EA',
      unit_cost: 0,
      total: 0,
      notes: null,
    }]);
  }, []);

  const totals = useMemo(() => {
    const materials = editableItems
      .filter(i => i.category === 'Materials' || i.category === 'Equipment')
      .reduce((s, i) => s + (Number(i.total) || 0), 0);
    const labor = editableItems
      .filter(i => i.category === 'Labor')
      .reduce((s, i) => s + (Number(i.total) || 0), 0);
    const other = editableItems
      .filter(i => i.category !== 'Materials' && i.category !== 'Equipment' && i.category !== 'Labor')
      .reduce((s, i) => s + (Number(i.total) || 0), 0);
    const subtotal = materials + labor + other;
    const overheadPct = result?.overhead_percent ?? 10;
    const profitPct = result?.profit_margin_percent ?? 15;
    const overhead = subtotal * (overheadPct / 100);
    const profit = subtotal * (profitPct / 100);
    return { materials, labor, other, subtotal, overhead, profit, total: subtotal + overhead + profit, overheadPct, profitPct };
  }, [editableItems, result]);

  const convertToEstimateLineItems = useCallback(() => {
    return editableItems.map((item, idx) => ({
      itemNumber: String(idx + 1),
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unit_cost,
      totalPrice: item.total,
      included: true,
    }));
  }, [editableItems]);

  const handleApply = useCallback(() => {
    onApplyToEstimate?.(convertToEstimateLineItems());
    toast.success('Line items applied to estimate');
  }, [convertToEstimateLineItems, onApplyToEstimate]);

  const handleStartNew = useCallback(() => {
    onStartNewEstimate?.(convertToEstimateLineItems(), {
      title: `${jobType || 'AI Generated'} Estimate`,
      project_description: scopeDescription,
      subtotal: totals.subtotal,
      grand_total: totals.total,
    });
  }, [convertToEstimateLineItems, onStartNewEstimate, jobType, scopeDescription, totals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Estimate Generator
          </h2>
          <p className="text-sm text-muted-foreground">Generate material lists and cost estimates from a job description</p>
        </div>
      </div>

      {/* Input Form */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Describe the Project</CardTitle>
            <CardDescription>Provide details about the job and we'll generate a detailed estimate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trade</Label>
                <Select value={trade} onValueChange={setTrade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Square Footage</Label>
                <Input
                  type="number"
                  placeholder="e.g., 1200"
                  value={squareFootage}
                  onChange={e => setSquareFootage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Zip Code (for regional pricing)</Label>
                <Input
                  placeholder="e.g., 90210"
                  maxLength={5}
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scope of Work *</Label>
              <VoiceTextareaField
                placeholder="Describe the project in detail. E.g., 'Full bathroom remodel including demo of existing tile, new subway tile shower surround, vanity replacement with granite top, new toilet, new light fixture, and paint...'"
                rows={5}
                value={scopeDescription}
                onChange={e => setScopeDescription(e.target.value)}
                onVoiceInput={setScopeDescription}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !scopeDescription.trim()}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Estimate...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Estimate
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-sm text-yellow-600 dark:text-yellow-400">{w}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Editable Line Items Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Line Items</CardTitle>
                <CardDescription>Review and adjust quantities, pricing, and items</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead className="w-[70px]">Unit</TableHead>
                      <TableHead className="w-[100px]">Unit Cost</TableHead>
                      <TableHead className="w-[100px] text-right">Total</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editableItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={item.category} onValueChange={v => updateItem(idx, 'category', v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {['Materials', 'Labor', 'Equipment', 'Subcontractor', 'Other'].map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs"
                            value={item.description}
                            onChange={e => updateItem(idx, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-xs w-[70px]"
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs w-[60px]"
                            value={item.unit}
                            onChange={e => updateItem(idx, 'unit', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            className="h-8 text-xs w-[90px]"
                            value={item.unit_cost}
                            onChange={e => updateItem(idx, 'unit_cost', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          ${(Number(item.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <Separator className="my-4" />
              <div className="space-y-2 max-w-xs ml-auto text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Materials</span>
                  <span>${totals.materials.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Labor</span>
                  <span>${totals.labor.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {totals.other > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other</span>
                    <span>${totals.other.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${totals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overhead ({totals.overheadPct}%)</span>
                  <span>${totals.overhead.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit ({totals.profitPct}%)</span>
                  <span>${totals.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total Estimate</span>
                  <span>${totals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assumptions */}
          {result.assumptions && result.assumptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  Assumptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {result.assumptions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="rounded-lg border border-muted bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground italic">
              ⚠️ AI-generated estimates are starting points. Review all quantities and pricing before sending to customers. Actual costs may vary based on site conditions, material availability, and local market rates.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => { setResult(null); setEditableItems([]); }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Start Over
            </Button>
            {onApplyToEstimate && (
              <Button variant="outline" onClick={handleApply}>
                <FileText className="h-4 w-4 mr-2" />
                Apply to Current Estimate
              </Button>
            )}
            <Button onClick={handleStartNew}>
              <Plus className="h-4 w-4 mr-2" />
              Start New Estimate with These Items
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
