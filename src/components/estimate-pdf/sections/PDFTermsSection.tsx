import { Estimate } from '@/hooks/useEstimates';
import { ContractorProfile } from '../types';
import { 
  PDFSectionHeader, 
  PDFContentSection,
  PDFSubsectionTitle,
  PDFBulletList
} from '../PDFStyles';

interface PDFTermsSectionProps {
  estimate: Estimate;
  contractor?: ContractorProfile;
}

export function PDFTermsSection({ estimate, contractor }: PDFTermsSectionProps) {
  const accentColor = contractor?.brand_accent_color || '#d59f47';
  const secondaryColor = contractor?.brand_secondary_color || '#161e2c';
  
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
        <PDFSectionHeader accentColor={accentColor} textColor={secondaryColor}>Terms & Conditions</PDFSectionHeader>
        <PDFContentSection>
          <p className="text-sm text-[#8c8c8c] italic">(No terms specified)</p>
        </PDFContentSection>
      </>
    );
  }

  return (
    <>
      <PDFSectionHeader accentColor={accentColor} textColor={secondaryColor}>Terms & Conditions</PDFSectionHeader>
      <PDFContentSection className="space-y-4">
        {/* Validity */}
        {estimate.terms_validity && (
          <div>
            <PDFSubsectionTitle style={{ color: accentColor }}>Estimate Validity</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.terms_validity}
            </p>
          </div>
        )}

        {/* Payment Schedule */}
        {estimate.terms_payment_schedule && (
          <div>
            <PDFSubsectionTitle style={{ color: accentColor }}>Payment Schedule</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.terms_payment_schedule}
            </p>
          </div>
        )}

        {/* Change Orders */}
        {estimate.terms_change_orders && (
          <div>
            <PDFSubsectionTitle style={{ color: accentColor }}>Change Order Policy</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.terms_change_orders}
            </p>
          </div>
        )}

        {/* Insurance */}
        {estimate.terms_insurance && (
          <div>
            <PDFSubsectionTitle style={{ color: accentColor }}>Insurance</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.terms_insurance}
            </p>
          </div>
        )}

        {/* Warranty */}
        {estimate.terms_warranty_years && estimate.terms_warranty_years > 0 && (
          <div>
            <PDFSubsectionTitle style={{ color: accentColor }}>Warranty</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed">
              {estimate.terms_warranty_years} year{estimate.terms_warranty_years > 1 ? 's' : ''} workmanship warranty provided.
            </p>
          </div>
        )}

        {/* Exclusions */}
        {estimate.scope_exclusions && estimate.scope_exclusions.length > 0 && (
          <div>
            <PDFSubsectionTitle style={{ color: accentColor }}>Exclusions</PDFSubsectionTitle>
            <PDFBulletList items={estimate.scope_exclusions} />
          </div>
        )}

        {/* Assumptions & Exclusions (legacy field) */}
        {estimate.assumptions_and_exclusions && (
          <div>
            <PDFSubsectionTitle style={{ color: accentColor }}>Notes & Assumptions</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.assumptions_and_exclusions}
            </p>
          </div>
        )}
      </PDFContentSection>
    </>
  );
}
