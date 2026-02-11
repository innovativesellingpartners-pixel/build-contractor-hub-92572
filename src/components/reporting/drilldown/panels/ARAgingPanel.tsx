/**
 * ARAgingPanel — Shows invoices for a specific aging bucket in drill-down.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDrillDown } from "../DrillDownProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, FileText, User } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

interface Props {
  data: {
    bucket?: string;
    minDays?: number;
    maxDays?: number;
    totalAmount?: number;
    invoiceCount?: number;
  };
}

export function ARAgingPanel({ data }: Props) {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();

  const { data: invoices } = useQuery({
    queryKey: ["drilldown-ar-aging", data.bucket, data.minDays, data.maxDays],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: inv } = await supabase
        .from("invoices")
        .select("id, invoice_number, amount_due, amount_paid, status, due_date, created_at, customer_id, customers(name)")
        .eq("user_id", user.id)
        .neq("status", "paid")
        .order("due_date", { ascending: true });

      if (!inv) return [];

      const now = new Date();
      return inv.filter((i) => {
        const balance = Math.max(0, Number(i.amount_due || 0) - Number(i.amount_paid || 0));
        if (balance <= 0) return false;
        if (!i.due_date) return data.minDays === undefined || data.minDays <= 0;
        const days = Math.floor((now.getTime() - new Date(i.due_date).getTime()) / (1000 * 60 * 60 * 24));
        if (data.minDays !== undefined && data.maxDays !== undefined) {
          return days >= data.minDays && days <= data.maxDays;
        }
        if (data.minDays !== undefined) return days >= data.minDays;
        if (data.maxDays !== undefined) return days <= data.maxDays;
        return true;
      });
    },
    enabled: !!user?.id,
  });

  const totalOutstanding = invoices?.reduce((s, i: any) =>
    s + Math.max(0, Number(i.amount_due || 0) - Number(i.amount_paid || 0)), 0
  ) || data.totalAmount || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{data.bucket || "Aging"} Invoices</h3>
      </div>

      <div className="text-center p-6 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">Outstanding</p>
        <p className="text-3xl font-bold tabular-nums">{fmt(totalOutstanding)}</p>
        <p className="text-xs text-muted-foreground mt-1">{invoices?.length || 0} invoices</p>
      </div>

      <Separator />

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {invoices?.map((inv: any) => {
          const balance = Math.max(0, Number(inv.amount_due || 0) - Number(inv.amount_paid || 0));
          const customerName = (inv.customers as any)?.name;
          return (
            <Button
              key={inv.id}
              variant="ghost"
              className="w-full justify-between text-sm h-auto py-2.5 px-3 hover:bg-muted text-left"
              onClick={() => openPanel({
                type: "invoice",
                title: `Invoice ${inv.invoice_number || "#—"}`,
                data: { ...inv, customer_name: customerName },
              })}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="font-medium">{inv.invoice_number || "INV"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {customerName && <span className="truncate">{customerName}</span>}
                  {inv.due_date && <span>Due {new Date(inv.due_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <span className="font-semibold tabular-nums text-red-600 ml-2">{fmt(balance)}</span>
            </Button>
          );
        })}
        {(!invoices || invoices.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">No invoices in this bucket</p>
        )}
      </div>
    </div>
  );
}
