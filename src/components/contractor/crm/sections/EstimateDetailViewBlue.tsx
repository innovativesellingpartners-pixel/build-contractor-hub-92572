import { useState } from 'react';
import { Estimate } from '@/hooks/useEstimates';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Send, Users, Briefcase, Eye, Copy, ArrowRight, FileText } from 'lucide-react';
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

interface EstimateDetailViewBlueProps {
  estimate: Estimate;
  onClose: () => void;
  onSectionChange?: (section: string) => void;
  onEdit?: () => void;
  onSend?: () => void;
  onDuplicate?: () => void;
}

export function EstimateDetailViewBlue({ 
  estimate, 
  onClose, 
  onSectionChange,
  onEdit,
  onSend,
  onDuplicate
}: EstimateDetailViewBlueProps) {
  const { user } = useAuth();
  const [isConverting, setIsConverting] = useState(false);

  const handleConvertToCustomer = async () => {
    if (estimate.customer_id) {
      toast.info('This estimate already has a customer');
      onSectionChange?.('customers');
      return;
    }

    setIsConverting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([{
          user_id: currentUser.id,
          name: estimate.client_name || 'Unknown Customer',
          email: estimate.client_email || null,
          phone: estimate.client_phone || null,
          address: estimate.site_address || estimate.client_address || null,
          customer_type: 'residential',
          estimate_id: estimate.id,
          notes: `Created from estimate: ${estimate.title}`,
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      await supabase
        .from('estimates')
        .update({ customer_id: newCustomer.id, status: 'accepted' })
        .eq('id', estimate.id);

      if (estimate.lead_id) {
        await supabase
          .from('leads')
          .update({ customer_id: newCustomer.id, converted_to_customer: true, status: 'won' })
          .eq('id', estimate.lead_id);
      }

      toast.success('Customer created from estimate!');
      onSectionChange?.('customers');
    } catch (error: any) {
      toast.error(`Failed to create customer: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertToJob = async () => {
    if (estimate.job_id) {
      toast.info('This estimate already has a job');
      onSectionChange?.('jobs');
      return;
    }

    setIsConverting(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-estimate-to-job', {
        body: { estimateId: estimate.id }
      });

      if (error) throw error;
      toast.success('Job created from estimate!');
      onSectionChange?.('jobs');
    } catch (error: any) {
      toast.error(`Failed to create job: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  // Parse line items
  const lineItems = estimate.line_items as any[] || [];

  const getDeliveryStatus = () => {
    if (estimate.signed_at) return 'Signed';
    if (estimate.viewed_at) return 'Viewed';
    if (estimate.sent_at) return 'Sent';
    return 'Draft';
  };

  return (
    <BlueBackground className="min-h-full">
      {/* Header */}
      <DetailHeader
        title={estimate.title}
        subtitle={estimate.estimate_number || undefined}
        onBack={onClose}
        rightContent={<StatusBadge status={estimate.status} />}
      />

      {/* Action Buttons */}
      <ActionButtonRow className="flex-wrap">
        {onEdit && (
          <ActionButton variant="secondary" onClick={onEdit} className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            EDIT
          </ActionButton>
        )}
        {onSend && estimate.client_email && (
          <ActionButton variant="success" onClick={onSend} className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            {estimate.sent_at ? 'RESEND' : 'SEND'}
          </ActionButton>
        )}
        {!estimate.customer_id && (estimate.status === 'sent' || estimate.status === 'accepted' || estimate.signed_at) && (
          <ActionButton 
            variant="primary" 
            onClick={handleConvertToCustomer}
            disabled={isConverting}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            TO CUSTOMER
          </ActionButton>
        )}
        {estimate.customer_id && !estimate.job_id && (
          <ActionButton 
            variant="primary" 
            onClick={handleConvertToJob}
            disabled={isConverting}
            className="flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            TO JOB
          </ActionButton>
        )}
        {onDuplicate && (
          <ActionButton variant="muted" onClick={onDuplicate} className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            DUPLICATE
          </ActionButton>
        )}
      </ActionButtonRow>

      {/* Content */}
      <div className="space-y-0">
        {/* Estimate Information */}
        <SectionHeader>ESTIMATE DETAILS</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow label="Title" value={estimate.title} />
          <InfoRow label="Estimate #" value={estimate.estimate_number} />
          <InfoRow label="Status" value={<StatusBadge status={estimate.status} />} />
          <InfoRow label="Delivery" value={getDeliveryStatus()} />
          {estimate.project_name && <InfoRow label="Project" value={estimate.project_name} />}
          {estimate.valid_until && (
            <InfoRow label="Valid Until" value={format(new Date(estimate.valid_until), 'MMM d, yyyy')} />
          )}
        </InfoCard>

        {/* Client Information */}
        <SectionHeader>CLIENT INFORMATION</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow label="Name" value={estimate.client_name} />
          {estimate.client_email && (
            <InfoRow 
              label="Email" 
              value={
                <a href={`mailto:${estimate.client_email}`} className="text-sky-600 underline">
                  {estimate.client_email}
                </a>
              } 
            />
          )}
          {estimate.client_phone && (
            <InfoRow 
              label="Phone" 
              value={
                <a href={`tel:${estimate.client_phone}`} className="text-sky-600 underline">
                  {estimate.client_phone}
                </a>
              } 
            />
          )}
          {estimate.site_address && <InfoRow label="Site Address" value={estimate.site_address} />}
        </InfoCard>

        {/* Financial Summary */}
        <SectionHeader>FINANCIAL SUMMARY</SectionHeader>
        <InfoCard className="rounded-none">
          <div className="grid grid-cols-2 gap-4 p-4">
            <MoneyDisplay amount={estimate.subtotal} label="Subtotal" />
            <MoneyDisplay amount={estimate.tax_amount} label="Tax" />
            <MoneyDisplay amount={estimate.grand_total || estimate.total_amount} label="Grand Total" size="lg" />
            <MoneyDisplay amount={estimate.required_deposit} label="Deposit Required" />
          </div>
          {estimate.payment_amount && (
            <InfoRow label="Amount Paid" value={`$${estimate.payment_amount.toFixed(2)}`} />
          )}
        </InfoCard>

        {/* Line Items */}
        {lineItems.length > 0 && (
          <>
            <SectionHeader>LINE ITEMS ({lineItems.length})</SectionHeader>
            <InfoCard className="rounded-none">
              {lineItems.map((item, index) => (
                <div key={index} className="px-4 py-3 border-b border-sky-50 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium text-slate-800 text-sm">{item.description || item.name}</p>
                      {item.item_code && (
                        <p className="text-xs text-slate-500">{item.item_code}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sky-600 text-sm">
                        ${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.quantity || 1} × ${(item.unit_price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </InfoCard>
          </>
        )}

        {/* Scope of Work */}
        {estimate.scope_objective && (
          <>
            <SectionHeader>SCOPE OF WORK</SectionHeader>
            <InfoCard className="rounded-none">
              <div className="p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{estimate.scope_objective}</p>
              </div>
            </InfoCard>
          </>
        )}

        {/* Linked Records */}
        {(estimate.lead_id || estimate.customer_id || estimate.job_id) && (
          <>
            <SectionHeader>LINKED RECORDS</SectionHeader>
            <InfoCard className="rounded-none">
              {estimate.lead_id && (
                <InfoRow 
                  label="Lead" 
                  value={
                    <span 
                      className="text-sky-600 cursor-pointer"
                      onClick={() => onSectionChange?.('leads')}
                    >
                      View Lead →
                    </span>
                  }
                  isClickable
                  onClick={() => onSectionChange?.('leads')}
                />
              )}
              {estimate.customer_id && (
                <InfoRow 
                  label="Customer" 
                  value={
                    <span 
                      className="text-sky-600 cursor-pointer"
                      onClick={() => onSectionChange?.('customers')}
                    >
                      View Customer →
                    </span>
                  }
                  isClickable
                  onClick={() => onSectionChange?.('customers')}
                />
              )}
              {estimate.job_id && (
                <InfoRow 
                  label="Job" 
                  value={
                    <span 
                      className="text-sky-600 cursor-pointer"
                      onClick={() => onSectionChange?.('jobs')}
                    >
                      View Job →
                    </span>
                  }
                  isClickable
                  onClick={() => onSectionChange?.('jobs')}
                />
              )}
            </InfoCard>
          </>
        )}

        {/* Timeline */}
        <SectionHeader>TIMELINE</SectionHeader>
        <InfoCard className="rounded-none">
          <InfoRow 
            label="Created" 
            value={format(new Date(estimate.created_at), 'MMM d, yyyy')} 
          />
          {estimate.sent_at && (
            <InfoRow 
              label="Sent" 
              value={format(new Date(estimate.sent_at), 'MMM d, yyyy h:mm a')} 
            />
          )}
          {estimate.viewed_at && (
            <InfoRow 
              label="Viewed" 
              value={format(new Date(estimate.viewed_at), 'MMM d, yyyy h:mm a')} 
            />
          )}
          {estimate.signed_at && (
            <InfoRow 
              label="Signed" 
              value={format(new Date(estimate.signed_at), 'MMM d, yyyy h:mm a')} 
            />
          )}
        </InfoCard>
      </div>
    </BlueBackground>
  );
}
