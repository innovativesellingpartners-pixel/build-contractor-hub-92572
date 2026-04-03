import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const DemoResetPanel = () => {
  const [seeding, setSeeding] = useState(false);
  const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null);

  const handleSeedData = async () => {
    setSeeding(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-data', {
        body: { action: 'reset' },
      });

      if (error) throw error;

      setLastResult('success');
      toast.success('Demo data seeded successfully!');
    } catch (err: any) {
      console.error('Seed error:', err);
      setLastResult('error');
      toast.error('Failed to seed demo data: ' + (err.message || 'Unknown error'));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">Reset Demo Data</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Seed / Reset Demo Data
          </CardTitle>
          <CardDescription>
            This will delete all existing demo data and re-seed with fresh, realistic mock data 
            across all modules (leads, customers, estimates, jobs, invoices, payments).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Only demo data is affected. No production contractor data will be modified.
            </p>
          </div>

          <Button
            onClick={handleSeedData}
            disabled={seeding}
            className="w-full sm:w-auto"
          >
            {seeding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Seeding Data...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset & Seed Demo Data
              </>
            )}
          </Button>

          {lastResult === 'success' && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Demo data seeded successfully. Visit module pages to explore.
            </div>
          )}

          {lastResult === 'error' && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Failed to seed data. Check console for details.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
