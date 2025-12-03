import { useState } from 'react';
import { Customer } from '@/hooks/useCustomers';
import { useEstimates } from '@/hooks/useEstimates';
import { useJobs } from '@/hooks/useJobs';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, FileText, Phone, Mail, ArrowRight } from 'lucide-react';
import {
  BlueBackground,
  SectionHeader,
  InfoCard,
  InfoRow,
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
}

export function CustomerDetailViewBlue({ customer, onClose, onSectionChange, onCreateJob }: CustomerDetailViewBlueProps) {
  const { estimates } = useEstimates();
  const { jobs } = useJobs();
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  const customerEstimates = estimates?.filter(e => e.customer_id === customer.id) || [];
  const customerJobs = jobs?.filter(j => j.customer_id === customer.id) || [];

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

  // Calculate totals
  const totalContractValue = customerJobs.reduce((sum, j) => sum + (j.contract_value || 0), 0);
  const totalPaymentsCollected = customerJobs.reduce((sum, j) => sum + (j.payments_collected || 0), 0);
  const outstandingBalance = totalContractValue - totalPaymentsCollected;

  return (
    <BlueBackground className="min-h-full">
      {/* Header */}
      <DetailHeader
        title={customer.name}
        subtitle={customer.customer_type || 'Customer'}
        onBack={onClose}
      />

      {/* Action Buttons */}
      <ActionButtonRow>
        <ActionButton 
          variant="orange" 
          onClick={handleCreateJob}
          disabled={isCreatingJob}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Briefcase className="w-4 h-4" />
          {isCreatingJob ? 'CREATING...' : customerJobs.length === 0 ? 'CREATE JOB' : 'ADD JOB'}
        </ActionButton>
      </ActionButtonRow>

      {/* Content */}
      <div className="space-y-0">
        {/* Customer Information */}
        <SectionHeader>CUSTOMER INFORMATION</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow label="Name" value={customer.name} />
          <InfoRow label="Type" value={customer.customer_type || 'Residential'} />
        </InfoCard>

        {/* Contact Information */}
        <SectionHeader>CONTACT DETAILS</SectionHeader>
        <InfoCard className="rounded-none">
          {customer.email && (
            <InfoRow 
              label="Email" 
              value={
                <a href={`mailto:${customer.email}`} className="text-sky-600 underline">
                  {customer.email}
                </a>
              } 
            />
          )}
          {customer.phone && (
            <InfoRow 
              label="Phone" 
              value={
                <a href={`tel:${customer.phone}`} className="text-sky-600 underline">
                  {customer.phone}
                </a>
              } 
            />
          )}
          {getFullAddress() && <InfoRow label="Address" value={getFullAddress()} />}
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
              <p className="text-slate-500 text-sm">No estimates linked</p>
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
              <p className="text-slate-500 text-sm mb-3">No jobs yet</p>
              <ActionButton variant="blue" onClick={handleCreateJob} disabled={isCreatingJob}>
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
    </BlueBackground>
  );
}
