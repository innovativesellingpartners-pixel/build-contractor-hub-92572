import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CashFlowChartProps {
  filters: ReportingFilters;
}

export function CashFlowChart({ filters }: CashFlowChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["cash-flow", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get invoices for cash inflow
      let invoicesQuery = supabase
        .from("invoices")
        .select("amount_paid, issue_date")
        .eq("user_id", user.id);

      if (filters.dateFrom) invoicesQuery = invoicesQuery.gte("issue_date", filters.dateFrom);
      if (filters.dateTo) invoicesQuery = invoicesQuery.lte("issue_date", filters.dateTo);

      // Get job costs for cash outflow
      let costsQuery = supabase
        .from("job_costs")
        .select("amount, cost_date")
        .eq("user_id", user.id);

      if (filters.dateFrom) costsQuery = costsQuery.gte("cost_date", filters.dateFrom);
      if (filters.dateTo) costsQuery = costsQuery.lte("cost_date", filters.dateTo);

      // Get materials costs
      let materialsQuery = supabase
        .from("materials")
        .select("total_cost, date_used")
        .eq("user_id", user.id);

      if (filters.dateFrom) materialsQuery = materialsQuery.gte("date_used", filters.dateFrom);
      if (filters.dateTo) materialsQuery = materialsQuery.lte("date_used", filters.dateTo);

      const [
        { data: invoices },
        { data: costs },
        { data: materials },
      ] = await Promise.all([
        invoicesQuery,
        costsQuery,
        materialsQuery,
      ]);

      // Group by month
      const monthlyData: Record<string, { inflow: number; outflow: number }> = {};

      // Process inflows (payments received)
      invoices?.forEach((inv) => {
        const date = new Date(inv.issue_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { inflow: 0, outflow: 0 };
        }
        
        monthlyData[monthKey].inflow += Number(inv.amount_paid) || 0;
      });

      // Process outflows (expenses)
      costs?.forEach((cost) => {
        const date = new Date(cost.cost_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { inflow: 0, outflow: 0 };
        }
        
        monthlyData[monthKey].outflow += Number(cost.amount) || 0;
      });

      materials?.forEach((mat) => {
        if (mat.date_used) {
          const date = new Date(mat.date_used);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { inflow: 0, outflow: 0 };
          }
          
          monthlyData[monthKey].outflow += Number(mat.total_cost) || 0;
        }
      });

      // Calculate net cash flow and running balance
      let runningBalance = 0;
      return Object.entries(monthlyData)
        .map(([month, values]) => {
          const netCashFlow = values.inflow - values.outflow;
          runningBalance += netCashFlow;
          
          return {
            month,
            inflow: values.inflow,
            outflow: values.outflow,
            netCashFlow,
            balance: runningBalance,
          };
        })
        .sort((a, b) => a.month.localeCompare(b.month));
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
        No cash flow data available
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value: number) => formatCurrency(value)} />
        <Legend />
        <Area
          type="monotone"
          dataKey="inflow"
          name="Cash In"
          stroke="hsl(142, 76%, 36%)"
          fillOpacity={1}
          fill="url(#colorInflow)"
        />
        <Area
          type="monotone"
          dataKey="outflow"
          name="Cash Out"
          stroke="hsl(0, 84%, 60%)"
          fillOpacity={1}
          fill="url(#colorOutflow)"
        />
        <Area
          type="monotone"
          dataKey="balance"
          name="Running Balance"
          stroke="hsl(217, 91%, 60%)"
          fillOpacity={1}
          fill="url(#colorBalance)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
