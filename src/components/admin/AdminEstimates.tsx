import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EstimateDetailViewBlue } from '@/components/contractor/crm/sections/EstimateDetailViewBlue';
import { Estimate } from '@/hooks/useEstimates';
import { useNavigate } from 'react-router-dom';

export const AdminEstimates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: estimates, isLoading } = useQuery({
    queryKey: ['adminEstimates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          profiles:user_id (
            contact_name,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const filteredEstimates = estimates?.filter(estimate =>
    estimate.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estimate.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estimate.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estimate.estimate_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500',
      viewed: 'bg-yellow-500',
      accepted: 'bg-green-500',
      signed: 'bg-emerald-500',
      sold: 'bg-emerald-600',
      rejected: 'bg-red-500',
      expired: 'bg-orange-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleRowClick = (estimate: any) => {
    setSelectedEstimate(estimate as Estimate);
    setDetailViewOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">All Estimates</h2>
          <p className="text-muted-foreground">View and manage all contractor estimates across the platform</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredEstimates?.length || 0} Total Estimates
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search estimates by title, client name, email, or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estimate</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstimates?.map((estimate) => (
                <TableRow 
                  key={estimate.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(estimate)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{estimate.title}</div>
                      {estimate.estimate_number && (
                        <div className="text-sm text-muted-foreground">{estimate.estimate_number}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {(estimate.profiles as any)?.company_name || (estimate.profiles as any)?.contact_name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{estimate.client_name || '-'}</div>
                      {estimate.client_email && (
                        <div className="text-muted-foreground">{estimate.client_email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(estimate.status)}>
                      {estimate.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(estimate.grand_total || estimate.total_amount)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(estimate.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(estimate);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredEstimates || filteredEstimates.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No estimates found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailViewOpen} onOpenChange={setDetailViewOpen}>
        <DialogContent className="max-w-4xl h-[calc(100vh-5rem)] top-[45%] sm:top-[50%] p-0 flex flex-col overflow-hidden">
          {selectedEstimate && (
            <EstimateDetailViewBlue
              estimate={selectedEstimate}
              onClose={() => setDetailViewOpen(false)}
              onSectionChange={() => {
                queryClient.invalidateQueries({ queryKey: ['adminEstimates'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};