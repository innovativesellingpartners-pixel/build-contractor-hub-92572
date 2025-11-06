import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Mail, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AddLeadDialog } from '../../AddLeadDialog';
import { EditLeadDialog } from '../../EditLeadDialog';

export default function LeadsSection() {
  const { leads, sources, loading, addLead, updateLead, deleteLead } = useLeads();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      contacted: 'bg-yellow-500',
      qualified: 'bg-purple-500',
      quoted: 'bg-orange-500',
      won: 'bg-green-500',
      lost: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setEditDialogOpen(true);
  };

  if (loading) {
    return <div className="p-6">Loading leads...</div>;
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Leads</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and track your leads</p>
        </div>
        <AddLeadDialog onAdd={addLead} sources={sources} />
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg truncate">{lead.name}</CardTitle>
                  {lead.company && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{lead.company}</p>
                  )}
                </div>
                <Badge className={`${getStatusColor(lead.status)} shrink-0 text-xs`}>
                  {lead.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
              {lead.project_type && (
                <p className="text-xs sm:text-sm">
                  <span className="font-medium">Project:</span> {lead.project_type}
                </p>
              )}
              {lead.value && (
                <p className="text-sm sm:text-base font-semibold text-primary">
                  ${lead.value.toLocaleString()}
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                {lead.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {lead.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${lead.email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditLead(lead)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>

        {selectedLead && (
          <EditLeadDialog
          lead={selectedLead}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={updateLead}
          onDelete={deleteLead}
            sources={sources}
          />
        )}
      </div>
    </div>
  );
}
