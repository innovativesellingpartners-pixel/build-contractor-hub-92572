import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface WinLossAnalysisProps {
  filters?: {
    dateFrom?: string;
    dateTo?: string;
  };
}

export function WinLossAnalysis({ filters }: WinLossAnalysisProps) {
  const { user } = useAuth();

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['win-loss-analysis', user?.id, filters],
    queryFn: async () => {
      if (!user) throw new Error('No user');

      let query = supabase
        .from('opportunities')
        .select('*')
        .eq('user_id', user.id)
        .in('stage', ['close', 'psfu']);

      if (filters?.dateFrom) {
        query = query.gte('closed_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('closed_at', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      const opportunities = data || [];
      
      // Separate wins and losses
      const wins = opportunities.filter(o => o.stage === 'close');
      const losses = opportunities.filter(o => o.stage === 'psfu');

      // Calculate win rate
      const totalClosed = opportunities.length;
      const winRate = totalClosed > 0 ? (wins.length / totalClosed) * 100 : 0;

      // Group by reason
      const winReasons = wins.reduce((acc, opp) => {
        const reason = opp.win_loss_reason || 'Not specified';
        if (!acc[reason]) {
          acc[reason] = { count: 0, value: 0 };
        }
        acc[reason].count++;
        acc[reason].value += Number(opp.estimated_value || 0);
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const lossReasons = losses.reduce((acc, opp) => {
        const reason = opp.win_loss_reason || 'Not specified';
        if (!acc[reason]) {
          acc[reason] = { count: 0, value: 0 };
        }
        acc[reason].count++;
        acc[reason].value += Number(opp.estimated_value || 0);
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      // Trend analysis by month
      const monthlyTrend = opportunities.reduce((acc, opp) => {
        const date = new Date(opp.closed_at || opp.updated_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, wins: 0, losses: 0, winRate: 0 };
        }
        
        if (opp.stage === 'close') {
          acc[monthKey].wins++;
        } else {
          acc[monthKey].losses++;
        }
        
        const total = acc[monthKey].wins + acc[monthKey].losses;
        acc[monthKey].winRate = total > 0 ? (acc[monthKey].wins / total) * 100 : 0;
        
        return acc;
      }, {} as Record<string, { month: string; wins: number; losses: number; winRate: number }>);

      const trendData = Object.values(monthlyTrend).sort((a, b) => a.month.localeCompare(b.month));

      // Format reason data for charts
      const winReasonData = Object.entries(winReasons).map(([reason, data]) => ({
        reason: reason.charAt(0).toUpperCase() + reason.slice(1),
        count: data.count,
        value: data.value,
      })).sort((a, b) => b.count - a.count);

      const lossReasonData = Object.entries(lossReasons).map(([reason, data]) => ({
        reason: reason.charAt(0).toUpperCase() + reason.slice(1),
        count: data.count,
        value: data.value,
      })).sort((a, b) => b.count - a.count);

      const totalWinValue = wins.reduce((sum, o) => sum + Number(o.estimated_value || 0), 0);
      const totalLossValue = losses.reduce((sum, o) => sum + Number(o.estimated_value || 0), 0);
      const avgWinValue = wins.length > 0 ? totalWinValue / wins.length : 0;
      const avgLossValue = losses.length > 0 ? totalLossValue / losses.length : 0;

      return {
        wins: wins.length,
        losses: losses.length,
        winRate,
        totalWinValue,
        totalLossValue,
        avgWinValue,
        avgLossValue,
        winReasonData,
        lossReasonData,
        trendData,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-96" />
        ))}
      </div>
    );
  }

  if (!analysis) return null;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold mt-2">{formatPercent(analysis.winRate)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {analysis.wins} won / {analysis.losses} lost
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Won Value</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(analysis.totalWinValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {formatCurrency(analysis.avgWinValue)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lost Value</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(analysis.totalLossValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {formatCurrency(analysis.avgLossValue)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Closed</p>
              <p className="text-2xl font-bold mt-2">{analysis.wins + analysis.losses}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(analysis.totalWinValue + analysis.totalLossValue)} total
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-foreground" />
            </div>
          </div>
        </Card>
      </div>

      {/* Trend Chart */}
      {analysis.trendData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Win Rate Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analysis.trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                formatter={(value: number) => formatPercent(value)}
              />
              <Legend />
              <Line type="monotone" dataKey="winRate" stroke="hsl(var(--primary))" name="Win Rate %" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Reasons Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Win Reasons */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Why We Win</h3>
          </div>
          {analysis.winReasonData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.winReasonData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="reason" className="text-xs" angle={-45} textAnchor="end" height={100} />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No win data available for this period
            </div>
          )}
        </Card>

        {/* Loss Reasons */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold">Why We Lose</h3>
          </div>
          {analysis.lossReasonData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.lossReasonData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="reason" className="text-xs" angle={-45} textAnchor="end" height={100} />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--destructive))" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No loss data available for this period
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
