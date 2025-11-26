import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Send, Download, DollarSign, Eye, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function InvoicesTab() {
  const { user } = useAuth();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('invoices')
        .select('*, customer:customers(name, email), job:jobs(name)')
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
      paid: "default",
      overdue: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'paid') return false;
    return new Date(dueDate) < new Date();
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
          <h3 className="text-lg font-semibold">Invoices</h3>
          <p className="text-sm text-muted-foreground">
            Track and manage all your invoices
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <div className="grid gap-4">
        {invoices && invoices.length > 0 ? (
          invoices.map((invoice: any) => {
            const overdueFlag = isOverdue(invoice.due_date, invoice.status);
            return (
              <Card key={invoice.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {invoice.invoice_number || 'No number'}
                        {overdueFlag && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {invoice.customer?.name || 'No customer'} • {invoice.job?.name || 'No job'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(overdueFlag ? 'overdue' : invoice.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold">${Number(invoice.amount_due).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Amount Paid</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${Number(invoice.amount_paid).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Balance Due</p>
                        <p className="text-lg font-semibold text-red-600">
                          ${Number(invoice.balance_due || invoice.amount_due - invoice.amount_paid).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {invoice.due_date && (
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {invoice.stripe_payment_link && invoice.status !== 'paid' && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={invoice.stripe_payment_link} target="_blank" rel="noopener noreferrer">
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
            );
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No invoices yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first invoice to track payments
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
