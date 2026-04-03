import { Link } from 'react-router-dom';
import { ArrowLeft, Receipt, DollarSign, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useDemoData } from '@/hooks/useDemoData';
import { Skeleton } from '@/components/ui/skeleton';

const invoiceStatusVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary';
    case 'sent': return 'info';
    case 'paid': return 'success';
    case 'partial': return 'warning';
    case 'overdue': return 'destructive';
    case 'void': return 'outline';
    default: return 'default';
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'paid': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case 'overdue': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'partial': return <Clock className="h-4 w-4 text-amber-600" />;
    default: return <Receipt className="h-4 w-4 text-muted-foreground" />;
  }
};

export const DemoInvoicesView = () => {
  const { data: invoices = [], isLoading } = useDemoData('invoices');

  const totalBilled = invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
  const totalCollected = invoices.reduce((sum: number, inv: any) => sum + (inv.amount_paid || 0), 0);
  const overdueAmount = invoices
    .filter((inv: any) => inv.status === 'overdue')
    .reduce((sum: number, inv: any) => sum + ((inv.total || 0) - (inv.amount_paid || 0)), 0);
  const outstandingAmount = totalBilled - totalCollected;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">Invoices & Payments</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">${totalBilled.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Billed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">${totalCollected.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-amber-600">${outstandingAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-destructive">${overdueAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : (
          invoices.map((inv: any) => (
            <Card key={inv.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {statusIcon(inv.status)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium font-mono text-sm">{inv.invoice_number}</p>
                      <Badge variant={invoiceStatusVariant(inv.status)} className="text-[10px] capitalize">
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due: {inv.due_date || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold">${(inv.total || 0).toLocaleString()}</p>
                  {inv.amount_paid > 0 && inv.amount_paid < inv.total && (
                    <p className="text-xs text-emerald-600">Paid: ${inv.amount_paid.toLocaleString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
