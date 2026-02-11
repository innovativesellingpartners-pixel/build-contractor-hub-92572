import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";
import { BankingView } from "@/components/accounting/BankingView";
import { QuickBooksReportsHub } from "@/components/accounting/quickbooks/QuickBooksReportsHub";
import { LayoutDashboard, Building2, BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tabs = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "reports", label: "Financial Reports", icon: BarChart3 },
  { value: "banking", label: "Banking", icon: Building2 },
];

export default function Accounting() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 pb-24 md:pb-8 overflow-y-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Accounting</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your finances, payments, and expenses
        </p>
      </div>

      {/* Mobile: Select dropdown */}
      <div className="block md:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {tabs.map((tab) => (
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

      {/* Desktop: Tab bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="hidden md:grid w-full grid-cols-3">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              <tab.icon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AccountingDashboard />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <QuickBooksReportsHub />
        </TabsContent>

        <TabsContent value="banking" className="space-y-4">
          <BankingView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
