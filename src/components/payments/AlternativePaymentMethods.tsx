import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Banknote, Smartphone, Building2 } from 'lucide-react';

interface AlternativePaymentMethodsProps {
  contractor: {
    zelle_email?: string | null;
    zelle_phone?: string | null;
    ach_instructions?: string | null;
    accepted_payment_methods?: string[] | null;
    company_name?: string | null;
  } | null;
  primaryColor?: string;
}

export function AlternativePaymentMethods({ contractor, primaryColor = '#334155' }: AlternativePaymentMethodsProps) {
  if (!contractor) return null;

  const methods = contractor.accepted_payment_methods || ['card'];
  const showZelle = methods.includes('zelle') && (contractor.zelle_email || contractor.zelle_phone);
  const showACH = methods.includes('ach') && contractor.ach_instructions;
  const showCheck = methods.includes('check');

  if (!showZelle && !showACH && !showCheck) return null;

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <Banknote className="h-5 w-5" style={{ color: primaryColor }} />
          Other Ways to Pay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {showZelle && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-bold text-purple-900 dark:text-purple-100 text-lg">Zelle</h4>
            </div>
            <div className="space-y-2 text-sm">
              {contractor.zelle_email && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Email:</span>
                  <span className="font-semibold text-purple-900 dark:text-purple-100">{contractor.zelle_email}</span>
                </div>
              )}
              {contractor.zelle_phone && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-700 dark:text-purple-300 font-medium">Phone:</span>
                  <span className="font-semibold text-purple-900 dark:text-purple-100">{contractor.zelle_phone}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-3">
              Send via your bank app → Zelle → use the info above. Include the estimate/invoice number as a memo.
            </p>
          </div>
        )}

        {showZelle && (showACH || showCheck) && <Separator />}

        {showACH && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-bold text-blue-900 dark:text-blue-100 text-lg">ACH / Bank Transfer</h4>
            </div>
            <pre className="text-sm whitespace-pre-wrap text-blue-900 dark:text-blue-100 bg-white dark:bg-blue-900/30 p-3 rounded-md border border-blue-200 dark:border-blue-700 font-sans">
              {contractor.ach_instructions}
            </pre>
          </div>
        )}

        {(showACH && showCheck) && <Separator />}

        {showCheck && (
          <div className="bg-muted/50 p-5 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-bold text-lg">Check</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Make checks payable to <span className="font-bold text-foreground">{contractor.company_name || 'the contractor'}</span>. 
              Please include the estimate/invoice number on the memo line.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}