import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DollarSign } from 'lucide-react';

interface FinancialSummarySectionProps {
  subtotal: number;
  salesTaxRatePercent: number;
  salesTaxAmount: number;
  permitFeeSurcharge: number;
  grandTotal: number;
  requiredDepositPercent: number;
  requiredDepositAmount: number;
  balanceDue: number;
  onTaxRateChange: (value: number) => void;
  onPermitFeeChange: (value: number) => void;
  onDepositPercentChange: (value: number) => void;
}

export default function FinancialSummarySection({
  subtotal,
  salesTaxRatePercent,
  salesTaxAmount,
  permitFeeSurcharge,
  grandTotal,
  requiredDepositPercent,
  requiredDepositAmount,
  balanceDue,
  onTaxRateChange,
  onPermitFeeChange,
  onDepositPercentChange,
}: FinancialSummarySectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subtotal */}
        <div className="flex items-center justify-between py-2">
          <span className="text-muted-foreground">Subtotal (Line Items)</span>
          <span className="font-semibold text-lg">{formatCurrency(subtotal)}</span>
        </div>

        <Separator />

        {/* Editable Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sales Tax Rate */}
          <div className="space-y-2">
            <Label htmlFor="tax_rate" className="text-sm">
              Sales Tax Rate (%)
            </Label>
            <Input
              id="tax_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={salesTaxRatePercent}
              onChange={(e) => onTaxRateChange(parseFloat(e.target.value) || 0)}
              className="w-full"
            />
          </div>

          {/* Permit Fee */}
          <div className="space-y-2">
            <Label htmlFor="permit_fee" className="text-sm">
              Permit/Fee Surcharge ($)
            </Label>
            <Input
              id="permit_fee"
              type="number"
              step="0.01"
              min="0"
              value={permitFeeSurcharge}
              onChange={(e) => onPermitFeeChange(parseFloat(e.target.value) || 0)}
              className="w-full"
            />
          </div>

          {/* Deposit Percent */}
          <div className="space-y-2">
            <Label htmlFor="deposit_percent" className="text-sm">
              Required Deposit (%)
            </Label>
            <Input
              id="deposit_percent"
              type="number"
              step="1"
              min="0"
              max="100"
              value={requiredDepositPercent}
              onChange={(e) => onDepositPercentChange(parseFloat(e.target.value) || 0)}
              className="w-full"
            />
          </div>
        </div>

        <Separator />

        {/* Calculated Values */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Sales Tax ({salesTaxRatePercent.toFixed(2)}%)
            </span>
            <span>{formatCurrency(salesTaxAmount)}</span>
          </div>

          {permitFeeSurcharge > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Permit/Fee Surcharge</span>
              <span>{formatCurrency(permitFeeSurcharge)}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Grand Total */}
        <div className="bg-primary/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Grand Total</span>
            <span className="text-2xl font-black text-primary">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Deposit & Balance */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Required Deposit ({requiredDepositPercent}%)
            </p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(requiredDepositAmount)}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Balance Due</p>
            <p className="text-lg font-bold">{formatCurrency(balanceDue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
