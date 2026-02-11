/**
 * BankingView — Pure bank experience.
 * Shows ONLY bank accounts, balances, and transactions.
 * All QuickBooks content has been removed from this tab.
 *
 * Connection status is checked via:
 *   - Bank: `bank_account_links` table (user_id, status = 'active')
 *   - QB/Stripe: checked for the Financial Connections dropdown only
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2, RefreshCw, DollarSign, TrendingDown, TrendingUp, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePlaidLink } from "@/hooks/usePlaidLink";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { FinancialConnectionsDropdown } from "./FinancialConnectionsDropdown";

export function BankingView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [qbConnected, setQbConnected] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);

  const { open: openPlaid } = usePlaidLink({
    onSuccess: async (publicToken: string, metadata: any) => {
      try {
        const { error } = await supabase.functions.invoke("plaid-exchange-token", {
          body: { public_token: publicToken, metadata },
        });
        if (error) throw error;
        window.location.reload();
      } catch (error) {
        console.error("Failed to link bank account:", error);
      }
    },
  });

  // Check QB and Stripe connection statuses
  useEffect(() => {
    const checkConnections = async () => {
      if (!user?.id) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("qb_realm_id, stripe_connect_account_id")
        .eq("id", user.id)
        .single();
      setQbConnected(!!profile?.qb_realm_id);
      setStripeConnected(!!profile?.stripe_connect_account_id);
    };
    checkConnections();

    if (searchParams.get("qb_connected") === "true") {
      toast({ title: "QuickBooks Connected!", description: "Your QuickBooks account has been successfully connected." });
      setQbConnected(true);
    }
    if (searchParams.get("qb_error")) {
      toast({ variant: "destructive", title: "Connection Failed", description: searchParams.get("qb_error") || "Failed to connect" });
    }
  }, [user?.id, searchParams, toast]);

  // Bank accounts
  const { data: bankAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ["bank-accounts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("bank_account_links")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");
      return data || [];
    },
    enabled: !!user?.id,
  });

  const bankConnected = (bankAccounts?.length || 0) > 0;

  // Bank transactions (only if bank connected)
  const { data: transactions, isLoading: loadingTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ["plaid-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("plaid_transactions")
        .select("*, job:jobs(name)")
        .eq("contractor_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user?.id && bankConnected,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);

  if (loadingAccounts) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Banking</h2>
          <p className="text-sm text-muted-foreground">
            {bankConnected
              ? `${bankAccounts!.length} bank ${bankAccounts!.length === 1 ? "account" : "accounts"} linked`
              : "Link a bank account to view balances and transactions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FinancialConnectionsDropdown
            connections={{ bankConnected, qbConnected, stripeConnected }}
            onConnectBank={openPlaid}
            onConnectionChange={() => window.location.reload()}
          />
          {bankConnected && (
            <Button variant="outline" size="sm" onClick={() => { refetchTransactions(); toast({ title: "Syncing..." }); }}>
              <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Sync</span>
            </Button>
          )}
        </div>
      </div>

      {/* EMPTY STATE — no bank connected */}
      {!bankConnected && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Link Your Bank Account</p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md px-4">
              Connect your bank to view account balances, recent transactions, and reconciliation status. All data stays secure and private.
            </p>
            <Button onClick={openPlaid} className="min-h-[44px]">
              <Building2 className="h-4 w-4 mr-2" />
              Link Bank Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* BANK ACCOUNTS */}
      {bankConnected && (
        <>
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-semibold">Linked Accounts</h3>
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
              {bankAccounts!.map((account: any) => (
                <Card key={account.id}>
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm md:text-base truncate">
                            {account.plaid_institution_name || "Bank Account"}
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
          </div>

          {/* TRANSACTIONS */}
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
                            <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${Number(txn.amount) < 0 ? "bg-destructive/10" : "bg-green-100 dark:bg-green-900/30"}`}>
                              {Number(txn.amount) < 0 ? (
                                <TrendingDown className="h-4 w-4 text-destructive" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="font-medium text-sm truncate">
                                {txn.vendor || txn.description || "Transaction"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(txn.transaction_date).toLocaleDateString()}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {txn.category && <Badge variant="outline" className="text-xs">{txn.category}</Badge>}
                                {txn.job && <Badge variant="secondary" className="text-xs">{txn.job.name}</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm md:text-base font-semibold tabular-nums ${Number(txn.amount) < 0 ? "text-destructive" : "text-green-600"}`}>
                              {formatCurrency(Number(txn.amount))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 md:py-12">
                  <DollarSign className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-base font-semibold mb-2">No transactions yet</p>
                  <p className="text-sm text-muted-foreground text-center px-4">
                    Transactions will appear here after your bank syncs
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
