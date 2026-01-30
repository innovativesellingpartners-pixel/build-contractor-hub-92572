import { Estimate, EstimateLineItem } from '@/hooks/useEstimates';
import { ContractorProfile, formatCurrency } from '../types';
import { 
  PDFSectionHeader, 
  PDFContentSection,
  PDFTable,
  PDFTableHeader,
  PDFTableHeaderCell,
  PDFTableRow,
  PDFTableCell
} from '../PDFStyles';

interface PDFLineItemsSectionProps {
  estimate: Estimate;
  contractor?: ContractorProfile;
  currency?: string;
  locale?: string;
}

export function PDFLineItemsSection({ estimate, contractor, currency = 'USD', locale = 'en-US' }: PDFLineItemsSectionProps) {
  const accentColor = contractor?.brand_accent_color || '#d59f47';
  const secondaryColor = contractor?.brand_secondary_color || '#161e2c';
  
  const lineItems = (estimate.line_items || []).filter((item: any) => item?.included !== false);

  if (lineItems.length === 0) {
    return (
      <>
        <PDFSectionHeader accentColor={accentColor} textColor={secondaryColor}>Cost Details</PDFSectionHeader>
        <PDFContentSection>
          <p className="text-sm text-[#8c8c8c] italic">(No line items)</p>
        </PDFContentSection>
      </>
    );
  }

  // Group items by category if categories exist
  const groupedItems: Record<string, EstimateLineItem[]> = {};
  let hasCategories = false;
  
  lineItems.forEach((item: EstimateLineItem) => {
    const category = item.category || 'General';
    if (item.category) hasCategories = true;
    if (!groupedItems[category]) groupedItems[category] = [];
    groupedItems[category].push(item);
  });

  const format = (val: number | null | undefined) => formatCurrency(val, currency, locale);

  const renderLineItemRow = (item: EstimateLineItem, index: number) => {
    const qty = item.quantity || 1;
    const unitPrice = item.unitPrice || item.unit_cost || 0;
    const lineTotal = item.line_total ?? item.totalPrice ?? (qty * unitPrice);
    const desc = item.item_description || item.description || 'Item';
    const unit = item.unit || item.unit_type || 'Each';

    return (
      <PDFTableRow key={item.id || index} isEven={index % 2 === 0}>
        {item.itemNumber && <PDFTableCell className="text-xs text-[#666666]">{item.itemNumber}</PDFTableCell>}
        <PDFTableCell className="max-w-[250px]">
          <span className="text-sm">{desc}</span>
        </PDFTableCell>
        <PDFTableCell align="center" className="text-sm">{qty}</PDFTableCell>
        <PDFTableCell align="center" className="text-xs text-[#666666]">{unit}</PDFTableCell>
        <PDFTableCell align="right" className="text-sm">{format(unitPrice)}</PDFTableCell>
        <PDFTableCell align="right" className="text-sm font-semibold">{format(lineTotal)}</PDFTableCell>
      </PDFTableRow>
    );
  };

  // Check if any item has itemNumber
  const hasItemNumbers = lineItems.some((item: EstimateLineItem) => item.itemNumber);

  return (
    <>
      <PDFSectionHeader accentColor={accentColor} textColor={secondaryColor}>Cost Details</PDFSectionHeader>
      <PDFContentSection className="overflow-x-auto">
        {hasCategories ? (
          // Render grouped by category
          Object.entries(groupedItems).map(([category, items], groupIndex) => (
            <div key={category} className={groupIndex > 0 ? 'mt-6' : ''}>
              <h4 
                className="text-xs font-bold uppercase tracking-wider mb-2 bg-[#f5f3ef] px-2 py-1"
                style={{ color: secondaryColor }}
              >
                {category}
              </h4>
              <PDFTable>
                <PDFTableHeader>
                  {hasItemNumbers && <PDFTableHeaderCell className="w-[60px]">Item #</PDFTableHeaderCell>}
                  <PDFTableHeaderCell>Description</PDFTableHeaderCell>
                  <PDFTableHeaderCell align="center" className="w-[60px]">Qty</PDFTableHeaderCell>
                  <PDFTableHeaderCell align="center" className="w-[60px]">Unit</PDFTableHeaderCell>
                  <PDFTableHeaderCell align="right" className="w-[90px]">Rate</PDFTableHeaderCell>
                  <PDFTableHeaderCell align="right" className="w-[100px]">Amount</PDFTableHeaderCell>
                </PDFTableHeader>
                <tbody>
                  {items.map((item, idx) => renderLineItemRow(item, idx))}
                </tbody>
              </PDFTable>
              {/* Category subtotal */}
              <div className="flex justify-end mt-1 pr-2">
                <span className="text-xs text-[#666666]">
                  {category} Subtotal: {format(items.reduce((sum, item) => {
                    const qty = item.quantity || 1;
                    const unitPrice = item.unitPrice || item.unit_cost || 0;
                    return sum + (item.line_total ?? item.totalPrice ?? (qty * unitPrice));
                  }, 0))}
                </span>
              </div>
            </div>
          ))
        ) : (
          // Render flat list
          <PDFTable>
            <PDFTableHeader>
              {hasItemNumbers && <PDFTableHeaderCell className="w-[60px]">Item #</PDFTableHeaderCell>}
              <PDFTableHeaderCell>Description</PDFTableHeaderCell>
              <PDFTableHeaderCell align="center" className="w-[60px]">Qty</PDFTableHeaderCell>
              <PDFTableHeaderCell align="center" className="w-[60px]">Unit</PDFTableHeaderCell>
              <PDFTableHeaderCell align="right" className="w-[90px]">Rate</PDFTableHeaderCell>
              <PDFTableHeaderCell align="right" className="w-[100px]">Amount</PDFTableHeaderCell>
            </PDFTableHeader>
            <tbody>
              {lineItems.map((item: EstimateLineItem, idx: number) => renderLineItemRow(item, idx))}
            </tbody>
          </PDFTable>
        )}
        
        {/* Bottom border line */}
        <div className="border-t-2 mt-2" style={{ borderColor: secondaryColor }}></div>
      </PDFContentSection>
    </>
  );
}
