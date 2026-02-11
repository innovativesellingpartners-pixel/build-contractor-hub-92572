/**
 * JobDetailPanel — Shows job overview, financial summary, costs, and team in drill-down.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDrillDown } from "../DrillDownProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Briefcase, DollarSign, TrendingUp, Calendar, User, ExternalLink, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

const COST_CATEGORIES = ["Materials", "Labor", "Subcontractor", "Equipment", "Other"];

interface Props {
  data: {
    id?: string;
    name?: string;
    job_status?: string;
    budget_amount?: number;
    actual_cost?: number;
    created_at?: string;
    customer_id?: string;
    trade_type?: string;
  };
}

export function JobDetailPanel({ data }: Props) {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();
  const navigate = useNavigate();

  // Fetch job costs
  const { data: jobCosts } = useQuery({
    queryKey: ["drilldown-job-costs", data.id],
    queryFn: async () => {
      if (!data.id) return [];
      const { data: costs } = await supabase.from("job_costs")
        .select("*")
        .eq("job_id", data.id)
        .order("date", { ascending: false });
      return costs || [];
    },
    enabled: !!data.id,
  });

  // Fetch related invoices
  const { data: invoices } = useQuery({
    queryKey: ["drilldown-job-invoices", data.id],
    queryFn: async () => {
      if (!data.id || !user?.id) return [];
      const { data: inv } = await supabase.from("invoices")
        .select("id, invoice_number, amount_due, amount_paid, status, created_at")
        .eq("job_id", data.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return inv || [];
    },
    enabled: !!data.id && !!user?.id,
  });

  // Fetch customer
  const { data: customer } = useQuery({
    queryKey: ["drilldown-job-customer", data.customer_id],
    queryFn: async () => {
      if (!data.customer_id) return null;
      const { data: c } = await supabase.from("customers").select("id, name, email, phone, lifetime_value").eq("id", data.customer_id).single();
      return c;
    },
    enabled: !!data.customer_id,
  });

  // Fetch estimate
  const { data: estimate } = useQuery({
    queryKey: ["drilldown-job-estimate", data.id],
    queryFn: async () => {
      if (!data.id || !user?.id) return null;
      const { data: est } = await supabase.from("estimates")
        .select("id, title, total_amount, status")
        .eq("job_id", data.id)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      return est;
    },
    enabled: !!data.id && !!user?.id,
  });

  const revenue = Number(data.budget_amount || 0);
  const totalCosts = jobCosts?.reduce((s, c: any) => s + Number(c.amount || 0), 0) || Number(data.actual_cost || 0);
  const profit = revenue - totalCosts;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  // Cost breakdown by category
  const costsByCategory = COST_CATEGORIES.map(cat => {
    const amount = jobCosts?.filter((c: any) => c.category === cat).reduce((s, c: any) => s + Number(c.amount || 0), 0) || 0;
    return { category: cat, amount, percentage: totalCosts > 0 ? (amount / totalCosts) * 100 : 0 };
  }).filter(c => c.amount > 0);

  const statusColor: Record<string, string> = {
    in_progress: "bg-blue-500",
    completed: "bg-green-500",
    pending: "bg-yellow-500",
    cancelled: "bg-red-500",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{data.name || "Job"}</h3>
          </div>
          {data.trade_type && (
            <Badge variant="outline" className="mt-1 text-xs">{data.trade_type}</Badge>
          )}
        </div>
        <Badge className={statusColor[data.job_status || ""] || "bg-muted"}>
          {data.job_status || "Unknown"}
        </Badge>
      </div>

      <Separator />

      {/* Financial Summary */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <DollarSign className="h-4 w-4" /> Financial Summary
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-base font-bold tabular-nums">{fmt(revenue)}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Costs</p>
            <p className="text-base font-bold tabular-nums text-red-600">{fmt(totalCosts)}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Profit</p>
            <p className={`text-base font-bold tabular-nums ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(profit)}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Margin</p>
            <p className={`text-base font-bold ${margin >= 20 ? "text-green-600" : margin >= 10 ? "text-yellow-600" : "text-red-600"}`}>
              {margin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Estimate vs Actual */}
        {estimate && (
          <div className="p-3 bg-muted/30 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated:</span>
              <span className="font-medium">{fmt(Number(estimate.total_amount || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actual Cost:</span>
              <span className="font-medium">{fmt(totalCosts)}</span>
            </div>
            {Number(estimate.total_amount || 0) > 0 && (
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Variance:</span>
                <span className={`font-medium ${totalCosts > Number(estimate.total_amount) ? "text-red-600" : "text-green-600"}`}>
                  {totalCosts > Number(estimate.total_amount) ? "+" : ""}{fmt(totalCosts - Number(estimate.total_amount))}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Cost Breakdown */}
      {costsByCategory.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" /> Cost Breakdown
          </h4>
          <div className="space-y-2">
            {costsByCategory.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{cat.category}</span>
                  <span className="font-medium tabular-nums">{fmt(cat.amount)} ({cat.percentage.toFixed(0)}%)</span>
                </div>
                <Progress value={cat.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Invoices */}
      {invoices && invoices.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Revenue Detail</h4>
          <div className="space-y-1.5">
            {invoices.map((inv: any) => (
              <Button
                key={inv.id}
                variant="ghost"
                className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                onClick={() => openPanel({
                  type: "invoice",
                  title: `Invoice ${inv.invoice_number || "#—"}`,
                  data: { ...inv, job_id: data.id, job_name: data.name },
                })}
              >
                <span>{inv.invoice_number || "INV"} · {new Date(inv.created_at).toLocaleDateString()}</span>
                <span className="font-medium tabular-nums">{fmt(Number(inv.amount_due || 0))}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Customer */}
      {customer && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <User className="h-4 w-4" /> Customer
          </h4>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm h-auto py-2 px-3 hover:bg-muted"
            onClick={() => openPanel({
              type: "customer",
              title: customer.name,
              data: customer,
            })}
          >
            <User className="h-4 w-4 mr-2 text-primary" />
            <span className="font-medium">{customer.name}</span>
            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
          </Button>
        </div>
      )}

      {/* View Full Job */}
      <div className="pt-2">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/jobs/${data.id}`)}
        >
          <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
          View Full Job Details & P&L
        </Button>
      </div>
    </div>
  );
}
