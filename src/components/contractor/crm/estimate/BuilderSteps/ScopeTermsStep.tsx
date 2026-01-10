import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, FileText, DollarSign, Shield, ListChecks } from 'lucide-react';
import { EstimateBuilderData } from '../../EstimateBuilder';

// Preset options for dropdowns
const TAX_RATE_OPTIONS = [
  { value: '0', label: 'No Tax (0%)' },
  { value: '5', label: '5%' },
  { value: '6', label: '6%' },
  { value: '6.5', label: '6.5%' },
  { value: '7', label: '7%' },
  { value: '7.5', label: '7.5%' },
  { value: '8', label: '8%' },
  { value: '8.25', label: '8.25%' },
  { value: '8.5', label: '8.5%' },
  { value: '9', label: '9%' },
  { value: '10', label: '10%' },
];

const DEPOSIT_OPTIONS = [
  { value: '0', label: 'No Deposit' },
  { value: '10', label: '10%' },
  { value: '20', label: '20%' },
  { value: '25', label: '25%' },
  { value: '30', label: '30%' },
  { value: '33', label: '33% (1/3)' },
  { value: '50', label: '50%' },
  { value: '75', label: '75%' },
  { value: '100', label: '100% (Full Upfront)' },
];

const WARRANTY_OPTIONS = [
  { value: '0', label: 'No Warranty' },
  { value: '1', label: '1 Year' },
  { value: '2', label: '2 Years' },
  { value: '3', label: '3 Years' },
  { value: '5', label: '5 Years' },
  { value: '10', label: '10 Years' },
];

const PAYMENT_SCHEDULE_PRESETS = [
  { value: 'custom', label: 'Custom Schedule' },
  { value: 'upfront', label: '100% Upfront', text: '100% of the contract amount is due upon acceptance of this estimate before work begins.' },
  { value: 'half', label: '50/50 Split', text: '50% deposit due upon acceptance. Remaining 50% due upon completion of work.' },
  { value: 'thirds', label: '1/3 Increments', text: '1/3 due upon acceptance, 1/3 due at project midpoint, final 1/3 due upon completion.' },
  { value: 'progress', label: 'Progress Payments', text: 'Deposit due upon acceptance. Progress payments will be billed monthly based on percentage of work completed.' },
  { value: 'net30', label: 'Net 30', text: 'Full payment due within 30 days of invoice date. A late fee of 1.5% per month will be applied to overdue balances.' },
  { value: 'completion', label: 'Upon Completion', text: 'Full payment is due upon satisfactory completion of all work outlined in this estimate.' },
];

interface ScopeTermsStepProps {
  data: EstimateBuilderData;
  onChange: (updates: Partial<EstimateBuilderData>) => void;
}

export default function ScopeTermsStep({ data, onChange }: ScopeTermsStepProps) {
  const [newExclusion, setNewExclusion] = useState('');
  const [paymentScheduleMode, setPaymentScheduleMode] = useState<string>('custom');

  const addExclusion = () => {
    if (newExclusion.trim()) {
      onChange({ 
        scope_exclusions: [...data.scope_exclusions, newExclusion.trim()] 
      });
      setNewExclusion('');
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

  // Get included line items for display
  const includedLineItems = data.line_items.filter(item => item.included !== false);

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

          {/* Line Items Summary (Read-only from Step 2) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <Label>Work Items (from Step 2)</Label>
            </div>
            {includedLineItems.length > 0 ? (
              <div className="border rounded-lg divide-y bg-muted/30">
                {includedLineItems.map((item, index) => (
                  <div key={item.id || index} className="flex items-center justify-between p-3 text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{item.description || item.item_description || 'Unnamed item'}</span>
                      <span className="text-muted-foreground ml-2">
                        ({item.quantity} {item.unit || item.unit_type})
                      </span>
                    </div>
                    <span className="font-medium text-primary">
                      {formatCurrency(item.line_total || item.totalPrice || 0)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-muted font-semibold">
                  <span>Subtotal</span>
                  <span className="text-primary">{formatCurrency(data.subtotal)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic p-3 border rounded-lg bg-muted/30">
                No line items added yet. Go back to Step 2 to add items.
              </p>
            )}
          </div>

          {/* Additional Items / Notes */}
          <div className="space-y-2">
            <Label htmlFor="additional_scope_notes">Additional Items / Notes</Label>
            <Textarea
              id="additional_scope_notes"
              value={data.scope_key_deliverables?.join('\n') || ''}
              onChange={(e) => {
                const notes = e.target.value;
                // Store as array for compatibility, but allow free-form text
                onChange({ 
                  scope_key_deliverables: notes ? notes.split('\n').filter(line => line.trim()) : [] 
                });
              }}
              placeholder="Enter any additional work items, notes, or details not covered in line items above..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Add any additional scope details, clarifications, or items not captured in the line items above.
            </p>
          </div>

          {/* Exclusions */}
          <div className="space-y-3">
            <Label>Exclusions (What's NOT included)</Label>
            <div className="flex gap-2">
              <Input
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                placeholder="Add an exclusion..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclusion())}
              />
              <Button type="button" onClick={addExclusion} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {data.scope_exclusions.length > 0 && (
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
            )}
          </div>
        </CardContent>
      </Card>

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
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Tax Rate Dropdown */}
            <div className="space-y-2">
              <Label>Tax Rate</Label>
              <Select
                value={String(data.tax_rate)}
                onValueChange={(value) => onChange({ tax_rate: parseFloat(value) })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select tax rate" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {TAX_RATE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deposit Dropdown */}
            <div className="space-y-2">
              <Label>Required Deposit</Label>
              <Select
                value={String(data.required_deposit_percent)}
                onValueChange={(value) => onChange({ required_deposit_percent: parseInt(value) })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select deposit amount" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {DEPOSIT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permit Fees */}
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
            <Label>Payment Schedule</Label>
            <Select
              value={paymentScheduleMode}
              onValueChange={(value) => {
                setPaymentScheduleMode(value);
                const preset = PAYMENT_SCHEDULE_PRESETS.find(p => p.value === value);
                if (preset && value !== 'custom') {
                  onChange({ terms_payment_schedule: preset.text });
                }
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select payment schedule" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {PAYMENT_SCHEDULE_PRESETS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              id="terms_payment_schedule"
              value={data.terms_payment_schedule}
              onChange={(e) => {
                setPaymentScheduleMode('custom');
                onChange({ terms_payment_schedule: e.target.value });
              }}
              rows={2}
              placeholder="Enter custom payment schedule terms..."
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

          <div className="space-y-2">
            <Label>Warranty Period</Label>
            <Select
              value={String(data.terms_warranty_years)}
              onValueChange={(value) => onChange({ terms_warranty_years: parseInt(value) })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select warranty period" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {WARRANTY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
