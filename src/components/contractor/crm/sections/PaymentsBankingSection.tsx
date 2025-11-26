import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Building2, ArrowUpRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { usePlaidLink } from '@/hooks/usePlaidLink';

export function PaymentsBankingSection() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);

  const handleStripeTestPayment = async () => {
    setLoading(true);
    try {
      // Ensure customer exists
      const { data: customerData, error: customerError } = await supabase.functions.invoke(
        'stripe-ensure-customer'
      );

      if (customerError) throw customerError;

      // Create checkout session
      const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
        body: {
          amount: 5000, // $50.00
          description: 'CT1 Test Payment',
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Stripe test payment error:', error);
      toast.error(error.message || 'Failed to create test payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    try {
      const { error } = await supabase.functions.invoke('plaid-exchange-token', {
        body: {
          public_token: publicToken,
          institution_name: metadata.institution?.name || 'Unknown Bank',
        },
      });

      if (error) throw error;

      toast.success('Bank account connected successfully!');
    } catch (error: any) {
      console.error('Plaid exchange error:', error);
      toast.error(error.message || 'Failed to connect bank account');
    }
  };

  const { open: openPlaidLink, ready: plaidReady } = usePlaidLink({
    onSuccess: handlePlaidSuccess,
  });

  const handleTransactionSync = async () => {
    setSyncLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('plaid-transactions-sync');

      if (error) throw error;

      if (data?.bankAccountLinks && data.bankAccountLinks.length > 0) {
        const allTransactions = data.bankAccountLinks.flatMap((link: any) =>
          link.transactions.map((t: any) => ({
            ...t,
            institutionName: link.institutionName,
          }))
        );
        setTransactions(allTransactions);
        toast.success(`Synced ${allTransactions.length} transactions`);
      } else {
        toast.info('No bank accounts connected yet');
      }
    } catch (error: any) {
      console.error('Transaction sync error:', error);
      toast.error(error.message || 'Failed to sync transactions');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payments & Banking</h2>
        <p className="text-muted-foreground">
          Manage Stripe payments and connect bank accounts with Plaid
        </p>
        <Badge variant="secondary" className="mt-2">Beta</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stripe Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Stripe Payments</CardTitle>
            </div>
            <CardDescription>
              Accept payments from customers using Stripe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleStripeTestPayment}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Create Test Payment ($50)
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Test your Stripe integration with a $50 checkout session
            </p>
          </CardContent>
        </Card>

        {/* Plaid Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Bank Accounts</CardTitle>
            </div>
            <CardDescription>
              Connect business bank accounts with Plaid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={openPlaidLink}
              disabled={!plaidReady}
              variant="outline"
              className="w-full"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Connect Bank Account
            </Button>
            <Button
              onClick={handleTransactionSync}
              disabled={syncLoading}
              variant="secondary"
              className="w-full"
            >
              {syncLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Transaction Sync
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Display */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Last 30 days from connected accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-left py-2">Bank</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((tx, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{tx.date}</td>
                      <td className="py-2">{tx.name}</td>
                      <td className="py-2 text-muted-foreground">{tx.institutionName}</td>
                      <td className={`py-2 text-right font-medium ${
                        tx.amount < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.amount < 0 ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length > 10 && (
              <p className="text-xs text-muted-foreground mt-4">
                Showing 10 of {transactions.length} transactions
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
