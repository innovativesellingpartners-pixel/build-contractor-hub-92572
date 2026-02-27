import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Plus, X, FileText, DollarSign, Shield, Paperclip } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EstimateBuilderData } from '../../EstimateBuilder';
import { WarrantySection } from '../WarrantySection';
import { DocumentAttachmentSection } from '../DocumentAttachmentSection';

interface ScopeTermsStepProps {
  data: EstimateBuilderData;
  onChange: (updates: Partial<EstimateBuilderData>) => void;
}

export default function ScopeTermsStep({ data, onChange }: ScopeTermsStepProps) {
  const [deliverableDialogOpen, setDeliverableDialogOpen] = useState(false);
  const [exclusionDialogOpen, setExclusionDialogOpen] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  // Auto-update payment schedule when deposit percentage changes
  useEffect(() => {
    const depositPercent = data.required_deposit_percent;
    const remainingPercent = 100 - depositPercent;
    
    // Generate dynamic payment schedule based on deposit
    let schedule = '';
    if (depositPercent > 0 && depositPercent < 100) {
      const midPoint = Math.round(remainingPercent / 2);
      schedule = `${depositPercent}% deposit required to begin work, ${midPoint}% upon completion of rough work, ${remainingPercent - midPoint}% upon final completion.`;
    } else if (depositPercent === 100) {
      schedule = '100% payment due before work begins.';
    } else {
      schedule = '50% deposit required to begin work, 50% upon final completion.';
    }
    
    // Only update if it looks like a generated schedule (not custom text)
    if (!data.terms_payment_schedule || 
        data.terms_payment_schedule.match(/^\d+% deposit required/) ||
        data.terms_payment_schedule.match(/^\d+% payment due before/)) {
      onChange({ terms_payment_schedule: schedule });
    }
  }, [data.required_deposit_percent]);

  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      onChange({ 
        scope_key_deliverables: [...data.scope_key_deliverables, newDeliverable.trim()] 
      });
      setNewDeliverable('');
      setDeliverableDialogOpen(false);
    }
  };

  const removeDeliverable = (index: number) => {
    onChange({ 
      scope_key_deliverables: data.scope_key_deliverables.filter((_, i) => i !== index) 
    });
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      onChange({ 
        scope_exclusions: [...data.scope_exclusions, newExclusion.trim()] 
      });
      setNewExclusion('');
      setExclusionDialogOpen(false);
    }
  };

  const removeExclusion = (index: number) => {
    onChange({ 
      scope_exclusions: data.scope_exclusions.filter((_, i) => i !== index) 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Scope of Work */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Scope of Work
          </CardTitle>
          <CardDescription>
            Define what's included and excluded from this project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="scope_objective">Project Objective</Label>
            <Textarea
              id="scope_objective"
              value={data.scope_objective}
              onChange={(e) => onChange({ scope_objective: e.target.value })}
              placeholder="Describe the main objective of this project..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope_timeline">Timeline</Label>
            <Input
              id="scope_timeline"
              value={data.scope_timeline}
              onChange={(e) => onChange({ scope_timeline: e.target.value })}
              placeholder="e.g., 2-3 weeks from start date"
            />
          </div>

          {/* Key Deliverables */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Key Deliverables</Label>
              <Button 
                type="button" 
                onClick={() => setDeliverableDialogOpen(true)} 
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            {data.scope_key_deliverables.length > 0 ? (
              <ul className="space-y-2">
                {data.scope_key_deliverables.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <span className="flex-1 text-sm">{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeDeliverable(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No deliverables added yet. Click "Add" to add one.</p>
            )}
          </div>

          {/* Exclusions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Exclusions (What's NOT included)</Label>
              <Button 
                type="button" 
                onClick={() => setExclusionDialogOpen(true)} 
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            {data.scope_exclusions.length > 0 ? (
              <ul className="space-y-2">
                {data.scope_exclusions.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                    <span className="flex-1 text-sm">{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeExclusion(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No exclusions added yet. Click "Add" to add one.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Deliverable Dialog */}
      <Dialog open={deliverableDialogOpen} onOpenChange={setDeliverableDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Key Deliverable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-deliverable">Deliverable Description</Label>
              <Textarea
                id="new-deliverable"
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                placeholder="e.g., Install new 50-gallon water heater with expansion tank"
                rows={3}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeliverableDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={addDeliverable} disabled={!newDeliverable.trim()}>
              Add Deliverable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Exclusion Dialog */}
      <Dialog open={exclusionDialogOpen} onOpenChange={setExclusionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Exclusion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-exclusion">Exclusion Description</Label>
              <Textarea
                id="new-exclusion"
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                placeholder="e.g., Drywall repair or painting not included"
                rows={3}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExclusionDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={addExclusion} disabled={!newExclusion.trim()}>
              Add Exclusion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Financial Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Financial Terms
          </CardTitle>
          <CardDescription>
            Tax rates, fees, and deposit requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tax Rate</Label>
                <span className="text-sm font-medium">{data.tax_rate}%</span>
              </div>
              <Slider
                value={[data.tax_rate]}
                onValueChange={(value) => onChange({ tax_rate: value[0] })}
                max={15}
                step={0.25}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Required Deposit</Label>
                <span className="text-sm font-medium">{data.required_deposit_percent}%</span>
              </div>
              <Slider
                value={[data.required_deposit_percent]}
                onValueChange={(value) => onChange({ required_deposit_percent: value[0] })}
                max={100}
                step={5}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permit_fee">Permit Fees / Surcharges</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="permit_fee"
                type="number"
                min="0"
                step="0.01"
                value={data.permit_fee || ''}
                onChange={(e) => onChange({ permit_fee: parseFloat(e.target.value) || 0 })}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Financial Summary Preview */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(data.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({data.tax_rate}%)</span>
              <span>{formatCurrency(data.tax_amount)}</span>
            </div>
            {data.permit_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Permit Fees</span>
                <span>{formatCurrency(data.permit_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Grand Total</span>
              <span className="text-primary">{formatCurrency(data.grand_total)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Required Deposit ({data.required_deposit_percent}%)</span>
              <span>{formatCurrency(data.required_deposit)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Terms & Conditions
          </CardTitle>
          <CardDescription>
            Standard terms that appear on your estimate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terms_validity">Validity Period</Label>
            <Textarea
              id="terms_validity"
              value={data.terms_validity}
              onChange={(e) => onChange({ terms_validity: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="terms_payment_schedule">Payment Schedule</Label>
              <span className="text-xs text-muted-foreground">
                Auto-synced with {data.required_deposit_percent}% deposit
              </span>
            </div>
            <Textarea
              id="terms_payment_schedule"
              value={data.terms_payment_schedule}
              onChange={(e) => onChange({ terms_payment_schedule: e.target.value })}
              rows={2}
              placeholder="Payment schedule will auto-generate based on deposit percentage"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_change_orders">Change Orders</Label>
            <Textarea
              id="terms_change_orders"
              value={data.terms_change_orders}
              onChange={(e) => onChange({ terms_change_orders: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_insurance">Insurance</Label>
            <Textarea
              id="terms_insurance"
              value={data.terms_insurance}
              onChange={(e) => onChange({ terms_insurance: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Warranty Section */}
      <WarrantySection
        selectedWarrantyId={data.warranty_id || null}
        warrantyText={data.warranty_text || ''}
        onWarrantyChange={(warranty) => {
          onChange({
            warranty_id: warranty.warranty_id,
            warranty_text: warranty.warranty_text,
            warranty_duration_years: warranty.warranty_duration_years,
            warranty_duration_months: warranty.warranty_duration_months,
            terms_warranty_years: warranty.warranty_duration_years,
          });
        }}
      />

      {/* Document Attachments Section */}
      <DocumentAttachmentSection
        estimateId={data.warranty_id ? undefined : undefined}
        attachments={data.document_attachments || []}
        onAttachmentsChange={(attachments) => onChange({ document_attachments: attachments })}
      />
    </div>
  );
}
