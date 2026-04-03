import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, FileText, Briefcase, Receipt, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDemoStats } from '@/hooks/useDemoData';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export const DemoReportsView = () => {
  const { data: stats, isLoading } = useDemoStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    );
  }

  const totalEstimateValue = stats?.estimates.data.reduce((s: number, e: any) => s + (e.total || 0), 0) || 0;
  const signedEstimates = stats?.estimates.data.filter((e: any) => e.status === 'signed') || [];
  const signedValue = signedEstimates.reduce((s: number, e: any) => s + (e.total || 0), 0);
  const totalJobValue = stats?.jobs.data.reduce((s: number, j: any) => s + (j.contract_value || 0), 0) || 0;
  const totalInvoiced = stats?.invoices.data.reduce((s: number, i: any) => s + (i.total || 0), 0) || 0;
  const totalCollected = stats?.invoices.data.reduce((s: number, i: any) => s + (i.amount_paid || 0), 0) || 0;

  const leadStages = (stats?.leads.data || []).reduce((acc: Record<string, number>, l: any) => {
    acc[l.stage] = (acc[l.stage] || 0) + 1;
    return acc;
  }, {});

  const jobStatuses = (stats?.jobs.data || []).reduce((acc: Record<string, number>, j: any) => {
    acc[j.job_status] = (acc[j.job_status] || 0) + 1;
    return acc;
  }, {});

  const invoiceStatuses = (stats?.invoices.data || []).reduce((acc: Record<string, number>, i: any) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">Reports & Analytics</h2>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{stats?.leads.count || 0}</p>
          <p className="text-xs text-muted-foreground">Total Leads</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">${totalEstimateValue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Estimate Pipeline</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <Briefcase className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">${totalJobValue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Job Contract Value</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 text-center">
          <DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
          <p className="text-2xl font-bold text-emerald-600">${totalCollected.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Revenue Collected</p>
        </CardContent></Card>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Lead Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(leadStages).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-sm capitalize">{stage.replace('_', ' ')}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Job Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(jobStatuses).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Invoice Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(invoiceStatuses).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{status}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex items-center justify-between text-sm font-medium">
              <span>Collection Rate</span>
              <span>{totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conversion Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xl font-bold">
                {stats?.leads.count ? Math.round((signedEstimates.length / stats.leads.count) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Lead → Signed</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xl font-bold">${signedValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Signed Value</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xl font-bold">{stats?.customers.count || 0}</p>
              <p className="text-xs text-muted-foreground">Active Customers</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-xl font-bold">
                ${stats?.jobs.count ? Math.round(totalJobValue / stats.jobs.count).toLocaleString() : 0}
              </p>
              <p className="text-xs text-muted-foreground">Avg Job Value</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
