import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Send, Download, DollarSign, Eye, FlaskConical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
import { useState } from "react";

export function EstimatesTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useAdminAuth();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const generateTestEstimate = async () => {
    if (!user?.id) return;
    setGenerating(true);
    try {
      const { error } = await supabase.from('estimates').insert({
        user_id: user.id,
        title: 'Kitchen Remodel - Test Estimate',
        status: 'draft',
        total_amount: 28750.00,
        subtotal: 25000.00,
        tax_rate: 0.075,
        tax_amount: 1875.00,
        grand_total: 28750.00,
        client_name: 'John & Sarah Mitchell',
        client_email: 'mitchell.test@example.com',
        client_phone: '(555) 867-5309',
        client_address: '742 Evergreen Terrace, Springfield, IL 62704',
        project_name: 'Full Kitchen Renovation',
        project_address: '742 Evergreen Terrace, Springfield, IL 62704',
        project_description: 'Complete kitchen remodel including cabinet replacement, granite countertop installation, new tile backsplash, updated plumbing fixtures, and LED recessed lighting throughout.',
        description: 'Full kitchen renovation including demolition, cabinetry, countertops, backsplash, plumbing, and electrical.',
        scope_objective: 'Transform the existing outdated kitchen into a modern, functional space with premium finishes and improved layout.',
        line_items: JSON.stringify([
          { description: 'Demo & Haul Away', quantity: 1, unit: 'lot', unit_price: 2500, total: 2500 },
          { description: 'Custom Shaker Cabinets (12 units)', quantity: 12, unit: 'ea', unit_price: 850, total: 10200 },
          { description: 'Granite Countertops – Installed', quantity: 45, unit: 'sqft', unit_price: 85, total: 3825 },
          { description: 'Subway Tile Backsplash', quantity: 30, unit: 'sqft', unit_price: 22, total: 660 },
          { description: 'Plumbing – Sink & Faucet Install', quantity: 1, unit: 'lot', unit_price: 1800, total: 1800 },
          { description: 'Electrical – Recessed Lighting (8)', quantity: 8, unit: 'ea', unit_price: 275, total: 2200 },
          { description: 'Flooring – LVP Install', quantity: 200, unit: 'sqft', unit_price: 8.50, total: 1700 },
          { description: 'Painting & Trim', quantity: 1, unit: 'lot', unit_price: 2115, total: 2115 },
        ]),
        terms_payment_schedule: '50% deposit due upon acceptance, 25% at rough-in completion, 25% upon final walkthrough.',
        terms_validity: '30 days',
        terms_warranty_years: 2,
        warranty_text: 'All workmanship is warranted for 2 years from the date of completion. Manufacturer warranties apply separately to all materials and fixtures.',
        required_deposit_percent: 50,
        required_deposit: 14375.00,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;
      toast.success('Test estimate generated!');
      queryClient.invalidateQueries({ queryKey: ['estimates', user.id] });
    } catch (err: any) {
      toast.error('Failed to generate test estimate: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

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
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={generateTestEstimate} disabled={generating}>
              <FlaskConical className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Generate Test Estimate'}
            </Button>
          )}
          <Button onClick={() => navigate('/dashboard')}>
            <Plus className="h-4 w-4 mr-2" />
            New Estimate
          </Button>
        </div>
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
