import { Estimate } from '@/hooks/useEstimates';
import { ContractorProfile } from '../types';
import { PDFSectionHeader, PDFContentSection, PDFSubsectionTitle, PDFBulletList } from '../PDFStyles';

interface PDFScopeSectionProps {
  estimate: Estimate;
  contractor?: ContractorProfile;
}

export function PDFScopeSection({ estimate, contractor }: PDFScopeSectionProps) {
  const accentColor = contractor?.brand_accent_color || '#d59f47';
  const secondaryColor = contractor?.brand_secondary_color || '#161e2c';
  
  const hasScope = estimate.scope_objective || 
    (estimate.scope_key_deliverables && estimate.scope_key_deliverables.length > 0) ||
    estimate.scope_timeline ||
    estimate.description ||
    estimate.project_description;

  if (!hasScope) {
    return (
      <>
        <PDFSectionHeader accentColor={accentColor} textColor={secondaryColor}>Scope of Work</PDFSectionHeader>
        <PDFContentSection>
          <p className="text-sm text-[#8c8c8c] italic">(No scope details provided)</p>
        </PDFContentSection>
      </>
    );
  }

  return (
    <>
      <PDFSectionHeader accentColor={accentColor} textColor={secondaryColor}>Scope of Work</PDFSectionHeader>
      <PDFContentSection className="space-y-4">
        {/* Objective */}
        {(estimate.scope_objective || estimate.description || estimate.project_description) && (
          <div>
            <PDFSubsectionTitle style={{ color: accentColor }}>Objective</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.scope_objective || estimate.description || estimate.project_description}
            </p>
          </div>
        )}

        {/* Key Deliverables */}
        {estimate.scope_key_deliverables && estimate.scope_key_deliverables.length > 0 && (
          <div>
            <PDFSubsectionTitle style={{ color: accentColor }}>Key Deliverables</PDFSubsectionTitle>
            <PDFBulletList items={estimate.scope_key_deliverables} />
          </div>
        )}

        {/* Timeline */}
        {estimate.scope_timeline && (
          <div>
            <PDFSubsectionTitle style={{ color: accentColor }}>Timeline</PDFSubsectionTitle>
            <p className="text-sm text-[#222222] leading-relaxed whitespace-pre-wrap">
              {estimate.scope_timeline}
            </p>
          </div>
        )}
      </PDFContentSection>
    </>
  );
}
