import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useDemoData } from '@/hooks/useDemoData';
import { Skeleton } from '@/components/ui/skeleton';

const statusBadge = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary';
    case 'sent': return 'info';
    case 'viewed': return 'warning';
    case 'signed': return 'success';
    case 'declined': return 'destructive';
    case 'expired': return 'outline';
    default: return 'default';
  }
};

export const DemoEstimatesView = () => {
  const { data: estimates = [], isLoading } = useDemoData<any>('estimates');

  const byStatus = estimates.reduce((acc: Record<string, any[]>, est: any) => {
    const s = est.status || 'draft';
    if (!acc[s]) acc[s] = [];
    acc[s].push(est);
    return acc;
  }, {});

  const totalValue = estimates.reduce((sum: number, e: any) => sum + (e.total || 0), 0);
  const signedValue = estimates
    .filter((e: any) => e.status === 'signed')
    .reduce((sum: number, e: any) => sum + (e.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">Estimates & Proposals</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{estimates.length}</p>
            <p className="text-xs text-muted-foreground">Total Estimates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">${totalValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Pipeline Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">${signedValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Signed Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">
              {estimates.length > 0
                ? Math.round((estimates.filter((e: any) => e.status === 'signed').length / estimates.length) * 100)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Close Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {['draft', 'sent', 'viewed', 'signed', 'declined'].map((status) => (
          <div key={status} className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={statusBadge(status)} className="capitalize">{status}</Badge>
              <span className="text-xs text-muted-foreground">{(byStatus[status] || []).length}</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              (byStatus[status] || []).map((est: any) => (
                <Card key={est.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="py-3 px-3 space-y-1">
                    <p className="text-sm font-medium truncate">{est.title || 'Untitled'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{est.estimate_number}</span>
                      <span className="text-sm font-semibold">${(est.total || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
