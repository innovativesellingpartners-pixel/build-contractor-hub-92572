import { ContractorProfile } from '../types';
import { PDFFooter } from '../PDFStyles';

interface PDFFooterSectionProps {
  contractor: ContractorProfile;
  pageNumber?: number;
  totalPages?: number;
  publicUrl?: string;
}

export function PDFFooterSection({ contractor, pageNumber, totalPages, publicUrl }: PDFFooterSectionProps) {
  const footerParts = [
    contractor.company_name,
    contractor.phone,
    contractor.business_email
  ].filter(Boolean);

  return (
    <PDFFooter>
      <div className="flex-1">
        {footerParts.join('  •  ')}
      </div>
      
      <div className="flex items-center gap-4">
        {publicUrl && (
          <span className="text-[10px] text-[#a0a0a0] truncate max-w-[200px]">
            {publicUrl}
          </span>
        )}
        {pageNumber && totalPages && (
          <span className="text-xs">
            Page {pageNumber} of {totalPages}
          </span>
        )}
      </div>
    </PDFFooter>
  );
}
