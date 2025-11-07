import { useState } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Mail, Edit, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AddLeadDialog } from '../../AddLeadDialog';
import { EditLeadDialog } from '../../EditLeadDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeadsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function LeadsSection({ onSectionChange }: LeadsSectionProps) {
  const { leads, sources, loading, addLead, updateLead, deleteLead, refreshLeads } = useLeads();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [convertingLead, setConvertingLead] = useState<any>(null);

  const handleConvertToJob = async () => {
    if (!convertingLead) return;

    try {
      toast.loading('Converting lead to job...', { id: 'convert-lead' });

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a new job from the lead - using raw insert with fields that exist
      const { data: newJob, error: jobError } = await supabase
        .from('jobs')
        .insert([{
          name: convertingLead.name + (convertingLead.project_type ? ` - ${convertingLead.project_type}` : ''),
          user_id: user.id,
          address: convertingLead.address || null,
          city: convertingLead.city || null,
          state: convertingLead.state || null,
          zip_code: convertingLead.zip_code || null,
          status: 'scheduled',
          notes: convertingLead.notes || null,
          lead_id: convertingLead.id,
        }])
        .select()
        .single();

      if (jobError) throw jobError;

      // Update the lead to mark it as converted
      const { error } = await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          converted_to_job_id: newJob?.id,
        })
        .eq('id', convertingLead.id);

      if (error) throw error;

      toast.success('Lead converted to job successfully!', { id: 'convert-lead' });
      setConvertingLead(null);

      // Navigate to jobs section if available
      if (onSectionChange) {
        setTimeout(() => onSectionChange('jobs'), 500);
      }
    } catch (error: any) {
      console.error('Error converting lead:', error);
      toast.error('Failed to convert lead: ' + error.message, { id: 'convert-lead' });
    }
  };

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
                {!(lead as any).converted_at && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setConvertingLead(lead)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Briefcase className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Convert to Job</span>
                  </Button>
                )}
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
            onConvertToJob={() => {
              refreshLeads();
              if (onSectionChange) onSectionChange('jobs');
            }}
          />
        )}

        <AlertDialog open={!!convertingLead} onOpenChange={() => setConvertingLead(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Convert Lead to Job?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a new job from the lead "{convertingLead?.name}" and mark the lead as converted.
                The job will be created in "Scheduled" status and you can manage it from the Jobs section.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConvertToJob}>
                Convert to Job
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
