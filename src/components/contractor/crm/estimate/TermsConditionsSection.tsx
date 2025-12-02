import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, FileText } from 'lucide-react';

interface TermsConditionsSectionProps {
  validityDays: number;
  paymentScheduleText: string;
  changeOrderText: string;
  insuranceText: string;
  warrantyYears: number;
  warrantyText: string;
  onChange: (field: string, value: string | number) => void;
  depositAmount?: number;
  companyName?: string;
}

const DEFAULT_PAYMENT_TEMPLATE = `A non-refundable deposit of {depositAmount} is required upon signing to secure scheduling and commence material procurement. The remaining balance is due upon project completion. Failure to adhere to the payment schedule may result in work stoppage and rescheduling fees.`;

const DEFAULT_CHANGE_ORDER_TEMPLATE = `Any work requested outside of the Scope and Line Items detailed in this estimate will require a written Change Order. Both parties must sign any Change Order before additional work commences. Price and schedule may change based on the nature of the requested modifications.`;

const DEFAULT_INSURANCE_TEMPLATE = `{companyName} maintains general liability and workers' compensation insurance. Copies of certificates are available upon request.`;

const DEFAULT_WARRANTY_TEMPLATE = `A standard {warrantyYears} year warranty is provided on workmanship from the date of substantial completion. This warranty excludes normal wear and tear or damage caused by improper use, client modifications, or acts of nature.`;

export default function TermsConditionsSection({
  validityDays,
  paymentScheduleText,
  changeOrderText,
  insuranceText,
  warrantyYears,
  warrantyText,
  onChange,
  depositAmount = 0,
  companyName = 'Our company',
}: TermsConditionsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize with templates if empty
  useEffect(() => {
    if (!paymentScheduleText) {
      onChange('paymentScheduleText', DEFAULT_PAYMENT_TEMPLATE.replace('{depositAmount}', `$${depositAmount.toFixed(2)}`));
    }
    if (!changeOrderText) {
      onChange('changeOrderText', DEFAULT_CHANGE_ORDER_TEMPLATE);
    }
    if (!insuranceText) {
      onChange('insuranceText', DEFAULT_INSURANCE_TEMPLATE.replace('{companyName}', companyName));
    }
    if (!warrantyText) {
      onChange('warrantyText', DEFAULT_WARRANTY_TEMPLATE.replace('{warrantyYears}', String(warrantyYears)));
    }
  }, []);

  // Update templates when values change
  useEffect(() => {
    if (paymentScheduleText.includes('{depositAmount}')) {
      onChange('paymentScheduleText', paymentScheduleText.replace('{depositAmount}', `$${depositAmount.toFixed(2)}`));
    }
  }, [depositAmount]);

  useEffect(() => {
    if (warrantyText.includes('{warrantyYears}')) {
      onChange('warrantyText', warrantyText.replace('{warrantyYears}', String(warrantyYears)));
    }
  }, [warrantyYears]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2 border-border/50">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Terms & Conditions
            </CardTitle>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Validity Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validity_days" className="text-sm font-semibold">
                  Estimate Valid For (days)
                </Label>
                <Input
                  id="validity_days"
                  type="number"
                  min="1"
                  value={validityDays}
                  onChange={(e) => onChange('validityDays', parseInt(e.target.value) || 30)}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty_years" className="text-sm font-semibold">
                  Warranty Period (years)
                </Label>
                <Input
                  id="warranty_years"
                  type="number"
                  min="1"
                  value={warrantyYears}
                  onChange={(e) => onChange('warrantyYears', parseInt(e.target.value) || 2)}
                  className="w-32"
                />
              </div>
            </div>

            {/* Payment Schedule */}
            <div className="space-y-2">
              <Label htmlFor="payment_schedule" className="text-sm font-semibold">
                Payment Schedule Terms
              </Label>
              <Textarea
                id="payment_schedule"
                value={paymentScheduleText}
                onChange={(e) => onChange('paymentScheduleText', e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Change Orders */}
            <div className="space-y-2">
              <Label htmlFor="change_orders" className="text-sm font-semibold">
                Change Order Policy
              </Label>
              <Textarea
                id="change_orders"
                value={changeOrderText}
                onChange={(e) => onChange('changeOrderText', e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Insurance */}
            <div className="space-y-2">
              <Label htmlFor="insurance" className="text-sm font-semibold">
                Insurance & Liability
              </Label>
              <Textarea
                id="insurance"
                value={insuranceText}
                onChange={(e) => onChange('insuranceText', e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            {/* Warranty */}
            <div className="space-y-2">
              <Label htmlFor="warranty" className="text-sm font-semibold">
                Warranty Terms
              </Label>
              <Textarea
                id="warranty"
                value={warrantyText}
                onChange={(e) => onChange('warrantyText', e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
