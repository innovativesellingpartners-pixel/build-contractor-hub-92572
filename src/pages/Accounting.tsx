import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";
import { PaymentsCenter } from "@/components/accounting/PaymentsCenter";
import { BankingView } from "@/components/accounting/BankingView";
import { LayoutDashboard, CreditCard, Building2, Receipt, Briefcase, FileBarChart } from "lucide-react";

export default function Accounting() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
        <p className="text-muted-foreground">
          Manage your finances, payments, and expenses
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="banking">
            <Building2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Banking</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" disabled>
            <Receipt className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="job-costing" disabled>
            <Briefcase className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Job Costing</span>
          </TabsTrigger>
          <TabsTrigger value="reports" disabled>
            <FileBarChart className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AccountingDashboard />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentsCenter />
        </TabsContent>

        <TabsContent value="banking" className="space-y-4">
          <BankingView />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="text-center text-muted-foreground py-12">
            Expenses view coming soon
          </div>
        </TabsContent>

        <TabsContent value="job-costing" className="space-y-4">
          <div className="text-center text-muted-foreground py-12">
            Job costing view coming soon
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="text-center text-muted-foreground py-12">
            Reports view coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
