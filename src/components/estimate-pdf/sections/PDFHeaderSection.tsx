import { ContractorProfile, formatDate } from '../types';
import { Estimate } from '@/hooks/useEstimates';
import { PDFHeader, PDFInfoBar, PDFInfoCell } from '../PDFStyles';

interface PDFHeaderSectionProps {
  estimate: Estimate;
  contractor: ContractorProfile;
}

export function PDFHeaderSection({ estimate, contractor }: PDFHeaderSectionProps) {
  const companyName = contractor.company_name || 'Contractor';
  const addressParts = [
    contractor.business_address,
    contractor.city,
    contractor.state,
    contractor.zip_code
  ].filter(Boolean);
  const businessAddress = addressParts.join(', ');

  // Use contractor's brand colors with fallbacks
  const secondaryColor = contractor.brand_secondary_color || '#161e2c';
  const accentColor = contractor.brand_accent_color || '#d59f47';

  return (
    <>
      {/* Header Banner */}
      <PDFHeader brandColor={secondaryColor}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {contractor.logo_url && (
              <div className="bg-white rounded p-2 flex-shrink-0">
                <img 
                  src={contractor.logo_url} 
                  alt={`${companyName} Logo`}
                  className="h-14 w-auto max-w-[80px] object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide">{companyName}</h1>
              <div className="text-sm text-gray-300 mt-1 space-y-0.5">
                {(contractor.phone || contractor.business_email) && (
                  <p>
                    {[contractor.phone, contractor.business_email].filter(Boolean).join('  •  ')}
                  </p>
                )}
                {businessAddress && (
                  <p className="text-gray-400 text-xs">{businessAddress}</p>
                )}
                {contractor.license_number && (
                  <p className="text-gray-500 text-xs">License #{contractor.license_number}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Estimate Badge */}
          <div 
            className="px-6 py-2 flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            <span 
              className="font-bold text-sm tracking-wide"
              style={{ color: secondaryColor }}
            >
              ESTIMATE
            </span>
          </div>
        </div>
      </PDFHeader>

      {/* Info Bar */}
      <div className="mx-8 mt-6">
        <PDFInfoBar>
          <PDFInfoCell label="Reference No." value={estimate.estimate_number || '—'} />
          <PDFInfoCell label="Client" value={estimate.client_name || '—'} />
          <PDFInfoCell label="Date Issued" value={formatDate(estimate.date_issued || estimate.created_at)} />
          <PDFInfoCell label="Valid Until" value={formatDate(estimate.valid_until) || '30 Days'} />
        </PDFInfoBar>
      </div>
    </>
  );
}
