import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Wrench, Zap, ToggleLeft, ToggleRight, Plus, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const DemoAdminTools = () => {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState<string | null>(null);

  // Mock integration states
  const [integrations, setIntegrations] = useState({
    quickbooks: true,
    banking: true,
    payments: true,
    email: true,
    calendar: true,
  });

  // Mock payment outcome toggle
  const [paymentOutcome, setPaymentOutcome] = useState<'success' | 'failed' | 'partial'>('success');

  const toggleIntegration = (key: string) => {
    setIntegrations(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    toast.success(`${key} integration ${integrations[key as keyof typeof integrations] ? 'disconnected' : 'connected'} (demo)`);
  };

  const handleGenerateLeads = async () => {
    setGenerating('leads');
    try {
      const { error } = await supabase.functions.invoke('seed-demo-data', {
        body: { action: 'add_leads', count: 5 },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['demo'] });
      toast.success('5 new demo leads generated!');
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(null);
    }
  };

  const handleResetScenario = async () => {
    setGenerating('reset');
    try {
      const { error } = await supabase.functions.invoke('seed-demo-data', {
        body: { action: 'reset' },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['demo'] });
      toast.success('Demo data reset complete!');
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setGenerating(null);
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
        <h2 className="text-xl font-semibold">Admin Tools</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Data Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" /> Data Generation
            </CardTitle>
            <CardDescription>Add mock data on the fly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleGenerateLeads}
              disabled={generating === 'leads'}
            >
              {generating === 'leads' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Generate 5 New Leads
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleResetScenario}
              disabled={generating === 'reset'}
            >
              {generating === 'reset' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Full Data Reset
            </Button>
          </CardContent>
        </Card>

        {/* Payment Outcome Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Payment Simulation
            </CardTitle>
            <CardDescription>Control payment outcomes for demos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['success', 'failed', 'partial'] as const).map((outcome) => (
              <Button
                key={outcome}
                variant={paymentOutcome === outcome ? 'default' : 'outline'}
                className="w-full justify-start capitalize"
                onClick={() => {
                  setPaymentOutcome(outcome);
                  toast.success(`Payment outcome set to: ${outcome}`);
                }}
              >
                <Badge
                  variant={outcome === 'success' ? 'success' : outcome === 'failed' ? 'destructive' : 'warning'}
                  className="mr-2"
                >
                  {outcome}
                </Badge>
                {outcome === 'success' && 'Payments succeed'}
                {outcome === 'failed' && 'Payments fail'}
                {outcome === 'partial' && 'Payments partially succeed'}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Integration Toggles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Mock Integrations
            </CardTitle>
            <CardDescription>Toggle integration states for demo purposes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(integrations).map(([key, enabled]) => (
                <button
                  key={key}
                  onClick={() => toggleIntegration(key)}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-medium text-sm">{key}</span>
                    <Badge variant={enabled ? 'success' : 'secondary'} className="text-[10px]">
                      {enabled ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  {enabled ? (
                    <ToggleRight className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
