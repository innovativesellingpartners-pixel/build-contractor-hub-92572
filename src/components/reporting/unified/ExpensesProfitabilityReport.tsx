/**
 * ExpensesProfitabilityReport — Expense analysis with full drill-down interactivity.
 * All metrics, vendor lists, and expense items support click → detail panel.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQBProfitAndLoss, useQBExpenses, useQBVendors } from "@/hooks/useQuickBooksQuery";
import { InteractiveReportShell } from "../drilldown/InteractiveReportShell";
import { InteractiveMetricCard } from "../drilldown/InteractiveMetricCard";
import { useDrillDown } from "../drilldown/DrillDownProvider";
import { DateRange } from "./ReportDateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, DollarSign, Store, BarChart3 } from "lucide-react";
import { ExpenseBreakdown } from "@/components/reporting/ExpenseBreakdown";
import { ProfitLossStatement } from "@/components/reporting/ProfitLossStatement";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

function extractTotal(rows: any[], groupName: string): number {
  const group = rows?.find((r: any) => r.group === groupName || r.Summary?.ColData?.[0]?.value === groupName);
  if (group?.Summary?.ColData?.[1]?.value) return parseFloat(group.Summary.ColData[1].value) || 0;
  return 0;
}

export function ExpensesProfitabilityReport() {
  const { user } = useAuth();
  const { openPanel } = useDrillDown();
  const [dateRange, setDateRange] = useState<DateRange>({ preset: "ytd", start: `${new Date().getFullYear()}-01-01`, end: new Date().toISOString().split("T")[0] });

  const { data: qbConnected } = useQuery({
    queryKey: ["qb-connected-exp", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from("profiles").select("qb_realm_id").eq("id", user.id).single();
      return !!data?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  const qbRange = { start: dateRange.start || `${new Date().getFullYear()}-01-01`, end: dateRange.end || new Date().toISOString().split("T")[0] };
  const { data: pnl, isLoading: pnlLoading } = useQBProfitAndLoss(qbRange, !!qbConnected);
  const { data: qbExpenses } = useQBExpenses(!!qbConnected);
  const { data: qbVendors } = useQBVendors(!!qbConnected);

  const { data: nativeExpenses, isLoading } = useQuery({
    queryKey: ["expense-report", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      let q = supabase.from("expenses").select("id, amount, category, date, description, job_id, notes").eq("contractor_id", user.id);
      if (dateRange.start) q = q.gte("date", dateRange.start);
      if (dateRange.end) q = q.lte("date", dateRange.end);
      const { data } = await q.order("date", { ascending: false });
      const exp = data || [];
      const total = exp.reduce((s, e) => s + Number(e.amount || 0), 0);
      const avg = exp.length > 0 ? total / exp.length : 0;

      const byCategory = exp.reduce((acc, e) => {
        const cat = e.category || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + Number(e.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      const topCategory = Object.entries(byCategory).sort(([,a], [,b]) => b - a)[0];

      return { total, avg, count: exp.length, topCategory: topCategory?.[0] || "N/A", topCategoryAmt: topCategory?.[1] || 0, expenses: exp, byCategory };
    },
    enabled: !!user?.id,
  });

  const filters = {
    dateRange: dateRange.preset === "ytd" ? "this_year" : dateRange.preset === "all_time" ? "all_time" : dateRange.preset,
    dateFrom: dateRange.start,
    dateTo: dateRange.end,
  };

  const qbIncome = pnl ? extractTotal(pnl.rows, "Income") : 0;
  const qbExpTotal = pnl ? extractTotal(pnl.rows, "Expenses") : 0;
  const qbNet = qbIncome - qbExpTotal;
  const grossMargin = qbIncome > 0 ? ((qbIncome - qbExpTotal) / qbIncome) * 100 : 0;

  const loading = isLoading || (qbConnected && pnlLoading);
  if (loading) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  const totalExpenses = (nativeExpenses?.total || 0) + qbExpTotal;

  return (
    <InteractiveReportShell
      title="Expenses & Profitability"
      subtitle="Spend analysis and margin tracking"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <InteractiveMetricCard
          title="Total Expenses"
          value={fmt(totalExpenses)}
          subtitle={qbConnected ? `myCT1: ${fmt(nativeExpenses?.total || 0)} · QB: ${fmt(qbExpTotal)}` : `${nativeExpenses?.count || 0} transactions`}
          icon={<TrendingDown className="h-4 w-4 text-red-600" />}
          variant="danger"
          onClick={() => openPanel({ type: "category-breakdown", title: "All Expenses", data: { category: "All", type: "expense", totalAmount: totalExpenses, dateStart: dateRange.start, dateEnd: dateRange.end } })}
        />
        <InteractiveMetricCard
          title="Avg Transaction"
          value={fmt(nativeExpenses?.avg || 0)}
          subtitle={`${nativeExpenses?.count || 0} expenses`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          variant="default"
        />
        <InteractiveMetricCard
          title="Top Category"
          value={nativeExpenses?.topCategory || "N/A"}
          subtitle={fmt(nativeExpenses?.topCategoryAmt || 0)}
          icon={<BarChart3 className="h-4 w-4 text-orange-500" />}
          variant="warning"
          onClick={() => {
            if (nativeExpenses?.topCategory && nativeExpenses.topCategory !== "N/A") {
              openPanel({ type: "category-breakdown", title: `${nativeExpenses.topCategory} Expenses`, data: { category: nativeExpenses.topCategory, type: "expense", totalAmount: nativeExpenses.topCategoryAmt, dateStart: dateRange.start, dateEnd: dateRange.end } });
            }
          }}
        />
        {qbConnected && (
          <InteractiveMetricCard
            title="Net Profit"
            value={fmt(qbNet)}
            subtitle={`${grossMargin.toFixed(1)}% margin`}
            icon={<DollarSign className="h-4 w-4 text-green-600" />}
            variant={qbNet >= 0 ? "success" : "danger"}
          />
        )}
      </div>

      {/* Expense breakdown chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
        <ExpenseBreakdown filters={filters} />
      </Card>

      {/* P&L Statement */}
      <ProfitLossStatement filters={filters} />

      {/* QB Top Vendors — clickable */}
      {qbConnected && qbVendors && qbVendors.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" /> Top Vendors (QB)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {qbVendors.slice(0, 10).map((v: any) => (
                <Button
                  key={v.Id}
                  variant="ghost"
                  className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                  onClick={() => openPanel({ type: "vendor", title: v.DisplayName, data: v })}
                >
                  <span className="truncate mr-3">{v.DisplayName}</span>
                  <span className="tabular-nums font-medium">{fmt(parseFloat(v.Balance || "0"))}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QB Recent Purchases — clickable */}
      {qbConnected && qbExpenses && qbExpenses.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Purchases (QB)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {qbExpenses.slice(0, 10).map((e: any) => (
                <Button
                  key={e.Id}
                  variant="ghost"
                  className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                  onClick={() => openPanel({ type: "expense", title: "Expense Details", data: { amount: parseFloat(e.TotalAmt || "0"), date: e.TxnDate, category: e.AccountRef?.name, description: e.EntityRef?.name || e.AccountRef?.name } })}
                >
                  <div className="min-w-0 flex-1 mr-3 text-left">
                    <p className="font-medium truncate">{e.EntityRef?.name || e.AccountRef?.name || "Expense"}</p>
                    <p className="text-xs text-muted-foreground">{e.TxnDate ? new Date(e.TxnDate).toLocaleDateString() : "N/A"}{e.PaymentType && ` · ${e.PaymentType}`}</p>
                  </div>
                  <p className="font-semibold tabular-nums text-red-600">{fmt(parseFloat(e.TotalAmt || "0"))}</p>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* myCT1 Recent Expenses — clickable */}
      {nativeExpenses?.expenses && nativeExpenses.expenses.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Expenses (myCT1)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {nativeExpenses.expenses.slice(0, 15).map((exp: any) => (
                <Button
                  key={exp.id}
                  variant="ghost"
                  className="w-full justify-between text-sm h-auto py-2 px-3 hover:bg-muted"
                  onClick={() => openPanel({ type: "expense", title: "Expense Details", data: exp })}
                >
                  <div className="min-w-0 flex-1 mr-3 text-left">
                    <p className="font-medium truncate">{exp.description || exp.category}</p>
                    <p className="text-xs text-muted-foreground">{exp.date ? new Date(exp.date).toLocaleDateString() : "—"} · {exp.category}</p>
                  </div>
                  <p className="font-semibold tabular-nums text-red-600">{fmt(Number(exp.amount || 0))}</p>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </InteractiveReportShell>
  );
}
