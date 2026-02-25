/**
 * BankingView — Unified banking experience.
 * Shows bank accounts (Plaid + Teller), balances, and transactions.
 * Teller connections use mTLS edge functions for syncing.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2, RefreshCw, DollarSign, TrendingDown, TrendingUp, Loader2, ArrowLeftRight, Unlink
} from "lucide-react";
import { ExpenseAssignmentDialog } from "./expense-assignment";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { usePlaidLink } from "@/hooks/usePlaidLink";
import { useTellerConnect } from "@/hooks/useTellerConnect";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { FinancialConnectionsDropdown } from "./FinancialConnectionsDropdown";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function BankingView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [qbConnected, setQbConnected] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["teller-connections"] });
    queryClient.invalidateQueries({ queryKey: ["plaid-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["teller-transactions"] });
  };

  const { open: openPlaid } = usePlaidLink({
    onSuccess: async (publicToken: string, metadata: any) => {
      try {
        const { error } = await supabase.functions.invoke("plaid-exchange-token", {
          body: { public_token: publicToken, metadata },
        });
        if (error) throw error;
        refreshAll();
      } catch (error) {
        console.error("Failed to link bank account:", error);
      }
    },
  });

  const { open: openTeller, loading: tellerLoading } = useTellerConnect({
    onSuccess: () => refreshAll(),
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

  // Plaid bank accounts
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

  // Teller connections
  const { data: tellerConnections, isLoading: loadingTeller } = useQuery({
    queryKey: ["teller-connections", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("teller_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");
      return data || [];
    },
    enabled: !!user?.id,
  });

  const bankConnected = (bankAccounts?.length || 0) > 0;
  const tellerConnected = (tellerConnections?.length || 0) > 0;
  const anyBankConnected = bankConnected || tellerConnected;

  // Plaid transactions
  const { data: plaidTransactions, isLoading: loadingPlaidTxns } = useQuery({
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

  // Teller transactions
  const { data: tellerTransactions, isLoading: loadingTellerTxns } = useQuery({
    queryKey: ["teller-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("teller_transactions")
        .select("*, job:jobs(name)")
        .eq("contractor_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user?.id && tellerConnected,
  });

  // Merge and sort all transactions
  const allTransactions = [
    ...(plaidTransactions || []).map((t: any) => ({ ...t, source: 'plaid' as const })),
    ...(tellerTransactions || []).map((t: any) => ({ ...t, source: 'teller' as const })),
  ].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()).slice(0, 50);

  const loadingTransactions = loadingPlaidTxns || loadingTellerTxns;

  const handleSyncTeller = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("teller-sync-transactions");
      if (error) throw error;
      toast({ title: "Sync Complete", description: "Transactions synced from your bank." });
      refreshAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectTeller = async () => {
    if (!disconnectId) return;
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from("teller_connections")
        .update({ status: "disconnected" })
        .eq("id", disconnectId);
      if (error) throw error;
      toast({ title: "Account Disconnected" });
      refreshAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setDisconnecting(false);
      setDisconnectId(null);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);

  if (loadingAccounts || loadingTeller) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <ExpenseAssignmentDialog open={assignOpen} onOpenChange={setAssignOpen} />

      {/* Disconnect confirmation */}
      <AlertDialog open={!!disconnectId} onOpenChange={(open) => !open && setDisconnectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop syncing transactions from this account. Your existing transaction data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnectTeller} disabled={disconnecting}>
              {disconnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Banking</h2>
          <p className="text-sm text-muted-foreground">
            {anyBankConnected
              ? `${(bankAccounts?.length || 0) + (tellerConnections?.length || 0)} account${((bankAccounts?.length || 0) + (tellerConnections?.length || 0)) === 1 ? "" : "s"} linked`
              : "Link a bank account to view balances and transactions"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)} className="gap-1.5">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Assign Expenses</span>
          </Button>
          <FinancialConnectionsDropdown
            connections={{ bankConnected: anyBankConnected, qbConnected, stripeConnected }}
            onConnectBank={openPlaid}
            onConnectTeller={openTeller}
            tellerLoading={tellerLoading}
            onConnectionChange={refreshAll}
          />
          {anyBankConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleSyncTeller();
                queryClient.invalidateQueries({ queryKey: ["plaid-transactions"] });
              }}
              disabled={syncing}
            >
              {syncing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />}
              <span className="hidden sm:inline">Sync</span>
            </Button>
          )}
        </div>
      </div>

      {/* EMPTY STATE */}
      {!anyBankConnected && !qbConnected && !stripeConnected && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Connect Your Bank Account</p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md px-4">
              Link your bank to automatically import transactions, track expenses by job, and see real-time balances.
            </p>
            <div className="flex gap-3">
              <Button onClick={openTeller} disabled={tellerLoading}>
                {tellerLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Building2 className="h-4 w-4 mr-2" />
                Connect Bank
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LINKED ACCOUNTS */}
      {anyBankConnected && (
        <>
          <div className="space-y-3">
            <h3 className="text-base md:text-lg font-semibold">Linked Accounts</h3>
            <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
              {/* Plaid accounts */}
              {bankAccounts?.map((account: any) => (
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
                      via Plaid · Last synced: {new Date(account.updated_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Teller accounts */}
              {tellerConnections?.map((conn: any) => (
                <Card key={conn.id}>
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm md:text-base truncate">
                            {conn.institution_name || "Bank Account"}
                            {conn.account_last_four && (
                              <span className="text-muted-foreground font-normal ml-1">
                                ····{conn.account_last_four}
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {conn.account_name && `${conn.account_name} · `}
                            {conn.account_type && <span className="capitalize">{conn.account_type}</span>}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="default">Active</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDisconnectId(conn.id)}
                        >
                          <Unlink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 md:px-6 md:pb-6 pt-0">
                    <div className="text-xs text-muted-foreground">
                      via Teller · {conn.last_synced_at ? `Last synced: ${new Date(conn.last_synced_at).toLocaleString()}` : `Connected ${new Date(conn.created_at).toLocaleDateString()}`}
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
            ) : allTransactions.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {allTransactions.map((txn: any) => (
                      <div key={`${txn.source}-${txn.id}`} className="p-3 md:p-4 hover:bg-muted/50 transition-colors min-h-[56px]">
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
                                <Badge variant="outline" className="text-[10px] opacity-50">{txn.source}</Badge>
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
                    Click Sync to import transactions from your bank
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
