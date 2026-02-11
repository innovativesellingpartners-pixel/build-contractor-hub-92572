/**
 * CustomerDetailPanel — Shows full customer profile with financial summary,
 * activity timeline, and related jobs/invoices in the drill-down panel.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDrillDown } from "../DrillDownProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Building, DollarSign, Star, Briefcase, FileText, ExternalLink } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

interface Props {
  data: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    lifetime_value?: number;
    referral_source?: string;
    created_at?: string;
  };
}

export function CustomerDetailPanel({ data }: Props) {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();

  // Fetch invoices for this customer
  const { data: invoices } = useQuery({
    queryKey: ["drilldown-customer-invoices", data.id],
    queryFn: async () => {
      if (!data.id || !user?.id) return [];
      const { data: inv } = await supabase.from("invoices")
        .select("id, invoice_number, amount_due, amount_paid, status, created_at, due_date")
        .eq("customer_id", data.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return inv || [];
    },
    enabled: !!data.id && !!user?.id,
  });

  // Fetch jobs for this customer
  const { data: jobs } = useQuery({
    queryKey: ["drilldown-customer-jobs", data.id],
    queryFn: async () => {
      if (!data.id || !user?.id) return [];
      const { data: j } = await supabase.from("jobs")
        .select("id, name, job_status, budget_amount, created_at")
        .eq("customer_id", data.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return j || [];
    },
    enabled: !!data.id && !!user?.id,
  });

  // Fetch estimates for this customer
  const { data: estimates } = useQuery({
    queryKey: ["drilldown-customer-estimates", data.id],
    queryFn: async () => {
      if (!data.id || !user?.id) return [];
      const { data: e } = await supabase.from("estimates")
        .select("id, title, status, total_amount, created_at")
        .eq("customer_id", data.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return e || [];
    },
    enabled: !!data.id && !!user?.id,
  });

  const totalInvoiced = invoices?.reduce((s, i: any) => s + Number(i.amount_due || 0), 0) || 0;
  const totalPaid = invoices?.reduce((s, i: any) => s + Number(i.amount_paid || 0), 0) || 0;
  const outstanding = totalInvoiced - totalPaid;

  // Calculate avg days to payment
  const paidInvoices = invoices?.filter((i: any) => i.status === "paid" && i.created_at && i.due_date) || [];
  const avgDays = paidInvoices.length > 0
    ? Math.round(paidInvoices.reduce((s: number, i: any) => {
      const created = new Date(i.created_at).getTime();
      const due = new Date(i.due_date).getTime();
      return s + Math.abs(due - created) / (1000 * 60 * 60 * 24);
    }, 0) / paidInvoices.length)
    : null;

  const rating = outstanding === 0 && totalPaid > 0 ? 5 : outstanding > 0 ? 3 : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
          {(data.name || "?")[0].toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{data.name || "Customer"}</h3>
          {data.company && <p className="text-sm text-muted-foreground">{data.company}</p>}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2">
        {data.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${data.email}`} className="text-primary hover:underline">{data.email}</a>
          </div>
        )}
        {data.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${data.phone}`} className="text-primary hover:underline">{data.phone}</a>
          </div>
        )}
        {data.referral_source && (
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">{data.referral_source}</Badge>
          </div>
        )}
      </div>

      <Separator />

      {/* Financial Summary */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <DollarSign className="h-4 w-4" /> Financial Summary
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Lifetime Value</p>
            <p className="text-base font-bold tabular-nums">{fmt(Number(data.lifetime_value || totalInvoiced))}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className={`text-base font-bold tabular-nums ${outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
              {fmt(outstanding)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Invoiced:</span>
            <span className="font-medium">{fmt(totalInvoiced)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Paid:</span>
            <span className="font-medium text-green-600">{fmt(totalPaid)}</span>
          </div>
        </div>
        {avgDays !== null && (
          <p className="text-xs text-muted-foreground">Avg Days to Payment: {avgDays} days</p>
        )}
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Payment Rating:</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Recent Invoices */}
      {invoices && invoices.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Recent Invoices
          </h4>
          <div className="space-y-1.5">
            {invoices.slice(0, 5).map((inv: any) => {
              const bal = Math.max(0, Number(inv.amount_due || 0) - Number(inv.amount_paid || 0));
              return (
                <Button
                  key={inv.id}
                  variant="ghost"
                  className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                  onClick={() => openPanel({
                    type: "invoice",
                    title: `Invoice ${inv.invoice_number || "#—"}`,
                    data: { ...inv, customer_name: data.name, customer_id: data.id },
                  })}
                >
                  <div className="flex items-center gap-2">
                    <span>{inv.status === "paid" ? "✓" : "○"}</span>
                    <span>{inv.invoice_number || "INV"}</span>
                    <span className="text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`font-medium tabular-nums ${bal > 0 ? "text-red-600" : "text-green-600"}`}>
                    {fmt(Number(inv.amount_due || 0))}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Jobs */}
      {jobs && jobs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" /> Jobs
          </h4>
          <div className="space-y-1.5">
            {jobs.slice(0, 5).map((job: any) => (
              <Button
                key={job.id}
                variant="ghost"
                className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                onClick={() => openPanel({
                  type: "job",
                  title: job.name || "Job",
                  data: job,
                })}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate max-w-[180px]">{job.name}</span>
                  <Badge variant="outline" className="text-[10px]">{job.job_status}</Badge>
                </div>
                <span className="font-medium tabular-nums">{fmt(Number(job.budget_amount || 0))}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Member Since */}
      {data.created_at && (
        <p className="text-xs text-muted-foreground pt-2">
          Customer since {new Date(data.created_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
