import { Estimate } from '@/hooks/useEstimates';
import { getUnmappedFields } from '../types';
import { 
  PDFSectionHeader, 
  PDFContentSection,
  PDFKeyValue
} from '../PDFStyles';

interface PDFCatchAllSectionProps {
  estimate: Estimate;
}

// Fields that are rendered in other sections
const RENDERED_FIELDS = new Set([
  'id',
  'user_id',
  'customer_id',
  'opportunity_id',
  'lead_id',
  'job_id',
  'estimate_number',
  'title',
  'description',
  'status',
  'total_amount',
  'valid_until',
  'line_items',
  'date_issued',
  'prepared_by',
  'project_name',
  'project_address',
  'referred_by',
  'client_name',
  'client_phone',
  'client_email',
  'client_address',
  'site_address',
  'scope_objective',
  'scope_key_deliverables',
  'scope_exclusions',
  'scope_timeline',
  'subtotal',
  'tax_rate',
  'tax_amount',
  'permit_fee',
  'grand_total',
  'required_deposit',
  'required_deposit_percent',
  'balance_due',
  'terms_validity',
  'terms_payment_schedule',
  'terms_change_orders',
  'terms_insurance',
  'terms_warranty_years',
  'contractor_signature',
  'contractor_printed_name',
  'contractor_acceptance_date',
  'client_signature',
  'client_printed_name',
  'client_acceptance_date',
  'trade_type',
  'project_description',
  'assumptions_and_exclusions',
  'cost_summary',
  'trade_specific',
  'attachments',
  'created_at',
  'updated_at',
  'sent_at',
  'viewed_at',
  'signed_at',
  'paid_at',
  'payment_amount',
  'payment_method',
  'payment_status',
  'public_token',
  'stripe_payment_link',
  'email_provider_id',
  'email_send_error',
  'last_send_attempt',
  'sales_tax_rate_percent',
]);

export function PDFCatchAllSection({ estimate }: PDFCatchAllSectionProps) {
  const unmappedFields = getUnmappedFields(estimate as any, RENDERED_FIELDS);
  
  // Filter out empty, null, or system fields
  const displayFields = Object.entries(unmappedFields).filter(([key, value]) => {
    if (value == null || value === '' || value === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    // Skip internal/system-looking fields
    if (key.includes('_id') || key.includes('_at') || key.startsWith('_')) return false;
    return true;
  });

  if (displayFields.length === 0) {
    return null;
  }

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\./g, ' › ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <>
      <PDFSectionHeader>Additional Estimate Details</PDFSectionHeader>
      <PDFContentSection>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {displayFields.map(([key, value]) => (
            <PDFKeyValue 
              key={key} 
              label={formatLabel(key)} 
              value={formatValue(value)} 
            />
          ))}
        </div>
      </PDFContentSection>
    </>
  );
}
