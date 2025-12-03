import { useState } from 'react';
import { Lead } from '@/hooks/useLeads';
import { useEstimates } from '@/hooks/useEstimates';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileText, Users, ArrowRight, Mail, Phone } from 'lucide-react';
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

interface LeadDetailViewBlueProps {
  lead: Lead;
  onConvertToCustomer: () => void;
  onClose: () => void;
  onSectionChange?: (section: string) => void;
}

export function LeadDetailViewBlue({ lead, onConvertToCustomer, onClose, onSectionChange }: LeadDetailViewBlueProps) {
  const { estimates, createEstimateAsync } = useEstimates();
  const { customers } = useCustomers();
  const { user } = useAuth();
  const [isConverting, setIsConverting] = useState(false);

  const leadEstimates = estimates?.filter(e => e.lead_id === lead.id) || [];
  const linkedCustomer = lead.customer_id ? customers?.find(c => c.id === lead.customer_id) : null;

  const handleConvertToEstimate = async () => {
    if (!user) return;
    
    setIsConverting(true);
    try {
      const fullAddress = [lead.address, lead.city, lead.state, lead.zip_code].filter(Boolean).join(', ');
      
      const estimateData = {
        title: `Estimate for ${lead.name}`,
        lead_id: lead.id,
        client_name: lead.name,
        client_email: lead.email || undefined,
        client_phone: lead.phone || undefined,
        client_address: fullAddress || undefined,
        site_address: fullAddress || undefined,
        project_name: lead.project_type || `Project for ${lead.name}`,
        status: 'draft' as const,
        total_amount: lead.value || 0,
      };

      await createEstimateAsync(estimateData);
      toast.success('Estimate created from lead!');
      
      if (onSectionChange) {
        onSectionChange('estimates');
      }
    } catch (error: any) {
      toast.error('Failed to create estimate: ' + error.message);
    } finally {
      setIsConverting(false);
    }
  };

  const getFullAddress = () => {
    return [lead.address, lead.city, lead.state, lead.zip_code].filter(Boolean).join(', ');
  };

  return (
    <BlueBackground className="min-h-full">
      {/* Header */}
      <DetailHeader
        title={lead.name}
        subtitle={lead.company || undefined}
        onBack={onClose}
        rightContent={<StatusBadge status={lead.status} />}
      />

      {/* Action Buttons */}
      <ActionButtonRow>
        {leadEstimates.length === 0 && !lead.converted_to_customer && (
          <ActionButton 
            variant="primary" 
            onClick={handleConvertToEstimate} 
            disabled={isConverting}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {isConverting ? 'CREATING...' : 'CREATE ESTIMATE'}
          </ActionButton>
        )}
        {!lead.converted_to_customer && leadEstimates.length > 0 && (
          <ActionButton 
            variant="secondary" 
            onClick={onConvertToCustomer}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            CONVERT TO CUSTOMER
          </ActionButton>
        )}
      </ActionButtonRow>

      {/* Sales Flow Progress */}
      <div className="bg-white px-4 py-3 border-b border-sky-100">
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="px-3 py-1 bg-sky-500 text-white rounded-full font-semibold">Lead</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className={`px-3 py-1 rounded-full font-semibold ${leadEstimates.length > 0 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            Estimate
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className={`px-3 py-1 rounded-full font-semibold ${linkedCustomer ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            Customer
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="px-3 py-1 bg-slate-200 text-slate-500 rounded-full font-semibold">Job</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-0">
        {/* Lead Information */}
        <SectionHeader>LEAD INFORMATION</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow label="Name" value={lead.name} />
          <InfoRow label="Status" value={<StatusBadge status={lead.status} />} />
          {lead.company && <InfoRow label="Company" value={lead.company} />}
          {lead.project_type && <InfoRow label="Project Type" value={lead.project_type} />}
          {lead.value && (
            <InfoRow 
              label="Estimated Value" 
              value={`$${lead.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
            />
          )}
        </InfoCard>

        {/* Contact Information */}
        <SectionHeader>CONTACT INFORMATION</SectionHeader>
        <InfoCard className="rounded-none">
          {lead.email && (
            <InfoRow 
              label="Email" 
              value={
                <a href={`mailto:${lead.email}`} className="text-sky-600 underline">
                  {lead.email}
                </a>
              } 
            />
          )}
          {lead.phone && (
            <InfoRow 
              label="Phone" 
              value={
                <a href={`tel:${lead.phone}`} className="text-sky-600 underline">
                  {lead.phone}
                </a>
              } 
            />
          )}
          {getFullAddress() && <InfoRow label="Address" value={getFullAddress()} />}
        </InfoCard>

        {/* Quick Contact Buttons */}
        {(lead.email || lead.phone) && (
          <div className="flex gap-2 px-4 py-3 bg-white border-b border-sky-100">
            {lead.phone && (
              <a 
                href={`tel:${lead.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-lg font-semibold"
              >
                <Phone className="w-4 h-4" />
                CALL
              </a>
            )}
            {lead.email && (
              <a 
                href={`mailto:${lead.email}`}
                className="flex-1 flex items-center justify-center gap-2 bg-sky-500 text-white py-3 rounded-lg font-semibold"
              >
                <Mail className="w-4 h-4" />
                EMAIL
              </a>
            )}
          </div>
        )}

        {/* Linked Customer */}
        {linkedCustomer && (
          <>
            <SectionHeader>LINKED CUSTOMER</SectionHeader>
            <InfoCard className="rounded-none">
              <InfoRow label="Customer Name" value={linkedCustomer.name} />
              <InfoRow 
                label="Lifetime Value" 
                value={`$${(linkedCustomer.lifetime_value || 0).toFixed(2)}`} 
              />
              <div 
                className="px-4 py-3 flex justify-center cursor-pointer hover:bg-sky-50"
                onClick={() => onSectionChange?.('customers')}
              >
                <span className="text-sky-600 font-semibold text-sm">View Customer →</span>
              </div>
            </InfoCard>
          </>
        )}

        {/* Estimates */}
        <SectionHeader>ESTIMATES ({leadEstimates.length})</SectionHeader>
        <InfoCard className="rounded-none">
          {leadEstimates.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-muted-foreground text-sm mb-3">No estimates yet</p>
              <ActionButton variant="secondary" onClick={handleConvertToEstimate} disabled={isConverting}>
                Create Estimate
              </ActionButton>
            </div>
          ) : (
            leadEstimates.map((estimate) => (
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

        {/* Timeline */}
        <SectionHeader>TIMELINE</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow 
            label="Created" 
            value={format(new Date(lead.created_at), 'MMM d, yyyy')} 
          />
          {lead.last_contact_date && (
            <InfoRow 
              label="Last Contact" 
              value={format(new Date(lead.last_contact_date), 'MMM d, yyyy')} 
            />
          )}
        </InfoCard>

        {/* Notes */}
        {lead.notes && (
          <>
            <SectionHeader>NOTES</SectionHeader>
            <InfoCard className="rounded-none">
              <div className="p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </InfoCard>
          </>
        )}
      </div>
    </BlueBackground>
  );
}
