import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EstimatesTab } from "./payments/EstimatesTab";
import { InvoicesTab } from "./payments/InvoicesTab";

export function PaymentsCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payments Center</h2>
        <p className="text-muted-foreground">
          Manage estimates and invoices with payment links
        </p>
      </div>

      <Tabs defaultValue="estimates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="estimates" className="space-y-4">
          <EstimatesTab />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <InvoicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
