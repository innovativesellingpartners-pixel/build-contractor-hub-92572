import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProfitLossStatementProps {
  filters: ReportingFilters;
}

export function ProfitLossStatement({ filters }: ProfitLossStatementProps) {
  const { data: plData, isLoading } = useQuery({
    queryKey: ["profit-loss", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Build date filter
      let dateFilter = "";
      if (filters.dateFrom && filters.dateTo) {
        dateFilter = `created_at >= '${filters.dateFrom}' AND created_at <= '${filters.dateTo}'`;
      }

      // Get revenue from completed/in-progress jobs
      let jobsQuery = supabase
        .from("jobs")
        .select("budget_amount, actual_cost, created_at")
        .eq("user_id", user.id)
        .in("job_status", ["completed", "in_progress"]);

      if (filters.dateFrom) jobsQuery = jobsQuery.gte("created_at", filters.dateFrom);
      if (filters.dateTo) jobsQuery = jobsQuery.lte("created_at", filters.dateTo);
      if (filters.tradeType && filters.tradeType !== "all") {
        jobsQuery = jobsQuery.eq("trade_type", filters.tradeType);
      }

      // Get job costs (operating expenses)
      let costsQuery = supabase
        .from("job_costs")
        .select("amount, category, cost_date")
        .eq("user_id", user.id);

      if (filters.dateFrom) costsQuery = costsQuery.gte("cost_date", filters.dateFrom);
      if (filters.dateTo) costsQuery = costsQuery.lte("cost_date", filters.dateTo);

      // Get materials costs (COGS)
      let materialsQuery = supabase
        .from("materials")
        .select("total_cost, date_used")
        .eq("user_id", user.id);

      if (filters.dateFrom) materialsQuery = materialsQuery.gte("date_used", filters.dateFrom);
      if (filters.dateTo) materialsQuery = materialsQuery.lte("date_used", filters.dateTo);

      // Get invoices for AR tracking
      let invoicesQuery = supabase
        .from("invoices")
        .select("amount_due, amount_paid, issue_date")
        .eq("user_id", user.id);

      if (filters.dateFrom) invoicesQuery = invoicesQuery.gte("issue_date", filters.dateFrom);
      if (filters.dateTo) invoicesQuery = invoicesQuery.lte("issue_date", filters.dateTo);

      const [
        { data: jobs },
        { data: costs },
        { data: materials },
        { data: invoices },
      ] = await Promise.all([
        jobsQuery,
        costsQuery,
        materialsQuery,
        invoicesQuery,
      ]);

      // Calculate Revenue
      const totalRevenue = jobs?.reduce((sum, j) => sum + (Number(j.budget_amount) || 0), 0) || 0;

      // Calculate COGS (materials + direct labor from actual_cost)
      const materialsCost = materials?.reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0) || 0;
      const directLaborCost = jobs?.reduce((sum, j) => sum + (Number(j.actual_cost) || 0), 0) || 0;
      const totalCOGS = materialsCost + directLaborCost;

      // Gross Profit
      const grossProfit = totalRevenue - totalCOGS;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Operating Expenses by category
      const expensesByCategory: Record<string, number> = {};
      costs?.forEach((cost) => {
        const category = cost.category || "Other";
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(cost.amount || 0);
      });

      const totalOperatingExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

      // Operating Income (EBIT)
      const operatingIncome = grossProfit - totalOperatingExpenses;
      const operatingMargin = totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0;

      // Net Income (simplified - no interest/taxes for now)
      const netIncome = operatingIncome;
      const netMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

      // AR tracking
      const totalAR = invoices?.reduce((sum, inv) => {
        const due = Number(inv.amount_due) || 0;
        const paid = Number(inv.amount_paid) || 0;
        return sum + (due - paid);
      }, 0) || 0;

      return {
        revenue: {
          total: totalRevenue,
        },
        cogs: {
          materials: materialsCost,
          directLabor: directLaborCost,
          total: totalCOGS,
        },
        grossProfit: {
          amount: grossProfit,
          margin: grossMargin,
        },
        operatingExpenses: {
          byCategory: expensesByCategory,
          total: totalOperatingExpenses,
        },
        operatingIncome: {
          amount: operatingIncome,
          margin: operatingMargin,
        },
        netIncome: {
          amount: netIncome,
          margin: netMargin,
        },
        accountsReceivable: totalAR,
      };
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Profit & Loss Statement</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">% of Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="font-semibold bg-muted/50">
            <TableCell>Revenue</TableCell>
            <TableCell className="text-right">{formatCurrency(plData?.revenue.total || 0)}</TableCell>
            <TableCell className="text-right">100.0%</TableCell>
          </TableRow>

          <TableRow className="font-medium">
            <TableCell className="pl-8">Cost of Goods Sold (COGS)</TableCell>
            <TableCell className="text-right">{formatCurrency(plData?.cogs.total || 0)}</TableCell>
            <TableCell className="text-right">
              {plData?.revenue.total ? formatPercent((plData.cogs.total / plData.revenue.total) * 100) : "0.0%"}
            </TableCell>
          </TableRow>
          <TableRow className="text-sm text-muted-foreground">
            <TableCell className="pl-12">Materials</TableCell>
            <TableCell className="text-right">{formatCurrency(plData?.cogs.materials || 0)}</TableCell>
            <TableCell className="text-right">
              {plData?.revenue.total ? formatPercent((plData.cogs.materials / plData.revenue.total) * 100) : "0.0%"}
            </TableCell>
          </TableRow>
          <TableRow className="text-sm text-muted-foreground">
            <TableCell className="pl-12">Direct Labor</TableCell>
            <TableCell className="text-right">{formatCurrency(plData?.cogs.directLabor || 0)}</TableCell>
            <TableCell className="text-right">
              {plData?.revenue.total ? formatPercent((plData.cogs.directLabor / plData.revenue.total) * 100) : "0.0%"}
            </TableCell>
          </TableRow>

          <TableRow className="font-semibold bg-primary/10">
            <TableCell>Gross Profit</TableCell>
            <TableCell className="text-right">{formatCurrency(plData?.grossProfit.amount || 0)}</TableCell>
            <TableCell className="text-right">{formatPercent(plData?.grossProfit.margin || 0)}</TableCell>
          </TableRow>

          <TableRow className="font-medium">
            <TableCell className="pl-8">Operating Expenses</TableCell>
            <TableCell className="text-right">{formatCurrency(plData?.operatingExpenses.total || 0)}</TableCell>
            <TableCell className="text-right">
              {plData?.revenue.total ? formatPercent((plData.operatingExpenses.total / plData.revenue.total) * 100) : "0.0%"}
            </TableCell>
          </TableRow>
          {Object.entries(plData?.operatingExpenses.byCategory || {}).map(([category, amount]) => (
            <TableRow key={category} className="text-sm text-muted-foreground">
              <TableCell className="pl-12">{category}</TableCell>
              <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
              <TableCell className="text-right">
                {plData?.revenue.total ? formatPercent((amount / plData.revenue.total) * 100) : "0.0%"}
              </TableCell>
            </TableRow>
          ))}

          <TableRow className="font-semibold bg-primary/10">
            <TableCell>Operating Income (EBIT)</TableCell>
            <TableCell className="text-right">{formatCurrency(plData?.operatingIncome.amount || 0)}</TableCell>
            <TableCell className="text-right">{formatPercent(plData?.operatingIncome.margin || 0)}</TableCell>
          </TableRow>

          <TableRow className="font-bold bg-primary/20 text-lg">
            <TableCell>Net Income</TableCell>
            <TableCell className="text-right">{formatCurrency(plData?.netIncome.amount || 0)}</TableCell>
            <TableCell className="text-right">{formatPercent(plData?.netIncome.margin || 0)}</TableCell>
          </TableRow>

          <TableRow className="border-t-2">
            <TableCell className="font-medium">Accounts Receivable (Outstanding)</TableCell>
            <TableCell className="text-right font-semibold">{formatCurrency(plData?.accountsReceivable || 0)}</TableCell>
            <TableCell className="text-right">-</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
}
