import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  ExternalLink,
  Edit
} from "lucide-react";
import { useState } from "react";
import ct1Logo from "@/assets/ct1-logo-main.png";
import { useLeads, Lead } from "@/hooks/useLeads";
import { AddLeadDialog } from "./AddLeadDialog";
import { EditLeadDialog } from "./EditLeadDialog";

export function ContractorCRM() {
  const { leads, sources, loading, addLead, updateLead, deleteLead, updateLeadStatus } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500 hover:bg-blue-600';
      case 'contacted': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'quoted': return 'bg-orange-500 hover:bg-orange-600';
      case 'won': return 'bg-green-500 hover:bg-green-600';
      case 'lost': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const newLeads = leads.filter(l => l.status === 'new').length;

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditDialogOpen(true);
  };

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    await updateLeadStatus(leadId, newStatus);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-4">
          <img src={ct1Logo} alt="CT1 Logo" className="h-12 w-12" />
          <div>
            <h2 className="text-3xl font-bold mb-1">CT1 CRM</h2>
            <p className="text-muted-foreground">Manage your leads and customer relationships</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AddLeadDialog onAdd={addLead} sources={sources} />
          <Button size="lg" variant="outline" asChild>
            <a
              href="https://psarcweb.com/PSAWeb/Account/Login?ReturnUrl=%2fPSAWeb"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open ProvenJobs login in a new tab"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              ProvenJobs
            </a>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{leads.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New This Week</p>
                <p className="text-2xl font-bold">{newLeads}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Leads</CardTitle>
          <CardDescription>Track and manage your sales pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first lead</p>
              <AddLeadDialog onAdd={addLead} sources={sources} />
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => (
                <div key={lead.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="font-semibold">{lead.name}</h4>
                      <Select value={lead.status} onValueChange={(value: Lead['status']) => handleStatusChange(lead.id, value)}>
                        <SelectTrigger className={`w-32 ${getStatusColor(lead.status)} text-white border-0`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="quoted">Quoted</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      {lead.company && <span className="text-sm text-muted-foreground">@ {lead.company}</span>}
                    </div>
                    {lead.project_type && <p className="text-sm text-muted-foreground mb-2">{lead.project_type}</p>}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="break-all">{lead.phone}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="break-all">{lead.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <div className="text-left md:text-right">
                      <p className="text-sm text-muted-foreground">Value</p>
                      <p className="font-bold text-lg">
                        {lead.value ? `$${lead.value.toLocaleString()}` : 'TBD'}
                      </p>
                    </div>
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
                      <Button variant="outline" size="sm" onClick={() => handleEditLead(lead)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditLeadDialog
        lead={selectedLead}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={updateLead}
        onDelete={deleteLead}
        sources={sources}
      />
    </div>
  );
}