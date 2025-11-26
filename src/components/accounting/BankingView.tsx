import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus, RefreshCw, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePlaidLink } from "@/hooks/usePlaidLink";

export function BankingView() {
  const { user } = useAuth();
  
  const { open: openPlaid } = usePlaidLink({
    onSuccess: async (publicToken: string, metadata: any) => {
      try {
        // Exchange public token for access token
        const { error } = await supabase.functions.invoke('plaid-exchange-token', {
          body: { public_token: publicToken, metadata }
        });

        if (error) throw error;

        // Refresh bank accounts
        window.location.reload();
      } catch (error) {
        console.error('Failed to link bank account:', error);
      }
    }
  });

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

  const handleSyncTransactions = async () => {
    // Call Plaid sync endpoint
    console.log('Syncing transactions...');
  };

  if (loadingAccounts) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Banking</h2>
          <p className="text-muted-foreground">
            Manage bank accounts and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Transactions
          </Button>
          <Button onClick={openPlaid}>
            <Plus className="h-4 w-4 mr-2" />
            Link Bank Account
          </Button>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Linked Accounts</h3>
        {bankAccounts && bankAccounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {bankAccounts.map((account: any) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {account.plaid_institution_name || 'Bank Account'}
                        </CardTitle>
                        <CardDescription>
                          Connected {new Date(account.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Last synced: {new Date(account.updated_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No bank accounts linked</p>
              <p className="text-sm text-muted-foreground mb-4">
                Link your bank account to automatically sync transactions
              </p>
              <Button onClick={openPlaid}>
                <Plus className="h-4 w-4 mr-2" />
                Link Bank Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transactions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        {loadingTransactions ? (
          <Skeleton className="h-64 w-full" />
        ) : transactions && transactions.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {transactions.map((txn: any) => (
                  <div key={txn.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${Number(txn.amount) < 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                          {Number(txn.amount) < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">{txn.vendor || txn.description || 'Transaction'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(txn.transaction_date).toLocaleDateString()}
                          </p>
                          {txn.category && (
                            <Badge variant="outline" className="text-xs">{txn.category}</Badge>
                          )}
                          {txn.job && (
                            <Badge variant="secondary" className="text-xs ml-2">{txn.job.name}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${Number(txn.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {Number(txn.amount) < 0 ? '-' : ''}${Math.abs(Number(txn.amount)).toFixed(2)}
                        </p>
                        {txn.is_reimbursable && (
                          <Badge variant="default" className="text-xs mt-1">Reimbursable</Badge>
                        )}
                      </div>
                    </div>
                    {txn.notes && (
                      <p className="text-sm text-muted-foreground mt-2 ml-11">{txn.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No transactions yet</p>
              <p className="text-sm text-muted-foreground">
                Link a bank account to see your transactions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
