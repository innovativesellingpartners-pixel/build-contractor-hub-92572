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

  return (
    <>
      {/* Header Banner */}
      <PDFHeader>
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
          <div className="bg-[#d59f47] px-6 py-2 flex-shrink-0">
            <span className="text-[#161e2c] font-bold text-sm tracking-wide">ESTIMATE</span>
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
