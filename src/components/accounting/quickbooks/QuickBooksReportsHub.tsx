/**
 * QuickBooksReportsHub — Sub-navigation for all QB financial reports.
 *
 * Connection check: queries profiles.qb_realm_id to determine if QB is connected.
 * If not connected, shows a clean empty state with connect action.
 * If connected, renders report tabs that each call the quickbooks-api edge function.
 *
 * QB data is fetched live from the QuickBooks API via the quickbooks-api proxy edge function.
 * Each report component (QBProfitLoss, QBBalanceSheet, etc.) handles its own data fetching,
 * error states, and field mapping from QBO response format to display format.
 */

import { useState } from "react";
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
import { LayoutDashboard, FileText, BarChart3, Receipt, Users, Store, Clock, Link as LinkIcon, Loader2 } from "lucide-react";
import { QBOverview } from "./QBOverview";
import { QBProfitLoss } from "./QBProfitLoss";
import { QBBalanceSheet } from "./QBBalanceSheet";
import { QBExpenses } from "./QBExpenses";
import { QBCustomers } from "./QBCustomers";
import { QBVendors } from "./QBVendors";
import { QBAging } from "./QBAging";
import { QBPayments } from "./QBPayments";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const qbTabs = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "pnl", label: "Profit & Loss", icon: BarChart3 },
  { value: "balance-sheet", label: "Balance Sheet", icon: FileText },
  { value: "payments", label: "Payments", icon: FileText },
  { value: "expenses", label: "Expenses", icon: Receipt },
  { value: "customers", label: "Customers", icon: Users },
  { value: "vendors", label: "Vendors", icon: Store },
  { value: "aging", label: "Aging", icon: Clock },
];

export function QuickBooksReportsHub() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);

  // Check if QB is connected
  const { data: qbConnected, isLoading: checkingConnection } = useQuery({
    queryKey: ['qb-connection-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data: profile } = await supabase
        .from('profiles')
        .select('qb_realm_id')
        .eq('id', user.id)
        .single();
      return !!profile?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-connect');
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

  if (checkingConnection) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Not connected — show clean empty state
  if (!qbConnected) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold mb-2">Connect QuickBooks</p>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-md px-4">
            Connect your QuickBooks account to access Profit & Loss, Balance Sheet, Customers, Vendors, Aging reports, and more.
          </p>
          <Button onClick={handleConnect} disabled={connecting} className="min-h-[44px]">
            {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
            Connect QuickBooks
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile dropdown */}
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
        <TabsContent value="payments"><QBPayments /></TabsContent>
        <TabsContent value="expenses"><QBExpenses /></TabsContent>
        <TabsContent value="customers"><QBCustomers /></TabsContent>
        <TabsContent value="vendors"><QBVendors /></TabsContent>
        <TabsContent value="aging"><QBAging /></TabsContent>
      </Tabs>
    </div>
  );
}