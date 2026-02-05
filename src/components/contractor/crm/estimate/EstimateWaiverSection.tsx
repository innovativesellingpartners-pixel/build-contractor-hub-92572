import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, FileCheck, AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface EstimateWaiverData {
  type: 'conditional_progress' | 'unconditional_progress' | 'conditional_final' | 'unconditional_final' | null;
  amount: number;
  billingPeriodEnd?: string;
  retainage?: number;
}

export const WAIVER_TYPE_OPTIONS = [
  {
    id: 'conditional_progress',
    label: 'Conditional Waiver - Progress Payment',
    description: 'Effective only when payment clears, applies to current billing cycle.',
    isUnconditional: false,
    isFinal: false,
  },
  {
    id: 'unconditional_progress',
    label: 'Unconditional Waiver - Progress Payment',
    description: 'Payment already received for current cycle. Use only after payment has cleared.',
    isUnconditional: true,
    isFinal: false,
  },
  {
    id: 'conditional_final',
    label: 'Conditional Waiver - Final Payment',
    description: 'Final payment pending, release becomes effective once funds clear.',
    isUnconditional: false,
    isFinal: true,
  },
  {
    id: 'unconditional_final',
    label: 'Unconditional Waiver - Final Payment',
    description: 'Final payment fully received. Use only after final payment has cleared.',
    isUnconditional: true,
    isFinal: true,
  },
];

interface EstimateWaiverSectionProps {
  waiverData: EstimateWaiverData;
  onWaiverDataChange: (data: EstimateWaiverData) => void;
  defaultAmount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EstimateWaiverSection({
  waiverData,
  onWaiverDataChange,
  defaultAmount,
  isOpen,
  onOpenChange,
}: EstimateWaiverSectionProps) {
  const [showUnconditionalWarning, setShowUnconditionalWarning] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);

  const includeWaiver = waiverData.type !== null;

  const handleIncludeChange = (checked: boolean) => {
    if (checked) {
      // Default to conditional progress waiver
      onWaiverDataChange({
        type: 'conditional_progress',
        amount: defaultAmount,
        billingPeriodEnd: new Date().toISOString().split('T')[0],
        retainage: 0,
      });
    } else {
      onWaiverDataChange({
        type: null,
        amount: 0,
        billingPeriodEnd: undefined,
        retainage: undefined,
      });
    }
  };

  const handleTypeChange = (newType: string) => {
    const waiverOption = WAIVER_TYPE_OPTIONS.find(w => w.id === newType);
    
    if (waiverOption?.isUnconditional) {
      setPendingType(newType);
      setShowUnconditionalWarning(true);
      return;
    }

    onWaiverDataChange({
      ...waiverData,
      type: newType as EstimateWaiverData['type'],
    });
  };

  const confirmUnconditionalWaiver = () => {
    if (pendingType) {
      onWaiverDataChange({
        ...waiverData,
        type: pendingType as EstimateWaiverData['type'],
      });
    }
    setShowUnconditionalWarning(false);
    setPendingType(null);
  };

  const cancelUnconditionalWaiver = () => {
    setShowUnconditionalWarning(false);
    setPendingType(null);
  };

  const selectedWaiverOption = WAIVER_TYPE_OPTIONS.find(w => w.id === waiverData.type);

  return (
    <TooltipProvider>
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-xl">Lien Waiver</CardTitle>
                {includeWaiver && (
                  <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                    Included
                  </Badge>
                )}
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optionally include a lien waiver with this estimate. When an invoice is created from this estimate, the waiver will be automatically attached.
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-waiver"
                  checked={includeWaiver}
                  onCheckedChange={handleIncludeChange}
                />
                <Label htmlFor="include-waiver" className="font-medium cursor-pointer">
                  Include Lien Waiver with this Estimate
                </Label>
              </div>

              {showUnconditionalWarning && (
                <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <p className="font-medium mb-2">Warning: Unconditional Waiver Selected</p>
                    <p className="text-sm mb-3">
                      Unconditional waivers should only be used after payment has cleared. 
                      By signing an unconditional waiver, you waive your lien rights immediately.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={confirmUnconditionalWaiver}
                        className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
                      >
                        I Understand, Continue
                      </button>
                      <button
                        type="button"
                        onClick={cancelUnconditionalWaiver}
                        className="px-3 py-1 text-sm bg-white border border-amber-300 text-amber-700 rounded hover:bg-amber-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {includeWaiver && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="waiver-type">Waiver Type</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            {selectedWaiverOption?.description || 'Select the type of lien waiver to include'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={waiverData.type || undefined}
                      onValueChange={handleTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select waiver type" />
                      </SelectTrigger>
                      <SelectContent>
                        {WAIVER_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            <div className="flex items-center gap-2">
                              <span>{option.label}</span>
                              {option.isUnconditional && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  ⚠️
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="waiver-amount">Waiver Amount ($)</Label>
                      <Input
                        id="waiver-amount"
                        type="number"
                        min={0}
                        step={0.01}
                        value={waiverData.amount || ''}
                        onChange={(e) => onWaiverDataChange({
                          ...waiverData,
                          amount: parseFloat(e.target.value) || 0,
                        })}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Usually matches the estimate total
                      </p>
                    </div>

                    {!selectedWaiverOption?.isFinal && (
                      <div className="space-y-2">
                        <Label htmlFor="waiver-through-date">Through Date</Label>
                        <Input
                          id="waiver-through-date"
                          type="date"
                          value={waiverData.billingPeriodEnd || ''}
                          onChange={(e) => onWaiverDataChange({
                            ...waiverData,
                            billingPeriodEnd: e.target.value,
                          })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Billing period end date
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="waiver-retainage">Retainage ($)</Label>
                      <Input
                        id="waiver-retainage"
                        type="number"
                        min={0}
                        step={0.01}
                        value={waiverData.retainage || ''}
                        onChange={(e) => onWaiverDataChange({
                          ...waiverData,
                          retainage: parseFloat(e.target.value) || 0,
                        })}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Amount withheld (if any)
                      </p>
                    </div>
                  </div>

                  {selectedWaiverOption && (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <FileCheck className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {selectedWaiverOption.label}
                        </span>
                        {selectedWaiverOption.isUnconditional && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            Unconditional
                          </Badge>
                        )}
                        {selectedWaiverOption.isFinal && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            Final
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-emerald-700 mt-1">
                        {selectedWaiverOption.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </TooltipProvider>
  );
}

export default EstimateWaiverSection;
