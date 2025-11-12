import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ReportingFilters } from "@/pages/Reporting";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface ExpenseBreakdownProps {
  filters: ReportingFilters;
}

const COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 36%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(174, 62%, 47%)",
  "hsl(24, 95%, 53%)",
  "hsl(280, 70%, 55%)",
];

export function ExpenseBreakdown({ filters }: ExpenseBreakdownProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["expense-breakdown", filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get job costs (operating expenses)
      let costsQuery = supabase
        .from("job_costs")
        .select("amount, category, cost_date")
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

      const [{ data: costs }, { data: materials }] = await Promise.all([
        costsQuery,
        materialsQuery,
      ]);

      // Group expenses by category
      const expensesByCategory: Record<string, number> = {};

      // Add materials as a category
      const totalMaterials = materials?.reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0) || 0;
      if (totalMaterials > 0) {
        expensesByCategory["Materials"] = totalMaterials;
      }

      // Add other costs
      costs?.forEach((cost) => {
        const category = cost.category || "Other";
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(cost.amount || 0);
      });

      const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
        name,
        value,
      }));

      const total = chartData.reduce((sum, item) => sum + item.value, 0);

      return { chartData, total };
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (!data?.chartData || data.chartData.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground">
        No expense data available
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
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Total Expenses</p>
        <p className="text-2xl font-bold">{formatCurrency(data.total)}</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data.chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
