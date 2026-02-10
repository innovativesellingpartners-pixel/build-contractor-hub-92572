import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutDashboard, FileText, BarChart3, Receipt, Users, Store, Clock } from "lucide-react";
import { QBOverview } from "./QBOverview";
import { QBProfitLoss } from "./QBProfitLoss";
import { QBBalanceSheet } from "./QBBalanceSheet";
import { QBExpenses } from "./QBExpenses";
import { QBCustomers } from "./QBCustomers";
import { QBVendors } from "./QBVendors";
import { QBAging } from "./QBAging";
import { QBPayments } from "./QBPayments";

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
