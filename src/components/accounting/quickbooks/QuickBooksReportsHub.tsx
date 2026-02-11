/**
 * QuickBooksReportsHub — Comprehensive 8-section financial reporting hub.
 *
 * Connection check: queries profiles.qb_realm_id to determine if QB is connected.
 * If not connected, shows a clean empty state with connect action.
 * If connected, renders report sections via sub-navigation.
 *
 * Sections: Overview | Profit & Loss | Balance Sheet | Sales/Invoices | Payments | Expenses | Customers | Vendors | Aging
 *
 * All QB branding removed — myCT1 branded only.
 */

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, BarChart3, Receipt, Users, Store, Clock,
  LinkIcon, Loader2, CreditCard, RefreshCw
} from "lucide-react";
import { QBOverview } from "./QBOverview";
import { QBProfitLoss } from "./QBProfitLoss";
import { QBBalanceSheet } from "./QBBalanceSheet";
import { QBSalesInvoices } from "./QBSalesInvoices";
import { QBExpenses } from "./QBExpenses";
import { QBCustomers } from "./QBCustomers";
import { QBVendors } from "./QBVendors";
import { QBAging } from "./QBAging";
import { QBPayments } from "./QBPayments";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FinancialConnectionsDropdown } from "../FinancialConnectionsDropdown";
import { usePlaidLink } from "@/hooks/usePlaidLink";

const qbTabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "pnl", label: "Profit & Loss", icon: BarChart3 },
  { value: "balance-sheet", label: "Balance Sheet", icon: FileText },
  { value: "sales", label: "Sales / Invoices", icon: FileText },
  { value: "payments", label: "Payments", icon: CreditCard },
  { value: "expenses", label: "Expenses", icon: Receipt },
  { value: "customers", label: "Customers", icon: Users },
  { value: "vendors", label: "Vendors", icon: Store },
  { value: "aging", label: "Aging", icon: Clock },
];

export function QuickBooksReportsHub() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);

  // Check if QB is connected
  const { data: qbConnected, isLoading: checkingConnection } = useQuery({
    queryKey: ["qb-connection-check", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data: profile } = await supabase
        .from("profiles")
        .select("qb_realm_id, stripe_connect_account_id")
        .eq("id", user.id)
        .single();
      setStripeConnected(!!profile?.stripe_connect_account_id);
      return !!profile?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  // Check bank
  useEffect(() => {
    const checkBank = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("bank_account_links")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);
      setBankConnected((data?.length || 0) > 0);
    };
    checkBank();
  }, [user?.id]);

  const { open: openPlaid } = usePlaidLink({
    onSuccess: async (publicToken: string, metadata: any) => {
      try {
        const { error } = await supabase.functions.invoke("plaid-exchange-token", {
          body: { public_token: publicToken, metadata },
        });
        if (error) throw error;
        window.location.reload();
      } catch (error) {
        console.error("Failed to link bank:", error);
      }
    },
  });

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { data, error } = await supabase.functions.invoke("quickbooks-connect");
      if (error) {
        toast({ variant: "destructive", title: "Connection Failed", description: error.message });
        return;
      }
      if (data?.authUrl) window.location.href = data.authUrl;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Connection Failed", description: error.message });
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = () => {
    queryClient.invalidateQueries({ queryKey: ["qb"] });
    toast({ title: "Syncing...", description: "Refreshing your financial data." });
  };

  if (checkingConnection) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Not connected
  if (!qbConnected) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Financial Reports</h2>
            <p className="text-sm text-muted-foreground">Connect your accounting to unlock reports</p>
          </div>
          <FinancialConnectionsDropdown
            connections={{ bankConnected, qbConnected: false, stripeConnected }}
            onConnectBank={openPlaid}
          />
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Connect Your Accounting</p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md px-4">
              Connect your accounting software to access Profit & Loss, Balance Sheet, Sales, Expenses, Customer & Vendor analytics, Aging reports, and more.
            </p>
            <Button onClick={handleConnect} disabled={connecting} className="min-h-[44px]">
              {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
              Connect Accounting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with connections dropdown and sync */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Financial Reports</h2>
          <p className="text-sm text-muted-foreground">Live data from your connected accounting</p>
        </div>
        <div className="flex items-center gap-2">
          <FinancialConnectionsDropdown
            connections={{ bankConnected, qbConnected: true, stripeConnected }}
            onConnectBank={openPlaid}
            onConnectionChange={() => window.location.reload()}
          />
          <Button variant="outline" size="sm" onClick={handleSync}>
            <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      <div className="block md:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select report" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {qbTabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                <div className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop tab bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="hidden md:flex w-full overflow-x-auto">
          {qbTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-shrink-0">
              <tab.icon className="h-4 w-4 mr-1.5" />
              <span className="text-xs lg:text-sm">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><QBOverview /></TabsContent>
        <TabsContent value="pnl"><QBProfitLoss /></TabsContent>
        <TabsContent value="balance-sheet"><QBBalanceSheet /></TabsContent>
        <TabsContent value="sales"><QBSalesInvoices /></TabsContent>
        <TabsContent value="payments"><QBPayments /></TabsContent>
        <TabsContent value="expenses"><QBExpenses /></TabsContent>
        <TabsContent value="customers"><QBCustomers /></TabsContent>
        <TabsContent value="vendors"><QBVendors /></TabsContent>
        <TabsContent value="aging"><QBAging /></TabsContent>
      </Tabs>
    </div>
  );
}
