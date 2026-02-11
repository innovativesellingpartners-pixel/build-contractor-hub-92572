/**
 * InvoiceDetailPanel — Shows full invoice details in the drill-down panel.
 * Displays line items, payment history, related documents, and job profitability.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDrillDown } from "../DrillDownProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ExternalLink, DollarSign, User, Briefcase, Calendar, CreditCard } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

interface Props {
  data: {
    id?: string;
    invoice_number?: string;
    amount_due?: number;
    amount_paid?: number;
    status?: string;
    due_date?: string;
    created_at?: string;
    customer_id?: string;
    customer_name?: string;
    job_id?: string;
    job_name?: string;
  };
}

export function InvoiceDetailPanel({ data }: Props) {
  const { openPanel } = useDrillDown();
  const balance = Math.max(0, Number(data.amount_due || 0) - Number(data.amount_paid || 0));
  const isOverdue = data.due_date && new Date(data.due_date) < new Date() && balance > 0;
  const daysToPay = data.due_date && data.amount_paid
    ? Math.floor((new Date().getTime() - new Date(data.created_at || "").getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Fetch related customer
  const { data: customer } = useQuery({
    queryKey: ["drilldown-customer", data.customer_id],
    queryFn: async () => {
      if (!data.customer_id) return null;
      const { data: c } = await supabase.from("customers").select("*").eq("id", data.customer_id).single();
      return c;
    },
    enabled: !!data.customer_id,
  });

  // Fetch related payments
  const { data: payments } = useQuery({
    queryKey: ["drilldown-invoice-payments", data.id],
    queryFn: async () => {
      if (!data.id) return [];
      const { data: p } = await supabase.from("payments").select("*").eq("invoice_id", data.id).order("payment_date", { ascending: false });
      return p || [];
    },
    enabled: !!data.id,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Invoice {data.invoice_number || "#—"}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data.created_at ? new Date(data.created_at).toLocaleDateString() : "—"}
          </p>
        </div>
        <Badge variant={isOverdue ? "destructive" : data.status === "paid" ? "default" : "outline"}>
          {isOverdue ? "Overdue" : data.status || "Open"}
        </Badge>
      </div>

      <Separator />

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="text-lg font-bold tabular-nums">{fmt(Number(data.amount_due || 0))}</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-lg font-bold tabular-nums text-green-600">{fmt(Number(data.amount_paid || 0))}</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className={`text-lg font-bold tabular-nums ${balance > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(balance)}</p>
        </div>
      </div>

      {/* Key Dates */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <Calendar className="h-4 w-4" /> Dates
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Issued:</span>
            <span className="ml-2 font-medium">{data.created_at ? new Date(data.created_at).toLocaleDateString() : "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Due:</span>
            <span className={`ml-2 font-medium ${isOverdue ? "text-red-600" : ""}`}>
              {data.due_date ? new Date(data.due_date).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Customer Link */}
      {(customer || data.customer_name) && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <User className="h-4 w-4" /> Customer
          </h4>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm h-auto py-2 px-3 hover:bg-muted"
            onClick={() => openPanel({
              type: "customer",
              title: customer?.name || data.customer_name || "Customer",
              data: customer || { name: data.customer_name, id: data.customer_id },
            })}
          >
            <User className="h-4 w-4 mr-2 text-primary" />
            <span className="font-medium">{customer?.name || data.customer_name}</span>
            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
          </Button>
        </div>
      )}

      {/* Job Link */}
      {data.job_id && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" /> Related Job
          </h4>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm h-auto py-2 px-3 hover:bg-muted"
            onClick={() => openPanel({
              type: "job",
              title: data.job_name || "Job Details",
              data: { id: data.job_id, name: data.job_name },
            })}
          >
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            <span className="font-medium">{data.job_name || "View Job"}</span>
            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
          </Button>
        </div>
      )}

      <Separator />

      {/* Payment History */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <CreditCard className="h-4 w-4" /> Payment History
        </h4>
        {payments && payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                <div>
                  <span className="text-green-600">✓</span>
                  <span className="ml-2">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"}</span>
                  {p.payment_method && <span className="text-muted-foreground ml-2">via {p.payment_method}</span>}
                </div>
                <span className="font-semibold tabular-nums text-green-600">{fmt(Number(p.amount || 0))}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No payments recorded</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" className="flex-1">
          <FileText className="h-3.5 w-3.5 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <DollarSign className="h-3.5 w-3.5 mr-1" /> Record Payment
        </Button>
      </div>
    </div>
  );
}
