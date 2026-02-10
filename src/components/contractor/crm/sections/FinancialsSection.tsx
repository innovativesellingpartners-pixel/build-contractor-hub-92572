import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Invoice {
  invoiceId: string;
  docNumber: string;
  customerName: string;
  customerId: string | null;
  totalAmount: number;
  balance: number;
  status: string;
  invoiceDate: string | null;
  dueDate: string | null;
}

interface FinancialsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function FinancialsSection({ onSectionChange }: FinancialsSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnectionAndLoadInvoices();
  }, []);

  const checkConnectionAndLoadInvoices = async () => {
    try {
      setLoading(true);

      // Check if QuickBooks is connected
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('qb_realm_id')
        .eq('id', user.id)
        .single();

      if (!profile?.qb_realm_id) {
        setIsConnected(false);
        setLoading(false);
        return;
      }

      setIsConnected(true);

      // Load invoices
      const { data, error } = await supabase.functions.invoke('quickbooks-invoices');

      if (error) {
        throw error;
      }

      if (data?.success && data?.invoices) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invoices from QuickBooks.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle>QuickBooks Not Connected</CardTitle>
            </div>
            <CardDescription>
              QuickBooks is not connected for your account. Go to Integrations and connect QuickBooks to view your invoices and financial data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/crm?section=accounting'}>
              Go to Accounting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-background pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Financials</h1>
          <p className="text-sm text-muted-foreground">QuickBooks invoice overview</p>
        </div>
        <Button onClick={checkConnectionAndLoadInvoices} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">QuickBooks Invoices</CardTitle>
          <CardDescription>
            {invoices.length > 0 
              ? `Showing ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`
              : 'No invoices found'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.invoiceId}>
                        <TableCell className="font-medium">{invoice.docNumber}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(invoice.balance)}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'Paid' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile list rows */}
              <div className="md:hidden divide-y">
                {invoices.map((invoice) => (
                  <div key={invoice.invoiceId} className="py-3 first:pt-0 last:pb-0 min-h-[56px]">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{invoice.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          #{invoice.docNumber} · {formatDate(invoice.invoiceDate)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm tabular-nums">{formatCurrency(invoice.totalAmount)}</p>
                        <Badge variant={invoice.status === 'Paid' ? 'default' : 'secondary'} className="text-xs mt-1">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                    {invoice.balance > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Balance: <span className="tabular-nums">{formatCurrency(invoice.balance)}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 md:py-12 text-muted-foreground">
              <DollarSign className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
              <p>No invoices found in QuickBooks</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
