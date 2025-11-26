import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Send, Download, DollarSign, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export function EstimatesTab() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: estimates, isLoading } = useQuery({
    queryKey: ['estimates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('estimates')
        .select('*, customer:customers(name, email)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      return data || [];
    },
    enabled: !!user?.id
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "secondary",
      sent: "default",
      approved: "default",
      paid: "default"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Estimates</h3>
          <p className="text-sm text-muted-foreground">
            Create and send estimates with payment links
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard')}>
          <Plus className="h-4 w-4 mr-2" />
          New Estimate
        </Button>
      </div>

      <div className="grid gap-4">
        {estimates && estimates.length > 0 ? (
          estimates.map((estimate: any) => (
            <Card key={estimate.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{estimate.title}</CardTitle>
                    <CardDescription>
                      {estimate.customer?.name || 'No customer'} • {estimate.estimate_number || 'No number'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(estimate.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">
                    ${Number(estimate.total_amount).toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    {estimate.stripe_payment_link && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={estimate.stripe_payment_link} target="_blank" rel="noopener noreferrer">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Pay Now
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No estimates yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first estimate to get paid faster
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Estimate
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
