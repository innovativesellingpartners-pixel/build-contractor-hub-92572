import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, RefreshCw, DollarSign, TrendingDown, TrendingUp, Link as LinkIcon, CheckCircle, Loader2, ChevronDown, CreditCard, FileText, Unlink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlaidLink } from "@/hooks/usePlaidLink";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BankingView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [qbLoading, setQbLoading] = useState(false);
  const [qbConnected, setQbConnected] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  
  const { open: openPlaid } = usePlaidLink({
    onSuccess: async (publicToken: string, metadata: any) => {
      try {
        const { error } = await supabase.functions.invoke('plaid-exchange-token', {
          body: { public_token: publicToken, metadata }
        });
        if (error) throw error;
        window.location.reload();
      } catch (error) {
        console.error('Failed to link bank account:', error);
      }
    }
  });

  useEffect(() => {
    const checkConnections = async () => {
      if (!user?.id) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('qb_realm_id, stripe_connect_account_id')
        .eq('id', user.id)
        .single();
      setQbConnected(!!profile?.qb_realm_id);
      setStripeConnected(!!profile?.stripe_connect_account_id);
    };
    checkConnections();

    if (searchParams.get('qb_connected') === 'true') {
      toast({
        title: "QuickBooks Connected!",
        description: "Your QuickBooks account has been successfully connected.",
      });
      setQbConnected(true);
    }
    if (searchParams.get('qb_error')) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: searchParams.get('qb_error') || "Failed to connect to QuickBooks",
      });
    }
  }, [user?.id, searchParams, toast]);

  const handleConnectQuickBooks = async () => {
    try {
      setQbLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-connect');
      if (error) {
        toast({ variant: "destructive", title: "Connection Failed", description: error.message || "Failed to initiate QuickBooks connection" });
        return;
      }
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Connection Failed", description: error.message || "Failed to connect to QuickBooks" });
    } finally {
      setQbLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setStripeLoading(true);
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboard');
      if (error) {
        toast({ variant: "destructive", title: "Connection Failed", description: error.message || "Failed to initiate Stripe connection" });
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Connection Failed", description: error.message || "Failed to connect to Stripe" });
    } finally {
      setStripeLoading(false);
    }
  };

  const handleDisconnectQuickBooks = async () => {
    try {
      setQbLoading(true);
      const { error } = await supabase.functions.invoke('quickbooks-disconnect');
      if (error) {
        toast({ variant: "destructive", title: "Disconnect Failed", description: error.message || "Failed to disconnect QuickBooks" });
        return;
      }
      setQbConnected(false);
      toast({ title: "Disconnected", description: "QuickBooks has been disconnected." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Disconnect Failed", description: error.message || "Failed to disconnect QuickBooks" });
    } finally {
      setQbLoading(false);
    }
  };

  const { data: bankAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['bank-accounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('bank_account_links')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');
      return data || [];
    },
    enabled: !!user?.id
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['plaid-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('plaid_transactions')
        .select('*, job:jobs(name)')
        .eq('contractor_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user?.id
  });

  // QuickBooks invoices query
  const { data: qbInvoices, isLoading: loadingQbInvoices, refetch: refetchQbInvoices } = useQuery({
    queryKey: ['qb-invoices', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('quickbooks-invoices');
      if (error) throw error;
      return data?.invoices || [];
    },
    enabled: !!user?.id && qbConnected
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSyncTransactions = async () => {
    console.log('Syncing transactions...');
    if (qbConnected) refetchQbInvoices();
  };

  if (loadingAccounts) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - stacks vertically on mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Banking</h2>
          <p className="text-sm text-muted-foreground">
            Manage bank accounts and transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <LinkIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Financial </span>Connections
                <ChevronDown className="h-4 w-4 ml-1 sm:ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
              <DropdownMenuItem onClick={openPlaid}>
                <Building2 className="h-4 w-4 mr-2" />
                Link Bank Account
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={qbConnected ? undefined : handleConnectQuickBooks}
                disabled={qbConnected || qbLoading}
              >
                {qbLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : qbConnected ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <LinkIcon className="h-4 w-4 mr-2" />
                )}
                {qbConnected ? "QuickBooks Connected" : "Connect QuickBooks"}
              </DropdownMenuItem>
              {qbConnected && (
                <DropdownMenuItem 
                  onClick={handleDisconnectQuickBooks}
                  disabled={qbLoading}
                  className="text-destructive focus:text-destructive"
                >
                  {qbLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4 mr-2" />
                  )}
                  Disconnect QuickBooks
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={stripeConnected ? undefined : handleConnectStripe}
                disabled={stripeConnected || stripeLoading}
              >
                {stripeLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : stripeConnected ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {stripeConnected ? "Stripe Connected" : "Connect Stripe"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={handleSyncTransactions}>
            <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold">Linked Accounts</h3>
        {bankAccounts && bankAccounts.length > 0 ? (
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
            {bankAccounts.map((account: any) => (
              <Card key={account.id}>
                <CardHeader className="p-4 md:p-6">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm md:text-base truncate">
                          {account.plaid_institution_name || 'Bank Account'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Connected {new Date(account.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="default" className="flex-shrink-0">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 md:px-6 md:pb-6 pt-0">
                  <div className="text-xs text-muted-foreground">
                    Last synced: {new Date(account.updated_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 md:py-12">
              <Building2 className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
              <p className="text-base md:text-lg font-semibold mb-2">No bank accounts linked</p>
              <p className="text-sm text-muted-foreground mb-4 text-center px-4">
                Link your bank account to automatically sync transactions
              </p>
              <Button onClick={openPlaid} className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Link Bank Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* QuickBooks Invoices - shown when connected */}
      {qbConnected && (
        <div className="space-y-3">
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            QuickBooks Invoices
          </h3>
          {loadingQbInvoices ? (
            <Skeleton className="h-48 w-full" />
          ) : qbInvoices && qbInvoices.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                {/* Desktop table */}
                <div className="hidden md:block">
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
                      {qbInvoices.map((inv: any) => (
                        <TableRow key={inv.invoiceId}>
                          <TableCell className="font-medium">{inv.docNumber}</TableCell>
                          <TableCell>{inv.customerName}</TableCell>
                          <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                          <TableCell>{formatDate(inv.dueDate)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(inv.totalAmount)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(inv.balance)}</TableCell>
                          <TableCell>
                            <Badge variant={inv.status === 'Paid' ? 'default' : 'secondary'}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile list rows */}
                <div className="md:hidden divide-y">
                  {qbInvoices.map((inv: any) => (
                    <div key={inv.invoiceId} className="p-3 min-h-[56px]">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{inv.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            #{inv.docNumber} · {formatDate(inv.invoiceDate)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-sm tabular-nums">{formatCurrency(inv.totalAmount)}</p>
                          <Badge variant={inv.status === 'Paid' ? 'default' : 'secondary'} className="text-xs mt-1">
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                      {inv.balance > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Balance: <span className="tabular-nums">{formatCurrency(inv.balance)}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-base font-semibold mb-1">No invoices found</p>
                <p className="text-sm text-muted-foreground text-center px-4">
                  Your QuickBooks invoices will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Transactions - mobile-friendly list rows */}
      <div className="space-y-3">
        <h3 className="text-base md:text-lg font-semibold">Recent Transactions</h3>
        {loadingTransactions ? (
          <Skeleton className="h-48 w-full" />
        ) : transactions && transactions.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {transactions.map((txn: any) => (
                  <div key={txn.id} className="p-3 md:p-4 hover:bg-muted/50 transition-colors min-h-[56px]">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${Number(txn.amount) < 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                          {Number(txn.amount) < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium text-sm truncate">{txn.vendor || txn.description || 'Transaction'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(txn.transaction_date).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {txn.category && (
                              <Badge variant="outline" className="text-xs">{txn.category}</Badge>
                            )}
                            {txn.job && (
                              <Badge variant="secondary" className="text-xs">{txn.job.name}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm md:text-base font-semibold tabular-nums ${Number(txn.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {Number(txn.amount) < 0 ? '-' : ''}${Math.abs(Number(txn.amount)).toFixed(2)}
                        </p>
                        {txn.is_reimbursable && (
                          <Badge variant="default" className="text-xs mt-1">Reimbursable</Badge>
                        )}
                      </div>
                    </div>
                    {txn.notes && (
                      <p className="text-xs text-muted-foreground mt-2 ml-9 md:ml-11">{txn.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 md:py-12">
              <DollarSign className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
              <p className="text-base md:text-lg font-semibold mb-2">No transactions yet</p>
              <p className="text-sm text-muted-foreground text-center px-4">
                Link a bank account to see your transactions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
