import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Receipt, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, subMonths, startOfQuarter, startOfYear, format } from 'date-fns';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

type DatePreset = 'this_month' | 'last_month' | 'this_quarter' | 'ytd';

function getDateRange(preset: DatePreset): { start: Date; end: Date } {
  const now = new Date();
  switch (preset) {
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_month':
      return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    case 'this_quarter':
      return { start: startOfQuarter(now), end: now };
    case 'ytd':
      return { start: startOfYear(now), end: now };
  }
}

interface JobsFinancialOverviewProps {
  onNavigateToJobs?: () => void;
}

export default function JobsFinancialOverview({ onNavigateToJobs }: JobsFinancialOverviewProps) {
  const { user } = useAuth();
  const [preset, setPreset] = useState<DatePreset>('this_month');
  const range = getDateRange(preset);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs-financial-overview', user?.id, preset],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('jobs')
        .select('id, name, contract_value, total_contract_value, payments_collected, expenses_total, profit, created_at')
        .eq('user_id', user.id)
        .gte('created_at', range.start.toISOString())
        .lte('created_at', range.end.toISOString())
        .eq('archived', false)
        .order('contract_value', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const metrics = useMemo(() => {
    if (!jobs) return { revenue: 0, costs: 0, payments: 0, outstanding: 0 };
    const revenue = jobs.reduce((s, j) => s + (Number(j.total_contract_value) || Number(j.contract_value) || 0), 0);
    const costs = jobs.reduce((s, j) => s + (Number(j.expenses_total) || 0), 0);
    const payments = jobs.reduce((s, j) => s + (Number(j.payments_collected) || 0), 0);
    const outstanding = revenue - payments;
    return { revenue, costs, payments, outstanding: Math.max(outstanding, 0) };
  }, [jobs]);

  const chartData = useMemo(() => {
    if (!jobs) return [];
    return jobs.slice(0, 5).map(j => ({
      name: j.name.length > 12 ? j.name.slice(0, 12) + '…' : j.name,
      revenue: Number(j.total_contract_value) || Number(j.contract_value) || 0,
    }));
  }, [jobs]);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  const cards = [
    { label: 'Revenue', value: metrics.revenue, icon: DollarSign, iconBg: 'bg-emerald-500/8', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Costs', value: metrics.costs, icon: Receipt, iconBg: 'bg-red-500/8', color: 'text-red-600 dark:text-red-400' },
    { label: 'Payments', value: metrics.payments, icon: TrendingUp, iconBg: 'bg-blue-500/8', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Outstanding', value: metrics.outstanding, icon: AlertCircle, iconBg: 'bg-amber-500/8', color: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Financial overview</h2>
        <Select value={preset} onValueChange={(v) => setPreset(v as DatePreset)}>
          <SelectTrigger className="w-[150px] h-9 text-xs bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">This month</SelectItem>
            <SelectItem value="last_month">Last month</SelectItem>
            <SelectItem value="this_quarter">This quarter</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(card => (
          <Card
            key={card.label}
            className="p-4 cursor-pointer card-interactive"
            onClick={onNavigateToJobs}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-8 w-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-xl font-bold tabular-nums tracking-tight ${card.color}`}>{fmt(card.value)}</p>
          </Card>
        ))}
      </div>

      {chartData.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Top jobs by revenue</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" className="text-[10px]" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis className="text-[10px]" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px', boxShadow: 'var(--shadow-md)' }}
                formatter={(v: number) => fmt(v)}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
