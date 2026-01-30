import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Shield, Plus, Star, AlertCircle } from 'lucide-react';
import { useWarranties, ContractorWarranty } from '@/hooks/useWarranties';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface WarrantySectionProps {
  selectedWarrantyId: string | null;
  warrantyText: string;
  onWarrantyChange: (warranty: {
    warranty_id: string | null;
    warranty_text: string;
    warranty_duration_years: number;
    warranty_duration_months: number;
  }) => void;
  onManageWarranties?: () => void;
}

export function WarrantySection({
  selectedWarrantyId,
  warrantyText,
  onWarrantyChange,
  onManageWarranties,
}: WarrantySectionProps) {
  const { warranties, isLoading, getDefaultWarranty } = useWarranties();
  const [isCustom, setIsCustom] = useState(false);
  const [customText, setCustomText] = useState(warrantyText || '');

  // Apply default warranty on initial load if none selected
  useEffect(() => {
    if (!selectedWarrantyId && !warrantyText && warranties && warranties.length > 0) {
      const defaultWarranty = getDefaultWarranty();
      if (defaultWarranty) {
        onWarrantyChange({
          warranty_id: defaultWarranty.id,
          warranty_text: defaultWarranty.warranty_text,
          warranty_duration_years: defaultWarranty.duration_years,
          warranty_duration_months: defaultWarranty.duration_months,
        });
      }
    }
  }, [warranties, selectedWarrantyId, warrantyText]);

  const handleWarrantySelect = (warrantyId: string) => {
    if (warrantyId === 'custom') {
      setIsCustom(true);
      onWarrantyChange({
        warranty_id: null,
        warranty_text: customText,
        warranty_duration_years: 1,
        warranty_duration_months: 0,
      });
    } else if (warrantyId === 'none') {
      setIsCustom(false);
      setCustomText('');
      onWarrantyChange({
        warranty_id: null,
        warranty_text: '',
        warranty_duration_years: 0,
        warranty_duration_months: 0,
      });
    } else {
      setIsCustom(false);
      const warranty = warranties?.find(w => w.id === warrantyId);
      if (warranty) {
        onWarrantyChange({
          warranty_id: warranty.id,
          warranty_text: warranty.warranty_text,
          warranty_duration_years: warranty.duration_years,
          warranty_duration_months: warranty.duration_months,
        });
      }
    }
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    onWarrantyChange({
      warranty_id: null,
      warranty_text: text,
      warranty_duration_years: 1,
      warranty_duration_months: 0,
    });
  };

  const selectedWarranty = warranties?.find(w => w.id === selectedWarrantyId);
  const currentValue = isCustom ? 'custom' : (selectedWarrantyId || (warrantyText ? 'custom' : 'none'));

  const formatDuration = (years: number, months: number) => {
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    return parts.join(' ') || 'No duration';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Warranty
        </CardTitle>
        <CardDescription>
          Include a warranty with your estimate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Warranty Template</Label>
            {onManageWarranties && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-xs h-auto p-0"
                onClick={onManageWarranties}
              >
                <Plus className="h-3 w-3 mr-1" />
                Manage Warranties
              </Button>
            )}
          </div>
          
          <Select value={currentValue} onValueChange={handleWarrantySelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a warranty..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">No warranty</span>
              </SelectItem>
              
              {warranties && warranties.length > 0 && (
                <>
                  {warranties.map((warranty) => (
                    <SelectItem key={warranty.id} value={warranty.id}>
                      <div className="flex items-center gap-2">
                        {warranty.name}
                        {warranty.is_default && (
                          <Star className="h-3 w-3 text-primary" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          ({formatDuration(warranty.duration_years, warranty.duration_months)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
              
              <SelectItem value="custom">
                <span className="text-primary">Write custom warranty...</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Show selected warranty preview */}
        {selectedWarranty && !isCustom && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {formatDuration(selectedWarranty.duration_years, selectedWarranty.duration_months)}
              </Badge>
              {selectedWarranty.is_default && (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3" />
                  Default
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {selectedWarranty.warranty_text}
            </p>
          </div>
        )}

        {/* Custom warranty text area */}
        {(isCustom || (currentValue === 'custom' && !selectedWarrantyId)) && (
          <div className="space-y-2">
            <Label htmlFor="custom-warranty">Custom Warranty Text</Label>
            <Textarea
              id="custom-warranty"
              value={customText || warrantyText}
              onChange={(e) => handleCustomTextChange(e.target.value)}
              placeholder="Enter your custom warranty terms..."
              rows={5}
            />
          </div>
        )}

        {/* No warranties message */}
        {(!warranties || warranties.length === 0) && currentValue === 'none' && (
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg border border-border">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                No warranty templates found
              </p>
              <p className="text-xs text-muted-foreground">
                Create warranty templates in your profile settings to quickly add warranties to estimates.
              </p>
              {onManageWarranties && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={onManageWarranties}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Warranty Template
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
