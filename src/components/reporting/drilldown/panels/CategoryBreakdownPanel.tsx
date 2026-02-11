/**
 * CategoryBreakdownPanel — Shows detailed breakdown when drilling into a category
 * (e.g., clicking "Materials" shows all material expenses by vendor, job, etc.)
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDrillDown } from "../DrillDownProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, ExternalLink } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

interface Props {
  data: {
    category?: string;
    type?: "expense" | "revenue" | "cost";
    dateStart?: string;
    dateEnd?: string;
    totalAmount?: number;
    total?: number;
    transactionCount?: number;
    period?: string;
    items?: { name: string; amount: number; depth?: number }[];
  };
}

export function CategoryBreakdownPanel({ data }: Props) {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();

  // Fetch expenses for this category
  const { data: expenses } = useQuery({
    queryKey: ["drilldown-category", data.category, data.dateStart, data.dateEnd],
    queryFn: async () => {
      if (!user?.id || !data.category) return [];
      let q = supabase.from("expenses")
        .select("*")
        .eq("contractor_id", user.id)
        .eq("category", data.category)
        .order("date", { ascending: false })
        .limit(50);
      if (data.dateStart) q = q.gte("date", data.dateStart);
      if (data.dateEnd) q = q.lte("date", data.dateEnd);
      const { data: exp } = await q;
      return exp || [];
    },
    enabled: !!user?.id && !!data.category,
  });

  // Group by description/vendor to show patterns
  const byDescription = expenses?.reduce((acc, e: any) => {
    const key = e.description || "Uncategorized";
    if (!acc[key]) acc[key] = { count: 0, total: 0 };
    acc[key].count++;
    acc[key].total += Number(e.amount || 0);
    return acc;
  }, {} as Record<string, { count: number; total: number }>) || {};

  const topDescriptions = Object.entries(byDescription)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10);

  const grandTotal = data.totalAmount || data.total || expenses?.reduce((s, e: any) => s + Number(e.amount || 0), 0) || 0;

  // If pre-computed items are passed (e.g. from QuickBooks P&L), use those instead of querying expenses
  const hasPrecomputedItems = data.items && data.items.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{data.category || "Category"} Breakdown</h3>
      </div>

      <div className="text-center p-6 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">Total {data.category}</p>
        <p className="text-3xl font-bold tabular-nums">{fmt(grandTotal)}</p>
        {data.period && <p className="text-xs text-muted-foreground mt-1">{data.period}</p>}
        {!hasPrecomputedItems && expenses && <p className="text-xs text-muted-foreground mt-1">{expenses.length} transactions</p>}
      </div>

      <Separator />

      {/* Pre-computed items from QuickBooks or other sources */}
      {hasPrecomputedItems && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Breakdown</h4>
          <div className="space-y-2">
            {data.items!.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[200px]" style={{ paddingLeft: `${(item.depth || 0) * 12}px` }}>{item.name}</span>
                  <span className="font-medium tabular-nums">{fmt(item.amount)}</span>
                </div>
                <Progress value={grandTotal > 0 ? (Math.abs(item.amount) / Math.abs(grandTotal)) * 100 : 0} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local expense breakdown (when no pre-computed items) */}
      {!hasPrecomputedItems && topDescriptions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">By Vendor / Description</h4>
          <div className="space-y-2">
            {topDescriptions.map(([desc, info]) => (
              <div key={desc} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[200px]">{desc}</span>
                  <span className="font-medium tabular-nums">
                    {fmt(info.total)} <span className="text-muted-foreground text-xs">({info.count})</span>
                  </span>
                </div>
                <Progress value={grandTotal > 0 ? (info.total / grandTotal) * 100 : 0} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasPrecomputedItems && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recent Transactions</h4>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {expenses?.slice(0, 20).map((exp: any) => (
                <Button
                  key={exp.id}
                  variant="ghost"
                  className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted text-left"
                  onClick={() => openPanel({
                    type: "expense",
                    title: "Expense Details",
                    data: exp,
                  })}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{exp.description || data.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.date ? new Date(exp.date).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-destructive ml-2">{fmt(Number(exp.amount || 0))}</span>
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
