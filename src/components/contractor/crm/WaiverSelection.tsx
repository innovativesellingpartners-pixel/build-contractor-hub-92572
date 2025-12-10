import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, FileText, Info } from 'lucide-react';

export interface WaiverType {
  id: 'conditional_progress' | 'unconditional_progress' | 'conditional_final' | 'unconditional_final';
  label: string;
  description: string;
  isUnconditional: boolean;
  isFinal: boolean;
}

export const WAIVER_TYPES: WaiverType[] = [
  {
    id: 'conditional_progress',
    label: 'Conditional Waiver and Release on Progress Payment',
    description: 'Effective only when payment clears, applies to current billing cycle.',
    isUnconditional: false,
    isFinal: false,
  },
  {
    id: 'unconditional_progress',
    label: 'Unconditional Waiver and Release on Progress Payment',
    description: 'Payment already received for current cycle. Use only after payment has cleared.',
    isUnconditional: true,
    isFinal: false,
  },
  {
    id: 'conditional_final',
    label: 'Conditional Waiver and Release on Final Payment',
    description: 'Final payment pending, release becomes effective once funds clear.',
    isUnconditional: false,
    isFinal: true,
  },
  {
    id: 'unconditional_final',
    label: 'Unconditional Waiver and Release on Final Payment',
    description: 'Final payment fully received. Use only after final payment has cleared.',
    isUnconditional: true,
    isFinal: true,
  },
];

export interface SelectedWaiver {
  type: WaiverType['id'];
  amount: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  retainage?: number;
}

interface WaiverSelectionProps {
  selectedWaivers: SelectedWaiver[];
  onWaiversChange: (waivers: SelectedWaiver[]) => void;
  defaultAmount: number;
}

export function WaiverSelection({ selectedWaivers, onWaiversChange, defaultAmount }: WaiverSelectionProps) {
  const [showUnconditionalWarning, setShowUnconditionalWarning] = useState(false);
  const [pendingWaiver, setPendingWaiver] = useState<WaiverType['id'] | null>(null);

  const isWaiverSelected = (id: WaiverType['id']) => 
    selectedWaivers.some(w => w.type === id);

  const getWaiverData = (id: WaiverType['id']) =>
    selectedWaivers.find(w => w.type === id);

  const handleWaiverToggle = (waiver: WaiverType, checked: boolean) => {
    if (checked) {
      if (waiver.isUnconditional) {
        setPendingWaiver(waiver.id);
        setShowUnconditionalWarning(true);
        return;
      }
      addWaiver(waiver.id);
    } else {
      removeWaiver(waiver.id);
    }
  };

  const addWaiver = (id: WaiverType['id']) => {
    const today = new Date().toISOString().split('T')[0];
    onWaiversChange([
      ...selectedWaivers,
      {
        type: id,
        amount: defaultAmount,
        billingPeriodEnd: today,
        retainage: 0,
      },
    ]);
  };

  const removeWaiver = (id: WaiverType['id']) => {
    onWaiversChange(selectedWaivers.filter(w => w.type !== id));
  };

  const updateWaiver = (id: WaiverType['id'], updates: Partial<SelectedWaiver>) => {
    onWaiversChange(
      selectedWaivers.map(w => 
        w.type === id ? { ...w, ...updates } : w
      )
    );
  };

  const confirmUnconditionalWaiver = () => {
    if (pendingWaiver) {
      addWaiver(pendingWaiver);
    }
    setShowUnconditionalWarning(false);
    setPendingWaiver(null);
  };

  const cancelUnconditionalWaiver = () => {
    setShowUnconditionalWarning(false);
    setPendingWaiver(null);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Lien Waivers (Optional)</Label>
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

        <div className="space-y-3">
          {WAIVER_TYPES.map((waiver) => {
            const selected = isWaiverSelected(waiver.id);
            const waiverData = getWaiverData(waiver.id);

            return (
              <div
                key={waiver.id}
                className={`border rounded-lg p-3 transition-colors ${
                  selected ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={waiver.id}
                    checked={selected}
                    onCheckedChange={(checked) => handleWaiverToggle(waiver, checked === true)}
                    disabled={showUnconditionalWarning}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label 
                        htmlFor={waiver.id} 
                        className="text-sm font-medium cursor-pointer leading-tight"
                      >
                        {waiver.label}
                      </Label>
                      <div className="flex gap-1">
                        {waiver.isUnconditional && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            Unconditional
                          </Badge>
                        )}
                        {waiver.isFinal && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Final
                          </Badge>
                        )}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-xs">{waiver.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {selected && waiverData && (
                  <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <Input
                        type="number"
                        value={waiverData.amount}
                        onChange={(e) => updateWaiver(waiver.id, { amount: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-sm"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    {!waiver.isFinal && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Through Date</Label>
                        <Input
                          type="date"
                          value={waiverData.billingPeriodEnd || ''}
                          onChange={(e) => updateWaiver(waiver.id, { billingPeriodEnd: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Retainage</Label>
                      <Input
                        type="number"
                        value={waiverData.retainage || 0}
                        onChange={(e) => updateWaiver(waiver.id, { retainage: parseFloat(e.target.value) || 0 })}
                        className="h-8 text-sm"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedWaivers.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">
              <strong>{selectedWaivers.length}</strong> waiver(s) will be generated and attached to the invoice
            </p>
            <div className="space-y-1">
              {selectedWaivers.map(w => {
                const waiverType = WAIVER_TYPES.find(t => t.id === w.type);
                return (
                  <div key={w.type} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{waiverType?.label.split(' on ')[0]}</span>
                    <span className="font-medium">${w.amount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
