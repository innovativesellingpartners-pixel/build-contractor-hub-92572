/**
 * DrillDownPanel — Slide-out detail panel that opens from the right.
 * Renders appropriate detail view based on panel type.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDrillDown } from "./DrillDownProvider";
import { InvoiceDetailPanel } from "./panels/InvoiceDetailPanel";
import { CustomerDetailPanel } from "./panels/CustomerDetailPanel";
import { JobDetailPanel } from "./panels/JobDetailPanel";
import { ExpenseDetailPanel } from "./panels/ExpenseDetailPanel";
import { CategoryBreakdownPanel } from "./panels/CategoryBreakdownPanel";
import { VendorDetailPanel } from "./panels/VendorDetailPanel";
import { WorkerDetailPanel } from "./panels/WorkerDetailPanel";
import { ARAgingPanel } from "./panels/ARAgingPanel";
import { EstimateDetailPanel } from "./panels/EstimateDetailPanel";

export function DrillDownPanel() {
  const { activePanel, closePanel } = useDrillDown();

  const isOpen = activePanel.type !== null;

  const renderContent = () => {
    switch (activePanel.type) {
      case "invoice":
        return <InvoiceDetailPanel data={activePanel.data} />;
      case "customer":
        return <CustomerDetailPanel data={activePanel.data} />;
      case "job":
        return <JobDetailPanel data={activePanel.data} />;
      case "expense":
      case "payment":
        return <ExpenseDetailPanel data={activePanel.data} type={activePanel.type} />;
      case "category-breakdown":
        return <CategoryBreakdownPanel data={activePanel.data} />;
      case "vendor":
        return <VendorDetailPanel data={activePanel.data} />;
      case "worker":
        return <WorkerDetailPanel data={activePanel.data} />;
      case "ar-aging":
        return <ARAgingPanel data={activePanel.data} />;
      case "estimate":
        return <EstimateDetailPanel data={activePanel.data} />;
      default:
        return null;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closePanel()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle className="text-left">
            {activePanel.title || "Details"}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
}
