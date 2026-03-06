import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Package, RefreshCw, Plus, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function LowesAdminPanel() {
  const { toast } = useToast();
  const [authLoading, setAuthLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [lastAuthResult, setLastAuthResult] = useState<{ success: boolean; time: string; message?: string } | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<{ success: boolean; time: string; count?: number; message?: string } | null>(null);

  const { data: productCount, refetch: refetchCount } = useQuery({
    queryKey: ['retailer-products-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('retailer_products')
        .select('*', { count: 'exact', head: true })
        .eq('retailer', 'lowes');
      if (error) throw error;
      return count || 0;
    },
  });

  const testAuth = async () => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lowes-auth');
      if (error) throw error;
      setLastAuthResult({
        success: data.success,
        time: new Date().toLocaleTimeString(),
        message: data.message || data.error,
      });
      toast({
        title: data.success ? "Auth Successful" : "Auth Failed",
        description: data.message || data.error,
        variant: data.success ? "default" : "destructive",
      });
    } catch (err: any) {
      setLastAuthResult({ success: false, time: new Date().toLocaleTimeString(), message: err.message });
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAuthLoading(false);
    }
  };

  const syncProducts = async () => {
    setSyncLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lowes-sync', {
        body: { action: 'sync' },
      });
      if (error) throw error;
      setLastSyncResult({
        success: data.success,
        time: new Date().toLocaleTimeString(),
        count: data.count,
        message: data.message || data.error,
      });
      refetchCount();
      toast({
        title: data.success ? "Sync Successful" : "Sync Failed",
        description: data.message || data.error,
        variant: data.success ? "default" : "destructive",
      });
    } catch (err: any) {
      setLastSyncResult({ success: false, time: new Date().toLocaleTimeString(), message: err.message });
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSyncLoading(false);
    }
  };

  const insertSample = async () => {
    setSampleLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lowes-sync', {
        body: { action: 'insert_sample' },
      });
      if (error) throw error;
      refetchCount();
      toast({
        title: data.success ? "Samples Inserted" : "Insert Failed",
        description: data.message || data.error,
        variant: data.success ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Lowe's Product Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Products in DB:</span>
            <Badge variant="secondary">{productCount ?? '...'}</Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button onClick={testAuth} disabled={authLoading} variant="outline" className="w-full">
            {authLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Test Lowe's Auth
          </Button>
          <Button onClick={syncProducts} disabled={syncLoading} variant="outline" className="w-full">
            {syncLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync Lowe's Furnaces
          </Button>
          <Button onClick={insertSample} disabled={sampleLoading} variant="outline" className="w-full">
            {sampleLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Insert Sample Furnace
          </Button>
        </div>

        {/* Results */}
        {lastAuthResult && (
          <div className="flex items-center gap-2 text-sm">
            {lastAuthResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span>Auth: {lastAuthResult.message}</span>
            <span className="text-muted-foreground text-xs">({lastAuthResult.time})</span>
          </div>
        )}

        {lastSyncResult && (
          <div className="flex items-center gap-2 text-sm">
            {lastSyncResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span>Sync: {lastSyncResult.message}</span>
            <span className="text-muted-foreground text-xs">({lastSyncResult.time})</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
