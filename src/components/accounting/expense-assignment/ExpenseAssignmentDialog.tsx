/**
 * ExpenseAssignmentDialog — Full-screen split-screen drag-and-drop
 * for assigning expenses/payments to Jobs, Customers, or Estimates.
 */

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useQBExpenses, useQBPayments } from "@/hooks/useQuickBooksQuery";
import { useToast } from "@/hooks/use-toast";
import { DraggableExpenseList } from "./DraggableExpenseList";
import { DropTargetPanel } from "./DropTargetPanel";
import { DraggableExpenseCard } from "./DraggableExpenseCard";
import { Skeleton } from "@/components/ui/skeleton";

export interface FinancialItem {
  id: string;
  source: "native" | "qb-expense" | "qb-payment" | "plaid";
  description: string;
  vendor?: string;
  amount: number;
  date: string;
  category?: string;
  job_id?: string | null;
  customer_id?: string | null;
  raw?: any;
}

interface ExpenseAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseAssignmentDialog({ open, onOpenChange }: ExpenseAssignmentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeItem, setActiveItem] = useState<FinancialItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Fetch native expenses
  const { data: nativeExpenses, isLoading: nativeLoading } = useQuery({
    queryKey: ["assign-native-expenses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("expenses")
        .select("id, amount, category, date, description, job_id, notes, contractor_id")
        .eq("contractor_id", user.id)
        .order("date", { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  // Fetch plaid transactions
  const { data: plaidTxns, isLoading: plaidLoading } = useQuery({
    queryKey: ["assign-plaid-txns", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("plaid_transactions")
        .select("id, amount, category, transaction_date, description, vendor, job_id, contractor_id")
        .eq("contractor_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  // Check QB connection
  const { data: qbConnected } = useQuery({
    queryKey: ["qb-connected-assign", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("profiles").select("qb_realm_id").eq("id", user.id).single();
      return !!data?.qb_realm_id;
    },
    enabled: !!user?.id && open,
  });

  const { data: qbExpenses, isLoading: qbExpLoading } = useQBExpenses(!!qbConnected && open);
  const { data: qbPayments, isLoading: qbPayLoading } = useQBPayments(!!qbConnected && open);

  // Normalize all items into a unified list
  const allItems: FinancialItem[] = useMemo(() => {
    const items: FinancialItem[] = [];

    // Native expenses
    (nativeExpenses || []).forEach((e: any) => {
      items.push({
        id: `native-${e.id}`,
        source: "native",
        description: e.description || e.category || "Expense",
        amount: Number(e.amount),
        date: e.date,
        category: e.category,
        job_id: e.job_id,
        raw: e,
      });
    });

    // Plaid transactions
    (plaidTxns || []).forEach((t: any) => {
      items.push({
        id: `plaid-${t.id}`,
        source: "plaid",
        description: t.description || t.vendor || "Transaction",
        vendor: t.vendor,
        amount: Math.abs(Number(t.amount)),
        date: t.transaction_date,
        category: t.category,
        job_id: t.job_id,
        raw: t,
      });
    });

    // QB expenses
    if (qbExpenses) {
      (qbExpenses as any[]).forEach((e: any) => {
        items.push({
          id: `qb-exp-${e.Id}`,
          source: "qb-expense",
          description: e.EntityRef?.name || e.AccountRef?.name || "QB Expense",
          vendor: e.EntityRef?.name,
          amount: parseFloat(e.TotalAmt || "0"),
          date: e.TxnDate || "",
          category: e.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name,
          raw: e,
        });
      });
    }

    // QB payments
    if (qbPayments) {
      (qbPayments as any[]).forEach((p: any) => {
        items.push({
          id: `qb-pay-${p.Id}`,
          source: "qb-payment",
          description: p.CustomerRef?.name || "QB Payment",
          amount: parseFloat(p.TotalAmt || "0"),
          date: p.TxnDate || "",
          category: "Payment",
          raw: p,
        });
      });
    }

    return items;
  }, [nativeExpenses, plaidTxns, qbExpenses, qbPayments]);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = allItems;
    if (sourceFilter !== "all") {
      items = items.filter((i) => i.source === sourceFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (i) =>
          i.description.toLowerCase().includes(term) ||
          (i.vendor || "").toLowerCase().includes(term) ||
          (i.category || "").toLowerCase().includes(term)
      );
    }
    return items;
  }, [allItems, sourceFilter, searchTerm]);

  const handleDragStart = (event: DragStartEvent) => {
    const item = allItems.find((i) => i.id === event.active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const item = allItems.find((i) => i.id === active.id);
    if (!item) return;

    const targetId = over.id as string;
    const [targetType, ...idParts] = targetId.split("-");
    const entityId = idParts.join("-");

    if (!entityId) return;

    try {
      if (targetType === "job") {
        // Assign expense to job
        if (item.source === "native") {
          const realId = item.id.replace("native-", "");
          await supabase.from("expenses").update({ job_id: entityId }).eq("id", realId);
        } else if (item.source === "plaid") {
          const realId = item.id.replace("plaid-", "");
          await supabase.from("plaid_transactions").update({ job_id: entityId }).eq("id", realId);
        } else {
          // QB items — create a native expense record linked to this job
          await supabase.from("expenses").insert({
            contractor_id: user!.id,
            amount: item.amount,
            category: item.category || "QuickBooks",
            date: item.date || new Date().toISOString().split("T")[0],
            description: item.description,
            job_id: entityId,
            notes: `Assigned from ${item.source === "qb-expense" ? "QuickBooks Expense" : "QuickBooks Payment"} (${item.raw?.Id || ""})`,
          });
        }
        toast({ title: "Assigned to Job", description: `${item.description} → assigned successfully` });
      } else if (targetType === "customer") {
        // For customer assignment, create expense with customer context or update
        if (item.source === "native") {
          // Native expenses don't have customer_id, so we add a note
          const realId = item.id.replace("native-", "");
          await supabase.from("expenses").update({ notes: `Assigned to customer: ${entityId}` }).eq("id", realId);
        } else {
          await supabase.from("expenses").insert({
            contractor_id: user!.id,
            amount: item.amount,
            category: item.category || "General",
            date: item.date || new Date().toISOString().split("T")[0],
            description: item.description,
            notes: `Assigned to customer: ${entityId}. Source: ${item.source}`,
          });
        }
        toast({ title: "Assigned to Customer", description: `${item.description} → assigned successfully` });
      } else if (targetType === "estimate") {
        // Link to estimate context
        await supabase.from("expenses").insert({
          contractor_id: user!.id,
          amount: item.amount,
          category: item.category || "General",
          date: item.date || new Date().toISOString().split("T")[0],
          description: item.description,
          notes: `Linked to estimate: ${entityId}. Source: ${item.source}`,
        });
        toast({ title: "Linked to Estimate", description: `${item.description} → linked successfully` });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["assign-native-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["assign-plaid-txns"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-stats"] });
      queryClient.invalidateQueries({ queryKey: ["expense-report"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Assignment Failed", description: err.message || "Could not assign item" });
    }
  };

  const isLoading = nativeLoading || plaidLoading || (!!qbConnected && (qbExpLoading || qbPayLoading));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-lg font-bold">
            Assign Expenses & Transactions
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Drag financial items from the left and drop them onto a Job, Customer, or Estimate on the right
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 p-6 grid grid-cols-2 gap-6">
            <Skeleton className="h-full" />
            <Skeleton className="h-full" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
              {/* Left: Draggable items */}
              <div className="border-r overflow-hidden flex flex-col">
                <DraggableExpenseList
                  items={filteredItems}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  sourceFilter={sourceFilter}
                  onSourceFilterChange={setSourceFilter}
                  hasQB={!!qbConnected}
                />
              </div>

              {/* Right: Drop targets */}
              <div className="overflow-hidden flex flex-col">
                <DropTargetPanel />
              </div>
            </div>

            <DragOverlay>
              {activeItem ? (
                <DraggableExpenseCard item={activeItem} isOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </DialogContent>
    </Dialog>
  );
}
