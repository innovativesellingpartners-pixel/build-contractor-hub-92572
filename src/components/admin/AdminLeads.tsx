import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Mail, Phone, MapPin, ExternalLink, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { EditLeadDialog } from '@/components/contractor/EditLeadDialog';
import { Lead, LeadSource } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export const AdminLeads = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: contractors = [] } = useQuery({
    queryKey: ['adminContractors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select('id, business_name, contractor_number')
        .order('business_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch admin user roles and profiles to identify admin-assigned leads
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['adminUsersForLeads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'super_admin']);
      if (error) throw error;
      // Fetch profiles for these admin users
      const userIds = data.map(r => r.user_id);
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, contact_name, company_name')
        .in('id', userIds);
      return (data || []).map(r => ({
        ...r,
        profile: profiles?.find(p => p.id === r.user_id),
      }));
    },
  });

  const contractorOptions = contractors.map((c) => ({
    value: c.id,
    label: c.business_name,
    description: c.contractor_number || undefined,
  }));

  const assignMutation = useMutation({
    mutationFn: async ({ leadId, contractorId }: { leadId: string; contractorId: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ user_id: contractorId })
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Lead assigned to contractor');
      queryClient.invalidateQueries({ queryKey: ['adminLeads'] });
      setAssignDialogOpen(false);
      setAssignLeadId(null);
      setSelectedContractorId('');
    },
    onError: () => {
      toast.error('Failed to assign lead');
    },
  });

  const { user } = useAuth();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['adminLeads', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          profiles:user_id (
            contact_name,
            company_name
          )
        `)
        .is('converted_to_job_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['leadSources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as LeadSource[];
    },
  });

  const filteredLeads = leads?.filter(lead =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      contacted: 'bg-yellow-500',
      qualified: 'bg-green-500',
      quoted: 'bg-purple-500',
      won: 'bg-emerald-500',
      lost: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleRowClick = (lead: any) => {
    setSelectedLead(lead as Lead);
    setEditDialogOpen(true);
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to update lead');
      throw error;
    }
    
    toast.success('Lead updated successfully');
    queryClient.invalidateQueries({ queryKey: ['adminLeads'] });
  };

  const handleDeleteLead = async (id: string) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete lead');
      throw error;
    }
    
    toast.success('Lead deleted successfully');
    queryClient.invalidateQueries({ queryKey: ['adminLeads'] });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">All Leads</h2>
          <p className="text-muted-foreground">View and manage all contractor leads across the platform</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredLeads?.length || 0} Total Leads
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, email, phone, or company..."
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
                <TableHead>Lead Info</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads?.map((lead) => (
                <TableRow 
                  key={lead.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(lead)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      {lead.company && (
                        <div className="text-sm text-muted-foreground">{lead.company}</div>
                      )}
                      {lead.project_type && (
                        <Badge variant="outline" className="mt-1">
                          {lead.project_type}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const contractor = contractors.find(c => c.id === lead.user_id);
                      const adminUser = !contractor ? adminUsers.find(a => a.user_id === lead.user_id) : null;
                      if (contractor) {
                        return (
                          <div>
                            <div className="text-sm font-medium">{contractor.business_name}</div>
                            <div className="text-xs text-muted-foreground">{contractor.contractor_number}</div>
                          </div>
                        );
                      } else if (adminUser) {
                        return (
                          <div>
                            <div className="text-sm font-medium">{adminUser.profile?.contact_name || adminUser.profile?.company_name || 'Admin'}</div>
                            <Badge variant="secondary" className="text-xs mt-0.5">Admin</Badge>
                          </div>
                        );
                      } else {
                        return <Badge variant="outline" className="text-xs text-muted-foreground">Unassigned</Badge>;
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      )}
                      {lead.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {lead.city}, {lead.state}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.value ? `$${lead.value.toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(lead.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Assign to Contractor"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignLeadId(lead.id);
                          setSelectedContractorId(lead.user_id || '');
                          setAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(lead);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredLeads || filteredLeads.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No leads found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditLeadDialog
        lead={selectedLead}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={handleUpdateLead}
        onDelete={handleDeleteLead}
        sources={sources}
        onConvertToJob={() => {
          queryClient.invalidateQueries({ queryKey: ['adminLeads'] });
        }}
      />

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Lead to Contractor</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <SearchableSelect
              options={contractorOptions}
              value={selectedContractorId}
              onValueChange={setSelectedContractorId}
              placeholder="Select a contractor..."
              searchPlaceholder="Search contractors..."
              emptyMessage="No contractors found."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedContractorId || assignMutation.isPending}
              onClick={() => {
                if (assignLeadId && selectedContractorId) {
                  assignMutation.mutate({ leadId: assignLeadId, contractorId: selectedContractorId });
                }
              }}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
