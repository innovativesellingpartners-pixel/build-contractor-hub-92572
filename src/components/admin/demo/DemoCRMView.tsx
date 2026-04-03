import { Link } from 'react-router-dom';
import { ArrowLeft, Users, UserCheck, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDemoData } from '@/hooks/useDemoData';
import { Skeleton } from '@/components/ui/skeleton';

const stageBadgeVariant = (stage: string) => {
  switch (stage) {
    case 'new': return 'default';
    case 'contacted': return 'info';
    case 'qualified': return 'warning';
    case 'proposal_sent': return 'secondary';
    case 'won': return 'success';
    case 'lost': return 'destructive';
    default: return 'outline';
  }
};

export const DemoCRMView = () => {
  const { data: leads = [], isLoading: leadsLoading } = useDemoData('leads');
  const { data: customers = [], isLoading: customersLoading } = useDemoData('customers');

  const leadsByStage = leads.reduce((acc: Record<string, number>, lead: any) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/demo">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">CRM – Leads & Customers</h2>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'].map((stage) => (
          <Card key={stage} className="text-center">
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{leadsByStage[stage] || 0}</p>
              <p className="text-xs text-muted-foreground capitalize">{stage.replace('_', ' ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList>
          <TabsTrigger value="leads" className="gap-1.5">
            <Users className="h-4 w-4" /> Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5">
            <UserCheck className="h-4 w-4" /> Customers ({customers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-2 mt-4">
          {leadsLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : (
            leads.map((lead: any) => (
              <Card key={lead.id} className="hover:bg-accent/5 transition-colors">
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{lead.name}</p>
                      <Badge variant={stageBadgeVariant(lead.stage)} className="text-[10px]">
                        {lead.stage?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {lead.phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                      )}
                      {lead.email && (
                        <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{lead.email}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] ml-2">{lead.source || 'N/A'}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-2 mt-4">
          {customersLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : (
            customers.map((customer: any) => (
              <Card key={customer.id} className="hover:bg-accent/5 transition-colors">
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{customer.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {customer.phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>
                      )}
                      {customer.city && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{customer.city}, {customer.state}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant={customer.customer_type === 'commercial' ? 'info' : 'outline'} className="text-[10px]">
                    {customer.customer_type || 'residential'}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
