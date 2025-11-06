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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage and track your leads</p>
        </div>
        <AddLeadDialog onAdd={addLead} sources={sources} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{lead.name}</CardTitle>
                  {lead.company && (
                    <p className="text-sm text-muted-foreground">{lead.company}</p>
                  )}
                </div>
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.project_type && (
                <p className="text-sm">
                  <span className="font-medium">Project:</span> {lead.project_type}
                </p>
              )}
              {lead.value && (
                <p className="text-sm font-semibold text-primary">
                  ${lead.value.toLocaleString()}
                </p>
              )}
              <div className="flex gap-2">
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
  );
}
