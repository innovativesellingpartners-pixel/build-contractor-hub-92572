import { useState, useRef } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useCustomers } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Mail, Edit, Users, TrendingUp, Upload, FileSpreadsheet, ChevronRight, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AddLeadDialog } from '../../AddLeadDialog';
import { EditLeadDialog } from '../../EditLeadDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { HorizontalRowCard, RowAvatar, RowContent, RowTitleLine, RowMetaLine, RowAmount, RowActions } from './HorizontalRowCard';
import { LeadDetailViewBlue } from './LeadDetailViewBlue';
import { PredictiveSearch } from '../PredictiveSearch';
import { SwipeToArchive } from '@/components/ui/swipe-to-archive';

interface LeadsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function LeadsSection({ onSectionChange }: LeadsSectionProps) {
  const { leads, sources, loading, addLead, updateLead, deleteLead, refreshLeads, archiveLead } = useLeads();
  const { customers } = useCustomers();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<any>(null);
  const [convertingLead, setConvertingLead] = useState<any>(null);
  const [convertToOpportunityLead, setConvertToOpportunityLead] = useState<any>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        // Map CSV columns to lead fields
        const mappedLeads = jsonData.map((row: any) => ({
          name: row['Name'] || row['name'] || row['Full Name'] || row['full_name'] || '',
          email: row['Email'] || row['email'] || row['E-mail'] || '',
          phone: row['Phone'] || row['phone'] || row['Phone Number'] || row['phone_number'] || '',
          company: row['Company'] || row['company'] || row['Business'] || '',
          project_type: row['Project Type'] || row['project_type'] || row['Project'] || '',
          value: parseFloat(row['Value'] || row['value'] || row['Estimated Value'] || '0') || null,
          address: row['Address'] || row['address'] || row['Street'] || '',
          city: row['City'] || row['city'] || '',
          state: row['State'] || row['state'] || '',
          zip_code: row['Zip'] || row['zip'] || row['Zip Code'] || row['zip_code'] || '',
          notes: row['Notes'] || row['notes'] || row['Comments'] || '',
          status: 'new',
        })).filter((lead: any) => lead.name); // Only include rows with a name

        setImportPreview(mappedLeads);
        setImportDialogOpen(true);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to parse file. Please ensure it\'s a valid CSV or Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportLeads = async () => {
    if (importPreview.length === 0) return;

    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let successCount = 0;
      for (const lead of importPreview) {
        try {
          await addLead(lead);
          successCount++;
        } catch (err) {
          console.error('Error importing lead:', lead.name, err);
        }
      }

