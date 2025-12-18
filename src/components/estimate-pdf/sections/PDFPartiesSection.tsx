import { ContractorProfile, formatDate } from '../types';
import { Estimate } from '@/hooks/useEstimates';
import { PDFContentSection, PDFSubsectionTitle, PDFKeyValue } from '../PDFStyles';

interface PDFPartiesSectionProps {
  estimate: Estimate;
  contractor: ContractorProfile;
}

export function PDFPartiesSection({ estimate, contractor }: PDFPartiesSectionProps) {
  const companyName = contractor.company_name || 'Contractor';
  const addressParts = [
    contractor.business_address,
    contractor.city,
    contractor.state,
    contractor.zip_code
  ].filter(Boolean);
  const businessAddress = addressParts.join(', ');

  return (
    <PDFContentSection>
      <div className="grid grid-cols-2 gap-8">
        {/* Contractor Block */}
        <div>
          <PDFSubsectionTitle>Contractor Details</PDFSubsectionTitle>
          <div className="space-y-0.5">
            <p className="font-semibold text-base text-[#222222]">{companyName}</p>
            {contractor.contact_name && (
              <p className="text-sm text-[#666666]">{contractor.contact_name}</p>
            )}
            {businessAddress && (
              <p className="text-sm text-[#666666]">{businessAddress}</p>
            )}
            {contractor.phone && (
              <p className="text-sm text-[#666666]">{contractor.phone}</p>
            )}
            {contractor.business_email && (
              <p className="text-sm text-[#666666]">{contractor.business_email}</p>
            )}
            {contractor.website_url && (
              <p className="text-sm text-[#666666]">{contractor.website_url}</p>
            )}
            {contractor.license_number && (
              <p className="text-xs text-[#8c8c8c] mt-1">License #{contractor.license_number}</p>
            )}
          </div>
        </div>

        {/* Client Block */}
        <div>
          <PDFSubsectionTitle>Client Details</PDFSubsectionTitle>
          <div className="space-y-0.5">
            {estimate.client_name ? (
              <p className="font-semibold text-base text-[#222222]">{estimate.client_name}</p>
            ) : (
              <p className="text-sm text-[#8c8c8c] italic">No client name</p>
            )}
            {estimate.client_address && (
              <p className="text-sm text-[#666666]">{estimate.client_address}</p>
            )}
            {estimate.client_phone && (
              <p className="text-sm text-[#666666]">{estimate.client_phone}</p>
            )}
            {estimate.client_email && (
              <p className="text-sm text-[#666666]">{estimate.client_email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Project Details */}
      {(estimate.project_name || estimate.site_address || estimate.project_address || estimate.trade_type) && (
        <div className="mt-6">
          <PDFSubsectionTitle>Project Details</PDFSubsectionTitle>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            {estimate.project_name && (
              <PDFKeyValue label="Project Name" value={estimate.project_name} />
            )}
            {estimate.title && estimate.title !== estimate.project_name && (
              <PDFKeyValue label="Title" value={estimate.title} />
            )}
            {(estimate.site_address || estimate.project_address) && (
              <PDFKeyValue label="Site Address" value={estimate.site_address || estimate.project_address} />
            )}
            {estimate.trade_type && (
              <PDFKeyValue label="Trade" value={estimate.trade_type} />
            )}
            {estimate.referred_by && (
              <PDFKeyValue label="Referred By" value={estimate.referred_by} />
            )}
            {estimate.prepared_by && (
              <PDFKeyValue label="Prepared By" value={estimate.prepared_by} />
            )}
          </div>
        </div>
      )}
    </PDFContentSection>
  );
}
