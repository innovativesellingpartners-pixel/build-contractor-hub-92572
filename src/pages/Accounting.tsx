import { useState } from "react";
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

      {/* Section selector dropdown */}
      <Select value={activeTab} onValueChange={setActiveTab}>
        <SelectTrigger className="w-full sm:w-[280px]">
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

      {/* Content */}
      {activeTab === "dashboard" && <AccountingDashboard />}
      {activeTab === "reports" && <QuickBooksReportsHub />}
      {activeTab === "banking" && <BankingView />}
    </div>
  );
}