      toast.success(`Successfully imported ${successCount} of ${importPreview.length} leads`);
      setImportDialogOpen(false);
      setImportPreview([]);
      refreshLeads();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Failed to import leads: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleConvertToCustomer = async () => {
    if (!convertingLead) return;

    try {
      toast.loading('Converting lead to customer...', { id: 'convert-lead' });

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a new customer from the lead
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([{
          name: convertingLead.name,
          user_id: user.id,
          email: convertingLead.email || null,
          phone: convertingLead.phone || null,
          company: convertingLead.company || null,
          address: convertingLead.address || null,
          city: convertingLead.city || null,
          state: convertingLead.state || null,
          zip_code: convertingLead.zip_code || null,
          notes: convertingLead.notes || null,
          customer_type: 'residential', // Default type
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // Update the lead to mark it as converted
      const { error } = await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
        })
        .eq('id', convertingLead.id);

      if (error) throw error;

      toast.success('Lead converted to customer successfully!', { id: 'convert-lead' });
      setConvertingLead(null);

      // Navigate to customers section if available
      if (onSectionChange) {
        setTimeout(() => onSectionChange('customers'), 500);
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

  const handleConvertToOpportunity = async () => {
    if (!convertToOpportunityLead) return;

    try {
      toast.loading('Converting lead to opportunity...', { id: 'convert-opportunity' });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create opportunity from lead
      const { data: newOpportunity, error: opportunityError } = await supabase
        .from('opportunities')
        .insert([{
          user_id: user.id,
          lead_id: convertToOpportunityLead.id,
          title: convertToOpportunityLead.name + (convertToOpportunityLead.project_type ? ` - ${convertToOpportunityLead.project_type}` : ''),
          customer_name: convertToOpportunityLead.name,
          trade_type: convertToOpportunityLead.project_type || 'General',
          estimated_value: convertToOpportunityLead.value || null,
          stage: 'qualification',
          probability_percent: 25,
        }])
        .select()
        .single();

      if (opportunityError) throw opportunityError;

      // Update lead to mark as converted
      const { error } = await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
        })
        .eq('id', convertToOpportunityLead.id);

      if (error) throw error;

      toast.success('Lead converted to opportunity successfully!', { id: 'convert-opportunity' });
      setConvertToOpportunityLead(null);
      refreshLeads();

      if (onSectionChange) {
        setTimeout(() => onSectionChange('dashboard'), 500);
      }
    } catch (error: any) {
      console.error('Error converting lead:', error);
      toast.error('Failed to convert lead: ' + error.message, { id: 'convert-opportunity' });
    }
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setEditDialogOpen(true);
  };

  // When closing edit dialog, return to detail view
  const handleCloseEditDialog = (open: boolean) => {
    if (!open) {
      setEditDialogOpen(false);
      // If we have a selected lead for detail view, refresh and reopen
      if (selectedLeadForDetail) {
        const updatedLead = leads.find(l => l.id === selectedLeadForDetail.id);
        if (updatedLead) {
          setSelectedLeadForDetail(updatedLead);
        }
        setDetailViewOpen(true);
      }
    } else {
      setEditDialogOpen(open);
    }
  };

  const handleOpenDetail = (lead: any) => {
    setSelectedLeadForDetail(lead);
    setDetailViewOpen(true);
  };

  const handleEditFromDetail = (lead: any) => {
    setSelectedLead(lead);
    setEditDialogOpen(true);
  };

  if (loading) {
    return <div className="p-6">Loading leads...</div>;
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Leads</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage and track your leads</p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import CSV</span>
            </Button>
            <AddLeadDialog onAdd={addLead} sources={sources} />
          </div>
        </div>

        {/* Predictive Search */}
        <PredictiveSearch
          items={leads}
          placeholder="Search leads by name, company, phone..."
          getLabel={(lead) => lead.name}
          getSublabel={(lead) => [lead.company, lead.project_type, lead.status].filter(Boolean).join(' • ')}
          filterFn={(lead, query) => {
            const q = query.toLowerCase();
            return (
              lead.name.toLowerCase().includes(q) ||
              lead.email?.toLowerCase().includes(q) ||
              lead.phone?.includes(q) ||
              lead.company?.toLowerCase().includes(q) ||
              lead.project_type?.toLowerCase().includes(q) ||
              lead.status?.toLowerCase().includes(q)
            );
          }}
          onSelect={handleOpenDetail}
        />

        <div className="space-y-3">
        {leads.map((lead) => {
          const linkedCustomer = customers.find(c => 
            leads.find(l => l.id === lead.id && l.customer_id === c.id)
          );
          return (
          <SwipeToArchive 
            key={lead.id} 
            onArchive={() => archiveLead(lead.id)}
          >
            <HorizontalRowCard onClick={() => handleOpenDetail(lead)}>
              {/* Avatar */}
              <RowAvatar initials={lead.name.charAt(0).toUpperCase()} />

              {/* Info */}
              <RowContent>
                <RowTitleLine>
                  <h3 className="font-semibold text-sm sm:text-base break-words">
                    {lead.name}
                  </h3>
                  <Badge className={`${getStatusColor(lead.status)} text-white text-xs`}>
                    {lead.status}
                  </Badge>
                </RowTitleLine>
                
                <RowMetaLine>
                  {lead.company && <span className="truncate max-w-[150px]">{lead.company}</span>}
                  {lead.project_type && <span className="truncate max-w-[120px]">{lead.project_type}</span>}
                </RowMetaLine>
              </RowContent>

              {/* Amount */}
              {lead.value ? (
                <RowAmount amount={lead.value} />
              ) : (
                <div className="min-w-[100px]" />
              )}

              {/* Actions */}
              <RowActions>
                {!(lead as any).converted_at && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setConvertToOpportunityLead(lead); }}
                    className="gap-1 hidden sm:flex"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Opportunity</span>
                  </Button>
                )}
                {!(lead as any).converted_at && (
                  <Button 
                    variant="default" 
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); setConvertToOpportunityLead(lead); }}
                    className="h-8 w-8 sm:hidden"
                    title="Convert to Opportunity"
                  >
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                )}
                {lead.phone && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {lead.email && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={`mailto:${lead.email}`}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); handleEditLead(lead); }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {!(lead as any).converted_at && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); setConvertingLead(lead); }}
                    title="Convert to Customer"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
              </RowActions>
            </HorizontalRowCard>
          </SwipeToArchive>
        )})}

        {leads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No leads yet. Add your first lead to get started.
          </div>
        )}
        </div>

        {selectedLead && (
          <EditLeadDialog
            lead={selectedLead}
            open={editDialogOpen}
            onOpenChange={handleCloseEditDialog}
            onUpdate={updateLead}
            onDelete={deleteLead}
            sources={sources}
            onConvertToCustomer={() => {
              refreshLeads();
              if (onSectionChange) onSectionChange('customers');
            }}
          />
        )}

        <AlertDialog open={!!convertingLead} onOpenChange={() => setConvertingLead(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Convert Lead to Customer?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a new customer from the lead "{convertingLead?.name}" and mark the lead as converted.
                You can then create jobs for this customer from the Customers section.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConvertToCustomer}>
                Convert to Customer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!convertToOpportunityLead} onOpenChange={() => setConvertToOpportunityLead(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Convert Lead to Opportunity?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a new opportunity from the lead "{convertToOpportunityLead?.name}" and mark the lead as converted.
                The opportunity will be created in "Qualification" stage and you can track it from the Dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConvertToOpportunity}>
                Convert to Opportunity
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CSV Import Preview Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import Leads Preview
              </DialogTitle>
              <DialogDescription>
                Review the leads to be imported. {importPreview.length} leads found.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Email</th>
                    <th className="text-left p-2 font-medium">Phone</th>
                    <th className="text-left p-2 font-medium">Project</th>
                    <th className="text-right p-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((lead, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2 truncate max-w-[150px]">{lead.name}</td>
                      <td className="p-2 truncate max-w-[150px]">{lead.email || '-'}</td>
                      <td className="p-2">{lead.phone || '-'}</td>
                      <td className="p-2 truncate max-w-[100px]">{lead.project_type || '-'}</td>
                      <td className="p-2 text-right">{lead.value ? `$${lead.value.toLocaleString()}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImportLeads} disabled={importing || importPreview.length === 0}>
                {importing ? 'Importing...' : `Import ${importPreview.length} Leads`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lead Detail View Dialog */}
        <Dialog open={detailViewOpen} onOpenChange={setDetailViewOpen}>
          <DialogContent className="max-w-2xl h-[calc(100vh-5rem)] top-[45%] sm:top-[50%] p-0 flex flex-col overflow-hidden">
            {selectedLeadForDetail && (
              <LeadDetailViewBlue
                lead={selectedLeadForDetail}
                onConvertToCustomer={() => {
                  setDetailViewOpen(false);
                  setConvertingLead(selectedLeadForDetail);
                }}
                onClose={() => setDetailViewOpen(false)}
                onSectionChange={onSectionChange}
                onEdit={() => handleEditFromDetail(selectedLeadForDetail)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
