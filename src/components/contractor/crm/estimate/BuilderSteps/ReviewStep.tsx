import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  List
} from 'lucide-react';
import { EstimateBuilderData } from '../../EstimateBuilder';

interface ReviewStepProps {
  data: EstimateBuilderData;
  onChange: (updates: Partial<EstimateBuilderData>) => void;
}

export default function ReviewStep({ data, onChange }: ReviewStepProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const includedItems = data.line_items.filter(item => item.included !== false);
  const excludedItems = data.line_items.filter(item => item.included === false);

  const completionChecks = [
    { label: 'Project name', complete: !!(data.title || data.project_name) },
    { label: 'Client name', complete: !!data.client_name },
    { label: 'Client email', complete: !!data.client_email },
    { label: 'Line items added', complete: includedItems.length > 0 },
    { label: 'Pricing set', complete: data.grand_total > 0 },
  ];

  const allComplete = completionChecks.every(check => check.complete);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Completion Status */}
      <Card className={allComplete ? 'border-green-500/50' : 'border-amber-500/50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allComplete ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            {allComplete ? 'Ready to Send!' : 'Almost There...'}
          </CardTitle>
          <CardDescription>
            {allComplete 
              ? 'Your estimate is complete and ready to send to the client.'
              : 'Complete the following items before sending.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {completionChecks.map((check, index) => (
              <Badge 
                key={index} 
                variant={check.complete ? 'default' : 'secondary'}
                className={check.complete ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
              >
                {check.complete && <CheckCircle className="h-3 w-3 mr-1" />}
                {check.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project & Client Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Project Name</p>
              <p className="font-medium">{data.title || data.project_name || '—'}</p>
            </div>
            {data.trade_type && (
              <div>
                <p className="text-sm text-muted-foreground">Trade Type</p>
                <p className="font-medium">{data.trade_type}</p>
              </div>
            )}
            {data.prepared_by && (
              <div>
                <p className="text-sm text-muted-foreground">Prepared By</p>
                <p className="font-medium">{data.prepared_by}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <p className="font-medium">{data.client_name || '—'}</p>
            </div>
            {data.client_email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <p className="text-sm">{data.client_email}</p>
              </div>
            )}
            {data.client_phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <p className="text-sm">{data.client_phone}</p>
              </div>
            )}
            {(data.site_address || data.client_address) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <p className="text-sm">{data.site_address || data.client_address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <List className="h-4 w-4" />
            Line Items ({includedItems.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {includedItems.map((item, index) => (
              <div 
                key={item.id || index} 
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {item.description || item.item_description || 'Unnamed item'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit || item.unit_type} × {formatCurrency(item.unit_cost || item.unitPrice || 0)}
                  </p>
                </div>
                <p className="font-medium">
                  {formatCurrency(item.line_total || item.totalPrice || 0)}
                </p>
              </div>
            ))}
          </div>

          {excludedItems.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Excluded Items ({excludedItems.length})
                </p>
                {excludedItems.map((item, index) => (
                  <div 
                    key={item.id || index} 
                    className="flex items-center justify-between py-1 text-muted-foreground"
                  >
                    <span className="text-sm line-through">
                      {item.description || item.item_description || 'Unnamed item'}
                    </span>
                    <span className="text-sm line-through">
                      {formatCurrency(item.line_total || item.totalPrice || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Scope Summary */}
      {(data.scope_objective || data.scope_key_deliverables.length > 0 || data.scope_exclusions.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope of Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.scope_objective && (
              <div>
                <p className="text-sm text-muted-foreground">Objective</p>
                <p className="text-sm">{data.scope_objective}</p>
              </div>
            )}
            {data.scope_key_deliverables.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Key Deliverables</p>
                <ul className="text-sm space-y-1">
                  {data.scope_key_deliverables.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.scope_exclusions.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Exclusions</p>
                <ul className="text-sm space-y-1">
                  {data.scope_exclusions.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(data.subtotal)}</span>
            </div>
            {data.tax_rate > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax ({data.tax_rate}%)</span>
                <span>{formatCurrency(data.tax_amount)}</span>
              </div>
            )}
            {data.permit_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Permit Fees</span>
                <span>{formatCurrency(data.permit_fee)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span className="text-primary">{formatCurrency(data.grand_total)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span>Required Deposit ({data.required_deposit_percent}%)</span>
              <span className="font-medium">{formatCurrency(data.required_deposit)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Balance Due</span>
              <span>{formatCurrency(data.balance_due)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
