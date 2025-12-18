import { Estimate } from '@/hooks/useEstimates';
import { formatDate } from '../types';
import { 
  PDFSectionHeader, 
  PDFContentSection,
  PDFSignatureLine
} from '../PDFStyles';

interface PDFAcceptanceSectionProps {
  estimate: Estimate;
}

export function PDFAcceptanceSection({ estimate }: PDFAcceptanceSectionProps) {
  const hasContractorSignature = estimate.contractor_signature || estimate.contractor_printed_name;
  const hasClientSignature = estimate.client_signature || estimate.client_printed_name;

  return (
    <>
      <PDFSectionHeader>Acceptance</PDFSectionHeader>
      <PDFContentSection>
        <p className="text-sm text-[#666666] mb-6 leading-relaxed">
          By signing below, both parties agree to the scope of work, terms, and pricing outlined in this estimate.
          This estimate becomes a binding agreement upon signature by both parties.
        </p>

        <div className="grid grid-cols-2 gap-8">
          {/* Contractor Signature */}
          <div className="border border-[#d1d1d1] p-4 bg-[#fafafa]">
            <h4 className="text-xs font-bold text-[#161e2c] uppercase tracking-wider mb-4">
              Contractor
            </h4>
            
            {hasContractorSignature ? (
              <div className="space-y-2">
                {estimate.contractor_signature && (
                  <div>
                    <img 
                      src={estimate.contractor_signature} 
                      alt="Contractor Signature" 
                      className="h-12 object-contain"
                    />
                  </div>
                )}
                {estimate.contractor_printed_name && (
                  <p className="text-sm font-semibold">{estimate.contractor_printed_name}</p>
                )}
                {estimate.contractor_acceptance_date && (
                  <p className="text-xs text-[#666666]">
                    Date: {formatDate(estimate.contractor_acceptance_date)}
                  </p>
                )}
              </div>
            ) : (
              <>
                <PDFSignatureLine label="Signature" />
                <div className="mt-4">
                  <div className="border-b border-[#d1d1d1] h-6 mb-1"></div>
                  <div className="text-xs text-[#666666]">Printed Name</div>
                </div>
                <div className="mt-4">
                  <div className="border-b border-[#d1d1d1] h-6 mb-1"></div>
                  <div className="text-xs text-[#666666]">Date</div>
                </div>
              </>
            )}
          </div>

          {/* Client Signature */}
          <div className="border border-[#d1d1d1] p-4 bg-[#fafafa]">
            <h4 className="text-xs font-bold text-[#161e2c] uppercase tracking-wider mb-4">
              Client
            </h4>
            
            {hasClientSignature ? (
              <div className="space-y-2">
                {estimate.client_signature && (
                  <div>
                    <img 
                      src={estimate.client_signature} 
                      alt="Client Signature" 
                      className="h-12 object-contain"
                    />
                  </div>
                )}
                {estimate.client_printed_name && (
                  <p className="text-sm font-semibold">{estimate.client_printed_name}</p>
                )}
                {estimate.client_acceptance_date && (
                  <p className="text-xs text-[#666666]">
                    Date: {formatDate(estimate.client_acceptance_date)}
                  </p>
                )}
              </div>
            ) : (
              <>
                <PDFSignatureLine label="Signature" />
                <div className="mt-4">
                  <div className="border-b border-[#d1d1d1] h-6 mb-1"></div>
                  <div className="text-xs text-[#666666]">Printed Name</div>
                </div>
                <div className="mt-4">
                  <div className="border-b border-[#d1d1d1] h-6 mb-1"></div>
                  <div className="text-xs text-[#666666]">Date</div>
                </div>
              </>
            )}
          </div>
        </div>
      </PDFContentSection>
    </>
  );
}
