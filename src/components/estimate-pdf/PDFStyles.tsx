// Shared styles for PDF preview and print
import { cn } from '@/lib/utils';
import { createContext, useContext } from 'react';

// Brand colors context for PDF styling
interface PDFBrandColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const defaultBrandColors: PDFBrandColors = {
  primaryColor: '#D50A22',
  secondaryColor: '#1e3a5f',
  accentColor: '#c9a227',
};

export const PDFBrandContext = createContext<PDFBrandColors>(defaultBrandColors);

export const usePDFBrandColors = () => useContext(PDFBrandContext);

// CSS-in-JS styles for the PDF that match exactly for preview and download
export const pdfStyles = {
  // Page setup
  page: 'bg-white w-full max-w-[816px] mx-auto shadow-lg print:shadow-none print:max-w-none',
  pageBreak: 'break-before-page',
  
  // Default Colors (matching edge function) - these are overridden by brand colors
  primaryNavy: '#161e2c',
  accentGold: '#d59f47',
  darkText: '#222222',
  mediumText: '#666666',
  lightText: '#8c8c8c',
  borderColor: '#d1d1d1',
  headerBg: '#f5f3ef',
  lightGrayBg: '#fafafa',
  
  // Typography
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

// CSS class utilities
export const PDFPageWrapper = ({ children, className, scaleMobile = false }: { children: React.ReactNode; className?: string; scaleMobile?: boolean }) => (
  <div 
    className={cn(
      'bg-white w-full max-w-[816px] mx-auto shadow-2xl print:shadow-none print:max-w-none',
      'font-sans text-[#222222]',
      scaleMobile && 'origin-top',
      className
    )}
    style={{ 
      fontFamily: pdfStyles.fontFamily,
    }}
  >
    {children}
  </div>
);

export const PDFHeader = ({ children, className, brandColor }: { children: React.ReactNode; className?: string; brandColor?: string }) => (
  <div 
    className={cn('text-white px-8 py-6', className)}
    style={{ backgroundColor: brandColor || '#161e2c' }}
  >
    {children}
  </div>
);

export const PDFSectionHeader = ({ children, className, accentColor, textColor }: { children: React.ReactNode; className?: string; accentColor?: string; textColor?: string }) => (
  <div 
    className={cn(
      'px-4 py-2 font-bold text-sm uppercase tracking-wide',
      className
    )}
    style={{ 
      backgroundColor: accentColor || '#d59f47',
      color: textColor || '#161e2c'
    }}
  >
    {children}
  </div>
);

export const PDFInfoBar = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div 
    className={cn(
      'bg-[#f5f3ef] border border-[#d1d1d1] flex flex-wrap',
      className
    )}
  >
    {children}
  </div>
);

export const PDFInfoCell = ({ label, value, className }: { label: string; value: string | React.ReactNode; className?: string }) => (
  <div className={cn('flex-1 min-w-[140px] px-4 py-3 border-r border-[#d1d1d1] last:border-r-0', className)}>
    <div className="text-[10px] text-[#8c8c8c] uppercase tracking-wider mb-1">{label}</div>
    <div className="text-sm font-semibold text-[#222222]">{value || '—'}</div>
  </div>
);

export const PDFTable = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <table className={cn('w-full border-collapse', className)}>
    {children}
  </table>
);

export const PDFTableHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <thead>
    <tr className={cn('bg-[#f5f3ef] border border-[#d1d1d1]', className)}>
      {children}
    </tr>
  </thead>
);

export const PDFTableHeaderCell = ({ children, className, align = 'left' }: { children: React.ReactNode; className?: string; align?: 'left' | 'center' | 'right' }) => (
  <th 
    className={cn(
      'px-3 py-2 text-[10px] font-bold text-[#222222] uppercase tracking-wider border-b border-[#d1d1d1]',
      align === 'right' && 'text-right',
      align === 'center' && 'text-center',
      className
    )}
  >
    {children}
  </th>
);

export const PDFTableRow = ({ children, className, isEven }: { children: React.ReactNode; className?: string; isEven?: boolean }) => (
  <tr 
    className={cn(
      'border-b border-[#e8e8e8]',
      isEven && 'bg-[#fafafa]',
      className
    )}
  >
    {children}
  </tr>
);

export const PDFTableCell = ({ children, className, align = 'left' }: { children: React.ReactNode; className?: string; align?: 'left' | 'center' | 'right' }) => (
  <td 
    className={cn(
      'px-3 py-2 text-sm',
      align === 'right' && 'text-right',
      align === 'center' && 'text-center',
      className
    )}
  >
    {children}
  </td>
);

export const PDFSummaryBox = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div 
    className={cn(
      'bg-[#f5f3ef] border border-[#d1d1d1] p-4',
      className
    )}
  >
    {children}
  </div>
);

export const PDFSummaryRow = ({ 
  label, 
  value, 
  isBold, 
  isTotal,
  totalColor,
  className 
}: { 
  label: string; 
  value: string; 
  isBold?: boolean; 
  isTotal?: boolean;
  totalColor?: string;
  className?: string;
}) => (
  <div 
    className={cn(
      'flex justify-between py-1',
      isTotal && 'border-t pt-2 mt-2',
      className
    )}
    style={isTotal ? { borderColor: totalColor || '#161e2c' } : undefined}
  >
    <span 
      className={cn('text-[#666666]', isBold && 'font-semibold', isTotal && 'font-bold text-base')}
      style={isTotal || isBold ? { color: totalColor || '#161e2c' } : undefined}
    >
      {label}
    </span>
    <span 
      className={cn('text-[#222222]', isBold && 'font-semibold', isTotal && 'font-bold text-lg')}
      style={isTotal ? { color: totalColor || '#161e2c' } : undefined}
    >
      {value}
    </span>
  </div>
);

export const PDFFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div 
    className={cn(
      'border-t border-[#d1d1d1] px-8 py-4 text-xs text-[#8c8c8c] flex justify-between items-center',
      className
    )}
  >
    {children}
  </div>
);

export const PDFContentSection = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('px-8 py-4', className)}>
    {children}
  </div>
);

export const PDFSubsectionTitle = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <h3 
    className={cn('text-xs font-bold uppercase tracking-wider mb-2', className)}
    style={{ color: style?.color || '#d59f47', ...style }}
  >
    {children}
  </h3>
);

export const PDFBulletList = ({ items, className }: { items: (string | null | undefined)[]; className?: string }) => (
  <ul className={cn('list-disc list-inside space-y-1 text-sm text-[#222222]', className)}>
    {items.filter(Boolean).map((item, i) => (
      <li key={i} className="leading-relaxed">{item}</li>
    ))}
  </ul>
);

export const PDFKeyValue = ({ label, value, className }: { label: string; value: string | React.ReactNode; className?: string }) => (
  <div className={cn('flex gap-2 text-sm py-1', className)}>
    <span className="text-[#666666] font-medium min-w-[120px]">{label}:</span>
    <span className="text-[#222222] flex-1">{value || '—'}</span>
  </div>
);

export const PDFSignatureLine = ({ label, className }: { label: string; className?: string }) => (
  <div className={cn('mt-4', className)}>
    <div className="border-b border-[#222222] h-10 mb-1"></div>
    <div className="text-xs text-[#666666]">{label}</div>
  </div>
);
