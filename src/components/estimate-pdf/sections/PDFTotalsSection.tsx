import { Estimate, EstimateLineItem } from '@/hooks/useEstimates';
import { formatCurrency } from '../types';
import { 
  PDFSectionHeader, 
  PDFContentSection,
  PDFSummaryBox,
  PDFSummaryRow
} from '../PDFStyles';

interface PDFTotalsSectionProps {
  estimate: Estimate;
  currency?: string;
  locale?: string;
}

export function PDFTotalsSection({ estimate, currency = 'USD', locale = 'en-US' }: PDFTotalsSectionProps) {
  const format = (val: number | null | undefined) => formatCurrency(val, currency, locale);
  
  const lineItems = (estimate.line_items || []).filter((item: any) => item?.included !== false);
  
  // Calculate subtotal from line items if not provided
  const calculatedSubtotal = lineItems.reduce((sum: number, item: EstimateLineItem) => {
    const qty = item.quantity || 1;
    const unitPrice = item.unitPrice || item.unit_cost || 0;
    return sum + (item.line_total ?? item.totalPrice ?? (qty * unitPrice));
  }, 0);
  
  const costSummary = estimate.cost_summary || {};
  const subtotal = costSummary.subtotal || estimate.subtotal || calculatedSubtotal;
  const taxAmount = costSummary.tax_and_fees || estimate.tax_amount || 0;
  const taxRate = (estimate as any).sales_tax_rate_percent || estimate.tax_rate || 0;
  const permitFee = estimate.permit_fee || 0;
  const profitMarkup = costSummary.profit_markup_amount || 0;
  const profitMarkupPercent = costSummary.profit_markup_percentage || 0;
  const grandTotal = estimate.grand_total || estimate.total_amount || (subtotal + taxAmount + permitFee);
  const requiredDeposit = estimate.required_deposit || 0;
  const depositPercent = (estimate as any).required_deposit_percent || 0;
  const balanceDue = estimate.balance_due || (grandTotal - (estimate.payment_amount || 0));
  const amountPaid = estimate.payment_amount || 0;

  return (
    <>
      <PDFSectionHeader>Estimate Summary</PDFSectionHeader>
      <PDFContentSection>
        <div className="flex justify-between gap-8">
          {/* Deposit Info (left side) */}
          <div className="flex-1">
            {requiredDeposit > 0 && (
              <div className="bg-[#f5f3ef] p-4 rounded">
                <div className="text-xs font-bold text-[#d59f47] uppercase tracking-wider mb-1">
                  Deposit Required
                </div>
                <div className="text-2xl font-bold text-[#161e2c]">
                  {format(requiredDeposit)}
                </div>
                {depositPercent > 0 && (
                  <div className="text-xs text-[#666666] mt-1">
                    ({depositPercent}% of total)
                  </div>
                )}
              </div>
            )}
            
            {amountPaid > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">
                  Amount Paid
                </div>
                <div className="text-xl font-bold text-green-700">
                  {format(amountPaid)}
                </div>
              </div>
            )}
          </div>

          {/* Summary Box (right side) */}
          <PDFSummaryBox className="w-[280px]">
            <PDFSummaryRow label="Subtotal" value={format(subtotal)} />
            
            {profitMarkup > 0 && (
              <PDFSummaryRow 
                label={`Profit/Markup${profitMarkupPercent ? ` (${profitMarkupPercent}%)` : ''}`} 
                value={format(profitMarkup)} 
              />
            )}
            
            {(taxAmount > 0 || taxRate > 0) && (
              <PDFSummaryRow 
                label={`Sales Tax${taxRate ? ` (${taxRate}%)` : ''}`} 
                value={format(taxAmount)} 
              />
            )}
            
            {permitFee > 0 && (
              <PDFSummaryRow label="Permit Fee" value={format(permitFee)} />
            )}
            
            <PDFSummaryRow 
              label="TOTAL DUE" 
              value={format(grandTotal)} 
              isTotal 
            />
            
            {amountPaid > 0 && balanceDue !== grandTotal && (
              <PDFSummaryRow 
                label="Balance Due" 
                value={format(balanceDue)} 
                isBold 
              />
            )}
          </PDFSummaryBox>
        </div>
      </PDFContentSection>
    </>
  );
}
