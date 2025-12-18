import { Estimate } from '@/hooks/useEstimates';
import { 
  PDFSectionHeader, 
  PDFContentSection,
  PDFSubsectionTitle,
  PDFBulletList
} from '../PDFStyles';

interface PDFTermsSectionProps {
  estimate: Estimate;
}

export function PDFTermsSection({ estimate }: PDFTermsSectionProps) {
  const hasTerms = estimate.terms_validity || 
    estimate.terms_payment_schedule || 
    estimate.terms_change_orders || 
    estimate.terms_insurance || 
    estimate.terms_warranty_years ||
    estimate.assumptions_and_exclusions ||
    (estimate.scope_exclusions && estimate.scope_exclusions.length > 0);

  if (!hasTerms) {
    return (
      <>
        <PDFSectionHeader>Terms & Conditions</PDFSectionHeader>
        <PDFContentSection>
          <p className="text-sm text-[#8c8c8c] italic">(No terms specified)</p>
        </PDFContentSection>
      </>
    );
  }

  return (
    <>
      <PDFSectionHeader>Terms & Conditions</PDFSectionHeader>
      <PDFContentSection className="space-y-4">
        {/* Validity */}
        {estimate.terms_validity && (
          <div>
            <PDFSubsectionTitle>Estimate Validity</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.terms_validity}
            </p>
          </div>
        )}

        {/* Payment Schedule */}
        {estimate.terms_payment_schedule && (
          <div>
            <PDFSubsectionTitle>Payment Schedule</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.terms_payment_schedule}
            </p>
          </div>
        )}

        {/* Change Orders */}
        {estimate.terms_change_orders && (
          <div>
            <PDFSubsectionTitle>Change Order Policy</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.terms_change_orders}
            </p>
          </div>
        )}

        {/* Insurance */}
        {estimate.terms_insurance && (
          <div>
            <PDFSubsectionTitle>Insurance</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.terms_insurance}
            </p>
          </div>
        )}

        {/* Warranty */}
        {estimate.terms_warranty_years && estimate.terms_warranty_years > 0 && (
          <div>
            <PDFSubsectionTitle>Warranty</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed">
              {estimate.terms_warranty_years} year{estimate.terms_warranty_years > 1 ? 's' : ''} workmanship warranty provided.
            </p>
          </div>
        )}

        {/* Exclusions */}
        {estimate.scope_exclusions && estimate.scope_exclusions.length > 0 && (
          <div>
            <PDFSubsectionTitle>Exclusions</PDFSubsectionTitle>
            <PDFBulletList items={estimate.scope_exclusions} />
          </div>
        )}

        {/* Assumptions & Exclusions (legacy field) */}
        {estimate.assumptions_and_exclusions && (
          <div>
            <PDFSubsectionTitle>Notes & Assumptions</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.assumptions_and_exclusions}
            </p>
          </div>
        )}
      </PDFContentSection>
    </>
  );
}
