import { useState } from 'react';
import { Customer, useCustomers } from '@/hooks/useCustomers';
import { useEstimates } from '@/hooks/useEstimates';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, FileText, Phone, Mail, ArrowRight, Merge, Search, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  BlueBackground,
  SectionHeader,
  InfoCard,
  InfoRow,
  EditableInfoRow,
  ActionButton,
  DetailHeader,
  StatusBadge,
  ActionButtonRow,
  MoneyDisplay,
} from './ProvenJobsTheme';

interface CustomerDetailViewBlueProps {
  customer: Customer;
  onClose: () => void;
  onSectionChange?: (section: string) => void;
  onCreateJob?: () => void;
  onEdit?: () => void;
}

export function CustomerDetailViewBlue({ customer, onClose, onSectionChange, onCreateJob, onEdit }: CustomerDetailViewBlueProps) {
  const { estimates, createEstimateAsync } = useEstimates();
  const { jobs } = useJobs();
  const { customers, refreshCustomers, updateCustomer } = useCustomers();
  const { user } = useAuth();
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isCreatingEstimate, setIsCreatingEstimate] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeSearch, setMergeSearch] = useState('');
  const [selectedMergeCustomer, setSelectedMergeCustomer] = useState<Customer | null>(null);

  const customerEstimates = estimates?.filter(e => e.customer_id === customer.id) || [];
  const customerJobs = jobs?.filter(j => j.customer_id === customer.id) || [];

  // Get other customers for merge (excluding current customer)
  const otherCustomers = customers?.filter(c => c.id !== customer.id) || [];
  const filteredMergeCustomers = otherCustomers.filter(c => 
    c.name.toLowerCase().includes(mergeSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(mergeSearch.toLowerCase()) ||
    c.phone?.includes(mergeSearch)
  );

  const getFullAddress = () => {
    return [customer.address, customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ');
  };

  const handleCreateJob = async () => {
    setIsCreatingJob(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const linkedEstimate = customerEstimates.find(e => !e.job_id);

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert([{
          name: `Job for ${customer.name}`,
          user_id: user.id,
          customer_id: customer.id,
          address: customer.address || null,
          city: customer.city || null,
          state: customer.state || null,
          zip_code: customer.zip_code || null,
          status: 'scheduled',
          contract_value: linkedEstimate?.grand_total || linkedEstimate?.total_amount || 0,
          original_estimate_id: linkedEstimate?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      if (linkedEstimate) {
        await supabase
          .from('estimates')
          .update({ job_id: newJob.id, status: 'sold' })
          .eq('id', linkedEstimate.id);
      }

      toast.success('Job created successfully!');
      onSectionChange?.('jobs');
    } catch (error: any) {
      toast.error('Failed to create job: ' + error.message);
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleCreateEstimate = async () => {
    if (!user) return;
    
    setIsCreatingEstimate(true);
    try {
      const fullAddress = getFullAddress();
      
      const estimateData = {
        title: `Estimate for ${customer.name}`,
        customer_id: customer.id,
        client_name: customer.name,
        client_email: customer.email || undefined,
        client_phone: customer.phone || undefined,
        client_address: fullAddress || undefined,
        site_address: fullAddress || undefined,
        project_name: `Project for ${customer.name}`,
        status: 'draft' as const,
        total_amount: 0,
      };

      await createEstimateAsync(estimateData);
      toast.success('Estimate created!');
      onSectionChange?.('estimates');
    } catch (error: any) {
      toast.error('Failed to create estimate: ' + error.message);
    } finally {
      setIsCreatingEstimate(false);
    }
  };

  const handleMergeCustomer = async () => {
    if (!selectedMergeCustomer) return;
    
    setIsMerging(true);
    try {
      const { data, error } = await supabase.functions.invoke('merge-customers', {
        body: { 
          keepCustomerId: customer.id,
          mergeCustomerId: selectedMergeCustomer.id
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Merged "${selectedMergeCustomer.name}" into this customer`);
      setShowMergeDialog(false);
      setSelectedMergeCustomer(null);
      setMergeSearch('');
      refreshCustomers?.();
    } catch (error: any) {
      toast.error('Failed to merge customers: ' + error.message);
    } finally {
      setIsMerging(false);
    }
  };

  // Calculate totals
  const totalContractValue = customerJobs.reduce((sum, j) => sum + (j.contract_value || 0), 0);
  const totalPaymentsCollected = customerJobs.reduce((sum, j) => sum + (j.payments_collected || 0), 0);
  const outstandingBalance = totalContractValue - totalPaymentsCollected;

  return (
    <BlueBackground className="min-h-full flex flex-col">
      {/* Header - Fixed */}
      <DetailHeader
        title={customer.name}
        subtitle={customer.customer_type || 'Customer'}
        onBack={onClose}
        onDashboard={onSectionChange ? () => { onSectionChange('dashboard'); onClose(); } : undefined}
      />

      {/* Scrollable Content - extra bottom padding to clear nav bar */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-32">
        {/* Action Buttons - scrolls with content */}
        <ActionButtonRow>
          {onEdit && (
            <ActionButton 
              variant="secondary" 
              onClick={onEdit}
              className="flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              EDIT
            </ActionButton>
          )}
          <ActionButton 
            variant="primary" 
            onClick={handleCreateJob}
            disabled={isCreatingJob}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            {isCreatingJob ? 'CREATING...' : customerJobs.length === 0 ? 'CREATE JOB' : 'ADD JOB'}
          </ActionButton>
          <ActionButton 
            variant="secondary" 
            onClick={handleCreateEstimate}
            disabled={isCreatingEstimate}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {isCreatingEstimate ? 'CREATING...' : 'CREATE ESTIMATE'}
          </ActionButton>
        </ActionButtonRow>

        {/* Merge Button */}
        <div className="px-4 py-2 bg-white border-b border-sky-100">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowMergeDialog(true)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Merge className="w-4 h-4" />
            Merge with Another Customer
          </Button>
        </div>

        <div className="space-y-0">
          {/* Customer Information */}
          <SectionHeader>CUSTOMER INFORMATION</SectionHeader>
        <InfoCard className="rounded-none">
          <EditableInfoRow label="Name" value={customer.name} onSave={(v) => updateCustomer(customer.id, { name: v })} placeholder="Customer name" />
          <EditableInfoRow 
            label="Type" 
            value={customer.customer_type || 'Residential'} 
            onSave={(v) => updateCustomer(customer.id, { customer_type: v })}
            selectOptions={[
              { value: 'Residential', label: 'Residential' },
              { value: 'Commercial', label: 'Commercial' },
              { value: 'Industrial', label: 'Industrial' },
            ]}
          />
        </InfoCard>

        {/* Contact Information */}
        <SectionHeader>CONTACT DETAILS</SectionHeader>
        <InfoCard className="rounded-none">
          <EditableInfoRow label="Email" value={customer.email} type="email" onSave={(v) => updateCustomer(customer.id, { email: v || null })} placeholder="Email address" />
          <EditableInfoRow label="Phone" value={customer.phone} type="tel" onSave={(v) => updateCustomer(customer.id, { phone: v || null })} placeholder="Phone number" />
          <EditableInfoRow label="Address" value={customer.address} onSave={(v) => updateCustomer(customer.id, { address: v || null })} placeholder="Street address" />
          <EditableInfoRow label="City" value={customer.city} onSave={(v) => updateCustomer(customer.id, { city: v || null })} placeholder="City" />
          <EditableInfoRow label="State" value={customer.state} onSave={(v) => updateCustomer(customer.id, { state: v || null })} placeholder="State" />
          <EditableInfoRow label="Zip Code" value={customer.zip_code} onSave={(v) => updateCustomer(customer.id, { zip_code: v || null })} placeholder="Zip code" />
        </InfoCard>

        {/* Quick Contact Buttons */}
        {(customer.email || customer.phone) && (
          <div className="flex gap-2 px-4 py-3 bg-white border-b border-sky-100">
            {customer.phone && (
              <a 
                href={`tel:${customer.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-lg font-semibold"
              >
                <Phone className="w-4 h-4" />
                CALL
              </a>
            )}
            {customer.email && (
              <a 
                href={`mailto:${customer.email}`}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white py-3 rounded-lg font-semibold"
              >
                <Mail className="w-4 h-4" />
                EMAIL
              </a>
            )}
          </div>
        )}

        {/* Financial Summary */}
        <SectionHeader>FINANCIAL SUMMARY</SectionHeader>
        <InfoCard className="rounded-none">
          <div className="grid grid-cols-2 gap-4 p-4">
            <MoneyDisplay amount={totalContractValue} label="Total Contract Value" />
            <MoneyDisplay amount={totalPaymentsCollected} label="Payments Collected" />
            <MoneyDisplay amount={outstandingBalance} label="Outstanding Balance" />
            <MoneyDisplay amount={customer.lifetime_value} label="Lifetime Value" />
          </div>
        </InfoCard>

        {/* Estimates */}
        <SectionHeader>ESTIMATES ({customerEstimates.length})</SectionHeader>
        <InfoCard className="rounded-none">
          {customerEstimates.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-slate-500 text-sm mb-3">No estimates linked</p>
              <ActionButton variant="secondary" onClick={handleCreateEstimate} disabled={isCreatingEstimate}>
                Create Estimate
              </ActionButton>
            </div>
          ) : (
            customerEstimates.map((estimate) => (
              <div
                key={estimate.id}
                className="flex items-center justify-between px-4 py-3 border-b border-sky-50 last:border-b-0 cursor-pointer hover:bg-sky-50"
                onClick={() => onSectionChange?.('estimates')}
              >
                <div>
                  <p className="font-medium text-slate-800 text-sm">{estimate.title}</p>
                  <p className="text-xs text-slate-500">
                    ${estimate.total_amount?.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={estimate.status} />
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))
          )}
        </InfoCard>

        {/* Jobs */}
        <SectionHeader>JOBS ({customerJobs.length})</SectionHeader>
        <InfoCard className="rounded-none">
          {customerJobs.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground text-sm mb-3">No jobs yet</p>
              <ActionButton variant="secondary" onClick={handleCreateJob} disabled={isCreatingJob}>
                Create Job
              </ActionButton>
            </div>
          ) : (
            customerJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between px-4 py-3 border-b border-sky-50 last:border-b-0 cursor-pointer hover:bg-sky-50"
                onClick={() => onSectionChange?.('jobs')}
              >
                <div>
                  <p className="font-medium text-slate-800 text-sm">{job.name}</p>
                  <p className="text-xs text-slate-500">
                    {job.job_number} • ${(job.contract_value || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={job.status} />
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))
          )}
        </InfoCard>

        {/* Timeline */}
        <SectionHeader>TIMELINE</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow 
            label="Created" 
            value={format(new Date(customer.created_at), 'MMM d, yyyy')} 
          />
          {customer.updated_at && (
            <InfoRow 
              label="Last Updated" 
              value={format(new Date(customer.updated_at), 'MMM d, yyyy')} 
            />
          )}
        </InfoCard>

        {/* Notes */}
        {customer.notes && (
          <>
            <SectionHeader>NOTES</SectionHeader>
            <InfoCard className="rounded-none">
              <div className="p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            </InfoCard>
          </>
        )}
        </div>
      </div>

      {/* Merge Customer Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Merge className="w-5 h-5" />
              Merge Customer
            </DialogTitle>
            <DialogDescription>
              Select a customer to merge into "{customer.name}". All jobs, estimates, and data from the selected customer will be transferred.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={mergeSearch}
                onChange={(e) => setMergeSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="border rounded-lg max-h-[250px] overflow-y-auto">
              {filteredMergeCustomers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {mergeSearch ? 'No customers found' : 'Start typing to search customers'}
                </div>
              ) : (
                filteredMergeCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedMergeCustomer(c)}
                    className={`p-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                      selectedMergeCustomer?.id === c.id 
                        ? 'bg-sky-50 border-sky-200' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[c.email, c.phone].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                ))
              )}
            </div>

            {selectedMergeCustomer && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800">
                  Merge "{selectedMergeCustomer.name}" into "{customer.name}"?
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  This action cannot be undone. All data will be transferred.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMergeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMergeCustomer} 
              disabled={!selectedMergeCustomer || isMerging}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isMerging ? 'Merging...' : 'Merge Customers'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BlueBackground>
  );
}
